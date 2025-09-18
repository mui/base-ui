'use client';
import * as React from 'react';
import { useComboboxInputValueContext } from '../../combobox/root/ComboboxRootContext';

/**
 * The current value of the autocomplete.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export function AutocompleteValue(props: AutocompleteValue.Props) {
  const { children } = props;

  const inputValue = useComboboxInputValueContext();

  if (typeof children === 'function') {
    return children(String(inputValue));
  }

  if (children != null) {
    return children;
  }

  return inputValue;
}

export namespace AutocompleteValue {
  export interface Props {
    children?: React.ReactNode | ((value: string) => React.ReactNode);
  }
}
