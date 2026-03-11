import type { ProviderProtocol } from './config';

export interface ChatProxyRequest {
  provider: ProviderProtocol;
  model: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  system?: string;
}

export interface SSEChunkEvent {
  type: 'chunk';
  content: string;
}

export interface SSEDoneEvent {
  type: 'done';
}

export interface SSEErrorEvent {
  type: 'error';
  message: string;
}

export type SSEEvent = SSEChunkEvent | SSEDoneEvent | SSEErrorEvent;
