'use client';
import * as React from 'react';
import { useMenuFilterItem } from '../filter-root/MenuFilterContext';
import type { BaseUIComponentProps, NonNativeButtonProps } from '../../internals/types';
import { useMenuRadioGroupContext } from '../radio-group/MenuRadioGroupContext';
import { MenuRadioItemContext } from './MenuRadioItemContext';
import { useSelectableMenuItem } from '../item/useMenuItem';

const MenuRadioItemPlain = React.forwardRef(function MenuRadioItemPlain(
  componentProps: MenuRadioItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { value } = componentProps;
  const {
    value: selectedValue,
    setValue: setSelectedValue,
    disabled: groupDisabled,
  } = useMenuRadioGroupContext();

  return useSelectableMenuItem(
    componentProps,
    forwardedRef,
    selectedValue === value,
    'menuitemradio',
    MenuRadioItemContext,
    (details) => setSelectedValue(value, details),
    groupDisabled,
  );
});

/**
 * A menu item that works like a radio button in a given group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuRadioItem = React.forwardRef(function MenuRadioItem(
  props: MenuRadioItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const filterItem = useMenuFilterItem(props, forwardedRef);

  if (!filterItem.visible) {
    return null;
  }

  return <MenuRadioItemPlain {...props} ref={filterItem.ref} />;
});

export interface MenuRadioItemState {
  /**
   * Whether the radio item should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the radio item is currently highlighted.
   */
  highlighted: boolean;
  /**
   * Whether the radio item is currently selected.
   */
  checked: boolean;
}

export interface MenuRadioItemProps
  extends NonNativeButtonProps, BaseUIComponentProps<'div', MenuRadioItemState> {
  /**
   * Value of the radio item.
   * This is the value that will be set in the MenuRadioGroup when the item is selected.
   */
  value: any;
  /**
   * The click handler for the menu item.
   */
  onClick?: BaseUIComponentProps<'div', MenuRadioItemState>['onClick'] | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Overrides the text used for keyboard text navigation and filtering.
   * Falls back to the rendered text when not provided.
   */
  label?: string | undefined;
  /**
   * @ignore
   */
  id?: string | undefined;
  /**
   * Whether to close the menu when the item is clicked.
   * @default false
   */
  closeOnClick?: boolean | undefined;
}

export namespace MenuRadioItem {
  export type State = MenuRadioItemState;
  export type Props = MenuRadioItemProps;
}
