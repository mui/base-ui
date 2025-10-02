'use client';
import * as React from 'react';
import { FloatingPortal } from '../../floating-ui-react';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { AlertDialogPortalContext } from './AlertDialogPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export const AlertDialogPortal = React.forwardRef(function AlertDialogPortal(
  props: AlertDialogPortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, keepMounted = false, ...portalProps } = props;

  const { store } = useDialogRootContext();
  const mounted = store.useState('mounted');

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <AlertDialogPortalContext.Provider value={keepMounted}>
      <FloatingPortal ref={forwardedRef} {...portalProps}>
        {children}
      </FloatingPortal>
    </AlertDialogPortalContext.Provider>
  );
});

export namespace AlertDialogPortal {
  export interface Props extends FloatingPortal.Props {
    /**
     * Whether to keep the portal mounted in the DOM while the popup is hidden.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * A parent element to render the portal element into.
     */
    container?: FloatingPortal.Props['container'];
  }
}
