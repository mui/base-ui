import {
  FilterDropdownClear,
  type FilterDropdownClearProps,
  type FilterDropdownClearState,
} from '../../filter-dropdown/clear/FilterDropdownClear';

/**
 * Clears the filter input value.
 * Renders a `<button>` element.
 */
export const SelectClear = FilterDropdownClear;

export interface SelectClearState extends FilterDropdownClearState {}
export interface SelectClearProps extends FilterDropdownClearProps {}

export namespace SelectClear {
  export type State = SelectClearState;
  export type Props = SelectClearProps;
}
