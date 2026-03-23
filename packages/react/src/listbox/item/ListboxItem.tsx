'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { isMouseWithinBounds } from '@base-ui/utils/isMouseWithinBounds';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useStore } from '@base-ui/utils/store';
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

    const {
      store,
      setValue,
      valuesRef,
      groupIdsRef,
      selectionMode,
      highlightItemOnHover,
      lastSelectedIndexRef,
      disabled: rootDisabled,
      onItemsReorder,
    } = useListboxRootContext();

    const groupContext = useListboxGroupContext(true);

    const highlightTimeout = useTimeout();

    const highlighted = useStore(store, selectors.isActive, listItem.index);
    const selected = useStore(store, selectors.isSelected, listItem.index, itemValue);
    const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);
    const isDragging = useStore(store, selectors.isDragging, listItem.index);
    const isDropTarget = useStore(store, selectors.isDropTarget, listItem.index);

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
      enabled: isDraggable && hasRegistered && !rootDisabled && !disabled,
      valuesRef,
      groupId,
      groupIdsRef,
      onItemsReorder,
    });

    useListItemValueRegistration({
      store,
      index,
      itemValue,
      isItemEqualToValue,
      multiple: isMultipleSelectionMode(selectionMode),
      hasRegistered,
      valuesRef,
    });

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
      }: { shiftKey?: boolean | undefined; ctrlKey?: boolean | undefined } = {},
    ) {
      if (selectionMode === 'none') {
        return;
      }

      let action: SelectionAction;

      if (shiftKey && isMultipleSelectionMode(selectionMode)) {
        action = { type: 'extendTo', index, anchorIndex: lastSelectedIndexRef.current };
      } else if (selectionMode === 'multiple') {
        // In 'multiple' mode, every click toggles
        action = { type: 'toggle', index };
      } else if (selectionMode === 'explicitMultiple' && ctrlKey) {
        // In 'explicitMultiple' mode, Ctrl/Cmd+Click toggles
        action = { type: 'toggle', index };
      } else {
        // 'single' or 'explicitMultiple' without modifier → replace
        action = { type: 'select', index };
      }

      const currentValue = store.state.value;
      const nextValue = selectionReducer(
        action,
        currentValue,
        valuesRef.current,
        isItemEqualToValue,
      );
      setValue(nextValue, createChangeEventDetails(REASONS.itemPress, event));

      // Update selection anchor (used by Shift+Click range selection)
      if (action.type !== 'extendTo') {
        lastSelectedIndexRef.current = index;
      }
    }

    const defaultProps: HTMLProps = {
      role: 'option',
      'aria-selected': selected,
      tabIndex: highlighted ? 0 : -1,
      onFocus() {
        store.set('activeIndex', index);
      },
      onMouseMove() {
        if (highlightItemOnHover) {
          store.set('activeIndex', index);
          itemRef.current?.focus();
        }
      },
      onMouseLeave(event) {
        if (!highlightItemOnHover || isMouseWithinBounds(event)) {
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
        store.set('activeIndex', index);

        // Keyboard-based reordering: Alt+Arrow
        if (event.altKey && onItemsReorder && isDraggable && !rootDisabled) {
          const isVertical = store.state.orientation === 'vertical';
          const moveUp =
            (isVertical && event.key === 'ArrowUp') || (!isVertical && event.key === 'ArrowLeft');
          const moveDown =
            (isVertical && event.key === 'ArrowDown') ||
            (!isVertical && event.key === 'ArrowRight');

          if (moveUp || moveDown) {
            event.preventDefault();

            // In multi-select modes, if the current item is selected, move
            // all selected items together (preserving relative order).
            const isMultiMove = isMultipleSelectionMode(selectionMode) && selected;

            if (isMultiMove) {
              const currentValue = store.state.value;
              const eqFn = store.state.isItemEqualToValue;
              const selectedIndices: number[] = [];
              for (let i = 0; i < valuesRef.current.length; i += 1) {
                const v = valuesRef.current[i];
                if (currentValue.some((sv) => eqFn(v, sv))) {
                  selectedIndices.push(i);
                }
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

              const targetValue = valuesRef.current[targetIdx];
              if (targetValue === undefined) {
                return;
              }

              const selectedValues = selectedIndices.map((i) => valuesRef.current[i]);

              onItemsReorder({
                items: selectedValues,
                referenceItem: targetValue,
                edge: moveUp ? 'before' : 'after',
                reason: 'keyboard',
              });

              // Move highlight to follow the initiating item
              const offsetInSelection = selectedIndices.indexOf(index);
              const newFirstIdx = moveUp ? firstIdx - 1 : firstIdx + 1;
              store.set('activeIndex', newFirstIdx + offsetInSelection);
            } else {
              // Single-item reorder
              const targetIdx = moveUp ? index - 1 : index + 1;
              if (targetIdx < 0 || targetIdx >= valuesRef.current.length) {
                return;
              }

              // When constrained to a group, block moves across group boundaries
              if (
                draggableProp === 'within-group' &&
                groupIdsRef.current[targetIdx] !== groupIdsRef.current[index]
              ) {
                return;
              }

              const targetValue = valuesRef.current[targetIdx];
              if (targetValue === undefined) {
                return;
              }

              onItemsReorder({
                items: [itemValue],
                referenceItem: targetValue,
                edge: moveUp ? 'before' : 'after',
                reason: 'keyboard',
              });

              // Move the highlight to follow the reordered item
              store.set('activeIndex', targetIdx);
            }
          }
        }
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
