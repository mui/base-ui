'use client';
import type * as React from 'react';
import { ComboboxStatus } from '../../combobox/status/ComboboxStatus';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Displays a status message whose content changes are announced politely to screen readers.
 * Useful for conveying the status of an asynchronously loaded list.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteStatus = ComboboxStatus as AutocompleteStatus;

/**
 * The state of the autocomplete status component.
 */
export interface AutocompleteStatusState {}

/**
 * The props of the autocomplete status component.
 */
export interface AutocompleteStatusProps extends BaseUIComponentProps<
  'div',
  AutocompleteStatusState
> {}

/**
 * The type of the autocomplete status component.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export interface AutocompleteStatus {
  (
    componentProps: AutocompleteStatusProps & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
}

export namespace AutocompleteStatus {
  export type State = AutocompleteStatusState;
  export type Props = AutocompleteStatusProps;
}
