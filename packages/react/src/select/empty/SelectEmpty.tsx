'use client';
import * as React from 'react';
import { FilterDropdownEmpty } from '../../filter-dropdown/empty/FilterDropdownEmpty';
import type {
  FilterDropdownEmptyProps,
  FilterDropdownEmptyState,
} from '../../filter-dropdown/empty/FilterDropdownEmpty';
import { useSelectFilterPart } from '../filter-root/SelectFilterContext';

/**
 * A message shown when the select has no matching items.
 * Requires the select to be wrapped in `Select.FilterProvider`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectEmpty = React.forwardRef(function SelectEmpty(
  props: SelectEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  useSelectFilterPart('Empty');
  return <FilterDropdownEmpty {...props} ref={forwardedRef} />;
});

export interface SelectEmptyState extends FilterDropdownEmptyState {}
export interface SelectEmptyProps extends FilterDropdownEmptyProps {}

export namespace SelectEmpty {
  export type State = SelectEmptyState;
  export type Props = SelectEmptyProps;
}
