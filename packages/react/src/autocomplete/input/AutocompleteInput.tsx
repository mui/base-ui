'use client';
import type * as React from 'react';
import { ComboboxInput } from '../../combobox/input/ComboboxInput';
import type { FieldRootState } from '../../field/root/FieldRoot';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Side } from '../../utils/useAnchorPositioning';

/**
 * A text input to search for items in the list.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteInput = ComboboxInput as AutocompleteInput;

/**
 * The state of the autocomplete input component.
 */
export interface AutocompleteInputState extends FieldRootState {
  /**
   * Whether the corresponding popup is open.
   */
  open: boolean;
  /**
   * Indicates which side the corresponding popup is positioned relative to its anchor.
   */
  popupSide: Side | null;
  /**
   * Present when the corresponding items list is empty.
   */
  listEmpty: boolean;
  /**
   * Whether the component should ignore user edits.
   */
  readOnly: boolean;
}

/**
 * The props of the autocomplete input component.
 */
export interface AutocompleteInputProps extends BaseUIComponentProps<
  'input',
  AutocompleteInputState
> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

/**
 * The type of the autocomplete input component.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export interface AutocompleteInput {
  (
    componentProps: AutocompleteInputProps & React.RefAttributes<HTMLInputElement>,
  ): React.JSX.Element;
}

export namespace AutocompleteInput {
  export type State = AutocompleteInputState;
  export type Props = AutocompleteInputProps;
}
