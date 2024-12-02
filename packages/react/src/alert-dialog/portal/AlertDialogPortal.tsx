'use client';
import * as React from 'react';
import { FloatingPortal } from '@floating-ui/react';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';

/**
 *
 * Demos:
 *
 * - [Alert Dialog](https://base-ui.com/components/react-alert-dialog/)
 *
 * API:
 *
 * - [AlertDialogPortal API](https://base-ui.com/components/react-alert-dialog/#api-reference-AlertDialogPortal)
 */
const AlertDialogPortal: AlertDialogPortal = function AlertDialogPortal(
  props: AlertDialogPortal.Props,
) {
  const { children, container, keepMounted = false } = props;

  const { mounted } = useAlertDialogRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return <FloatingPortal root={container}>{children}</FloatingPortal>;
};

namespace AlertDialogPortal {
  export interface Props {
    children?: React.ReactNode;
    /**
     * The container to render the portal element into.
     */
    container?: HTMLElement | null | React.RefObject<HTMLElement | null>;
    /**
     * Whether to keep the portal mounted in the DOM when the popup is closed.
     * @default false
     */
    keepMounted?: boolean;
  }

  export interface State {}
}

interface AlertDialogPortal {
  (props: AlertDialogPortal.Props): React.JSX.Element | null;
  propTypes?: any;
}

export { AlertDialogPortal };
