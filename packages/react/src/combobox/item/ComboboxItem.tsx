'use client';
import * as React from 'react';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import {
  useCompositeListItem,
  IndexGuessBehavior,
} from '../../composite/list/useCompositeListItem';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useLatestRef } from '../../utils/useLatestRef';
import { useSelector } from '../../utils/store';
import { useRenderElement } from '../../utils/useRenderElement';
import { ComboboxItemContext } from './ComboboxItemContext';
import { selectors } from '../store';
import { useButton } from '../../use-button';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useComboboxRowContext } from '../row/ComboboxRowContext';

/**
 * An individual item in the combobox popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
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
      label,
      disabled = false,
      nativeButton = false,
      ...elementProps
    } = componentProps;

    const id = useBaseUiId();

    const textRef = React.useRef<HTMLElement | null>(null);
    const listItem = useCompositeListItem({
      label,
      textRef,
      indexGuessBehavior: IndexGuessBehavior.GuessFromOrder,
    });

    const {
      store,
      select,
      listRef,
      getItemProps,
      setOpen,
      setValue,
      valuesRef,
      inputRef,
      registerSelectedItem,
      keyboardActiveRef,
      allowActiveIndexSyncRef,
      onItemHighlighted,
      readOnly,
    } = useComboboxRootContext();

    const selectable = select !== 'none';
    const multiple = select === 'multiple';
    const isRow = useComboboxRowContext();

    const active = useSelector(store, selectors.isActive, listItem.index);
    const matchesSelectedValue = useSelector(store, selectors.isSelected, value);
    const rootValue = useSelector(store, selectors.value);

    const selected = matchesSelectedValue && selectable;

    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const indexRef = useLatestRef(listItem.index);

    const hasRegistered = listItem.index !== -1;

    useModernLayoutEffect(() => {
      if (!hasRegistered) {
        return undefined;
      }

      const values = valuesRef.current;
      values[listItem.index] = value;

      return () => {
        delete values[listItem.index];
      };
    }, [hasRegistered, listItem.index, value, valuesRef]);

    useModernLayoutEffect(() => {
      if (hasRegistered && value === rootValue) {
        registerSelectedItem(listItem.index);

        if (selectable && allowActiveIndexSyncRef.current) {
          const frame = requestAnimationFrame(() => {
            itemRef.current?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' });
            store.set('activeIndex', listItem.index);
            onItemHighlighted(value, keyboardActiveRef.current ? 'keyboard' : 'pointer');
            allowActiveIndexSyncRef.current = false;
          });
          return () => {
            cancelAnimationFrame(frame);
          };
        }
      }

      return undefined;
    }, [
      hasRegistered,
      listItem.index,
      registerSelectedItem,
      value,
      rootValue,
      store,
      selectable,
      allowActiveIndexSyncRef,
      onItemHighlighted,
      keyboardActiveRef,
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
      tabIndex: -1,
      onClick(event) {
        if (disabled || readOnly) {
          return;
        }

        if (multiple) {
          const currentValue = rootValue as any[];
          const isCurrentlySelected = Array.isArray(currentValue) && currentValue.includes(value);

          let nextValue: any[];
          if (isCurrentlySelected) {
            nextValue = currentValue.filter((v) => v !== value);
          } else {
            nextValue = Array.isArray(currentValue) ? [...currentValue, value] : [value];
          }

          setValue(nextValue, event.nativeEvent, 'item-press');

          const wasFiltering = inputRef.current ? inputRef.current.value.trim() !== '' : false;
          if (wasFiltering) {
            setOpen(false, event.nativeEvent, 'item-press');
          }
        } else {
          setValue(value, event.nativeEvent, 'item-press');
          setOpen(false, event.nativeEvent, 'item-press');
        }

        const selectedIndex = listRef.current.indexOf(itemRef.current);
        if (selectedIndex !== -1) {
          store.set('selectedIndex', selectedIndex);
        }

        queueMicrotask(() => {
          inputRef.current?.focus();
        });
      },
      onPointerDown(event) {
        // Prevent the item from stealing focus from the input.
        event.preventDefault();
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
     * A unique value that identifies this select item.
     * @default null
     */
    value?: any;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Overrides the text label to use on the trigger when this item is selected
     * and when the item is matched during keyboard text navigation.
     */
    label?: string;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default false
     */
    nativeButton?: boolean;
  }
}
