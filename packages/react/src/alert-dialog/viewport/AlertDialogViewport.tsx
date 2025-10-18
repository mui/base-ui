'use client';
import * as React from 'react';
import { useRenderElement } from '../../utils/useRenderElement';
import { type BaseUIComponentProps } from '../../utils/types';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { type StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { useAlertDialogPortalContext } from '../portal/AlertDialogPortalContext';
import { AlertDialogViewportDataAttributes } from './AlertDialogViewportDataAttributes';

const stateAttributesMapping: StateAttributesMapping<AlertDialogViewport.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
  nested(value) {
    return value ? { [AlertDialogViewportDataAttributes.nested]: '' } : null;
  },
  nestedDialogOpen(value) {
    return value ? { [AlertDialogViewportDataAttributes.nestedDialogOpen]: '' } : null;
  },
};

/**
 * A scrollable container for the dialog popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export const AlertDialogViewport = React.forwardRef(function AlertDialogViewport(
  componentProps: AlertDialogViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, children, ...elementProps } = componentProps;

  const keepMounted = useAlertDialogPortalContext();
  const { store } = useDialogRootContext();

  const open = store.useState('open');
  const nested = store.useState('nested');
  const transitionStatus = store.useState('transitionStatus');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const mounted = store.useState('mounted');

  const nestedDialogOpen = nestedOpenDialogCount > 0;

  const state: AlertDialogViewport.State = React.useMemo(
    () => ({
      open,
      nested,
      transitionStatus,
      nestedDialogOpen,
    }),
    [open, nested, transitionStatus, nestedDialogOpen],
  );

  const shouldRender = keepMounted || mounted;

  return useRenderElement('div', componentProps, {
    enabled: shouldRender,
    state,
    ref: [forwardedRef, store.getElementSetter('viewportElement')],
    stateAttributesMapping,
    props: [
      {
        hidden: !mounted,
        children,
      },
      elementProps,
    ],
  });
});

export interface AlertDialogViewportState {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
  transitionStatus: TransitionStatus;
  /**
   * Whether the dialog is nested within another dialog.
   */
  nested: boolean;
  /**
   * Whether the dialog has nested dialogs open.
   */
  nestedDialogOpen: boolean;
}

export interface AlertDialogViewportProps
  extends BaseUIComponentProps<'div', AlertDialogViewportState> {}

export namespace AlertDialogViewport {
  export type State = AlertDialogViewportState;
  export type Props = AlertDialogViewportProps;
}
