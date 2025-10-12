'use client';
import * as React from 'react';
import { inertValue } from '@base-ui-components/utils/inertValue';
import { FloatingPortal, FloatingPortalProps } from '../../floating-ui-react';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { AlertDialogPortalContext } from './AlertDialogPortalContext';
import { InternalBackdrop } from '../../utils/InternalBackdrop';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogPortal(props: AlertDialogPortal.Props) {
  const { children, keepMounted = false, container } = props;

  const { store } = useDialogRootContext();
  const mounted = store.useState('mounted');
  const modal = store.useState('modal');

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <AlertDialogPortalContext.Provider value={keepMounted}>
      <FloatingPortal root={container}>
        {mounted && modal === true && (
          <InternalBackdrop ref={store.context.internalBackdropRef} inert={inertValue(!open)} />
        )}
        {children}
      </FloatingPortal>
    </AlertDialogPortalContext.Provider>
  );
}

export interface AlertDialogPortalProps {
  children?: React.ReactNode;
  /**
   * Whether to keep the portal mounted in the DOM while the popup is hidden.
   * @default false
   */
  keepMounted?: boolean;
  /**
   * A parent element to render the portal element into.
   */
  container?: FloatingPortalProps['root'];
}

export namespace AlertDialogPortal {
  export type Props = AlertDialogPortalProps;
}
