'use client';
import {
  FilterDropdownClear,
  type FilterDropdownClearProps,
  type FilterDropdownClearState,
} from '../../filter-dropdown/clear/FilterDropdownClear';

/**
 * A button that clears the filter query. Renders nothing while the query is empty.
 * Requires the menu to be wrapped in `Menu.FilterProvider`.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuFilterClear = FilterDropdownClear;

export interface MenuFilterClearState extends FilterDropdownClearState {}
export interface MenuFilterClearProps extends FilterDropdownClearProps {}

export namespace MenuFilterClear {
  export type State = MenuFilterClearState;
  export type Props = MenuFilterClearProps;
}
