'use client';

import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  settingsOpen: boolean;
  creditsModal: { required: number; balance: number } | null;
  toggleSidebar: () => void;
  toggleSettings: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  setSidebarOpen: (open: boolean) => void;
  openCreditsModal: (required: number, balance: number) => void;
  closeCreditsModal: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  settingsOpen: false,
  creditsModal: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openCreditsModal: (required, balance) => set({ creditsModal: { required, balance } }),
  closeCreditsModal: () => set({ creditsModal: null }),
}));
