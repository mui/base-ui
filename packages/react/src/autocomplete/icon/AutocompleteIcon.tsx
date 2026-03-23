'use client';
import type * as React from 'react';
import { ComboboxIcon } from '../../combobox/icon/ComboboxIcon';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * An icon that indicates that the trigger button opens the popup.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteIcon = ComboboxIcon as AutocompleteIcon;

/**
 * The state of the autocomplete icon component.
 */
export interface AutocompleteIconState {}

/**
 * The props of the autocomplete icon component.
 */
export interface AutocompleteIconProps extends BaseUIComponentProps<
  'span',
  AutocompleteIconState
> {}

/**
 * The type of the autocomplete icon component.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export interface AutocompleteIcon {
  (componentProps: AutocompleteIconProps & React.RefAttributes<HTMLSpanElement>): React.JSX.Element;
}

export namespace AutocompleteIcon {
  export type State = AutocompleteIconState;
  export type Props = AutocompleteIconProps;
}
