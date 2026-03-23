'use client';
import type * as React from 'react';
import { ComboboxArrow } from '../../combobox/arrow/ComboboxArrow';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';

/**
 * Displays an element positioned against the anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteArrow = ComboboxArrow as AutocompleteArrow;

/**
 * The state of the autocomplete arrow component.
 */
export interface AutocompleteArrowState {
  /**
   * Whether the popup is currently open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the arrow cannot be centered on the anchor.
   */
  uncentered: boolean;
}

/**
 * The props of the autocomplete arrow component.
 */
export interface AutocompleteArrowProps extends BaseUIComponentProps<
  'div',
  AutocompleteArrowState
> {}

/**
 * The type of the autocomplete arrow component.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export interface AutocompleteArrow {
  (componentProps: AutocompleteArrowProps & React.RefAttributes<HTMLDivElement>): React.JSX.Element;
}

export namespace AutocompleteArrow {
  export type State = AutocompleteArrowState;
  export type Props = AutocompleteArrowProps;
}
