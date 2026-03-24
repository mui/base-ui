'use client';
import type * as React from 'react';
import { ComboboxGroupLabel } from '../../combobox/group-label/ComboboxGroupLabel';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteGroupLabel = ComboboxGroupLabel as AutocompleteGroupLabel;

export interface AutocompleteGroupLabelState {}

export interface AutocompleteGroupLabelProps extends BaseUIComponentProps<
  'div',
  AutocompleteGroupLabelState
> {}

export interface AutocompleteGroupLabel {
  (
    componentProps: AutocompleteGroupLabelProps & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
}

export namespace AutocompleteGroupLabel {
  export type State = AutocompleteGroupLabelState;
  export type Props = AutocompleteGroupLabelProps;
}
