'use client';
import * as React from 'react';
import { isAndroid } from '@base-ui/utils/detectBrowser';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { isMouseWithinBounds } from '@base-ui/utils/isMouseWithinBounds';
import { ownerDocument } from '@base-ui/utils/owner';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { contains, activeElement } from '../../floating-ui-react/utils';
import { scrollIntoViewIfNeeded } from '../../composite/composite';
import { useDirection } from '../../direction-provider/DirectionContext';
import { useListboxRootContext } from '../root/ListboxRootContext';
import {
  useCompositeListItem,
  IndexGuessBehavior,
} from '../../composite/list/useCompositeListItem';
import type {
  BaseUIComponentProps,
  BaseUIEvent,
  HTMLProps,
  NonNativeButtonProps,
} from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { ListboxItemContext } from './ListboxItemContext';
import { useButton } from '../../use-button';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useListItemValueRegistration } from '../../utils/useListItemValueRegistration';
import { useDragAndDrop } from '../utils/useDragAndDrop';
import { useListboxDragAndDropProviderContext } from '../drag-and-drop-provider/ListboxDragAndDropProviderContext';
import { useListboxGroupContext } from '../group/ListboxGroupContext';
import { selectionReducer, isMultipleSelectionMode } from '../utils/selectionReducer';
import type { SelectionAction } from '../utils/selectionReducer';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { findItemIndex } from '../../utils/itemEquality';

// Map the raw edge from Pragmatic DnD (top/bottom/left/right) to logical
// before/after values for the data attribute, so consumers can style with a
// single pair of selectors regardless of orientation.
const dropTargetEdgeMapping: StateAttributesMapping<ListboxItemState> = {
  dropTargetEdge(value) {
    if (value === 'top' || value === 'left') {
      return { 'data-drop-target-edge': 'before' };
    }
    if (value === 'bottom' || value === 'right') {
      return { 'data-drop-target-edge': 'after' };
    }
    return null;
  },
};

function reorderRegistry<T>(
  registry: React.RefObject<Array<T>>,
  movedIndices: number[],
  targetIndex: number,
  edge: 'before' | 'after',
) {
  // Optimistically mirror the external reorder inside the mutable registries so
  // consecutive keyboard reorders compute against the intended order even
  // before React commits the parent's updated item array.
  const current = registry.current;
  const movedItems = movedIndices.map((movedIndex) => current[movedIndex]);

  let removedBeforeTarget = 0;

  for (let i = movedIndices.length - 1; i >= 0; i -= 1) {
    const movedIndex = movedIndices[i];
    current.splice(movedIndex, 1);

    if (movedIndex < targetIndex) {
      removedBeforeTarget += 1;
    }
  }

  const targetIndexInRemaining = targetIndex - removedBeforeTarget;
  let insertionIndex = edge === 'after' ? targetIndexInRemaining + 1 : targetIndexInRemaining;

  for (let i = 0; i < movedItems.length; i += 1) {
    current.splice(insertionIndex, 0, movedItems[i]);
    insertionIndex += 1;
  }
}

