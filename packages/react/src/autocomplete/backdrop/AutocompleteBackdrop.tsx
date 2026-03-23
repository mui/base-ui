'use client';
import type * as React from 'react';
import { ComboboxBackdrop } from '../../combobox/backdrop/ComboboxBackdrop';
import type { BaseUIComponentProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteBackdrop = ComboboxBackdrop as AutocompleteBackdrop;

/**
 * The props of the autocomplete backdrop component.
 */
export interface AutocompleteBackdropProps extends BaseUIComponentProps<
  'div',
  AutocompleteBackdropState
> {}

/**
 * The state of the autocomplete backdrop component.
 */
export interface AutocompleteBackdropState {
  /**
   * Whether the popup is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

/**
 * The type of the autocomplete backdrop component.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export interface AutocompleteBackdrop {
  (
    componentProps: AutocompleteBackdropProps & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
}

export namespace AutocompleteBackdrop {
  export type Props = AutocompleteBackdropProps;
  export type State = AutocompleteBackdropState;
}
