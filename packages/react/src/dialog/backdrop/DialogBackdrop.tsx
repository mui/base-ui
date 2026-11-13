'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePopupBackdrop } from '../../utils/popups/popupParts';

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogBackdrop = React.forwardRef(function DialogBackdrop(
  componentProps: DialogBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { forceRender = false, ...backdropProps } = componentProps;
  const store = useDialogRootContext();
  const nested = store.useState('nested');

  return usePopupBackdrop(backdropProps, forwardedRef, store, {
    ref: store.context.backdropRef,
    enabled: forceRender || !nested,
  });
});

export interface DialogBackdropProps extends BaseUIComponentProps<'div', DialogBackdropState> {
  /**
   * Whether the backdrop is forced to render even when nested.
   * @default false
   */
  forceRender?: boolean | undefined;
}

export interface DialogBackdropState {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export namespace DialogBackdrop {
  export type Props = DialogBackdropProps;
  export type State = DialogBackdropState;
}
