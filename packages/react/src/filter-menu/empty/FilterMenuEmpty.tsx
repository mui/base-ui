'use client';
import {
  FilterDropdownEmpty,
  type FilterDropdownEmptyProps,
  type FilterDropdownEmptyState,
} from '../../filter-dropdown/empty/FilterDropdownEmpty';

/**
 * A message shown when no items match the filter query and announced politely to screen readers.
 * This component's root element must remain mounted in the DOM to announce changes consistently
 * across screen readers. Avoid hiding or removing the root element, and apply layout styles to a
 * child element instead.
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
