'use client';
import * as React from 'react';
import { inertValue } from '@base-ui-components/utils/inertValue';
import { FloatingPortal, FloatingPortalProps } from '../../floating-ui-react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { DialogPortalContext } from './DialogPortalContext';
import { InternalBackdrop } from '../../utils/InternalBackdrop';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogPortal(props: DialogPortal.Props) {
  const { children, keepMounted = false, container } = props;

  const { store } = useDialogRootContext();
  const mounted = store.useState('mounted');
  const modal = store.useState('modal');

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <DialogPortalContext.Provider value={keepMounted}>
      {mounted && modal === true && (
        <InternalBackdrop ref={store.context.internalBackdropRef} inert={inertValue(!open)} />
      )}
      <FloatingPortal root={container}>{children}</FloatingPortal>
    </DialogPortalContext.Provider>
  );
}

export interface DialogPortalProps {
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

export namespace DialogPortal {
  export type Props = DialogPortalProps;
}
