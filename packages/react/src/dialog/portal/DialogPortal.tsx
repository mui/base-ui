'use client';
import * as React from 'react';
import { FloatingPortal } from '../../floating-ui-react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { DialogPortalContext } from './DialogPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogPortal = React.forwardRef(function DialogPortal(
  props: DialogPortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { keepMounted = false, ...portalProps } = props;

  const { store } = useDialogRootContext();
  const mounted = store.useState('mounted');

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <DialogPortalContext.Provider value={keepMounted}>
      <FloatingPortal ref={forwardedRef} {...portalProps} />
    </DialogPortalContext.Provider>
  );
});

export namespace DialogPortal {
  export interface State {}
}

export interface DialogPortalProps extends FloatingPortal.Props<DialogPortal.State> {
  /**
   * Whether to keep the portal mounted in the DOM while the popup is hidden.
   * @default false
   */
  keepMounted?: boolean;
  /**
   * A parent element to render the portal element into.
   */
  container?: FloatingPortal.Props<DialogPortal.State>['container'];
}

export namespace DialogPortal {
  export type Props = DialogPortalProps;
}
