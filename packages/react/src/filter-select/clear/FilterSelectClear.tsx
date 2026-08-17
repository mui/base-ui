'use client';
import * as React from 'react';
import {
  FilterDropdownClear,
  type FilterDropdownClearProps,
  type FilterDropdownClearState,
} from '../../filter-dropdown/clear/FilterDropdownClear';
import { useSelectFilterableRootContext } from '../../select/root/SelectRootContext';

/**
 * Clears the filter input value.
 * Renders a `<button>` element.
 */
export const FilterSelectClear = React.forwardRef(function FilterSelectClear(
  componentProps: FilterSelectClear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const context = useSelectFilterableRootContext('Clear');
  return (
    <FilterDropdownClear
      {...componentProps}
      ref={forwardedRef}
      disabled={context.disabled || componentProps.disabled}
    />
  );
});

export interface FilterSelectClearState extends FilterDropdownClearState {}
export interface FilterSelectClearProps extends FilterDropdownClearProps {}

export namespace FilterSelectClear {
  export type State = FilterSelectClearState;
  export type Props = FilterSelectClearProps;
}
