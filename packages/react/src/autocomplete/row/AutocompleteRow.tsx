'use client';
import type * as React from 'react';
import { ComboboxRow } from '../../combobox/row/ComboboxRow';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Displays a single row of items in a grid list.
 * Enable `grid` on the root component to turn the listbox into a grid.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteRow = ComboboxRow as AutocompleteRow;

/**
 * The state of the autocomplete row component.
 */
export interface AutocompleteRowState {}

/**
 * The props of the autocomplete row component.
 */
export interface AutocompleteRowProps extends BaseUIComponentProps<'div', AutocompleteRowState> {}

/**
 * The type of the autocomplete row component.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export interface AutocompleteRow {
  (componentProps: AutocompleteRowProps & React.RefAttributes<HTMLDivElement>): React.JSX.Element;
}

export namespace AutocompleteRow {
  export type State = AutocompleteRowState;
  export type Props = AutocompleteRowProps;
}
