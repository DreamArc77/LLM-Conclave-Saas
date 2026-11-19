export interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
  displayName?: string;
}

export interface UsageData {
  inputTokens: number;
  outputTokens: number;
}

export interface StreamResult {
  finishReason?: string;
  /** True when the provider stopped because the output token cap was reached. */
  truncated: boolean;
}

export interface StreamParams {
  apiKey: string;
  baseUrl?: string | null;
  model: string;
  system?: string;
  messages: Array<ChatMessageItem>;
  writeSSE: (data: { type: string; content?: string; message?: string }) => Promise<void>;
  onUsage?: (usage: UsageData) => void;
  /** Hard completion-token cap for this call. */
  maxTokens?: number;
  /** OpenRouter reasoning-token cap (reasoning models only). */
  reasoningMaxTokens?: number;
  /** Called once the stream ends, with the normalized stop reason. */
  onFinish?: (result: StreamResult) => void;
}
