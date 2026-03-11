import type { ProviderId } from './config';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  modelId?: string;
  providerId?: ProviderId;
  displayName?: string;
  timestamp: number;
  isError?: boolean;
  errorMessage?: string;
  isSystem?: boolean;
  reportMarkdown?: string;
  reportFilename?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export type RelayStatus = 'idle' | 'running' | 'error' | 'stopped';
