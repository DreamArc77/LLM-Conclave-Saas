'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, MessageSquare, Trash2, Bot } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { deleteSession, getSessionMessages } from '@/lib/db/operations';
import { useChatStore } from '@/stores/chat-store';
import { useUIStore } from '@/stores/ui-store';
import { useT } from '@/hooks/useT';
import { isSaasClient } from '@/lib/flags';
import type { ChatSession } from '@/types/chat';

interface CloudSession {
  id: string;
  title: string;
  source: 'web' | 'agent';
  updated_at: string;
}

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const relayStatus = useChatStore((s) => s.relay.status);
  const setActiveSession = useChatStore((s) => s.setActiveSession);
  const setMessages = useChatStore((s) => s.setMessages);
  const isRelayRunning = relayStatus === 'running';
  const prevRelayStatus = useRef(relayStatus);

  const t = useT();

  // ── Non-SaaS: live IndexedDB query ──────────────────────────────────────
  const dexieSessions = useLiveQuery(() =>
    isSaasClient ? Promise.resolve([] as ChatSession[]) : db.sessions.orderBy('updatedAt').reverse().toArray()
  );

  // ── SaaS: fetch from server ──────────────────────────────────────────────
  const [cloudSessions, setCloudSessions] = useState<CloudSession[]>([]);

  const fetchCloudSessions = useCallback(async () => {
    const res = await fetch('/api/sessions').catch(() => null);
    if (!res?.ok) return;
    const { sessions } = await res.json();
    setCloudSessions(sessions ?? []);
  }, []);

  useEffect(() => {
    if (isSaasClient) fetchCloudSessions();
  }, [fetchCloudSessions]);

  // Re-fetch when a debate finishes (running → idle)
  useEffect(() => {
    if (isSaasClient && prevRelayStatus.current === 'running' && relayStatus === 'idle') {
      fetchCloudSessions();
    }
    prevRelayStatus.current = relayStatus;
  }, [relayStatus, fetchCloudSessions]);

  const sessions = isSaasClient ? cloudSessions : (dexieSessions ?? []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const closeMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleNewSession = () => {
    if (isRelayRunning) return;
    setActiveSession(null);
    setMessages([]);
    closeMobile();
  };

  const handleSelectSession = async (sessionId: string, source?: string) => {
    if (isRelayRunning) return;
    setActiveSession(sessionId);
    if (isSaasClient && source === 'agent') {
      // Agent sessions live only in Supabase
      const res = await fetch(`/api/sessions/${sessionId}/messages`);
      const { messages } = await res.json();
      setMessages(messages ?? []);
    } else {
      // Web sessions: use IndexedDB (always in sync, faster)
      const messages = await getSessionMessages(sessionId);
      setMessages(messages);
    }
    closeMobile();
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string, source?: string) => {
    e.stopPropagation();
    if (isSaasClient) {
      await fetch(`/api/sessions?id=${sessionId}`, { method: 'DELETE' });
      setCloudSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
    if (!isSaasClient || source !== 'agent') {
      await deleteSession(sessionId);
    }
    if (activeSessionId === sessionId) handleNewSession();
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className={[
        'fixed inset-y-0 left-0 z-40',
        'md:relative md:inset-auto md:z-auto',
        'w-64',
        sidebarOpen ? 'md:w-64' : 'md:w-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        'transition-all duration-300 overflow-hidden',
        'border-r border-gray-200 dark:border-gray-700',
        'bg-gray-50 dark:bg-gray-900 flex flex-col h-full',
      ].join(' ')}
    >
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleNewSession}
          disabled={isRelayRunning}
          className="w-full flex items-center justify-center gap-2 text-sm py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {t('sidebar.newChat')}
        </button>
        {isRelayRunning && (
          <p className="mt-1.5 text-center text-[10px] text-amber-500 dark:text-amber-400">
            {t('sidebar.relayRunning')}
          </p>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto p-2 ${isRelayRunning ? 'opacity-50 pointer-events-none' : ''}`}>
        {sessions.map((session) => {
          const source = isSaasClient ? (session as CloudSession).source : 'web';
          return (
            <div
              key={session.id}
              onClick={() => handleSelectSession(session.id, source)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm mb-1 transition-colors ${
                activeSessionId === session.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {source === 'agent'
                ? <Bot className="w-4 h-4 flex-shrink-0 text-blue-500" />
                : <MessageSquare className="w-4 h-4 flex-shrink-0" />
              }
              <span className="flex-1 truncate text-sm">{session.title}</span>
              <button
                onClick={(e) => handleDeleteSession(e, session.id, source)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            {t('sidebar.noConversations')}
          </p>
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-[10px] text-gray-300 dark:text-gray-600 select-none font-mono">
          {process.env.NEXT_PUBLIC_BUILD_HASH ?? 'dev'}
        </span>
      </div>
    </div>
  );
}
