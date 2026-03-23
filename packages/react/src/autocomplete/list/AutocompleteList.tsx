'use client';
import type * as React from 'react';
import { ComboboxList } from '../../combobox/list/ComboboxList';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * A list container for the items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteList = ComboboxList as AutocompleteList;

/**
 * The state of the autocomplete list component.
 */
export interface AutocompleteListState {
  /**
   * Whether the list is empty.
   */
  empty: boolean;
}

/**
 * The props of the autocomplete list component.
 */
export interface AutocompleteListProps extends Omit<
  BaseUIComponentProps<'div', AutocompleteListState>,
  'children'
> {
  children?: React.ReactNode | ((item: any, index: number) => React.ReactNode);
}

/**
 * The type of the autocomplete list component.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export interface AutocompleteList {
  (componentProps: AutocompleteListProps & React.RefAttributes<HTMLDivElement>): React.JSX.Element;
}

export namespace AutocompleteList {
  export type State = AutocompleteListState;
  export type Props = AutocompleteListProps;
}
