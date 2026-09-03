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
 * Requires `Menu.FilterRoot` or `Menu.FilterSubmenuRoot`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuFilterEmpty = FilterDropdownEmpty;

export interface MenuFilterEmptyState extends FilterDropdownEmptyState {}
export interface MenuFilterEmptyProps extends FilterDropdownEmptyProps {}

export namespace MenuFilterEmpty {
  export type State = MenuFilterEmptyState;
  export type Props = MenuFilterEmptyProps;
}
