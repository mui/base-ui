'use client';
import * as React from 'react';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
  attachClosestEdge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { useListboxRootContext } from '../root/ListboxRootContext';
import { afterDomSettle } from '../utils/afterDomSettle';
import { isMultipleSelectionMode } from '../utils/selectionReducer';
import {
  type ListboxDragAndDropProviderContext as ListboxDragAndDropContextValue,
  ListboxDragAndDropProviderContext,
  type ListboxDragAndDropEdge,
  type ListboxDragAndDropItem,
  type ListboxDragAndDropProviderOnItemsReorderEvent,
  type ListboxDragAndDropTargetEdge,
} from './ListboxDragAndDropProviderContext';

/**
 * Maps a physical edge (top/bottom/left/right) from Pragmatic DnD to a
 * logical placement (before/after) so consumers get a consistent API
 * regardless of the listbox orientation.
 */
function toLogicalEdge(edge: ListboxDragAndDropEdge | null): ListboxDragAndDropTargetEdge {
  return edge === 'bottom' || edge === 'right' ? 'after' : 'before';
}

/**
 * Enables drag-and-drop reordering when rendered inside `Listbox.Root`.
 * Renders no DOM element of its own.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export function ListboxDragAndDropProvider<Value = any>(
  props: ListboxDragAndDropProvider.Props<Value>,
) {
  const { children, onItemsReorder, canDrag, canDrop } = props;
  const store = useListboxRootContext();
  const dropHighlightTimeout = useTimeout();
  const dropHighlightFrame = useAnimationFrame();
  const { disabledItemsRef, groupIdsRef, pointerMoveSuppressedRef, valuesRef } = store.context;

  // Stable reference to the reorder callback so that Pragmatic DnD event
  // handlers always call the latest version without needing to re-register.
  const handleItemsReorder = useStableCallback(
    (event: ListboxDragAndDropProviderOnItemsReorderEvent<Value>) => {
      onItemsReorder?.(event);
    },
  );

  const handleCanDrag = useStableCallback((item: ListboxDragAndDropItem<Value>) => {
    if (store.state.disabled) {
      return false;
    }

    if (canDrag) {
      return canDrag(item);
    }

    return !item.disabled;
  });

  const handleCanDrop = useStableCallback(
    (
      sourceItems: ListboxDragAndDropItem<Value>[],
      targetItem: ListboxDragAndDropItem<Value>,
      edge: ListboxDragAndDropTargetEdge,
    ) => {
      if (store.state.disabled) {
        return false;
      }

      if (canDrop) {
        return canDrop(sourceItems, targetItem, edge);
      }

      return true;
    },
  );

  // ---------------------------------------------------------------------------
  // setupItem — called by each ListboxItem via useDragAndDrop to register
  // itself as a draggable source and/or drop target with Pragmatic DnD.
  // Returns a cleanup function that tears down both registrations.
  // ---------------------------------------------------------------------------
  const setupItem = useStableCallback<ListboxDragAndDropContextValue['setupItem']>((params) => {
    const {
      element,
      dragHandle,
      dragEnabled,
      dropTargetEnabled,
      index,
      itemValue,
      groupId,
      disabled,
      setClosestEdge,
    } = params;

    // Nothing to set up — bail early.
    if (!dragEnabled && !dropTargetEnabled) {
      return undefined;
    }

    let cleanupDraggable: (() => void) | undefined;
    let cleanupDropTarget: (() => void) | undefined;
    const targetItem: ListboxDragAndDropItem<Value> = {
      value: itemValue,
      index,
      groupId,
      disabled,
    };

    function getSourceItems(sourceData: Record<string, unknown>): ListboxDragAndDropItem<Value>[] {
      if (sourceData.isMultiDrag) {
        const values = sourceData.values as Value[];
        const indices = sourceData.indices as number[];
        const groupIds = sourceData.groupIds as (string | undefined)[];

        return values.map((value, itemIndex) => ({
          value,
          index: indices[itemIndex],
          groupId: groupIds[itemIndex],
          disabled: disabledItemsRef.current[indices[itemIndex]] ?? false,
        }));
      }

      const sourceIndex = sourceData.index as number;

      return [
        {
          value: sourceData.value as Value,
          index: sourceIndex,
          groupId: sourceData.groupId as string | undefined,
          disabled: disabledItemsRef.current[sourceIndex] ?? false,
        },
      ];
    }

    // -------------------------------------------------------------------------
    // Draggable registration
    // -------------------------------------------------------------------------
    if (dragEnabled && handleCanDrag(targetItem)) {
      cleanupDraggable = draggable({
        element: dragHandle,

        // Snapshot the drag payload at drag-start. In multi-select modes, if
        // the dragged item is part of the selection, we bundle *all* selected
        // items so they move together.
        getInitialData() {
          const { value: selectedValues, selectionMode, isItemEqualToValue } = store.state;
          const isSelected = selectedValues.some((sv) => isItemEqualToValue(itemValue, sv));

          // Multi-drag: collect every selected item's index, value, and groupId.
          if (isMultipleSelectionMode(selectionMode) && isSelected) {
            const indices: number[] = [];
            const values: any[] = [];
            const groupIds: (string | undefined)[] = [];

            for (let i = 0; i < valuesRef.current.length; i += 1) {
              const value = valuesRef.current[i];
              if (selectedValues.some((sv) => isItemEqualToValue(value, sv))) {
                indices.push(i);
                values.push(value);
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

          // Single-item drag payload.
          return { index, value: itemValue, groupId, isMultiDrag: false };
        },

        // Suppress pointer-move highlighting while dragging so hover events
        // don't steal focus, and record which indices are being dragged.
        onDragStart({ source }) {
          pointerMoveSuppressedRef.current = true;
          if (source.data.isMultiDrag) {
            store.set('dragActiveIndices', source.data.indices as number[]);
          } else {
            store.set('dragActiveIndices', [index]);
          }
        },

        // After the drop: clear DnD visual state, wait for React to commit
        // the reordered DOM (via afterDomSettle), then focus the dragged
        // item and re-enable pointer-move highlighting.
        onDrop({ source }) {
          store.update({ dragActiveIndices: null, dropTargetIndex: null });

          const draggedValue = source.data.value;
          const eqFn = store.state.isItemEqualToValue;

          afterDomSettle(dropHighlightTimeout, dropHighlightFrame, () => {
            const idx = valuesRef.current.findIndex(
              (v) => v !== undefined && eqFn(v, draggedValue),
            );
            if (idx !== -1) {
              const listEl = store.state.listElement;
              const target = listEl?.querySelectorAll<HTMLElement>('[role="option"]')[idx];
              target?.focus();
              store.set('activeIndex', idx);
            }
            pointerMoveSuppressedRef.current = false;
          });
        },
      });
    }

    // -------------------------------------------------------------------------
    // Drop target registration
    // -------------------------------------------------------------------------
    if (dropTargetEnabled) {
      // Shared handler for onDragEnter and onDrag — both need to mark this
      // item as the active drop target and update its closest-edge indicator.
      function updateDropState(args: {
        source: { data: Record<string, unknown> };
        self: { data: Record<string, unknown> };
      }) {
        const physicalEdge = extractClosestEdge(args.self.data) as ListboxDragAndDropEdge | null;
        const logicalEdge = toLogicalEdge(physicalEdge);
        const sourceItems = getSourceItems(args.source.data);

        if (!handleCanDrop(sourceItems, targetItem, logicalEdge)) {
          if (store.state.dropTargetIndex === index) {
            store.set('dropTargetIndex', null);
          }
          setClosestEdge(null);
          return;
        }

        store.set('dropTargetIndex', index);
        setClosestEdge(physicalEdge);
      }

      cleanupDropTarget = dropTargetForElements({
        element,

        // Attach the closest physical edge (top/bottom or left/right) based
        // on orientation so Pragmatic DnD can report which side the pointer
        // is closest to.
        getData: ({ input, element: dropTargetElement }) =>
          attachClosestEdge(
            { index, value: itemValue, groupId },
            {
              input,
              element: dropTargetElement,
              allowedEdges:
                store.state.orientation === 'horizontal' ? ['left', 'right'] : ['top', 'bottom'],
            },
          ),

        onDragEnter: updateDropState,
        onDrag: updateDropState,

        // Clear this item's drop-target state, but only if it's still the
        // active target (another item may have already claimed the role).
        onDragLeave() {
          if (store.state.dropTargetIndex === index) {
            store.set('dropTargetIndex', null);
          }
          setClosestEdge(null);
        },

        // Fire the consumer's reorder callback with the moved items, the
        // reference item (drop target), and the logical edge (before/after).
        // DnD visual state is cleared by the draggable's onDrop above.
        onDrop(args) {
          const edge = extractClosestEdge(args.self.data) as ListboxDragAndDropEdge | null;
          const logicalEdge = toLogicalEdge(edge);
          const targetValue = valuesRef.current[index];
          const sourceItems = getSourceItems(args.source.data);
          const isDroppingOnDraggedItem = sourceItems.some((item) => item.index === index);

          if (
            !isDroppingOnDraggedItem &&
            targetValue !== undefined &&
            handleCanDrop(sourceItems, targetItem, logicalEdge)
          ) {
            const items = sourceItems.map((item) => item.value);

            handleItemsReorder({
              items,
              referenceItem: targetValue,
              edge: logicalEdge,
              reason: 'drag',
            });
          }

          setClosestEdge(null);
        },
      });
    }

    // Cleanup: tear down both registrations when the item unmounts or
    // its dependencies change.
    return () => {
      cleanupDraggable?.();
      cleanupDropTarget?.();
    };
  });

  // The context value is stable across renders because both
  // handleItemsReorder and setupItem come from useStableCallback.
  const contextValue = React.useMemo(
    () => ({
      onItemsReorder: onItemsReorder ? handleItemsReorder : undefined,
      canDragItem: handleCanDrag,
      canDropItems: handleCanDrop,
      policySignature: [canDrag, canDrop] as const,
      setupItem,
    }),
    [canDrag, canDrop, handleCanDrag, handleCanDrop, handleItemsReorder, onItemsReorder, setupItem],
  );

  return (
    <ListboxDragAndDropProviderContext.Provider value={contextValue}>
      {children}
    </ListboxDragAndDropProviderContext.Provider>
  );
}

export interface ListboxDragAndDropProviderState {}

export interface ListboxDragAndDropProviderProps<Value = any> {
  children?: React.ReactNode;
  /**
   * Event handler called when items are reordered via drag-and-drop or keyboard.
   * `items` contains the moved item(s). `referenceItem` is the item that was
   * dropped on or moved next to, and `edge` indicates placement relative to it.
   */
  onItemsReorder?:
    | ((event: ListboxDragAndDropProviderOnItemsReorderEvent<Value>) => void)
    | undefined;
  /**
   * Determines whether a given item can initiate drag-and-drop.
   * Defaults to allowing all non-disabled items.
   */
  canDrag?: ((item: ListboxDragAndDropItem<Value>) => boolean) | undefined;
  /**
   * Determines whether the dragged items can be dropped relative to a target item.
   * Defaults to allowing all drops.
   */
  canDrop?:
    | ((
        sourceItems: ListboxDragAndDropItem<Value>[],
        targetItem: ListboxDragAndDropItem<Value>,
        edge: ListboxDragAndDropTargetEdge,
      ) => boolean)
    | undefined;
}

export namespace ListboxDragAndDropProvider {
  export type Props<Value = any> = ListboxDragAndDropProviderProps<Value>;
  export type State = ListboxDragAndDropProviderState;
}

export type {
  ListboxDragAndDropItem,
  ListboxDragAndDropProviderOnItemsReorderEvent,
  ListboxDragAndDropTargetEdge,
} from './ListboxDragAndDropProviderContext';
