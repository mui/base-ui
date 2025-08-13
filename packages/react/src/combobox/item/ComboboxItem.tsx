'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useAnimationFrame } from '@base-ui-components/utils/useAnimationFrame';

import { useComboboxRootContext } from '../root/ComboboxRootContext';
import {
  useCompositeListItem,
  IndexGuessBehavior,
} from '../../composite/list/useCompositeListItem';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { ComboboxItemContext } from './ComboboxItemContext';
import { selectors } from '../store';
import { useButton } from '../../use-button';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useComboboxRowContext } from '../row/ComboboxRowContext';

/**
 * An individual item in the popup.
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
      disabled = false,
      nativeButton = false,
      ...elementProps
    } = componentProps;

    const id = useBaseUiId();

    const textRef = React.useRef<HTMLElement | null>(null);
    const listItem = useCompositeListItem({
      textRef,
      indexGuessBehavior: IndexGuessBehavior.GuessFromOrder,
    });

    const {
      store,
      selectionMode,
      getItemProps,
      setOpen,
      setSelectedValue,
      valuesRef,
      inputRef,
      registerSelectedItem,
      keyboardActiveRef,
      allowActiveIndexSyncRef,
      onItemHighlighted,
      readOnly,
      virtualized,
      listRef,
    } = useComboboxRootContext();

    const storeItems = useStore(store, selectors.items);

    const selectable = selectionMode !== 'none';
    const multiple = selectionMode === 'multiple';
    const index = virtualized && storeItems ? storeItems.indexOf(value) : listItem.index;

    const isRow = useComboboxRowContext();
    const active = useStore(store, selectors.isActive, index);
    const matchesSelectedValue = useStore(store, selectors.isSelected, value);
    const rootSelectedValue = useStore(store, selectors.selectedValue);
    const initialList = useStore(store, selectors.initialList);

    const selected = matchesSelectedValue && selectable;

    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const indexRef = useLatestRef(index);

    const frame = useAnimationFrame();

    const hasRegistered = listItem.index !== -1;

    useIsoLayoutEffect(() => {
      if (!storeItems || !virtualized) {
        return undefined;
      }

      const list = listRef.current;

      if (index !== -1) {
        list[index] = itemRef.current;
        return () => {
          list[index] = null;
        };
      }

      return undefined;
    }, [index, virtualized, listRef, storeItems, initialList]);

    useIsoLayoutEffect(() => {
      if (!hasRegistered) {
        return undefined;
      }

      const values = valuesRef.current;
      values[index] = value;

      return () => {
        delete values[index];
      };
    }, [hasRegistered, index, value, valuesRef]);

    useIsoLayoutEffect(() => {
      if (virtualized) {
        return undefined;
      }

      if (hasRegistered && value === rootSelectedValue) {
        registerSelectedItem(index);

        if (selectable && allowActiveIndexSyncRef.current) {
          frame.request(() => {
            itemRef.current?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' });
            store.set('activeIndex', index);
            onItemHighlighted(value, {
              type: keyboardActiveRef.current ? 'keyboard' : 'pointer',
              index,
            });
            allowActiveIndexSyncRef.current = false;
          });
          return () => {
            frame.cancel();
          };
        }
      }

      return undefined;
    }, [
      hasRegistered,
      index,
      registerSelectedItem,
      value,
      rootSelectedValue,
      store,
      selectable,
      allowActiveIndexSyncRef,
      onItemHighlighted,
      keyboardActiveRef,
      frame,
      virtualized,
    ]);

    const state: ComboboxItem.State = React.useMemo(
      () => ({
        disabled,
        selected,
        highlighted: active,
      }),
      [disabled, selected, active],
    );

    const rootProps = getItemProps({ active, selected });
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

          setSelectedValue(nextValue, event.nativeEvent, 'item-press');

          const wasFiltering = inputRef.current ? inputRef.current.value.trim() !== '' : false;
          if (wasFiltering) {
            setOpen(false, event.nativeEvent, 'item-press');
          }
        } else {
          setSelectedValue(value, event.nativeEvent, 'item-press');
          setOpen(false, event.nativeEvent, 'item-press');
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

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'id'> {
    children?: React.ReactNode;
    /**
     * A unique value that identifies this combobox item.
     */
    value?: any;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default false
     */
    nativeButton?: boolean;
  }
}
