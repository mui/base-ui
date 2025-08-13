'use client';
import * as React from 'react';
import { ComboboxRoot } from '../../combobox/root/ComboboxRoot';

/**
 * Groups all parts of the autocomplete.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export function AutocompleteRoot<Item = any>(
  props: Omit<
    ComboboxRoot.Props<Item, 'none'>,
    'selectionMode' | 'selectedValue' | 'defaultSelectedValue' | 'fillInputOnItemPress'
  >,
): React.JSX.Element {
  const { openOnInputClick = false, ...rest } = props;
  return (
    <ComboboxRoot
      {...rest}
      openOnInputClick={openOnInputClick}
      selectionMode="none"
      fillInputOnItemPress
    />
  );
}
