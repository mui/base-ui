'use client';
import {
  FilterDropdownClear,
  type FilterDropdownClearProps,
  type FilterDropdownClearState,
} from '../../filter-dropdown/clear/FilterDropdownClear';

/**
 * A button that clears the filter query.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuClear = FilterDropdownClear;

export interface FilterMenuClearState extends FilterDropdownClearState {}
export interface FilterMenuClearProps extends FilterDropdownClearProps {}

export namespace FilterMenuClear {
  export type State = FilterMenuClearState;
  export type Props = FilterMenuClearProps;
}
