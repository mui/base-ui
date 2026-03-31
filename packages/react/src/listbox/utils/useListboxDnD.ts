'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
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
import { isMultipleSelectionMode } from './selectionReducer';

export interface UseListboxItemDnDParameters {
  store: ListboxStore;
  index: number;
  itemValue: any;
  itemRef: React.RefObject<HTMLElement | null>;
  dragHandleRef: React.RefObject<HTMLElement | null>;
  dragEnabled: boolean;
  dropTargetEnabled: boolean;
  valuesRef: React.RefObject<Array<any>>;
  pointerMoveSuppressedRef: React.RefObject<boolean>;
  /**
   * Group ID for constraining drops. When defined, only items with the same
   * groupId can be drop targets. When `undefined`, drops are unrestricted.
   */
  groupId: string | undefined;
  /** Ref mapping each item index to its group ID (used for multi-item within-group checks). */
  groupIdsRef: React.RefObject<Array<string | undefined>>;
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
    dragEnabled,
    dropTargetEnabled,
    valuesRef,
    pointerMoveSuppressedRef,
    groupId,
    groupIdsRef,
    onItemsReorder,
  } = params;

  const [closestEdge, setClosestEdge] = React.useState<Edge | null>(null);
  const dropHighlightTimeout = useTimeout();
  const dropHighlightFrame = useAnimationFrame();

  const handleDrop = useStableCallback(
    (sourceData: Record<string, unknown>, targetIndex: number, edge: Edge | null) => {
      if (!onItemsReorder) {
        return;
      }

      const targetValue = valuesRef.current[targetIndex];
      if (targetValue === undefined) {
        return;
      }

      // In multi-drag, `values` contains all dragged items in index order.
      // In single-drag, wrap the single value in an array.
      const items: any[] = sourceData.isMultiDrag
        ? (sourceData.values as any[])
        : [sourceData.value];

      onItemsReorder({
        items,
        referenceItem: targetValue,
        edge: toLogicalEdge(edge),
        reason: 'drag',
      });
    },
  );

  useIsoLayoutEffect(() => {
    const element = itemRef.current;
    if (!element || (!dragEnabled && !dropTargetEnabled)) {
      return undefined;
    }

    let cleanupDraggable: (() => void) | undefined;
    let cleanupDropTarget: (() => void) | undefined;

    if (dragEnabled) {
      const dragHandle = dragHandleRef.current ?? element;

      cleanupDraggable = draggable({
        element: dragHandle,
        getInitialData: () => {
          // In multi-select modes, dragging a selected item drags all selected
          // items together, preserving their relative order.
          const { value: selectedValues, selectionMode, isItemEqualToValue } = store.state;
          const isSelected = selectedValues.some((sv) => isItemEqualToValue(itemValue, sv));

          if (isMultipleSelectionMode(selectionMode) && isSelected) {
            const indices: number[] = [];
            const values: any[] = [];
            const groupIds: (string | undefined)[] = [];
            for (let i = 0; i < valuesRef.current.length; i += 1) {
              const v = valuesRef.current[i];
              if (selectedValues.some((sv) => isItemEqualToValue(v, sv))) {
                indices.push(i);
                values.push(v);
                groupIds.push(groupIdsRef.current[i]);
              }
            }
            return {
              index,
              indices,
              values,
              groupIds,
              groupId,
              value: itemValue,
              isMultiDrag: true,
            };
          }

          return { index, value: itemValue, groupId, isMultiDrag: false };
        },
        onDragStart({ source }) {
          pointerMoveSuppressedRef.current = true;
          if (source.data.isMultiDrag) {
            store.set('dragActiveIndices', source.data.indices as number[]);
          } else {
            store.set('dragActiveIndices', [index]);
          }
        },
        onDrop({ source }) {
          store.update({ dragActiveIndices: null, dropTargetIndex: null });

          // After the drop, highlight the dragged item at its new position.
          const draggedValue = source.data.value;
          const eqFn = store.state.isItemEqualToValue;

          dropHighlightTimeout.start(0, () => {
            dropHighlightFrame.request(() => {
              dropHighlightFrame.request(() => {
                const idx = valuesRef.current.findIndex(
                  (v) => v !== undefined && eqFn(v, draggedValue),
                );
                if (idx !== -1) {
                  const listEl = store.state.listElement;
                  const target = listEl?.querySelectorAll<HTMLElement>('[role="option"]')[idx];
                  target?.focus();
                  // Focusing can synchronously fire onFocus with a stale
                  // composite index from before the reorder. Re-apply the
                  // resolved index afterward so the dragged item remains
                  // highlighted at its new position.
                  store.set('activeIndex', idx);
                }
                pointerMoveSuppressedRef.current = false;
              });
            });
          });
        },
      });
    }

    if (dropTargetEnabled) {
      cleanupDropTarget = dropTargetForElements({
        element,
        canDrop({ source }) {
          // For multi-drag with within-group constraint, ALL dragged items'
          // groups must match the target's group.
          if (source.data.isMultiDrag && groupId !== undefined) {
            const sourceGroupIds = source.data.groupIds as (string | undefined)[];
            return sourceGroupIds.every((gid) => gid === groupId);
          }

          // Single-item group constraint (existing logic).
          const sourceGroupId = source.data.groupId as string | undefined;
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
          const edge = extractClosestEdge(args.self.data);
          handleDrop(args.source.data, index, edge);
          store.update({ dragActiveIndices: null, dropTargetIndex: null });
          setClosestEdge(null);
        },
      });
    }

    return () => {
      cleanupDraggable?.();
      cleanupDropTarget?.();
    };
  }, [
    dragEnabled,
    dropTargetEnabled,
    index,
    itemValue,
    groupId,
    itemRef,
    dragHandleRef,
    store,
    handleDrop,
    valuesRef,
    groupIdsRef,
    dropHighlightTimeout,
    dropHighlightFrame,
    pointerMoveSuppressedRef,
  ]);

  return { closestEdge };
}
