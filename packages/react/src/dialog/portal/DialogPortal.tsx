'use client';
import * as React from 'react';
import { FloatingPortal } from '@floating-ui/react';
import { useDialogRootContext } from '../root/DialogRootContext';

/**
 *
 * Demos:
 *
 * - [Dialog](https://base-ui.com/components/react-dialog/)
 *
 * API:
 *
 * - [DialogPortal API](https://base-ui.com/components/react-dialog/#api-reference-DialogPortal)
 */
const DialogPortal: DialogPortal = function DialogPortal(props: DialogPortal.Props) {
  const { children, container, keepMounted = false } = props;

  const { mounted } = useDialogRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return <FloatingPortal root={container}>{children}</FloatingPortal>;
};

namespace DialogPortal {
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

interface DialogPortal {
  (props: DialogPortal.Props): React.JSX.Element | null;
  propTypes?: any;
}

export { DialogPortal };