/**
 * An individual option in the listbox.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxItem = React.memo(
  React.forwardRef(function ListboxItem(
    componentProps: ListboxItem.Props,
    forwardedRef: React.ForwardedRef<HTMLElement>,
  ) {
    const {
      render,
      className,
      style,
      value: itemValue = null,
      label,
      disabled = false,
      nativeButton = false,
      ...elementProps
    } = componentProps;

    const textRef = React.useRef<HTMLElement | null>(null);
    const listItem = useCompositeListItem({
      label,
      textRef,
      indexGuessBehavior: IndexGuessBehavior.GuessFromOrder,
    });

    const store = useListboxRootContext();

    const groupContext = useListboxGroupContext(true);
    const dragAndDropContext = useListboxDragAndDropProviderContext(true);
    const direction = useDirection();

    const highlightTimeout = useTimeout();

    const selectionMode = store.useState('selectionMode');
    const highlightItemOnHover = store.useState('highlightItemOnHover');
    const rootDisabled = store.useState('disabled');
    const highlighted = store.useState('isActive', listItem.index);
    const selected = store.useState('isSelected', listItem.index, itemValue);
    const isItemEqualToValue = store.useState('isItemEqualToValue');
    const isDragging = store.useState('isDragging', listItem.index);
    const isDropTarget = store.useState('isDropTarget', listItem.index);
    const {
      disabledItemsRef,
      groupIdsRef,
      labelsRef,
      lastSelectedIndexRef,
      pointerMoveSuppressedRef,
      requestHighlightReconcile,
      setValue,
      valuesRef,
    } = store.context;

    const index = listItem.index;
    const hasRegistered = index !== -1;
    const groupId = groupContext?.groupId;

    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const dragHandleRef = React.useRef<HTMLElement | null>(null);
    const indexRef = useValueAsRef(index);
    const dragEnabled = dragAndDropContext != null && hasRegistered && !rootDisabled;
    const dropTargetEnabled = dragEnabled;
    const preventContextMenuOnAndroid = isAndroid && dragEnabled && !disabled;
    const handleContextMenu = React.useCallback((event: BaseUIEvent<React.MouseEvent>) => {
      event.preventDefault();
    }, []);

    const { closestEdge } = useDragAndDrop({
      index,
      itemValue,
      itemRef,
      dragHandleRef,
      dragEnabled,
      dropTargetEnabled,
      disabled,
      groupId,
    });

    useListItemValueRegistration({
      index,
      itemValue,
      hasRegistered,
      valuesRef,
    });

    useIsoLayoutEffect(() => {
      if (!hasRegistered) {
        return undefined;
      }

      const disabledItems = disabledItemsRef.current;
      disabledItems[index] = rootDisabled || disabled;

      return () => {
        delete disabledItems[index];
      };
    }, [disabled, disabledItemsRef, hasRegistered, index, rootDisabled]);

    // Register this item's groupId so the keyboard reorder handler can check
    // whether the target index belongs to the same group.
    useIsoLayoutEffect(() => {
      if (!hasRegistered) {
        return undefined;
      }

      const groupIds = groupIdsRef.current;
      groupIds[index] = groupContext?.groupId;

      return () => {
        delete groupIds[index];
      };
    }, [hasRegistered, index, groupContext?.groupId, groupIdsRef]);

    const state: ListboxItemState = {
      disabled,
      selected,
      highlighted,
      dragging: isDragging,
      dropTarget: isDropTarget,
      dropTargetEdge: isDropTarget && closestEdge ? closestEdge : null,
    };

    const lastKeyRef = React.useRef<string | null>(null);

    const { getButtonProps, buttonRef } = useButton({
      disabled,
      focusableWhenDisabled: true,
      native: nativeButton,
      composite: true,
    });

    /**
     * Maps a click event (with modifier keys) to a SelectionAction based on
     * the current selectionMode, then dispatches it through the reducer.
     */
    function commitSelection(
      event: MouseEvent | KeyboardEvent,
      {
        shiftKey = false,
        ctrlKey = false,
      }: {
        shiftKey?: boolean | undefined;
        ctrlKey?: boolean | undefined;
      } = {},
    ) {
      let action: SelectionAction;

      if (shiftKey && isMultipleSelectionMode(selectionMode)) {
        action = { type: 'extendTo', index, anchorIndex: lastSelectedIndexRef.current };
      } else if (selectionMode === 'multiple') {
        // In 'multiple' mode, every click toggles
        action = { type: 'toggle', index };
      } else if (selectionMode === 'explicit-multiple' && ctrlKey) {
        // In 'explicit-multiple' mode, Ctrl/Cmd+Click toggles
        action = { type: 'toggle', index };
      } else {
        // 'single' or 'explicit-multiple' without modifier → replace
        action = { type: 'select', index };
      }

      const currentValue = store.state.value;
      const nextValue = selectionReducer(
        action,
        currentValue,
        valuesRef.current,
        disabledItemsRef.current,
        isItemEqualToValue,
      );
      setValue(nextValue, createChangeEventDetails(REASONS.itemPress, event));

      // Update selection anchor (used by Shift+Click range selection)
      if (action.type !== 'extendTo') {
        lastSelectedIndexRef.current = index;
      }
    }

    /**
     * Handles Alt+Arrow keyboard reordering for both single-item and
     * multi-item (selected set) moves.
     */
    function handleKeyboardReorder(event: BaseUIEvent<React.KeyboardEvent>, resolvedIndex: number) {
      const reorderItems = dragAndDropContext?.onItemsReorder;
      const canDragItem = dragAndDropContext?.canDragItem;
      const canDropItems = dragAndDropContext?.canDropItems;

      if (
        !event.altKey ||
        event.shiftKey ||
        event.ctrlKey ||
        event.metaKey ||
        !reorderItems ||
        !canDragItem ||
        !canDropItems ||
        rootDisabled
      ) {
        return;
      }
      const handleReorderItems = reorderItems;
      const handleCanDragItem = canDragItem;
      const handleCanDropItems = canDropItems;
      const isVertical = store.state.orientation === 'vertical';
      const moveUp =
        (isVertical && event.key === 'ArrowUp') || (!isVertical && event.key === 'ArrowLeft');
      const moveDown =
        (isVertical && event.key === 'ArrowDown') || (!isVertical && event.key === 'ArrowRight');

      if (!moveUp && !moveDown) {
        return;
      }

      event.preventDefault();
      const reorderEdge = moveUp ? 'before' : 'after';
      const currentItem = {
        value: itemValue,
        index: resolvedIndex,
        groupId: groupIdsRef.current[resolvedIndex],
        disabled: disabledItemsRef.current[resolvedIndex] ?? false,
      };

      if (!handleCanDragItem(currentItem)) {
        return;
      }

      // After a keyboard reorder, we need to:
      // 1. Restore focus if it was lost (cross-group moves cause React to
      //    unmount/remount the item, moving focus to the document body).
      // 2. Scroll the moved item into view.
      // NOTE: This intentionally uses raw setTimeout instead of afterDomSettle
      // because the item may be unmounted during cross-group moves and a
      // hook-based cleanup (useTimeout) would cancel the callback.
      function restoreFocusAndScroll() {
        setTimeout(() => {
          const listEl = store.state.listElement;
          if (!listEl) {
            pointerMoveSuppressedRef.current = false;
            return;
          }

          const doc = ownerDocument(listEl);
          let target = activeElement(doc) as HTMLElement | null;

          if (!contains(listEl, target)) {
            target = listEl.querySelector<HTMLElement>('[role="option"][tabindex="0"]');
            target?.focus();
          }

          if (target) {
            scrollIntoViewIfNeeded(listEl, target, direction, store.state.orientation);
          }

          // Re-enable pointer-move highlighting after the DOM has settled.
          pointerMoveSuppressedRef.current = false;
        }, 0);
      }

      function commitReorder(movedIndices: number[], movedItems: any[], targetIdx: number) {
        const targetValue = valuesRef.current[targetIdx];
        if (targetValue === undefined) {
          return false;
        }

        const sourceItems = movedIndices.map((movedIndex, itemIndex) => ({
          value: movedItems[itemIndex],
          index: movedIndex,
          groupId: groupIdsRef.current[movedIndex],
          disabled: disabledItemsRef.current[movedIndex] ?? false,
        }));

        const targetItem = {
          value: targetValue,
          index: targetIdx,
          groupId: groupIdsRef.current[targetIdx],
          disabled: disabledItemsRef.current[targetIdx] ?? false,
        };

        if (!handleCanDropItems(sourceItems, targetItem, reorderEdge)) {
          return false;
        }

        // Suppress pointer-move highlighting while the DOM is being
        // reordered to prevent the item under the pointer from
        // stealing the highlight.
        pointerMoveSuppressedRef.current = true;
        requestHighlightReconcile();
        reorderRegistry(valuesRef, movedIndices, targetIdx, reorderEdge);
        reorderRegistry(labelsRef, movedIndices, targetIdx, reorderEdge);
        reorderRegistry(disabledItemsRef, movedIndices, targetIdx, reorderEdge);
        reorderRegistry(groupIdsRef, movedIndices, targetIdx, reorderEdge);

        handleReorderItems({
          items: movedItems,
          referenceItem: targetValue,
          edge: reorderEdge,
          reason: 'keyboard',
        });

        return true;
      }

      // In multi-select modes, if the current item is selected, move
      // all selected items together (preserving relative order).
      if (isMultipleSelectionMode(selectionMode) && selected) {
        const currentValue = store.state.value;
        const eqFn = store.state.isItemEqualToValue;
        const selectedIndices: number[] = [];
        for (let i = 0; i < valuesRef.current.length; i += 1) {
          const v = valuesRef.current[i];
          if (currentValue.some((sv) => eqFn(v, sv))) {
            selectedIndices.push(i);
          }
        }

        if (selectedIndices.length === 0) {
          return;
        }

        const firstIdx = selectedIndices[0];
        const lastIdx = selectedIndices[selectedIndices.length - 1];
        const targetIdx = moveUp ? firstIdx - 1 : lastIdx + 1;

        if (targetIdx < 0 || targetIdx >= valuesRef.current.length) {
          return;
        }

        const selectedValues = selectedIndices.map((i) => valuesRef.current[i]);
        if (!commitReorder(selectedIndices, selectedValues, targetIdx)) {
          return;
        }

        // Move highlight to follow the initiating item
        const offsetInSelection = selectedIndices.indexOf(resolvedIndex);
        const newFirstIdx = moveUp ? firstIdx - 1 : firstIdx + 1;
        store.set('activeIndex', newFirstIdx + offsetInSelection);
        restoreFocusAndScroll();
      } else {
        // Single-item reorder
        const targetIdx = moveUp ? resolvedIndex - 1 : resolvedIndex + 1;
        if (targetIdx < 0 || targetIdx >= valuesRef.current.length) {
          return;
        }
        if (!commitReorder([resolvedIndex], [itemValue], targetIdx)) {
          return;
        }

        // Move the highlight to follow the reordered item
        store.set('activeIndex', targetIdx);
        restoreFocusAndScroll();
      }
    }

    function handleItemKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
      lastKeyRef.current = event.key;
      const currentIndex = findItemIndex(valuesRef.current, itemValue, isItemEqualToValue);
      const resolvedIndex = currentIndex === -1 ? index : currentIndex;

      store.set('activeIndex', resolvedIndex);
      handleKeyboardReorder(event, resolvedIndex);
    }

    const defaultProps: HTMLProps = {
      role: 'option',
      'aria-selected': selected,
      tabIndex: highlighted ? 0 : -1,
      onFocus() {
        store.set('activeIndex', index);
      },
      onMouseMove() {
        if (highlightItemOnHover && !pointerMoveSuppressedRef.current) {
          store.set('activeIndex', index);
          itemRef.current?.focus();
        }
      },
      onMouseLeave(event) {
        if (
          !highlightItemOnHover ||
          pointerMoveSuppressedRef.current ||
          isMouseWithinBounds(event)
        ) {
          return;
        }

        highlightTimeout.start(0, () => {
          if (store.state.activeIndex === index) {
            store.set('activeIndex', null);
          }
        });
      },
      onKeyDownCapture(event: BaseUIEvent<React.KeyboardEvent>) {
        if (disabled && !rootDisabled) {
          handleItemKeyDown(event);
        }
      },
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
        handleItemKeyDown(event);
      },
      onClick(event) {
        // useButton in composite mode synthesizes a click from keydown (Space/Enter).
        // lastKeyRef is set in our onKeyDown and cleared below. If lastKeyRef is
        // null but the event type is 'keydown', it means a synthetic click arrived
        // without a real keydown we tracked — ignore it to avoid double-selection.
        if (event.type === 'keydown' && lastKeyRef.current === null) {
          return;
        }

        if (disabled || rootDisabled) {
          return;
        }

        lastKeyRef.current = null;
        commitSelection(event.nativeEvent, {
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey || event.metaKey,
        });
      },
      onContextMenu: preventContextMenuOnAndroid ? handleContextMenu : undefined,
    };

    const element = useRenderElement('div', componentProps, {
      ref: [buttonRef, forwardedRef, listItem.ref, itemRef],
      state,
      props: [defaultProps, elementProps, getButtonProps],
      stateAttributesMapping: dropTargetEdgeMapping,
    });

    const contextValue: ListboxItemContext = React.useMemo(
      () => ({
        selected,
        indexRef,
        textRef,
        dragHandleRef,
        hasRegistered,
      }),
      [selected, indexRef, textRef, dragHandleRef, hasRegistered],
    );

    return (
      <ListboxItemContext.Provider value={contextValue}>{element}</ListboxItemContext.Provider>
    );
  }),
);

export interface ListboxItemState {
  /**
   * Whether the item should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
  /**
   * Whether the item is currently being dragged.
   */
  dragging: boolean;
  /**
   * Whether the item is a drop target.
   */
  dropTarget: boolean;
  /**
   * The edge closest to the pointer when the item is a drop target (`'before'` or `'after'`), or `null`.
   */
  dropTargetEdge: string | null;
}

export interface ListboxItemProps
  extends
    NonNativeButtonProps,
    Omit<BaseUIComponentProps<'div', ListboxItemState>, 'id' | 'draggable'> {
  children?: React.ReactNode;
  /**
   * A unique value that identifies this listbox item.
   * @default null
   */
  value?: any;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Specifies the text label to use when the item is matched during keyboard text navigation.
   */
  label?: string | undefined;
}

export namespace ListboxItem {
  export type State = ListboxItemState;
  export type Props = ListboxItemProps;
}
