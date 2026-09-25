'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  type ListboxDragAndDropEdge,
  useListboxDragAndDropProviderContext,
} from '../drag-and-drop-provider/ListboxDragAndDropProviderContext';

/**
 * Parameters for {@link useDragAndDrop}.
 */
export interface UseDragAndDropParameters {
  /** Composite index of the item within the current listbox. */
  index: number;
  /** Value associated with the current item. */
  itemValue: any;
  /** Ref to the item's DOM element. */
  itemRef: React.RefObject<HTMLElement | null>;
  /** Ref to the optional drag handle element. */
  dragHandleRef: React.RefObject<HTMLElement | null>;
  /** Whether dragging should be enabled for the item. */
  dragEnabled: boolean;
  /** Whether the item should act as a drop target. */
  dropTargetEnabled: boolean;
  /** Whether the item is disabled. */
  disabled: boolean;
  /**
   * Group ID metadata exposed to provider drag-and-drop predicates.
   */
  groupId: string | undefined;
}

export interface UseDragAndDropReturnValue {
  /** The closest edge when the item is the active drop target. */
  closestEdge: ListboxDragAndDropEdge | null;
}

/**
 * Wires a listbox item into `Listbox.DragAndDropProvider` and exposes its
 * current drop-target edge for styling.
 *
 * @param params Configuration for the current draggable item.
 * @returns The closest edge for the current drop target, or `null`.
 */
export function useDragAndDrop(params: UseDragAndDropParameters): UseDragAndDropReturnValue {
  const {
    index,
    itemValue,
    itemRef,
    dragHandleRef,
    dragEnabled,
    dropTargetEnabled,
    disabled,
    groupId,
  } = params;

  const [closestEdge, setClosestEdge] = React.useState<ListboxDragAndDropEdge | null>(null);
  const dragAndDropContext = useListboxDragAndDropProviderContext(true);

  useIsoLayoutEffect(() => {
    const element = itemRef.current;
    if (!dragAndDropContext || !element || (!dragEnabled && !dropTargetEnabled)) {
      return undefined;
    }

    return dragAndDropContext.setupItem({
      element,
      dragHandle: dragHandleRef.current ?? element,
      index,
      itemValue,
      dragEnabled,
      dropTargetEnabled,
      disabled,
      groupId,
      setClosestEdge,
    });
  }, [
    dragAndDropContext,
    dragEnabled,
    dropTargetEnabled,
    disabled,
    index,
    itemValue,
    groupId,
    itemRef,
    dragHandleRef,
  ]);

  return { closestEdge };
}
