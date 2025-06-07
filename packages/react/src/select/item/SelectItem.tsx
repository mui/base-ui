'use client';
import * as React from 'react';
import { useSelectRootContext } from '../root/SelectRootContext';
import {
  useCompositeListItem,
  IndexGuessBehavior,
} from '../../composite/list/useCompositeListItem';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectItem } from './useSelectItem';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useLatestRef } from '../../utils/useLatestRef';
import { useSelector } from '../../utils/store';
import { useRenderElement } from '../../utils/useRenderElement';
import { SelectItemContext } from './SelectItemContext';
import { selectors } from '../store';

/**
 * An individual option in the select menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectItem = React.memo(
  React.forwardRef(function SelectItem(
    componentProps: SelectItem.Props,
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

    const textRef = React.useRef<HTMLElement | null>(null);
    const listItem = useCompositeListItem({
      label,
      textRef,
      indexGuessBehavior: IndexGuessBehavior.GuessFromOrder,
    });

    const {
      store,
      getItemProps,
      setOpen,
      setValue,
      selectionRef,
      typingRef,
      valuesRef,
      popupRef,
      registerSelectedItem,
      keyboardActiveRef,
      events,
    } = useSelectRootContext();

    const active = useSelector(store, selectors.isActive, listItem.index);
    const selected = useSelector(store, selectors.isSelected, listItem.index, value);
    const rootValue = useSelector(store, selectors.value);

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
      }
    }, [hasRegistered, listItem.index, registerSelectedItem, value, rootValue]);

    const state: SelectItem.State = React.useMemo(
      () => ({
        disabled,
        selected,
        highlighted: active,
      }),
      [disabled, selected, active],
    );

    const rootProps = getItemProps({ active, selected });
    // With our custom `focusItemOnHover` implementation, this interferes with the logic and can
    // cause the index state to be stuck when leaving the select popup.
    delete rootProps.onFocus;
    delete rootProps.id;

    const { props, rootRef } = useSelectItem({
      setOpen,
      disabled,
      highlighted: active,
      selected,
      ref: forwardedRef,
      typingRef,
      handleSelect: (event) => setValue(value, event),
      selectionRef,
      indexRef,
      popupRef,
      keyboardActiveRef,
      events,
      rootProps,
      elementProps,
      nativeButton,
    });

    const element = useRenderElement('div', componentProps, {
      ref: [rootRef, forwardedRef, listItem.ref, itemRef],
      state,
      props,
    });

    const contextValue: SelectItemContext = React.useMemo(
      () => ({
        selected,
        indexRef,
        textRef,
      }),
      [selected, indexRef, textRef],
    );

    return <SelectItemContext.Provider value={contextValue}>{element}</SelectItemContext.Provider>;
  }),
);

export namespace SelectItem {
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
