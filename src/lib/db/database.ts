import Dexie, { type Table } from 'dexie';
import type { ChatSession, ChatMessage } from '@/types/chat';

export class AIConcilDB extends Dexie {
  sessions!: Table<ChatSession>;
  messages!: Table<ChatMessage>;

  constructor() {
    super('llmconclave-db');

    this.version(1).stores({
      sessions: 'id, updatedAt',
      messages: 'id, sessionId, [sessionId+timestamp]',
    });
  }
}

export const db = new AIConcilDB();
