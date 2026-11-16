'use client';

import { create } from 'zustand';

type CreditsModalReason = 'insufficient' | 'subscription' | 'busy';

interface UIState {
  sidebarOpen: boolean;
  settingsOpen: boolean;
  creditsModal: { required: number; balance: number; reason: CreditsModalReason } | null;
  toggleSidebar: () => void;
  toggleSettings: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  setSidebarOpen: (open: boolean) => void;
  openCreditsModal: (required: number, balance: number, reason?: CreditsModalReason) => void;
  closeCreditsModal: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  settingsOpen: false,
  creditsModal: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openCreditsModal: (required, balance, reason = 'insufficient') =>
    set({ creditsModal: { required, balance, reason } }),
  closeCreditsModal: () => set({ creditsModal: null }),
}));
