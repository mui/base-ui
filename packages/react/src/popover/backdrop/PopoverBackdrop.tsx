'use client';
import * as React from 'react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import type { BaseUIComponentProps } from '../../internals/types';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { usePopupBackdrop } from '../../utils/popups/popupParts';
import { REASONS } from '../../internals/reasons';

/**
 * An overlay displayed beneath the popover.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverBackdrop = React.forwardRef(function PopoverBackdrop(
  props: PopoverBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const store = usePopoverRootContext();
  const openReason = store.useState('openChangeReason');

  return usePopupBackdrop(props, forwardedRef, store, {
    style: {
      pointerEvents: openReason === REASONS.triggerHover ? 'none' : undefined,
    },
  });
});

export interface PopoverBackdropState {
  /**
   * Whether the popover is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface PopoverBackdropProps extends BaseUIComponentProps<'div', PopoverBackdropState> {}

export namespace PopoverBackdrop {
  export type State = PopoverBackdropState;
  export type Props = PopoverBackdropProps;
}
