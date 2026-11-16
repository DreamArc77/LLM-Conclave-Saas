'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useConfigStore } from '@/stores/config-store';
import { ModelCard } from './ModelCard';
import { useT } from '@/hooks/useT';

const isSaas = process.env.NEXT_PUBLIC_SAAS_MODE === 'true';

export function ModelList() {
  const models = useConfigStore((s) => s.models);
  const reorderModels = useConfigStore((s) => s.reorderModels);
  const updateModel = useConfigStore((s) => s.updateModel);
  const t = useT();
  const [unlocked, setUnlocked] = useState<boolean | null>(isSaas ? null : true);

  useEffect(() => {
    if (!isSaas) return;
    const refresh = () => {
      fetch('/api/credits/balance')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && typeof d.unlocked === 'boolean') setUnlocked(d.unlocked);
        })
        .catch(() => { /* keep previous state */ });
    };
    refresh();
    window.addEventListener('credits-changed', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('credits-changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // Free-tier users cannot keep premium presets enabled — mirror the server-side gate.
  useEffect(() => {
    if (!isSaas || unlocked !== false) return;
    for (const m of models) {
      if (m.isPreset && !m.freeTier && m.enabled) {
        updateModel(m.id, { enabled: false });
      }
    }
  }, [models, unlocked, updateModel]);

  const showLockHint = isSaas && unlocked === false;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px movement before activating drag — prevents accidental
      // drags when the user just wants to tap a button on mobile.
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderModels(active.id as string, over.id as string);
    }
  };

  if (models.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-4">
        {t('settings.noModels')}
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {showLockHint && (
        <div className="mb-3 rounded-lg border border-yellow-200 dark:border-yellow-900/60 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2">
          <p className="text-[11px] leading-relaxed text-yellow-800 dark:text-yellow-300">
            {t('settings.freeTierHint')}{' '}
            <Link href="/account" className="font-semibold underline">
              {t('settings.unlockCta')}
            </Link>
          </p>
        </div>
      )}
      <SortableContext
        items={models.map((m) => m.id)}
        strategy={verticalListSortingStrategy}
      >
        {models.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            locked={showLockHint && !!model.isPreset && !model.freeTier}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
