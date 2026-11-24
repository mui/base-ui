'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { usePopupBackdrop } from '../../utils/popups/popupParts';

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxBackdrop = React.forwardRef(function ComboboxBackdrop(
  componentProps: ComboboxBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return usePopupBackdrop(componentProps, forwardedRef, useComboboxRootContext());
});

export interface ComboboxBackdropProps extends BaseUIComponentProps<'div', ComboboxBackdropState> {}

export interface ComboboxBackdropState {
  /**
   * Whether the popup is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export namespace ComboboxBackdrop {
  export type Props = ComboboxBackdropProps;
  export type State = ComboboxBackdropState;
}
