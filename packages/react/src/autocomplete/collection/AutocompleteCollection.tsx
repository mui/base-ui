'use client';
import type * as React from 'react';
import { ComboboxCollection } from '../../combobox/collection/ComboboxCollection';

/**
 * Renders filtered list items.
 * Doesn't render its own HTML element.
 *
 * If rendering a flat list, pass a function child to the `List` component instead, which implicitly wraps it.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteCollection = ComboboxCollection as AutocompleteCollection;

export interface AutocompleteCollectionState {}

export interface AutocompleteCollectionProps {
  children: (item: any, index: number) => React.ReactNode;
}

export interface AutocompleteCollection {
  (componentProps: AutocompleteCollectionProps): React.JSX.Element | null;
}

export namespace AutocompleteCollection {
  export type State = AutocompleteCollectionState;
  export type Props = AutocompleteCollectionProps;
}
