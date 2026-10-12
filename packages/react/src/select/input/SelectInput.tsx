'use client';
import * as React from 'react';
import { FilterDropdownInput } from '../../filter-dropdown/input/FilterDropdownInput';
import type {
  FilterDropdownInputProps,
  FilterDropdownInputState,
} from '../../filter-dropdown/input/FilterDropdownInput';
import { useFilterDropdownValueContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { mergeProps } from '../../merge-props';
import {
  useSelectFilterNavigationContext,
  useSelectFilterPart,
} from '../filter-root/SelectFilterContext';
import { useSelectFilterKeyDown } from '../filter-root/useSelectFilterKeyDown';

/**
 * A search field that filters the select items.
 * Requires the select to be wrapped in `Select.FilterProvider`.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectInput = React.forwardRef(function SelectInput(
  componentProps: SelectInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  useSelectFilterPart('Input');
  const value = useFilterDropdownValueContext();
  const {
    navigationProps: { onKeyDown, ...navigationProps },
    activeItemId,
  } = useSelectFilterNavigationContext();

  const handleKeyDown = useSelectFilterKeyDown(value !== '');

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    { onKeyDown: handleKeyDown },
    componentProps,
  );

  return (
    <FilterDropdownInput
      {...inputProps}
      activeItemId={activeItemId}
      navigationProps={navigationProps}
      ref={forwardedRef}
    />
  );
});

export interface SelectInputState extends FilterDropdownInputState {}
export interface SelectInputProps extends FilterDropdownInputProps {}

export namespace SelectInput {
  export type State = SelectInputState;
  export type Props = SelectInputProps;
}
