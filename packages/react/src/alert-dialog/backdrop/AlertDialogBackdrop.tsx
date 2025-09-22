'use client';
import * as React from 'react';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { BaseUIComponentProps } from '../../utils/types';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useBodyClientHeight } from '../../utils/useBodyClientHeight';
import { AlertDialogBackdropCssVars } from './AlertDialogBackdropCssVars';

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
  const { open, nested, mounted, transitionStatus, backdropRef } = useAlertDialogRootContext();

  const bodyClientHeight = useBodyClientHeight(backdropRef, open);

  const state: AlertDialogBackdrop.State = React.useMemo(
    () => ({
      open,
      transitionStatus,
    }),
    [open, transitionStatus],
  );

  return useRenderElement('div', componentProps, {
    state,
    ref: [backdropRef, forwardedRef],
    props: [
      {
        role: 'presentation',
        hidden: !mounted,
        style: {
          userSelect: 'none',
          WebkitUserSelect: 'none',
          [AlertDialogBackdropCssVars.bodyClientHeight as string]: `${bodyClientHeight}px`,
        },
      },
      elementProps,
    ],
    stateAttributesMapping,
    enabled: forceRender || !nested,
  });
});

export namespace AlertDialogBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the backdrop is forced to render even when nested.
     * @default false
     */
    forceRender?: boolean;
  }

  export interface State {
    /**
     * Whether the dialog is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}
