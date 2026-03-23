import { nanoid } from 'nanoid';
import { useConfigStore } from '@/stores/config-store';
import { useChatStore } from '@/stores/chat-store';
import { useLocaleStore } from '@/stores/locale-store';
import { useUIStore } from '@/stores/ui-store';
import { getMessages, interpolate } from '@/i18n';
import { addMessage, createSession, getSessionMessages } from '@/lib/db/operations';
import { parseRelayStream } from './stream-parser';
import type { RelaySSEEvent } from './stream-parser';
import type { ChatMessage } from '@/types/chat';
import type { ProviderId } from '@/types/config';
import { COMPACT_TOKEN_THRESHOLD, COMPACT_KEEP_RECENT } from '@/config/credit-packages';

const ACTIVE_RELAY_KEY = 'activeRelay';

// ---------------------------------------------------------------------------
// Background context compaction — triggered after relay if token count is high
// ---------------------------------------------------------------------------

async function triggerBackgroundCompaction(sessionId: string): Promise<void> {
  const messages = useChatStore.getState().messages.filter(
    (m) => !m.isSystem && !m.isError && !m.isCompacted
  );
  if (messages.length === 0) return;

  const res = await fetch('/api/compact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (res.ok) {
    const { summary } = await res.json() as { summary: string };
    if (summary) {
      useChatStore.getState().applyCompaction(summary, COMPACT_KEEP_RECENT);
      console.log(`[Relay] Context compacted for session ${sessionId}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Event handler factory — shared logic for executeRelay and reconnectRelay
// ---------------------------------------------------------------------------

function createEventProcessor(sessionId: string, existingIds: Set<string>, relayRunId: string) {
  let streamingBuffer = '';
  let summaryBuffer = '';
  let summaryMode = false;
  let relayHasEnded = false;

  const handleEvent = async (event: RelaySSEEvent): Promise<void> => {
    switch (event.type) {
      case 'model_start':
        streamingBuffer = '';
        useChatStore.getState().setRelayRound(event.round);
        useChatStore.getState().advanceRelay(event.modelIndex, event.displayName);
        break;

      case 'summary_start':
        summaryMode = true;
        summaryBuffer = '';
        break;

      case 'content':
        if (summaryMode) {
          summaryBuffer += event.text;
        } else {
          streamingBuffer += event.text;
          useChatStore.getState().updateStreamingContent(streamingBuffer);
        }
        break;

      case 'model_done': {
        useChatStore.getState().updateStreamingContent('');
        streamingBuffer = '';
        if (event.content.length > 0) {
          // Deterministic ID — stable across reconnects for the same relay run,
          // unique across different relay runs on the same session (relayRunId)
          const msgId = `${sessionId}-${relayRunId}-r${event.round}-m${event.modelIndex}`;
          const assistantMsg: ChatMessage = {
            id: msgId,
            sessionId,
            role: 'assistant',
            content: event.content,
            modelId: event.modelId,
            providerId: event.providerId as ProviderId,
            displayName: event.displayName,
            timestamp: Date.now(),
          };
          if (!existingIds.has(msgId)) {
            existingIds.add(msgId);
            useChatStore.getState().appendMessage(assistantMsg);
          }
          await addMessage(assistantMsg); // put() — idempotent upsert
        }
        break;
      }

      case 'summary_done': {
        summaryMode = false;
        const markdown = summaryBuffer.length > 0 ? summaryBuffer : (event.markdown ?? '');
        const summaryId = `${sessionId}-${relayRunId}-summary`;
        const locale = useLocaleStore.getState().locale;
        const relayMsgs = getMessages(locale);
        const systemMsg: ChatMessage = {
          id: summaryId,
          sessionId,
          role: 'assistant',
          content: interpolate(relayMsgs.relay.complete, { seconds: event.elapsedSec, topic: event.topic }),
          timestamp: Date.now(),
          isSystem: true,
          reportMarkdown: markdown,
          reportFilename: event.filename,
          reportLocale: locale,
          usageStats: event.usageStats,
        };
        if (!existingIds.has(summaryId)) {
          existingIds.add(summaryId);
          useChatStore.getState().appendMessage(systemMsg);
        }
        await addMessage(systemMsg); // put() — idempotent upsert
        break;
      }

      case 'relay_done': {
        relayHasEnded = true;
        localStorage.removeItem(ACTIVE_RELAY_KEY);
        useChatStore.getState().completeRelay();
        window.dispatchEvent(new CustomEvent('credits-changed'));
        const totalTokens = (event.totalInputTokens ?? 0) + (event.totalOutputTokens ?? 0);
        if (totalTokens > COMPACT_TOKEN_THRESHOLD) {
          triggerBackgroundCompaction(sessionId).catch(() => {});
        }
        break;
      }

      case 'error':
        relayHasEnded = true;
        localStorage.removeItem(ACTIVE_RELAY_KEY);
        console.error('[Relay] Server error event:', event.message);
        useChatStore.getState().errorRelay(event.message);
        break;

      case 'keepalive':
      case 'done':
        break;
    }
  };

  return {
    handleEvent,
    isEnded: () => relayHasEnded,
  };
}

// ---------------------------------------------------------------------------
// connectAndProcess — connects to the events endpoint and processes the stream
// ---------------------------------------------------------------------------

async function connectAndProcess(
  sessionId: string,
  handleEvent: (event: RelaySSEEvent) => Promise<void>,
  signal?: AbortSignal
): Promise<void> {
  const url = `/api/relay/events?sessionId=${encodeURIComponent(sessionId)}&from=0`;

  // Retry up to 4 attempts with exponential backoff (1s, 2s, 4s).
  // iOS Safari returns "Load failed" when the network is briefly unavailable
  // right after the user unlocks the screen — we must not give up on the first try.
  for (let attempt = 0; attempt < 4; attempt++) {
    if (signal?.aborted) return;

    if (attempt > 0) {
      const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
      if (signal?.aborted) return;
      console.log(`[Relay] Reconnect attempt ${attempt + 1}/4...`);
    }

    try {
      const response = await fetch(url, signal ? { signal } : {});

      if (response.status === 404) {
        // Relay job not found (server restarted or cleaned up) — cannot be resumed.
        localStorage.removeItem(ACTIVE_RELAY_KEY);
        useChatStore.getState().completeRelay();
        return;
      }

      if (!response.ok || !response.body) {
        console.error('[Relay] Events endpoint error:', response.status);
        localStorage.removeItem(ACTIVE_RELAY_KEY);
        useChatStore.getState().completeRelay();
        return;
      }

      await parseRelayStream(response.body, handleEvent);
      return; // stream completed successfully — stop retrying
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err; // propagate Stop button

      // Network error (e.g. iOS "Load failed" after unlock). Retry if attempts remain.
      if (attempt < 3) {
        console.warn(`[Relay] Connect attempt ${attempt + 1}/4 failed, retrying:`, err);
        continue;
      }
      // All retries exhausted
      console.error('[Relay] All reconnect attempts failed:', err);
      localStorage.removeItem(ACTIVE_RELAY_KEY);
      useChatStore.getState().completeRelay();
    }
  }
}

// ---------------------------------------------------------------------------
// executeRelay — initiates a new relay session
// ---------------------------------------------------------------------------

export async function executeRelay(
  sessionId: string | null,
  userMessage: string
): Promise<string> {
  const configStore = useConfigStore.getState();
  const enabledModels = configStore.getEnabledModels();
  if (enabledModels.length === 0) return sessionId || '';

  if (!sessionId) {
    sessionId = await createSession(userMessage);
    useChatStore.getState().setActiveSession(sessionId);
  }

  const currentSessionId = sessionId;

  // Display user message immediately
  const userMsg: ChatMessage = {
    id: nanoid(),
    sessionId: currentSessionId,
    role: 'user',
    content: userMessage,
    timestamp: Date.now(),
  };
  useChatStore.getState().appendMessage(userMsg);
  useChatStore.getState().startRelay();
  addMessage(userMsg).catch((err) =>
    console.error('[Relay] Failed to save user message:', err)
  );

  // Build prior context from existing messages (exclude the one just added)
  const existingMessages = useChatStore.getState().messages;
  const { compactedSummary } = useChatStore.getState();
  let priorContext: Array<{ role: 'user' | 'assistant'; content: string; displayName?: string }>;
  if (compactedSummary) {
    const recent = existingMessages.filter(
      (m) => !m.isCompacted && !m.isSystem && !m.isError && m.id !== userMsg.id
    );
    priorContext = [
      { role: 'user', content: compactedSummary, displayName: '[Prior Summary]' },
      ...recent.map((m) => ({ role: m.role, content: m.content, displayName: m.displayName })),
    ];
  } else {
    priorContext = existingMessages
      .filter((m) => m.id !== userMsg.id && !m.isError && !m.isSystem)
      .map((m) => ({ role: m.role, content: m.content, displayName: m.displayName }));
  }

  const models = enabledModels.map((m) => ({
    id: m.id,
    modelId: m.modelId,
    providerId: m.providerId,
    displayName: m.displayName || m.modelId,
    apiKey: m.isPreset ? undefined : (m.apiKey || undefined),
    isPreset: m.isPreset,
    baseUrl: m.baseUrl || undefined,
  }));

  const abortController = new AbortController();
  useChatStore.getState().setAbortController(abortController);

  const existingIds = new Set(existingMessages.map((m) => m.id));

  // Unique ID for this relay run — prevents ID collisions across turns on the same session
  // while remaining stable for reconnects (stored in localStorage)
  const relayRunId = nanoid(8);
  const { handleEvent, isEnded } = createEventProcessor(currentSessionId, existingIds, relayRunId);

  // Mark relay as active — survives page reload (e.g. iOS Safari killing JS context)
  localStorage.setItem(ACTIVE_RELAY_KEY, JSON.stringify({ sessionId: currentSessionId, relayRunId }));

  const locale = useLocaleStore.getState().locale;
  try {
    const response = await fetch('/api/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: currentSessionId,
        query: userMessage,
        maxRounds: configStore.maxRounds,
        models,
        priorContext,
        locale,
        generateReport: configStore.generateReport,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      if (response.status === 402) {
        // Credits insufficient — show modal with required vs current balance
        const body = await response.json().catch(() => ({}));
        localStorage.removeItem(ACTIVE_RELAY_KEY);
        useChatStore.getState().errorRelay('CREDITS_INSUFFICIENT');
        useUIStore.getState().openCreditsModal(body.required ?? 0, body.balance ?? 0);
        return currentSessionId;
      }
      const errorText = await response.text();
      throw new Error(`Relay API error ${response.status}: ${errorText}`);
    }

    if (!response.body) throw new Error('No response body from /api/relay');

    try {
      await parseRelayStream(response.body, handleEvent);
    } catch (streamErr) {
      // Re-throw Stop-button aborts; for network errors fall through to reconnect below.
      if (streamErr instanceof Error && streamErr.name === 'AbortError') throw streamErr;
      console.warn('[Relay] Initial stream interrupted, relay may still be running server-side:', streamErr);
    }

    // Stream ended (normally or due to network drop) — check if relay fully completed.
    if (!isEnded()) {
      console.warn('[Relay] Stream closed without relay_done — reconnecting to server-side relay');
      await connectAndProcess(currentSessionId, handleEvent);
      if (!isEnded()) {
        localStorage.removeItem(ACTIVE_RELAY_KEY);
        useChatStore.getState().completeRelay();
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      // User explicitly clicked Stop — abort the server-side relay too
      localStorage.removeItem(ACTIVE_RELAY_KEY);
      fetch('/api/relay/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId }),
      }).catch(() => {});
      useChatStore.getState().stopRelay();
    } else {
      localStorage.removeItem(ACTIVE_RELAY_KEY);
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Relay] Stream fetch error:', err);
      useChatStore.getState().errorRelay(message);
    }
  }

  return currentSessionId;
}

// ---------------------------------------------------------------------------
// reconnectRelay — called after page reload to resume an in-progress relay
// ---------------------------------------------------------------------------

export async function reconnectRelay(sessionId: string): Promise<void> {
  // Load existing messages from IndexedDB so duplicate detection works
  const existing = await getSessionMessages(sessionId);
  const existingIds = new Set(existing.map((m) => m.id));

  // Ensure existing messages are in the Zustand store (needed after page reload)
  const storeIds = new Set(useChatStore.getState().messages.map((m) => m.id));
  for (const msg of existing) {
    if (!storeIds.has(msg.id)) {
      useChatStore.getState().appendMessage(msg);
    }
  }
  useChatStore.getState().setActiveSession(sessionId);

  const abortController = new AbortController();
  useChatStore.getState().setAbortController(abortController);
  useChatStore.getState().startRelay();

  // Recover the relayRunId saved when the relay was first started so that
  // reconstructed message IDs match what was already saved to IndexedDB
  const storedRelay = JSON.parse(localStorage.getItem(ACTIVE_RELAY_KEY) || '{}');
  const relayRunId = storedRelay.relayRunId || nanoid(8);
  const { handleEvent, isEnded } = createEventProcessor(sessionId, existingIds, relayRunId);

  try {
    await connectAndProcess(sessionId, handleEvent, abortController.signal);

    if (!isEnded()) {
      // Stream ended without relay_done — clean up gracefully
      localStorage.removeItem(ACTIVE_RELAY_KEY);
      useChatStore.getState().completeRelay();
    }
  } catch (err) {
    localStorage.removeItem(ACTIVE_RELAY_KEY);
    if (err instanceof Error && err.name === 'AbortError') {
      useChatStore.getState().stopRelay();
    } else {
      console.error('[Relay] Reconnect error:', err);
      useChatStore.getState().completeRelay();
    }
  }
}
