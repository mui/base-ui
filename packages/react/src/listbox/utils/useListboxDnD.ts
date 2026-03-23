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
  /**
   * Group ID for constraining drops. When defined, only items with the same
   * groupId can be drop targets. When `undefined`, drops are unrestricted.
   */
  groupId: string | undefined;
  onItemsReorder:
    | ((event: {
        items: any[];
        referenceItem: any;
        edge: 'before' | 'after';
        reason: 'drag' | 'keyboard';
      }) => void)
    | undefined;
}

/**
 * Converts a physical edge (top/bottom/left/right) from Pragmatic DnD into
 * a logical 'before' | 'after' value.
 */
function toLogicalEdge(edge: Edge | null): 'before' | 'after' {
  return edge === 'bottom' || edge === 'right' ? 'after' : 'before';
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
    groupId,
    onItemsReorder,
  } = params;

  const [closestEdge, setClosestEdge] = React.useState<Edge | null>(null);

  const handleDrop = useStableCallback(
    (sourceIndex: number, targetIndex: number, edge: Edge | null) => {
      if (!onItemsReorder || sourceIndex === targetIndex) {
        return;
      }

      const sourceValue = valuesRef.current[sourceIndex];
      const targetValue = valuesRef.current[targetIndex];

      if (sourceValue === undefined || targetValue === undefined) {
        return;
      }

      onItemsReorder({
        items: [sourceValue],
        referenceItem: targetValue,
        edge: toLogicalEdge(edge),
        reason: 'drag',
      });
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
      getInitialData: () => ({ index, value: itemValue, groupId }),
      onDragStart() {
        store.set('dragActiveIndex', index);
      },
      onDrop() {
        store.update({ dragActiveIndex: null, dropTargetIndex: null });
      },
    });

    const cleanupDropTarget = dropTargetForElements({
      element,
      canDrop({ source }) {
        const sourceGroupId = source.data.groupId as string | undefined;
        // If either source or target has a groupId constraint, they must match.
        if (sourceGroupId !== undefined && groupId !== undefined) {
          return sourceGroupId === groupId;
        }
        if (sourceGroupId !== undefined || groupId !== undefined) {
          return sourceGroupId === groupId;
        }
        return true;
      },
      getData: ({ input, element: el }) => {
        return attachClosestEdge(
          { index, value: itemValue, groupId },
          {
            input,
            element: el,
            allowedEdges:
              store.state.orientation === 'horizontal' ? ['left', 'right'] : ['top', 'bottom'],
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
  }, [enabled, index, itemValue, groupId, itemRef, dragHandleRef, store, handleDrop]);

  return { closestEdge };
}
