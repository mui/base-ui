'use client';
import * as React from 'react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { type BaseUIComponentProps } from '../../utils/types';
import { type StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';

const stateAttributesMapping: StateAttributesMapping<DialogBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

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
  const { render, className, forceRender = false, ...elementProps } = componentProps;
  const { store } = useDialogRootContext();

  const open = store.useState('open');
  const nested = store.useState('nested');
  const mounted = store.useState('mounted');
  const transitionStatus = store.useState('transitionStatus');

  const state: DialogBackdrop.State = {
    open,
    transitionStatus,
  };

  return useRenderElement('div', componentProps, {
    state,
    ref: [store.context.backdropRef, forwardedRef],
    stateAttributesMapping,
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
    enabled: forceRender || !nested,
  });
});

export interface DialogBackdropProps extends BaseUIComponentProps<'div', DialogBackdrop.State> {
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
  transitionStatus: TransitionStatus;
}

export namespace DialogBackdrop {
  export type Props = DialogBackdropProps;
  export type State = DialogBackdropState;
}
