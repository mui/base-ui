'use client';
import * as React from 'react';
import { isHTMLElement } from '@floating-ui/utils/dom';
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
    } = useComboboxRootContext();

    const selectable = selectionMode !== 'none';
    const multiple = selectionMode === 'multiple';
    const isRow = useComboboxRowContext();

    const active = useSelector(store, selectors.isActive, listItem.index);
    const matchesSelectedValue = useSelector(store, selectors.isSelected, value);
    const rootSelectedValue = useSelector(store, selectors.selectedValue);

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
      if (hasRegistered && value === rootSelectedValue) {
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
      rootSelectedValue,
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
      onFocus(event) {
        const refocusTarget = isHTMLElement(event.relatedTarget)
          ? event.relatedTarget
          : inputRef.current;
        refocusTarget?.focus();
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
