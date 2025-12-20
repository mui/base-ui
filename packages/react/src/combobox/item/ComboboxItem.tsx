'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  useComboboxRootContext,
  useComboboxDerivedItemsContext,
} from '../root/ComboboxRootContext';
import {
  useCompositeListItem,
  IndexGuessBehavior,
} from '../../composite/list/useCompositeListItem';
import type { BaseUIComponentProps, HTMLProps, NonNativeButtonProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { ComboboxItemContext } from './ComboboxItemContext';
import { selectors } from '../store';
import { useButton } from '../../use-button';
import { useComboboxRowContext } from '../row/ComboboxRowContext';
import { compareItemEquality, findItemIndex } from '../../utils/itemEquality';
import { ComboboxGroupContext } from '../group/ComboboxGroupContext';

/**
 * An individual item in the list.
 * Renders a `<div>` element.
 */
export const ComboboxItem = React.memo(
  React.forwardRef(function ComboboxItem(
    componentProps: ComboboxItem.Props,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      render,
      className,
      value = null,
      index: indexProp,
      disabled = false,
      nativeButton = false,
      ...elementProps
    } = componentProps;

    const didPointerDownRef = React.useRef(false);
    const textRef = React.useRef<HTMLElement | null>(null);
    const listItem = useCompositeListItem({
      index: indexProp,
      textRef,
      indexGuessBehavior: IndexGuessBehavior.GuessFromOrder,
    });

    const store = useComboboxRootContext();
    const isRow = useComboboxRowContext();
    const { filterQuery, flatFilteredItems } = useComboboxDerivedItemsContext();
    const groupContext = React.useContext(ComboboxGroupContext);

    const open = useStore(store, selectors.open);
    const selectionMode = useStore(store, selectors.selectionMode);
    const filter = useStore(store, selectors.filter);
    const readOnly = useStore(store, selectors.readOnly);
    const virtualized = useStore(store, selectors.virtualized);
    const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);
    const hasFilteredItemsProp = useStore(store, selectors.hasFilteredItemsProp);

    const selectable = selectionMode !== 'none';
    const index =
      indexProp ??
      (virtualized ? findItemIndex(flatFilteredItems, value, isItemEqualToValue) : listItem.index);
    const hasRegistered = listItem.index !== -1;

    const rootId = useStore(store, selectors.id);
    const highlighted = useStore(store, selectors.isActive, index);
    const matchesSelectedValue = useStore(store, selectors.isSelected, value);
    const items = useStore(store, selectors.items);
    const getItemProps = useStore(store, selectors.getItemProps);

    const itemRef = React.useRef<HTMLDivElement | null>(null);

    const id = rootId != null && hasRegistered ? `${rootId}-${index}` : undefined;
    const selected = matchesSelectedValue && selectable;

    const shouldFilterByQuery = !items && !hasFilteredItemsProp;
    const matchesQuery =
      !shouldFilterByQuery || value == null || filterQuery === '' || filter(value, filterQuery);

    const prevItemElementRef = React.useRef<HTMLDivElement | null>(null);
    const handleItemRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        itemRef.current = node;

        const prevNode = prevItemElementRef.current;
        if (prevNode && prevNode !== node) {
          store.state.itemValueMapRef.current.delete(prevNode);
        }

        prevItemElementRef.current = node;

        if (!node || !shouldFilterByQuery) {
          return;
        }

        store.state.itemValueMapRef.current.set(node, value);
      },
      [shouldFilterByQuery, store, value],
    );

    useIsoLayoutEffect(() => {
      const shouldRun = matchesQuery && hasRegistered && (virtualized || indexProp != null);
      if (!shouldRun) {
        return undefined;
      }

      const list = store.state.listRef.current;
      list[index] = itemRef.current;

      return () => {
        delete list[index];
      };
    }, [matchesQuery, hasRegistered, virtualized, index, indexProp, store]);

    const shouldRegisterValue = shouldFilterByQuery && (virtualized || indexProp != null);

    useIsoLayoutEffect(() => {
      if (!shouldRegisterValue || !matchesQuery || !hasRegistered) {
        return undefined;
      }

      const visibleMap = store.state.valuesRef.current;
      visibleMap[index] = value;

      return () => {
        delete visibleMap[index];
      };
    }, [shouldRegisterValue, matchesQuery, hasRegistered, index, value, store]);

    useIsoLayoutEffect(() => {
      if (!open) {
        didPointerDownRef.current = false;
        return;
      }

      // When the user starts filtering, avoid syncing `selectedIndex` from the selected value.
      // Otherwise list navigation can restore the active highlight to the selected item after input edits.
      if (!hasRegistered || items || selectionMode === 'none' || filterQuery !== '') {
        return;
      }

      const selectedValue = store.state.selectedValue;
      const lastSelectedValue = Array.isArray(selectedValue)
        ? selectedValue[selectedValue.length - 1]
        : selectedValue;

      if (compareItemEquality(lastSelectedValue, value, store.state.isItemEqualToValue)) {
        store.set('selectedIndex', index);
      }
    }, [hasRegistered, items, open, store, index, value, selectionMode, filterQuery]);

    useIsoLayoutEffect(() => {
      const registerItem = groupContext?.registerVisibleItem;
      if (!registerItem || !matchesQuery) {
        return undefined;
      }

      return registerItem();
    }, [groupContext?.registerVisibleItem, matchesQuery]);

    const state: ComboboxItem.State = {
      disabled,
      selected,
      highlighted,
    };

    const rootProps = getItemProps({ active: highlighted, selected });
    rootProps.id = undefined;
    rootProps.onFocus = undefined;

    const { getButtonProps, buttonRef } = useButton({
      disabled,
      focusableWhenDisabled: true,
      native: nativeButton,
    });

    function commitSelection(nativeEvent: MouseEvent) {
      function selectItem() {
        store.state.handleSelection(nativeEvent, value);
      }

      if (store.state.submitOnItemClick) {
        ReactDOM.flushSync(selectItem);
        store.state.requestSubmit();
      } else {
        selectItem();
      }
    }

    const defaultProps: HTMLProps = {
      id,
      role: isRow ? 'gridcell' : 'option',
      'aria-selected': selectable ? selected : undefined,
      // Focusable items steal focus from the input upon mouseup.
      // Warn if the user renders a natively focusable element like `<button>`,
      // as it should be a `<div>` instead.
      tabIndex: undefined,
      onPointerDownCapture(event) {
        didPointerDownRef.current = true;
        event.preventDefault();
      },
      onClick(event) {
        if (disabled || readOnly) {
          return;
        }

        commitSelection(event.nativeEvent);
      },
      onMouseUp(event) {
        const pointerStartedOnItem = didPointerDownRef.current;
        didPointerDownRef.current = false;

        if (disabled || readOnly || event.button !== 0 || pointerStartedOnItem || !highlighted) {
          return;
        }

        commitSelection(event.nativeEvent);
      },
    };

    const element = useRenderElement('div', componentProps, {
      ref: [buttonRef, forwardedRef, listItem.ref, handleItemRef],
      state,
      props: [rootProps, defaultProps, elementProps, getButtonProps],
    });

    const contextValue: ComboboxItemContext = React.useMemo(
      () => ({
        selected,
        textRef,
      }),
      [selected, textRef],
    );

    if (!matchesQuery) {
      return null;
    }

    return (
      <ComboboxItemContext.Provider value={contextValue}>{element}</ComboboxItemContext.Provider>
    );
  }),
);

export interface ComboboxItemState {
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
}

export interface ComboboxItemProps
  extends NonNativeButtonProps, Omit<BaseUIComponentProps<'div', ComboboxItem.State>, 'id'> {
  children?: React.ReactNode;
  /**
   * An optional click handler for the item when selected.
   * It fires when clicking the item with the pointer, as well as when pressing `Enter` with the keyboard if the item is highlighted when the `Input` or `List` element has focus.
   */
  onClick?: BaseUIComponentProps<'div', ComboboxItemState>['onClick'] | undefined;
  /**
   * The index of the item in the list. Improves performance when specified by avoiding the need to calculate the index automatically from the DOM.
   */
  index?: number | undefined;
  /**
   * A unique value that identifies this item.
   * @default null
   */
  value?: any;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace ComboboxItem {
  export type State = ComboboxItemState;
  export type Props = ComboboxItemProps;
}
