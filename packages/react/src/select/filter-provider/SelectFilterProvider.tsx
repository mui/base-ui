'use client';
import * as React from 'react';
import { SelectFilterRoot } from '../filter-root/SelectFilterRoot';
import type { SelectFilterProviderOptions } from './SelectFilterProviderOptions';
import { SelectFilterProviderContext } from './SelectFilterProviderContext';
import type { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRootContext';

/**
 * Enables filtering for the select it wraps. Add `Select.Input` to the popup and place its items
 * in `Select.List`.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectFilterProvider(props: SelectFilterProvider.Props): React.JSX.Element {
  const {
    children,
    filter,
    value,
    defaultValue,
    onValueChange,
    autoHighlight,
    locale,
    virtualized,
  } = props;

  const contextValue = React.useMemo(
    () => ({
      Root: SelectFilterRoot,
      options: {
        filter,
        value,
        defaultValue,
        onValueChange,
        autoHighlight,
        locale,
        virtualized,
      },
    }),
    [filter, value, defaultValue, onValueChange, autoHighlight, locale, virtualized],
  );

  return (
    <SelectFilterProviderContext.Provider value={contextValue}>
      {children}
    </SelectFilterProviderContext.Provider>
  );
}

export interface SelectFilterProviderState {}

export interface SelectFilterProviderProps extends SelectFilterProviderOptions {
  /**
   * The `<Select.Root>` to make filterable.
   */
  children?: React.ReactNode;
}

export type SelectFilterProviderChangeEventReason = FilterDropdownRoot.ChangeEventReason;
export type SelectFilterProviderChangeEventDetails = FilterDropdownRoot.ChangeEventDetails;

export namespace SelectFilterProvider {
  export type State = SelectFilterProviderState;
  export type Props = SelectFilterProviderProps;
  export type ChangeEventReason = SelectFilterProviderChangeEventReason;
  export type ChangeEventDetails = SelectFilterProviderChangeEventDetails;
}
