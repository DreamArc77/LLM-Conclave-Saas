'use client';

import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/input/ChatInput';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { InsufficientCreditsModal } from '@/components/billing/InsufficientCreditsModal';
import { useUIStore } from '@/stores/ui-store';
import { useConfigStore } from '@/stores/config-store';
import { useChatStore } from '@/stores/chat-store';
import { reconnectRelay } from '@/lib/relay/relay-engine';

export function AppShell() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  useEffect(() => {
    // Sync preset models from server
    useConfigStore.getState().syncPresets();

    // Cold reload: resume any relay that was active when the page was last killed.
    const tryReconnect = () => {
      try {
        const saved = localStorage.getItem('activeRelay');
        if (!saved) return;
        const { sessionId } = JSON.parse(saved) as { sessionId: string };
        // Skip if a relay is already running (avoids double reconnect)
        if (sessionId && useChatStore.getState().relay.status !== 'running') {
          reconnectRelay(sessionId).catch(console.error);
        }
      } catch { /* invalid localStorage data — ignore */ }
    };

    tryReconnect();

    // Warm resume: iOS Safari keeps the page alive but freezes JS.
    // When the user returns, visibilitychange fires — reconnect if needed.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') tryReconnect();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div
      className="fixed inset-0 flex bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden"
      style={{
        paddingTop: 'var(--safe-inset-top)',
        paddingBottom: 'var(--safe-inset-bottom)',
        paddingLeft: 'var(--safe-inset-left)',
        paddingRight: 'var(--safe-inset-right)',
      }}
    >
      {/* Mobile backdrop — tapping it closes the sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <StatusBar />
        <ChatArea />
        <ChatInput />
      </div>

      <SettingsDrawer />
      <InsufficientCreditsModal />
    </div>
  );
}
