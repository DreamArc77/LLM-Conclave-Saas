import { nanoid } from 'nanoid';
import { useConfigStore } from '@/stores/config-store';
import { useChatStore } from '@/stores/chat-store';
import { useLocaleStore } from '@/stores/locale-store';
import { addMessage } from '@/lib/db/operations';
import { getMessages, interpolate } from '@/i18n';
import type { ChatMessage, VoteCard, VoteResult } from '@/types/chat';

// ─── Types for the /api/vote/run SSE stream ──────────────────────────────────

type VoteSSEEvent =
  | { type: 'vote_start'; modelIndex: number; displayName: string }
  | { type: 'content'; text: string }
  | { type: 'vote_done'; modelIndex: number; modelId: string; providerId: string; displayName: string; choice: string; statement: string }
  | { type: 'voting_complete' }
  | { type: 'error'; message: string }
  | { type: 'done' };

async function parseVoteStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: VoteSSEEvent) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const dataLine = event.split('\n').find((l) => l.startsWith('data: '));
      if (!dataLine) continue;
      try {
        const data = JSON.parse(dataLine.slice(6)) as VoteSSEEvent;
        onEvent(data);
      } catch {
        // skip malformed events
      }
    }
  }
}

// ─── prepareVoting ────────────────────────────────────────────────────────────
// Called when user clicks the "Conclude Discussion, Start Decision" button.
// Appends a voteCard message in 'loading' state, fetches alternatives from
// /api/vote/prepare, then transitions to 'setup' phase.

export async function prepareVoting(sessionId: string): Promise<void> {
  const messages = useChatStore.getState().messages;
  const locale = useLocaleStore.getState().locale;

  // Append a loading-state voting card message
  const voteCardId = `${sessionId}-vote-${nanoid(6)}`;
  const loadingMsg: ChatMessage = {
    id: voteCardId,
    sessionId,
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    voteCard: {
      phase: 'loading',
      alternatives: [],
      votes: [],
    },
  };
  useChatStore.getState().appendMessage(loadingMsg);

  // Build conversation context (exclude system/error/compacted messages)
  const convMessages = messages
    .filter((m) => !m.isSystem && !m.isError && !m.isCompacted && !m.voteCard)
    .map((m) => ({ role: m.role, content: m.content, displayName: m.displayName }));
  const query = messages.find((m) => m.role === 'user')?.content ?? '';

  try {
    const res = await fetch('/api/vote/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: convMessages, query, locale }),
    });

    if (!res.ok) throw new Error(`/api/vote/prepare failed: ${res.status}`);
    const { alternatives } = await res.json() as { alternatives: string[] };

    // Transition to setup phase
    const setupCard: VoteCard = {
      phase: 'setup',
      alternatives,
      votes: [],
      totalVoters: useConfigStore.getState().getEnabledModels().length,
    };
    useChatStore.getState().updateMessage(voteCardId, { voteCard: setupCard });
    await addMessage({ ...loadingMsg, voteCard: setupCard });
  } catch (err) {
    console.error('[VoteEngine] prepareVoting failed:', err);
    // Remove the loading message on failure
    // (updateMessage to show an error state would be better, but keep it simple)
    useChatStore.getState().updateMessage(voteCardId, {
      voteCard: { phase: 'setup', alternatives: [], votes: [] },
    });
  }
}

// ─── runVoting ────────────────────────────────────────────────────────────────
// Called when user clicks "Start Voting" in the VotingBubble.
// Streams voting events from /api/vote/run and updates the voteCard in real-time.
// After all votes are cast, generates the report via /api/report/generate.

