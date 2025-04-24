'use client';
import * as React from 'react';
import { FloatingPortal } from '@floating-ui/react';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { AlertDialogPortalContext } from './AlertDialogPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
function AlertDialogPortal(props: AlertDialogPortal.Props) {
  const { children, keepMounted = false, container } = props;

  const { mounted } = useAlertDialogRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <AlertDialogPortalContext.Provider value={keepMounted}>
      <FloatingPortal root={container}>{children}</FloatingPortal>
    </AlertDialogPortalContext.Provider>
  );
}

namespace AlertDialogPortal {
  export interface Props {
    children?: React.ReactNode;
    /**
     * Whether to keep the portal mounted in the DOM while the popup is hidden.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * A parent element to render the portal element into.
     */
    container?: HTMLElement | null | React.RefObject<HTMLElement | null>;
  }
}

export { AlertDialogPortal };
