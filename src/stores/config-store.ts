'use client';

import { createStore, useStore } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { ModelConfig } from '@/types/config';

interface ConfigState {
  models: ModelConfig[];
  maxRounds: number;
  exportFormat: 'pdf' | 'png';
  generateReport: boolean;

  addModel: (model: Omit<ModelConfig, 'id' | 'order'>) => void;
  removeModel: (modelId: string) => void;
  toggleModel: (modelId: string) => void;
  reorderModels: (activeId: string, overId: string) => void;
  updateModel: (modelId: string, updates: Partial<ModelConfig>) => void;
  getEnabledModels: () => ModelConfig[];
  setMaxRounds: (n: number) => void;
  setExportFormat: (format: 'pdf' | 'png') => void;
  setGenerateReport: (v: boolean) => void;
  syncPresets: () => Promise<void>;
}

function createConfigStore() {
  return createStore<ConfigState>()(
    persist(
      (set, get) => ({
        models: [],
        maxRounds: 1,
        exportFormat: 'png' as const,
        generateReport: true,

        addModel: (model) =>
          set((state) => ({
            models: [
              ...state.models,
              { ...model, id: nanoid(), order: state.models.length },
            ],
          })),

        removeModel: (modelId) =>
          set((state) => ({
            models: state.models
              .filter((m) => m.id !== modelId)
              .map((m, i) => ({ ...m, order: i })),
          })),

        toggleModel: (modelId) =>
          set((state) => ({
            models: state.models.map((m) =>
              m.id === modelId ? { ...m, enabled: !m.enabled } : m
            ),
          })),

        reorderModels: (activeId, overId) =>
          set((state) => {
            const oldIndex = state.models.findIndex((m) => m.id === activeId);
            const newIndex = state.models.findIndex((m) => m.id === overId);
            if (oldIndex === -1 || newIndex === -1) return state;

            const newModels = [...state.models];
            const [moved] = newModels.splice(oldIndex, 1);
            newModels.splice(newIndex, 0, moved);
            return {
              models: newModels.map((m, i) => ({ ...m, order: i })),
            };
          }),

        updateModel: (modelId, updates) =>
          set((state) => ({
            models: state.models.map((m) =>
              m.id === modelId ? { ...m, ...updates } : m
            ),
          })),

        getEnabledModels: () =>
          get()
            .models.filter((m) => m.enabled)
            .sort((a, b) => a.order - b.order),

        setMaxRounds: (n) => set({ maxRounds: n }),

        setExportFormat: (format) => set({ exportFormat: format }),

        setGenerateReport: (v) => set({ generateReport: v }),

        syncPresets: async () => {
          let serverPresets: ModelConfig[];
          try {
            const res = await fetch('/api/presets');
            if (!res.ok) return;
            serverPresets = await res.json();
          } catch {
            return;
          }
          set((state) => {
            const serverIds = new Set(serverPresets.map((p) => p.id));
            const withoutStale = state.models.filter((m) => !m.isPreset || serverIds.has(m.id));
            const updated = withoutStale.map((m) => {
              if (!m.isPreset) return m;
              const fresh = serverPresets.find((p) => p.id === m.id);
              if (!fresh) return m;
              return { ...m, modelId: fresh.modelId, displayName: fresh.displayName, baseUrl: fresh.baseUrl, creditsPerRound: fresh.creditsPerRound, badge: fresh.badge };
            });
            const existingIds = new Set(updated.map((m) => m.id));
            const toAdd = serverPresets
              .filter((p) => !existingIds.has(p.id))
              .map((p, i) => ({ ...p, apiKey: '', isPreset: true as const, enabled: p.defaultEnabled ?? true, order: updated.length + i }));
            return { models: [...updated, ...toAdd] };
          });
        },
      }),
      {
        name: 'llmconclave-config',
        storage: createJSONStorage(() =>
          typeof window !== 'undefined'
            ? window.localStorage
            : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
        ),
      }
    )
  );
}

// Lazy init: avoid calling Zustand's persist (which references window) at module
// evaluation time, so Turbopack SSR does not crash on window is not defined.
let _store: ReturnType<typeof createConfigStore> | null = null;
function getStore() {
  if (!_store) _store = createConfigStore();
  return _store;
}

function useConfigStoreHook<T>(selector: (state: ConfigState) => T): T {
  return useStore(getStore(), selector);
}

// Exported hook also exposes .getState() / .setState() for imperative access.
export const useConfigStore = Object.assign(useConfigStoreHook, {
  getState: () => getStore().getState(),
  setState: (partial: ConfigState | Partial<ConfigState> | ((state: ConfigState) => ConfigState | Partial<ConfigState>), replace?: boolean | undefined) => {
    getStore().setState(partial as any, replace as any);
  },
});
