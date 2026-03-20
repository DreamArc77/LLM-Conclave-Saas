'use client';

import { create } from 'zustand';
import type { ChatMessage, RelayStatus } from '@/types/chat';

interface RelayState {
  status: RelayStatus;
  currentModelIndex: number;
  currentModelName: string;
  streamingContent: string;
  abortController: AbortController | null;
  round: number;
}

interface ChatState {
  activeSessionId: string | null;
  relay: RelayState;
  messages: ChatMessage[];
  compactedSummary: string | null;

  setActiveSession: (sessionId: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  appendMessage: (message: ChatMessage) => void;
  updateStreamingContent: (content: string) => void;
  startRelay: () => void;
  advanceRelay: (modelIndex: number, modelName: string) => void;
  setRelayRound: (round: number) => void;
  stopRelay: () => void;
  errorRelay: (errorMsg: string) => void;
  completeRelay: () => void;
  setAbortController: (ac: AbortController | null) => void;
  clearMessages: () => void;
  applyCompaction: (summary: string, keepRecentN: number) => void;
}

const initialRelay: RelayState = {
  status: 'idle',
  currentModelIndex: -1,
  currentModelName: '',
  streamingContent: '',
  abortController: null,
  round: -1,
};

export const useChatStore = create<ChatState>()((set) => ({
  activeSessionId: null,
  relay: { ...initialRelay },
  messages: [],
  compactedSummary: null,

  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

  setMessages: (messages) => set({ messages }),

  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateStreamingContent: (content) =>
    set((state) => ({
      relay: { ...state.relay, streamingContent: content },
    })),

  startRelay: () =>
    set((state) => ({
      relay: {
        ...state.relay,
        status: 'running',
        currentModelIndex: -1,
        currentModelName: '',
        streamingContent: '',
        round: -1,
      },
    })),

  advanceRelay: (modelIndex, modelName) =>
    set((state) => ({
      relay: {
        ...state.relay,
        currentModelIndex: modelIndex,
        currentModelName: modelName,
        streamingContent: '',
      },
    })),

  setRelayRound: (round) =>
    set((state) => ({
      relay: { ...state.relay, round },
    })),

  stopRelay: () =>
    set(() => ({
      relay: { ...initialRelay, abortController: null },
    })),

  errorRelay: (_errorMsg) =>
    set(() => ({
      relay: { ...initialRelay, status: 'error' },
    })),

  completeRelay: () =>
    set(() => ({
      relay: { ...initialRelay },
    })),

  setAbortController: (ac) =>
    set((state) => ({
      relay: { ...state.relay, abortController: ac },
    })),

  clearMessages: () => set({ messages: [], compactedSummary: null }),

  applyCompaction: (summary, keepRecentN) =>
    set((state) => {
      const eligible = state.messages.filter(
        (m) => !m.isSystem && !m.isError && !m.isCompacted
      );
      const toCompact = eligible.slice(0, -keepRecentN);
      const ids = new Set(toCompact.map((m) => m.id));
      return {
        compactedSummary: summary,
        messages: state.messages.map((m) =>
          ids.has(m.id) ? { ...m, isCompacted: true } : m
        ),
      };
    }),
}));
