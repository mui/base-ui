'use client';
import * as React from 'react';
import {
  FilterDropdownClear,
  type FilterDropdownClearProps,
  type FilterDropdownClearState,
} from '../../filter-dropdown/clear/FilterDropdownClear';
import { useSelectFilterableRootContext } from '../root/SelectRootContext';

/**
 * Clears the filter input value.
 * Renders a `<button>` element.
 */
export const SelectClear = React.forwardRef(function SelectClear(
  componentProps: SelectClear.Props,
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

export interface SelectClearState extends FilterDropdownClearState {}
export interface SelectClearProps extends FilterDropdownClearProps {}

export namespace SelectClear {
  export type State = SelectClearState;
  export type Props = SelectClearProps;
}
