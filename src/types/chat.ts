import type { ProviderId } from './config';

export interface ModelUsageStat {
  displayName: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  roundsCompleted: number;
  finishedEarly: boolean;
}

export interface RelayUsageStats {
  models: ModelUsageStat[];
  totalInputTokens: number;
  totalOutputTokens: number;
  creditCost: number;
  refund: number;
  maxRounds: number;
}

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
  usageStats?: RelayUsageStats;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export type RelayStatus = 'idle' | 'running' | 'error' | 'stopped';
