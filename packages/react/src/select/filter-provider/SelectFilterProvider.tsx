'use client';
import * as React from 'react';
import { SelectFilterRoot } from '../filter-root/SelectFilterRoot';
import type { SelectFilterRootFilterProps } from '../filter-root/SelectFilterRootFilterProps';
import { SelectFilterProviderContext } from './SelectFilterProviderContext';
import type { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRootContext';

/**
 * Makes the select directly inside it filterable: the popup can render `Select.FilterInput`,
 * `Select.FilterClear`, and `Select.FilterEmpty`, and the items inside `Select.List` filter
 * against the query.
 * Wrap it around `Select.Root`. This is the only part that bundles the filter implementation.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectFilterProvider(props: SelectFilterProvider.Props): React.JSX.Element {
  const {
    children,
    filter,
    inputValue,
    defaultInputValue,
    onInputValueChange,
    autoHighlight,
    locale,
  } = props;

  const value = React.useMemo(
    () => ({
      Root: SelectFilterRoot,
      options: {
        filter,
        inputValue,
        defaultInputValue,
        onInputValueChange,
        autoHighlight,
        locale,
      },
    }),
    [filter, inputValue, defaultInputValue, onInputValueChange, autoHighlight, locale],
  );

  return (
    <SelectFilterProviderContext.Provider value={value}>
      {children}
    </SelectFilterProviderContext.Provider>
  );
}

export interface SelectFilterProviderProps extends SelectFilterRootFilterProps {
  children?: React.ReactNode;
}

export type SelectFilterProviderInputValueChangeEventReason = FilterDropdownRoot.ChangeEventReason;
export type SelectFilterProviderInputValueChangeEventDetails =
  FilterDropdownRoot.ChangeEventDetails;

export namespace SelectFilterProvider {
  export type Props = SelectFilterProviderProps;
  export type InputValueChangeEventReason = SelectFilterProviderInputValueChangeEventReason;
  export type InputValueChangeEventDetails = SelectFilterProviderInputValueChangeEventDetails;
}
