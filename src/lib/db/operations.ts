import Dexie from 'dexie';
import { nanoid } from 'nanoid';
import { db } from './database';
import type { ChatMessage, ChatSession } from '@/types/chat';

export async function createSession(firstMessage: string): Promise<string> {
  const id = nanoid();
  const now = Date.now();
  const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
  await db.sessions.add({ id, title, createdAt: now, updatedAt: now });
  return id;
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  return db.messages
    .where('[sessionId+timestamp]')
    .between([sessionId, Dexie.minKey], [sessionId, Dexie.maxKey])
    .toArray();
}

export async function addMessage(message: ChatMessage): Promise<void> {
  await db.messages.put(message); // put() = upsert — idempotent on relay reconnect
  await db.sessions.update(message.sessionId, { updatedAt: Date.now() });
}

export async function clearSessionMessages(sessionId: string): Promise<void> {
  await db.messages.where('sessionId').equals(sessionId).delete();
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.transaction('rw', [db.sessions, db.messages], async () => {
    await db.messages.where('sessionId').equals(sessionId).delete();
    await db.sessions.delete(sessionId);
  });
}

export async function getAllSessions(): Promise<ChatSession[]> {
  return db.sessions.orderBy('updatedAt').reverse().toArray();
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  await db.sessions.update(sessionId, { title });
}
