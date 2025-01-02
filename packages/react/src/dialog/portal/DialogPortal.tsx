'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import { useDialogRootContext } from '../root/DialogRootContext';
import { DialogPortalContext } from './DialogPortalContext';
import { HTMLElementType, refType } from '../../utils/proptypes';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
function DialogPortal(props: DialogPortal.Props) {
  const { children, keepMounted = false, container } = props;

  const { mounted } = useDialogRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <DialogPortalContext.Provider value={keepMounted}>
      <FloatingPortal root={container}>{children}</FloatingPortal>
    </DialogPortalContext.Provider>
  );
}

namespace DialogPortal {
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

DialogPortal.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * A parent element to render the portal element into.
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([HTMLElementType, refType]),
  /**
   * Whether to keep the portal mounted in the DOM while the popup is hidden.
   * @default false
   */
  keepMounted: PropTypes.bool,
} as any;

export { DialogPortal };
