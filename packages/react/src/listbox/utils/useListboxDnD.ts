'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import type { ListboxStore } from '../store';

export interface UseListboxItemDnDParameters {
  store: ListboxStore;
  index: number;
  itemValue: any;
  itemRef: React.RefObject<HTMLElement | null>;
  dragHandleRef: React.RefObject<HTMLElement | null>;
  enabled: boolean;
  valuesRef: React.RefObject<Array<any>>;
  onItemsReorder: ((event: { items: any[]; reason: 'drag' | 'keyboard' }) => void) | undefined;
}

export function useListboxItemDnD(params: UseListboxItemDnDParameters) {
  const {
    store,
    index,
    itemValue,
    itemRef,
    dragHandleRef,
    enabled,
    valuesRef,
    onItemsReorder,
  } = params;

  const [closestEdge, setClosestEdge] = React.useState<Edge | null>(null);

  const handleDrop = useStableCallback(
    (sourceIndex: number, targetIndex: number, edge: Edge | null) => {
      if (!onItemsReorder || sourceIndex === targetIndex) {
        return;
      }

      const values = valuesRef.current.filter((v) => v !== undefined);
      const newItems = [...values];
      const [moved] = newItems.splice(sourceIndex, 1);
      // When dropping on the bottom/right edge, the visual intent is "after this item",
      // so bump the target by 1. Then compensate: if sourceIndex < adjustedTarget,
      // the earlier splice(sourceIndex, 1) shifted all higher indices down by 1.
      const adjustedTarget = edge === 'bottom' || edge === 'right' ? targetIndex + 1 : targetIndex;
      const insertAt = sourceIndex < adjustedTarget ? adjustedTarget - 1 : adjustedTarget;
      newItems.splice(insertAt, 0, moved);
      onItemsReorder({ items: newItems, reason: 'drag' });
    },
  );

  useIsoLayoutEffect(() => {
    const element = itemRef.current;
    if (!element || !enabled) {
      return undefined;
    }

    const dragHandle = dragHandleRef.current ?? element;

    const cleanupDraggable = draggable({
      element: dragHandle,
      getInitialData: () => ({ index, value: itemValue }),
      onDragStart() {
        store.set('dragActiveIndex', index);
      },
      onDrop() {
        store.update({ dragActiveIndex: null, dropTargetIndex: null });
      },
    });

    const cleanupDropTarget = dropTargetForElements({
      element,
      getData: ({ input, element: el }) => {
        return attachClosestEdge(
          { index, value: itemValue },
          {
            input,
            element: el,
            allowedEdges: ['top', 'bottom'],
          },
        );
      },
      onDragEnter(args) {
        store.set('dropTargetIndex', index);
        setClosestEdge(extractClosestEdge(args.self.data));
      },
      onDrag(args) {
        store.set('dropTargetIndex', index);
        setClosestEdge(extractClosestEdge(args.self.data));
      },
      onDragLeave() {
        if (store.state.dropTargetIndex === index) {
          store.set('dropTargetIndex', null);
        }
        setClosestEdge(null);
      },
      onDrop(args) {
        const sourceIndex = args.source.data.index as number;
        const edge = extractClosestEdge(args.self.data);
        handleDrop(sourceIndex, index, edge);
        store.update({ dragActiveIndex: null, dropTargetIndex: null });
        setClosestEdge(null);
      },
    });

    return () => {
      cleanupDraggable();
      cleanupDropTarget();
    };
  }, [enabled, index, itemValue, itemRef, dragHandleRef, store, handleDrop]);

  return { closestEdge };
}
