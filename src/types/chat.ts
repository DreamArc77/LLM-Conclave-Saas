import type { ProviderId } from './config';

export interface VoteResult {
  modelId: string;
  providerId: string;
  displayName: string;
  choice: string;    // "A" | "B" | "C" | ...
  statement: string; // 简短投票陈述
}

export interface VoteCard {
  phase: 'loading' | 'setup' | 'voting' | 'complete';
  alternatives: string[];    // 2-4 个备选方案文本
  votes: VoteResult[];
  activeVoterIndex?: number; // 当前正在投票的模型序号
  activeStatement?: string;  // 当前正在流式输出的陈述
  totalVoters?: number;      // 参与投票的总模型数
}

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
  isCompacted?: boolean;
  reportMarkdown?: string;
  reportFilename?: string;
  reportLocale?: string;
  usageStats?: RelayUsageStats;
  isConcludePrompt?: boolean;
  voteCard?: VoteCard;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export type RelayStatus = 'idle' | 'running' | 'error' | 'stopped';
