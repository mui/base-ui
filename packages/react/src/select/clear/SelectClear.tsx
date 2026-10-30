'use client';
import * as React from 'react';
import { FilterDropdownClear } from '../../filter-dropdown/clear/FilterDropdownClear';
import type {
  FilterDropdownClearProps,
  FilterDropdownClearState,
} from '../../filter-dropdown/clear/FilterDropdownClear';
import { useSelectFilterPart } from '../filter-root/SelectFilterContext';

/**
 * A button that clears the input text.
 * Requires the select to be wrapped in `Select.FilterProvider`.
 * Renders a `<button>` element when the input has text.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectClear = React.forwardRef(function SelectClear(
  props: SelectClear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  useSelectFilterPart('Clear');
  return <FilterDropdownClear {...props} ref={forwardedRef} />;
});

export interface SelectClearState extends FilterDropdownClearState {}
export interface SelectClearProps extends FilterDropdownClearProps {}

export namespace SelectClear {
  export type State = SelectClearState;
  export type Props = SelectClearProps;
}
