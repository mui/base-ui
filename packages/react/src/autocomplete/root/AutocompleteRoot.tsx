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
  props: AutocompleteRoot.Props<Item>,
): React.JSX.Element {
  const { openOnInputClick = false, value, defaultValue, onValueChange, ...rest } = props;
  return (
    <ComboboxRoot
      {...rest}
      openOnInputClick={openOnInputClick}
      selectionMode="none"
      fillInputOnItemPress
      inputValue={value}
      defaultInputValue={defaultValue}
      onInputValueChange={onValueChange}
    />
  );
}

export namespace AutocompleteRoot {
  export interface Props<Item = any>
    extends Omit<
      ComboboxRoot.Props<Item, 'none'>,
      | 'selectionMode'
      | 'selectedValue'
      | 'defaultSelectedValue'
      | 'onSelectedValueChange'
      | 'fillInputOnItemPress'
      | 'modal'
      | 'clearInputOnCloseComplete'
      // Custom JSDoc
      | 'openOnInputClick'
      // Different names
      | 'inputValue'
      | 'defaultInputValue'
      | 'onInputValueChange'
    > {
    /**
     * Whether the combobox popup opens when clicking the input.
     * @default false
     */
    openOnInputClick?: boolean;
    /**
     * The uncontrolled input value of the autocomplete when it's initially rendered.
     *
     * To render a controlled autocomplete, use the `value` prop instead.
     */
    defaultValue?: ComboboxRoot.Props<Item, 'none'>['defaultInputValue'];
    /**
     * The input value of the autocomplete. Use when controlled.
     */
    value?: ComboboxRoot.Props<Item, 'none'>['inputValue'];
    /**
     * Callback fired when the input value of the autocomplete changes.
     */
    onValueChange?: ComboboxRoot.Props<Item, 'none'>['onInputValueChange'];
  }
}
