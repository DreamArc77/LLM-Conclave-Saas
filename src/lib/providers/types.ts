export interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
  displayName?: string;
}

export interface UsageData {
  inputTokens: number;
  outputTokens: number;
}

export interface StreamParams {
  apiKey: string;
  baseUrl?: string | null;
  model: string;
  system?: string;
  messages: Array<ChatMessageItem>;
  writeSSE: (data: { type: string; content?: string; message?: string }) => Promise<void>;
  onUsage?: (usage: UsageData) => void;
}
