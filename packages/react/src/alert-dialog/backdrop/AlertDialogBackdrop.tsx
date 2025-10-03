'use client';
import * as React from 'react';
import { useRenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { BaseUIComponentProps } from '../../utils/types';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';

const stateAttributesMapping: StateAttributesMapping<AlertDialogBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export const AlertDialogBackdrop = React.forwardRef(function AlertDialogBackdrop(
  componentProps: AlertDialogBackdrop.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, forceRender = false, ...elementProps } = componentProps;
  const { store } = useDialogRootContext();

  const open = store.useState('open');
  const nested = store.useState('nested');
  const mounted = store.useState('mounted');
  const transitionStatus = store.useState('transitionStatus');

  const state: AlertDialogBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  return useRenderElement('div', componentProps, {
    state,
    ref: [store.context.backdropRef, forwardedRef],
    props: [
      {
        role: 'presentation',
        hidden: !mounted,
        style: {
          userSelect: 'none',
          WebkitUserSelect: 'none',
        },
      },
      elementProps,
    ],
    stateAttributesMapping,
    enabled: forceRender || !nested,
  });
});

export interface AlertDialogBackdropProps
  extends BaseUIComponentProps<'div', AlertDialogBackdrop.State> {
  /**
   * Whether the backdrop is forced to render even when nested.
   * @default false
   */
  forceRender?: boolean;
}

export interface AlertDialogBackdropState {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
  transitionStatus: TransitionStatus;
}

export namespace AlertDialogBackdrop {
  export type Props = AlertDialogBackdropProps;
  export type State = AlertDialogBackdropState;
}
