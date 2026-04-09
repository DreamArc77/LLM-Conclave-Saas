'use client';

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

export function ModelList() {
  const models = useConfigStore((s) => s.models);
  const reorderModels = useConfigStore((s) => s.reorderModels);
  const t = useT();

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
      <SortableContext
        items={models.map((m) => m.id)}
        strategy={verticalListSortingStrategy}
      >
        {models.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
