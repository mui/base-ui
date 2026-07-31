'use client';
import * as React from 'react';
import {
  FilterDropdownClear,
  type FilterDropdownClearProps,
  type FilterDropdownClearState,
} from '../../filter-dropdown/clear/FilterDropdownClear';
import { useMenuFilterableRootContext } from '../root/MenuRootContext';

/**
 * Clears the filter input value.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuClear = React.forwardRef(function MenuClear(
  componentProps: MenuClear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { store, parent } = useMenuFilterableRootContext('Clear');
  const parentDisabled = parent.type === 'menu' && parent?.store.useState('disabled');
  const disabled = store.useState('disabled');

  return (
    <FilterDropdownClear
      {...componentProps}
      ref={forwardedRef}
      disabled={componentProps.disabled || disabled || parentDisabled}
    />
  );
});

export interface MenuClearState extends FilterDropdownClearState {}
export interface MenuClearProps extends FilterDropdownClearProps {}

export namespace MenuClear {
  export type State = MenuClearState;
  export type Props = MenuClearProps;
}
