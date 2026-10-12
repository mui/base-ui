'use client';
import { FilterDropdownClear } from '../../filter-dropdown/clear/FilterDropdownClear';
import type {
  FilterDropdownClearProps,
  FilterDropdownClearState,
} from '../../filter-dropdown/clear/FilterDropdownClear';

/**
 * A button that clears the filter query. Renders nothing while the query is empty.
 * Requires the select to be wrapped in `Select.FilterProvider`.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectFilterClear = FilterDropdownClear;

export interface SelectFilterClearState extends FilterDropdownClearState {}
export interface SelectFilterClearProps extends FilterDropdownClearProps {}

export namespace SelectFilterClear {
  export type State = SelectFilterClearState;
  export type Props = SelectFilterClearProps;
}