export async function runVoting(voteCardMessageId: string, sessionId: string): Promise<void> {
  const chatStore = useChatStore.getState();
  const configStore = useConfigStore.getState();
  const locale = useLocaleStore.getState().locale;

  const currentMsg = chatStore.messages.find((m) => m.id === voteCardMessageId);
  if (!currentMsg?.voteCard || currentMsg.voteCard.phase !== 'setup') return;

  const { alternatives } = currentMsg.voteCard;
  const enabledModels = configStore.getEnabledModels();
  const models = enabledModels.map((m) => ({
    id: m.id,
    modelId: m.modelId,
    providerId: m.providerId,
    displayName: m.displayName || m.modelId,
    apiKey: m.isPreset ? undefined : (m.apiKey || undefined),
    isPreset: m.isPreset,
    baseUrl: m.baseUrl || undefined,
  }));

  const allMessages = chatStore.messages;
  const convMessages = allMessages
    .filter((m) => !m.isSystem && !m.isError && !m.isCompacted && !m.voteCard)
    .map((m) => ({ role: m.role, content: m.content, displayName: m.displayName }));
  const query = allMessages.find((m) => m.role === 'user')?.content ?? '';

  // Transition to voting phase
  const votingCard: VoteCard = {
    phase: 'voting',
    alternatives,
    votes: [],
    totalVoters: models.length,
  };
  useChatStore.getState().updateMessage(voteCardMessageId, { voteCard: votingCard });

  let currentActiveIdx: number | undefined;
  let currentStatement = '';
  const collectedVotes: VoteResult[] = [];

  const updateCard = (patch: Partial<VoteCard>) => {
    const existing = useChatStore.getState().messages.find((m) => m.id === voteCardMessageId)?.voteCard;
    if (!existing) return;
    useChatStore.getState().updateMessage(voteCardMessageId, {
      voteCard: { ...existing, ...patch },
    });
  };

  try {
    const res = await fetch('/api/vote/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ models, alternatives, context: convMessages, locale, sessionId }),
    });

    if (!res.ok || !res.body) throw new Error(`/api/vote/run failed: ${res.status}`);

    await parseVoteStream(res.body, (event) => {
      switch (event.type) {
        case 'vote_start':
          currentActiveIdx = event.modelIndex;
          currentStatement = '';
          updateCard({ activeVoterIndex: event.modelIndex, activeStatement: '' });
          break;

        case 'content':
          currentStatement += event.text;
          updateCard({ activeStatement: currentStatement });
          break;

        case 'vote_done': {
          const vote: VoteResult = {
            modelId: event.modelId,
            providerId: event.providerId,
            displayName: event.displayName,
            choice: event.choice,
            statement: event.statement,
          };
          collectedVotes.push(vote);
          updateCard({
            votes: [...collectedVotes],
            activeVoterIndex: undefined,
            activeStatement: undefined,
          });
          currentActiveIdx = undefined;
          currentStatement = '';
          break;
        }

        case 'voting_complete':
          // will be finalized after report generation
          break;

        case 'error':
          console.error('[VoteEngine] vote error:', event.message);
          break;
      }
    });

    // All votes in — transition to complete
    updateCard({ phase: 'complete', activeVoterIndex: undefined, activeStatement: undefined });

    // Persist the completed vote card
    const finalMsg = useChatStore.getState().messages.find((m) => m.id === voteCardMessageId);
    if (finalMsg) {
      await addMessage(finalMsg);
    }

    // Generate report with voting results
    await generateReportWithVotes(sessionId, collectedVotes, alternatives, query, convMessages, locale);

  } catch (err) {
    console.error('[VoteEngine] runVoting error:', err);
    updateCard({ phase: 'complete' }); // graceful fallback
  }
}

// ─── generateReportWithVotes ──────────────────────────────────────────────────
// Calls /api/report/generate and appends the resulting report as a system message.

async function generateReportWithVotes(
  sessionId: string,
  votes: VoteResult[],
  alternatives: string[],
  query: string,
  convMessages: Array<{ role: 'user' | 'assistant'; content: string; displayName?: string }>,
  locale: string,
): Promise<void> {
  const relayMsgs = getMessages(locale as Parameters<typeof getMessages>[0]);

  try {
    const res = await fetch('/api/report/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: convMessages, query, locale, voteResults: votes, alternatives }),
    });

    if (!res.ok) throw new Error(`/api/report/generate failed: ${res.status}`);
    const { markdown, filename } = await res.json() as { markdown: string; filename: string };

    const elapsed = 0; // not tracked here
    const topic = query.slice(0, 30) + (query.length > 30 ? '...' : '');
    const reportId = `${sessionId}-vote-report-${nanoid(4)}`;
    const reportMsg: ChatMessage = {
      id: reportId,
      sessionId,
      role: 'assistant',
      content: interpolate(relayMsgs.relay.complete, { seconds: elapsed, topic }),
      timestamp: Date.now(),
      isSystem: true,
      reportMarkdown: markdown,
      reportFilename: filename,
      reportLocale: locale,
    };

    useChatStore.getState().appendMessage(reportMsg);
    await addMessage(reportMsg);
  } catch (err) {
    console.error('[VoteEngine] generateReportWithVotes failed:', err);
  }
}
