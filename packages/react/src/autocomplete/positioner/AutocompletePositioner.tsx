'use client';
import type * as React from 'react';
import { ComboboxPositioner } from '../../combobox/positioner/ComboboxPositioner';
import type {
  Align,
  Side,
  UseAnchorPositioningSharedParameters,
} from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Positions the popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompletePositioner = ComboboxPositioner as AutocompletePositioner;

export interface AutocompletePositionerState {
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
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
  /**
   * Whether there are no items to display.
   */
  empty: boolean;
}

export interface AutocompletePositionerProps
  extends
    UseAnchorPositioningSharedParameters,
    BaseUIComponentProps<'div', AutocompletePositionerState> {}

export interface AutocompletePositioner {
  (
    componentProps: AutocompletePositionerProps & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
}

export namespace AutocompletePositioner {
  export type State = AutocompletePositionerState;
  export type Props = AutocompletePositionerProps;
}
