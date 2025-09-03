'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
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
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';

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
      value,
      index: indexProp,
      disabled = false,
      nativeButton = false,
      ...elementProps
    } = componentProps;

    const textRef = React.useRef<HTMLElement | null>(null);
    const listItem = useCompositeListItem({
      index: indexProp,
      textRef,
      indexGuessBehavior: IndexGuessBehavior.GuessFromOrder,
    });

    const store = useComboboxRootContext();
    const isRow = useComboboxRowContext();
    const { flatFilteredItems } = useComboboxDerivedItemsContext();

    const selectionMode = useStore(store, selectors.selectionMode);
    const readOnly = useStore(store, selectors.readOnly);
    const virtualized = useStore(store, selectors.virtualized);
    const listRef = useStore(store, selectors.listRef);
    const valuesRef = useStore(store, selectors.valuesRef);
    const allValuesRef = useStore(store, selectors.allValuesRef);
    const inputRef = useStore(store, selectors.inputRef);

    const selectable = selectionMode !== 'none';
    const multiple = selectionMode === 'multiple';
    const index = indexProp ?? (virtualized ? flatFilteredItems.indexOf(value) : listItem.index);

    const rootId = useStore(store, selectors.id);
    const highlighted = useStore(store, selectors.isActive, index);
    const matchesSelectedValue = useStore(store, selectors.isSelected, value);
    const rootSelectedValue = useStore(store, selectors.selectedValue);
    const items = useStore(store, selectors.items);
    const getItemProps = useStore(store, selectors.getItemProps);

    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const indexRef = useLatestRef(index);

    const hasRegistered = listItem.index !== -1;

    const id = rootId != null && hasRegistered ? `${rootId}-${index}` : undefined;
    const selected = matchesSelectedValue && selectable;

    useIsoLayoutEffect(() => {
      const shouldRun = hasRegistered && (virtualized || indexProp != null);
      if (!shouldRun) {
        return undefined;
      }

      const list = listRef.current;
      list[index] = itemRef.current;

      return () => {
        delete list[index];
      };
    }, [hasRegistered, virtualized, index, listRef, indexProp]);

    useIsoLayoutEffect(() => {
      if (!hasRegistered || items) {
        return undefined;
      }

      const visibleMap = valuesRef.current;
      visibleMap[index] = value;

      // Stable registry that doesn't depend on filtering. Assume that no
      // filtering had occurred at this point; otherwise, an `items` prop is
      // required.
      if (selectionMode !== 'none') {
        allValuesRef.current.push(value);
      }

      return () => {
        delete visibleMap[index];
      };
    }, [hasRegistered, items, index, value, valuesRef, allValuesRef, selectionMode]);

    // When items are uncontrolled (no `items` prop), ensure selectedIndex is
    // derived from the mounted item whose value matches the selected value.
    useIsoLayoutEffect(() => {
      if (!hasRegistered || items) {
        return;
      }

      const lastSelectedValue = Array.isArray(rootSelectedValue)
        ? rootSelectedValue[rootSelectedValue.length - 1]
        : rootSelectedValue;

      if (lastSelectedValue != null && lastSelectedValue === value) {
        store.set('selectedIndex', index);
      }
    }, [hasRegistered, items, store, index, value, rootSelectedValue]);

    const state: ComboboxItem.State = React.useMemo(
      () => ({
        disabled,
        selected,
        highlighted,
      }),
      [disabled, selected, highlighted],
    );

    const rootProps = getItemProps({ active: highlighted, selected });
    delete rootProps.id;
    delete rootProps.onFocus;

    const { getButtonProps, buttonRef } = useButton({
      disabled,
      focusableWhenDisabled: true,
      native: nativeButton,
    });

    const defaultProps: HTMLProps = {
      id,
      role: isRow ? 'gridcell' : 'option',
      'aria-disabled': disabled || undefined,
      'aria-selected': selectable ? selected : undefined,
      // Focusable items steal focus from the input upon mouseup.
      // Warn if the user renders a natively focusable element like `<button>`,
      // as it should be a `<div>` instead.
      tabIndex: undefined,
      onPointerDown(event) {
        event.preventDefault();
      },
      onClick(event) {
        if (disabled || readOnly) {
          return;
        }

        const eventDetails = createBaseUIEventDetails('item-press', event.nativeEvent);

        if (multiple) {
          const currentSelectedValue = rootSelectedValue as any[];
          const isCurrentlySelected =
            Array.isArray(currentSelectedValue) && currentSelectedValue.includes(value);

          let nextValue: any[];
          if (isCurrentlySelected) {
            nextValue = currentSelectedValue.filter((v) => v !== value);
          } else {
            nextValue = Array.isArray(currentSelectedValue)
              ? [...currentSelectedValue, value]
              : [value];
          }

          store.state.setSelectedValue(nextValue, eventDetails);

          const wasFiltering = inputRef.current ? inputRef.current.value.trim() !== '' : false;
          if (wasFiltering) {
            store.state.setOpen(false, eventDetails);
          }
        } else {
          store.state.setSelectedValue(value, eventDetails);
          store.state.setOpen(false, eventDetails);
        }
      },
    };

    const element = useRenderElement('div', componentProps, {
      ref: [buttonRef, forwardedRef, listItem.ref, itemRef],
      state,
      props: [rootProps, defaultProps, elementProps, getButtonProps],
    });

    const contextValue: ComboboxItemContext = React.useMemo(
      () => ({
        selected,
        indexRef,
        textRef,
      }),
      [selected, indexRef, textRef],
    );

    return (
      <ComboboxItemContext.Provider value={contextValue}>{element}</ComboboxItemContext.Provider>
    );
  }),
);

export namespace ComboboxItem {
  export interface State {
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

  export interface Props
    extends NonNativeButtonProps,
      Omit<BaseUIComponentProps<'div', State>, 'id'> {
    children?: React.ReactNode;
    /**
     * The index of the item in the list. Improves performance when specified by avoiding the need to calculate the index automatically from the DOM.
     */
    index?: number;
    /**
     * A unique value that identifies this item.
     */
    value?: any;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
  }
}
