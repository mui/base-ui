'use client';
import * as React from 'react';
import { FilterDropdownInput } from '../../filter-dropdown/input/FilterDropdownInput';
import type {
  FilterDropdownInputProps,
  FilterDropdownInputState,
} from '../../filter-dropdown/input/FilterDropdownInput';
import { useFilterDropdownValueContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { mergeProps } from '../../merge-props';
import { useSelectFilterNavigationContext } from '../filter-root/SelectFilterContext';
import { useSelectFilterKeyDown } from '../filter-root/useSelectFilterKeyDown';

/**
 * A search field that filters the select options.
 * Requires the select to be wrapped in `Select.FilterProvider`.
 * Automatically receives focus whenever the popup opens, after the popup is positioned.
 * The `autoFocus` prop is not needed and does not change this behavior.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectFilterInput = React.forwardRef(function SelectFilterInput(
  componentProps: SelectFilterInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
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

export interface SelectFilterInputState extends FilterDropdownInputState {}
export interface SelectFilterInputProps extends FilterDropdownInputProps {}

export namespace SelectFilterInput {
  export type State = SelectFilterInputState;
  export type Props = SelectFilterInputProps;
}
