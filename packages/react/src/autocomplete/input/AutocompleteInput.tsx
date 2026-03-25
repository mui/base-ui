'use client';
import * as React from 'react';
import { type FieldRootState } from '../../field/root/FieldRoot';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Side } from '../../utils/useAnchorPositioning';
import { ComboboxInput } from '../../combobox/input/ComboboxInput';

/**
 * A text input to search for items in the list.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteInput = ComboboxInput as React.ForwardRefExoticComponent<
  AutocompleteInputProps & React.RefAttributes<HTMLInputElement>
>;

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

export namespace AutocompleteInput {
  export type State = AutocompleteInputState;
  export type Props = AutocompleteInputProps;
}
