'use client';
import {
  FilterDropdownEmpty,
  type FilterDropdownEmptyProps,
  type FilterDropdownEmptyState,
} from '../../filter-dropdown/empty/FilterDropdownEmpty';

/**
 * A message shown when no items match the filter query and announced politely to screen readers.
 * Renders nothing while items match, so screen readers don't count an empty node
 * among the popup's contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuEmpty = FilterDropdownEmpty;

export interface FilterMenuEmptyState extends FilterDropdownEmptyState {}
export interface FilterMenuEmptyProps extends FilterDropdownEmptyProps {}

export namespace FilterMenuEmpty {
  export type State = FilterMenuEmptyState;
  export type Props = FilterMenuEmptyProps;
}
