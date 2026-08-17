'use client';
import * as React from 'react';
import {
  FilterDropdownEmpty,
  type FilterDropdownEmptyProps,
  type FilterDropdownEmptyState,
} from '../../filter-dropdown/empty/FilterDropdownEmpty';
import { useMenuFilterableRootContext } from '../../menu/root/MenuRootContext';

/**
 * Displays when no items match the current filter.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuEmpty = React.forwardRef(function FilterMenuEmpty(
  componentProps: FilterMenuEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  useMenuFilterableRootContext('Empty');
  return <FilterDropdownEmpty {...componentProps} ref={forwardedRef} />;
});

export interface FilterMenuEmptyState extends FilterDropdownEmptyState {}
export interface FilterMenuEmptyProps extends FilterDropdownEmptyProps {}

export namespace FilterMenuEmpty {
  export type State = FilterMenuEmptyState;
  export type Props = FilterMenuEmptyProps;
}
