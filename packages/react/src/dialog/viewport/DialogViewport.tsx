'use client';
import * as React from 'react';
import { useRenderElement } from '../../utils/useRenderElement';
import { type BaseUIComponentProps } from '../../utils/types';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { type StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useDialogPortalContext } from '../portal/DialogPortalContext';
import { DialogViewportDataAttributes } from './DialogViewportDataAttributes';

const stateAttributesMapping: StateAttributesMapping<DialogViewport.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
  nested(value) {
    return value ? { [DialogViewportDataAttributes.nested]: '' } : null;
  },
  nestedDialogOpen(value) {
    return value ? { [DialogViewportDataAttributes.nestedDialogOpen]: '' } : null;
  },
};

/**
 * A scrollable container for the dialog popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogViewport = React.forwardRef(function DialogViewport(
  componentProps: DialogViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render: renderProp, className: classNameProp, children, ...elementProps } = componentProps;
  void renderProp;
  void classNameProp;

  const keepMounted = useDialogPortalContext();
  const {
    mounted,
    open,
    nested,
    transitionStatus,
    nestedOpenDialogCount,
    setViewportElement,
  } = useDialogRootContext();

  const nestedDialogOpen = nestedOpenDialogCount > 0;

  const state: DialogViewport.State = React.useMemo(
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
    ref: [forwardedRef, setViewportElement],
    stateAttributesMapping,
    props: [
      {
        children,
      },
      elementProps,
    ],
  });
});

export namespace DialogViewport {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {
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
}
