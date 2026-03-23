'use client';
import * as React from 'react';
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
import { compareItemEquality, removeItem } from '../../utils/itemEquality';
import { useListItemValueRegistration } from '../../utils/useListItemValueRegistration';
import { useListboxItemDnD } from '../utils/useListboxDnD';
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
      multiple,
      highlightItemOnHover,
      lastSelectedIndexRef,
      readOnly,
      disabled: rootDisabled,
      onItemsReorder,
    } = useListboxRootContext();

    const highlightTimeout = useTimeout();

    const highlighted = useStore(store, selectors.isActive, listItem.index);
    const selected = useStore(store, selectors.isSelected, listItem.index, itemValue);
    const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);
    const isDragging = useStore(store, selectors.isDragging, listItem.index);
    const isDropTarget = useStore(store, selectors.isDropTarget, listItem.index);

    const index = listItem.index;
    const hasRegistered = index !== -1;

    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const dragHandleRef = React.useRef<HTMLElement | null>(null);
    const indexRef = useValueAsRef(index);

    const { closestEdge } = useListboxItemDnD({
      store,
      index,
      itemValue,
      itemRef,
      dragHandleRef,
      enabled: draggableProp && hasRegistered,
      valuesRef,
      onItemsReorder,
    });

    useListItemValueRegistration({
      store,
      index,
      itemValue,
      isItemEqualToValue,
      multiple,
      hasRegistered,
      valuesRef,
    });

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

    function commitSelection(event: MouseEvent | KeyboardEvent, shiftKey = false) {
      if (readOnly) {
        return;
      }

      const selectedValue = store.state.value;

      if (multiple) {
        const currentValue = Array.isArray(selectedValue) ? selectedValue : [];

        if (shiftKey && lastSelectedIndexRef.current !== null) {
          // Range selection with Shift+Click
          const start = Math.min(lastSelectedIndexRef.current, index);
          const end = Math.max(lastSelectedIndexRef.current, index);
          const rangeValues: any[] = [];
          for (let i = start; i <= end; i += 1) {
            const val = valuesRef.current[i];
            if (val !== undefined) {
              rangeValues.push(val);
            }
          }
          // Merge: keep existing selections outside the range, plus the range
          const outsideRange = currentValue.filter((v) => {
            const idx = valuesRef.current.findIndex((rv) =>
              compareItemEquality(v, rv, isItemEqualToValue),
            );
            return idx < start || idx > end;
          });
          const nextValue = [...outsideRange, ...rangeValues];
          setValue(nextValue, createChangeEventDetails(REASONS.itemPress, event));
        } else {
          const nextValue = selected
            ? removeItem(currentValue, itemValue, isItemEqualToValue)
            : [...currentValue, itemValue];
          setValue(nextValue, createChangeEventDetails(REASONS.itemPress, event));
          lastSelectedIndexRef.current = index;
        }
      } else {
        setValue(itemValue, createChangeEventDetails(REASONS.itemPress, event));
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
        if (event.altKey && onItemsReorder && draggableProp) {
          const isVertical = store.state.orientation === 'vertical';
          const moveUp =
            (isVertical && event.key === 'ArrowUp') || (!isVertical && event.key === 'ArrowLeft');
          const moveDown =
            (isVertical && event.key === 'ArrowDown') ||
            (!isVertical && event.key === 'ArrowRight');

          if (moveUp || moveDown) {
            event.preventDefault();
            const values = valuesRef.current.filter((v) => v !== undefined);
            const currentIdx = values.findIndex((v) =>
              compareItemEquality(v, itemValue, isItemEqualToValue),
            );

            if (currentIdx === -1) {
              return;
            }

            const targetIdx = moveUp ? currentIdx - 1 : currentIdx + 1;
            if (targetIdx < 0 || targetIdx >= values.length) {
              return;
            }

            const newItems = [...values];
            const [moved] = newItems.splice(currentIdx, 1);
            newItems.splice(targetIdx, 0, moved);
            onItemsReorder({ items: newItems, reason: 'keyboard' });

            // Move the highlight to follow the reordered item
            store.set('activeIndex', targetIdx);
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
        commitSelection(event.nativeEvent, event.shiftKey);
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

    return <ListboxItemContext.Provider value={contextValue}>{element}</ListboxItemContext.Provider>;
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
   * The edge closest to the pointer when the item is a drop target (`'top'` or `'bottom'`), or `null`.
   */
  dropTargetEdge: string | null;
}

export interface ListboxItemProps
  extends NonNativeButtonProps,
    Omit<BaseUIComponentProps<'div', ListboxItemState>, 'id'> {
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
   * @default false
   */
  draggable?: boolean | undefined;
}

export namespace ListboxItem {
  export type State = ListboxItemState;
  export type Props = ListboxItemProps;
}
