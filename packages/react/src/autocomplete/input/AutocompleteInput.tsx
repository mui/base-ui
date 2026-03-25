'use client';
import * as React from 'react';
import {
  ComboboxInput,
  type ComboboxInputProps,
  type ComboboxInputState,
} from '../../combobox/input/ComboboxInput';

/**
 * A text input to search for items in the list.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteInput = React.forwardRef(function AutocompleteInput(
  props: AutocompleteInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  return <ComboboxInput {...props} ref={forwardedRef} />;
});

export type AutocompleteInputState = ComboboxInputState;

export interface AutocompleteInputProps extends Omit<ComboboxInputProps, 'clearOnItemClick'> {}

export namespace AutocompleteInput {
  export type State = AutocompleteInputState;
  export type Props = AutocompleteInputProps;
}
