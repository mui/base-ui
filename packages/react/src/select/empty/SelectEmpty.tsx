'use client';
import * as React from 'react';
import {
  FilterDropdownEmpty,
  type FilterDropdownEmptyProps,
  type FilterDropdownEmptyState,
} from '../../filter-dropdown/empty/FilterDropdownEmpty';
import { useSelectFilterableRootContext } from '../root/SelectRootContext';

/**
 * Displays when no items match the current filter.
 * Renders a `<div>` element.
 */
export const SelectEmpty = React.forwardRef(function SelectEmpty(
  componentProps: SelectEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  useSelectFilterableRootContext('Empty');
  return <FilterDropdownEmpty {...componentProps} ref={forwardedRef} />;
});

export interface SelectEmptyState extends FilterDropdownEmptyState {}
export interface SelectEmptyProps extends FilterDropdownEmptyProps {}

export namespace SelectEmpty {
  export type State = SelectEmptyState;
  export type Props = SelectEmptyProps;
}
