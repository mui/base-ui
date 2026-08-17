'use client';
import * as React from 'react';
import {
  FilterDropdownClear,
  type FilterDropdownClearProps,
  type FilterDropdownClearState,
} from '../../filter-dropdown/clear/FilterDropdownClear';
import { useMenuFilterableRootContext } from '../../menu/root/MenuRootContext';

/**
 * Clears the filter input value.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuClear = React.forwardRef(function FilterMenuClear(
  componentProps: FilterMenuClear.Props,
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

export interface FilterMenuClearState extends FilterDropdownClearState {}
export interface FilterMenuClearProps extends FilterDropdownClearProps {}

export namespace FilterMenuClear {
  export type State = FilterMenuClearState;
  export type Props = FilterMenuClearProps;
}
