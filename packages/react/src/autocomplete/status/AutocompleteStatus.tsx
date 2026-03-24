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

export interface AutocompleteStatusState {}

export interface AutocompleteStatusProps extends BaseUIComponentProps<
  'div',
  AutocompleteStatusState
> {}

export interface AutocompleteStatus {
  (
    componentProps: AutocompleteStatusProps & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
}

export namespace AutocompleteStatus {
  export type State = AutocompleteStatusState;
  export type Props = AutocompleteStatusProps;
}
