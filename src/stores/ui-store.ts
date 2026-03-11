'use client';

import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  settingsOpen: boolean;
  toggleSidebar: () => void;
  toggleSettings: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  settingsOpen: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
