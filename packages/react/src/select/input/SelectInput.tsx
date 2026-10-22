'use client';
import * as React from 'react';
import { FilterDropdownInput } from '../../filter-dropdown/input/FilterDropdownInput';
import type {
  FilterDropdownInputProps,
  FilterDropdownInputState,
} from '../../filter-dropdown/input/FilterDropdownInput';
import { useFilterDropdownValueContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { mergeProps } from '../../merge-props';
import { useSelectFilterPart } from '../filter-root/SelectFilterContext';
import { useSelectRootContext } from '../root/SelectRootContext';
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
  const store = useSelectRootContext();
  const value = useFilterDropdownValueContext();

  const { onKeyDown, ...navigationProps } = store.useState('inputProps');
  const activeItemId = store.useState('highlightedItemId');
  const open = store.useState('open');

  const handleKeyDown = useSelectFilterKeyDown(value !== '');

  // Like a combobox's input inside its popup, the input is a combobox that controls the listbox,
  // which lets it point `aria-activedescendant` at an option outside it.
  const inputProps = mergeProps<typeof FilterDropdownInput>(
    {
      role: 'combobox',
      'aria-expanded': open,
      'aria-haspopup': 'listbox',
      'aria-autocomplete': 'list',
      onKeyDown: handleKeyDown,
    },
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
