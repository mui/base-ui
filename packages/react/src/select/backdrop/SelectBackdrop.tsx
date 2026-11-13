'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { usePopupBackdrop } from '../../utils/popups/popupParts';

/**
 * An overlay displayed beneath the select popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectBackdrop = React.forwardRef(function SelectBackdrop(
  componentProps: SelectBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return usePopupBackdrop(componentProps, forwardedRef, useSelectRootContext());
});

export interface SelectBackdropState {
  /**
   * Whether the component is open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface SelectBackdropProps extends BaseUIComponentProps<'div', SelectBackdropState> {}

export namespace SelectBackdrop {
  export type State = SelectBackdropState;
  export type Props = SelectBackdropProps;
}
