import {
  FilterDropdownEmpty,
  type FilterDropdownEmptyProps,
  type FilterDropdownEmptyState,
} from '../../filter-dropdown/empty/FilterDropdownEmpty';

/**
 * Displays when no items match the current filter.
 * Renders a `<div>` element.
 */
export const SelectEmpty = FilterDropdownEmpty;

export interface SelectEmptyState extends FilterDropdownEmptyState {}
export interface SelectEmptyProps extends FilterDropdownEmptyProps {}

export namespace SelectEmpty {
  export type State = SelectEmptyState;
  export type Props = SelectEmptyProps;
}
