import Dexie from 'dexie';
import { nanoid } from 'nanoid';
import { db } from './database';
import { createClient } from '@/lib/supabase/client';
import { isSaasClient } from '@/lib/flags';
import type { ChatMessage, ChatSession } from '@/types/chat';

// ---------------------------------------------------------------------------
// Supabase dual-write helpers (SaaS mode only, fire-and-forget)
// ---------------------------------------------------------------------------

async function syncSessionCreate(id: string, title: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('chat_sessions').insert({ id, user_id: user.id, title, source: 'web' });
}

async function syncMessageUpsert(message: ChatMessage) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await Promise.all([
    supabase.from('chat_messages').upsert({
      id: message.id,
      session_id: message.sessionId,
      user_id: user.id,
      role: message.role,
      content: message.content,
      model_id: message.modelId ?? null,
      display_name: message.displayName ?? null,
      timestamp: message.timestamp,
      is_error: message.isError ?? false,
      is_system: message.isSystem ?? false,
      report_markdown: message.reportMarkdown ?? null,
      usage_stats: message.usageStats ?? null,
    }),
    supabase.from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', message.sessionId),
  ]);
}

async function syncSessionDelete(sessionId: string) {
  const supabase = createClient();
  // chat_messages cascade via FK
  await supabase.from('chat_sessions').delete().eq('id', sessionId);
}

// ---------------------------------------------------------------------------
// Public operations
// ---------------------------------------------------------------------------

export async function createSession(firstMessage: string): Promise<string> {
  const id = nanoid();
  const now = Date.now();
  const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
  await db.sessions.add({ id, title, createdAt: now, updatedAt: now });
  if (isSaasClient) syncSessionCreate(id, title).catch(() => {});
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
  if (isSaasClient) syncMessageUpsert(message).catch(() => {});
}

export async function clearSessionMessages(sessionId: string): Promise<void> {
  await db.messages.where('sessionId').equals(sessionId).delete();
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.transaction('rw', [db.sessions, db.messages], async () => {
    await db.messages.where('sessionId').equals(sessionId).delete();
    await db.sessions.delete(sessionId);
  });
  if (isSaasClient) syncSessionDelete(sessionId).catch(() => {});
}

export async function getAllSessions(): Promise<ChatSession[]> {
  return db.sessions.orderBy('updatedAt').reverse().toArray();
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  await db.sessions.update(sessionId, { title });
}
