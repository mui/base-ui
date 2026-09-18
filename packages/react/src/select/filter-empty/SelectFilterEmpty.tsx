'use client';
import {
  FilterDropdownEmpty,
  type FilterDropdownEmptyProps,
  type FilterDropdownEmptyState,
} from '../../filter-dropdown/empty/FilterDropdownEmpty';

/**
 * A message shown when no options match the filter query and announced politely to screen
 * readers. Renders nothing while options match, so screen readers don't count an empty node
 * among the popup's contents.
 * Requires the select to be wrapped in `Select.FilterProvider`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectFilterEmpty = FilterDropdownEmpty;

export interface SelectFilterEmptyState extends FilterDropdownEmptyState {}
export interface SelectFilterEmptyProps extends FilterDropdownEmptyProps {}

export namespace SelectFilterEmpty {
  export type State = SelectFilterEmptyState;
  export type Props = SelectFilterEmptyProps;
}
