'use client';
import type * as React from 'react';
import { ComboboxGroup } from '../../combobox/group/ComboboxGroup';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Groups related items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteGroup = ComboboxGroup as AutocompleteGroup;

/**
 * The state of the autocomplete group component.
 */
export interface AutocompleteGroupState {}

/**
 * The props of the autocomplete group component.
 */
export interface AutocompleteGroupProps extends BaseUIComponentProps<
  'div',
  AutocompleteGroupState
> {
  /**
   * Items to be rendered within this group.
   * When provided, child `Collection` components will use these items.
   */
  items?: readonly any[] | undefined;
}

/**
 * The type of the autocomplete group component.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export interface AutocompleteGroup {
  (componentProps: AutocompleteGroupProps & React.RefAttributes<HTMLDivElement>): React.JSX.Element;
}

export namespace AutocompleteGroup {
  export type State = AutocompleteGroupState;
  export type Props = AutocompleteGroupProps;
}
