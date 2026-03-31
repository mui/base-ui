'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { isMouseWithinBounds } from '@base-ui/utils/isMouseWithinBounds';
import { ownerDocument } from '@base-ui/utils/owner';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useStore } from '@base-ui/utils/store';
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
import { selectors } from '../store';
import { useButton } from '../../use-button';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useListItemValueRegistration } from '../../utils/useListItemValueRegistration';
import { useListboxItemDnD } from '../utils/useListboxDnD';
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
      draggable: draggableProp = false,
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
    const direction = useDirection();

    const highlightTimeout = useTimeout();

    const selectionMode = useStore(store, selectors.selectionMode);
    const highlightItemOnHover = useStore(store, selectors.highlightItemOnHover);
    const rootDisabled = useStore(store, selectors.disabled);
    const highlighted = useStore(store, selectors.isActive, listItem.index);
    const selected = useStore(store, selectors.isSelected, listItem.index, itemValue);
    const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);
    const isDragging = useStore(store, selectors.isDragging, listItem.index);
    const isDropTarget = useStore(store, selectors.isDropTarget, listItem.index);
    const {
      disabledItemsRef,
      groupIdsRef,
      labelsRef,
      lastPointerTypeRef,
      lastSelectedIndexRef,
      pointerMoveSuppressedRef,
      requestHighlightReconcile,
      setValue,
      valuesRef,
    } = store.context;

    const index = listItem.index;
    const hasRegistered = index !== -1;
    const isDraggable = draggableProp !== false;

    // When draggable='within-group', constrain DnD to the item's group.
    // When draggable=true, pass undefined to allow unrestricted drops.
    const groupId = draggableProp === 'within-group' ? groupContext?.groupId : undefined;

    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const dragHandleRef = React.useRef<HTMLElement | null>(null);
    const indexRef = useValueAsRef(index);

    const { closestEdge } = useListboxItemDnD({
      store,
      index,
      itemValue,
      itemRef,
      dragHandleRef,
      dragEnabled: isDraggable && hasRegistered && !rootDisabled && !disabled,
      dropTargetEnabled: isDraggable && hasRegistered && !rootDisabled,
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
        pointerType,
      }: {
        shiftKey?: boolean | undefined;
        ctrlKey?: boolean | undefined;
        pointerType?: string | null | undefined;
      } = {},
    ) {
      if (selectionMode === 'none') {
        return;
      }

      // Touch and pen interactions in 'explicit-multiple' mode behave like
      // 'multiple' — every tap toggles without requiring a modifier key.
      const isCoarsePointer = pointerType === 'touch' || pointerType === 'pen';

      let action: SelectionAction;

      if (shiftKey && isMultipleSelectionMode(selectionMode)) {
        action = { type: 'extendTo', index, anchorIndex: lastSelectedIndexRef.current };
      } else if (selectionMode === 'multiple') {
        // In 'multiple' mode, every click toggles
        action = { type: 'toggle', index };
      } else if (selectionMode === 'explicit-multiple' && (ctrlKey || isCoarsePointer)) {
        // In 'explicit-multiple' mode, Ctrl/Cmd+Click or touch/pen toggles
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
      const reorderItems = store.context.onItemsReorder;

      if (!event.altKey || !reorderItems || !isDraggable || rootDisabled || disabled) {
        return;
      }
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
        if (!reorderItems) {
          return false;
        }

        const targetValue = valuesRef.current[targetIdx];
        if (targetValue === undefined) {
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

        reorderItems({
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
          if (!disabledItemsRef.current[i] && currentValue.some((sv) => eqFn(v, sv))) {
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

        // Within-group: all selected items must share the target's group
        if (draggableProp === 'within-group') {
          const targetGroupId = groupIdsRef.current[targetIdx];
          if (selectedIndices.some((si) => groupIdsRef.current[si] !== targetGroupId)) {
            return;
          }
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

        // When constrained to a group, block moves across group boundaries
        if (
          draggableProp === 'within-group' &&
          groupIdsRef.current[targetIdx] !== groupIdsRef.current[resolvedIndex]
        ) {
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

    const defaultProps: HTMLProps = {
      role: 'option',
      'aria-selected': selected,
      tabIndex: highlighted ? 0 : -1,
      onPointerDown(event: React.PointerEvent) {
        lastPointerTypeRef.current = event.pointerType;
      },
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
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
        lastKeyRef.current = event.key;
        const currentIndex = findItemIndex(valuesRef.current, itemValue, isItemEqualToValue);
        const resolvedIndex = currentIndex === -1 ? index : currentIndex;

        store.set('activeIndex', resolvedIndex);
        handleKeyboardReorder(event, resolvedIndex);
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

        // Determine the true pointer type that initiated this click.
        // iOS Safari dispatches `click` as a PointerEvent but incorrectly
        // reports pointerType as "mouse" even for touch interactions.
        // The ref set in onPointerDown always has the correct value,
        // so prefer it when available. The ref is shared across all items
        // (via context) because on touch devices the pointerdown and click
        // targets may differ when a finger lands near an item boundary.
        const pointerType =
          lastPointerTypeRef.current ||
          ('pointerType' in event.nativeEvent
            ? (event.nativeEvent as PointerEvent).pointerType
            : null);

        lastKeyRef.current = null;
        lastPointerTypeRef.current = null;
        commitSelection(event.nativeEvent, {
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey || event.metaKey,
          pointerType,
        });
      },
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
  /**
   * Whether the item can be reordered via drag-and-drop.
   * Set to `true` for unrestricted reordering, or `'within-group'` to
   * constrain reordering to the item's parent group.
   * @default false
   */
  draggable?: boolean | 'within-group' | undefined;
}

export namespace ListboxItem {
  export type State = ListboxItemState;
  export type Props = ListboxItemProps;
}
