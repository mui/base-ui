'use client';
import type * as React from 'react';
import { ComboboxEmpty } from '../../combobox/empty/ComboboxEmpty';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Renders its children only when the list is empty.
 * Requires the `items` prop on the root component.
 * Announces changes politely to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteEmpty = ComboboxEmpty as AutocompleteEmpty;

/**
 * The state of the autocomplete empty component.
 */
export interface AutocompleteEmptyState {}

/**
 * The props of the autocomplete empty component.
 */
export interface AutocompleteEmptyProps extends BaseUIComponentProps<
  'div',
  AutocompleteEmptyState
> {}

/**
 * The type of the autocomplete empty component.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export interface AutocompleteEmpty {
  (componentProps: AutocompleteEmptyProps & React.RefAttributes<HTMLDivElement>): React.JSX.Element;
}

export namespace AutocompleteEmpty {
  export type State = AutocompleteEmptyState;
  export type Props = AutocompleteEmptyProps;
}
