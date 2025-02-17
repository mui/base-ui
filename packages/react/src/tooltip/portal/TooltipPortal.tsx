'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { HTMLElementType, refType } from '../../utils/proptypes';
import { TooltipPortalContext } from './TooltipPortalContext';
import { FloatingPortalLite } from '../../utils/FloatingPortalLite';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
const TooltipPortal: React.FC<TooltipPortal.Props> = function TooltipPortal(props) {
  const { children, keepMounted = false, container } = props;

  const { mounted } = useTooltipRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <TooltipPortalContext.Provider value={keepMounted}>
      <FloatingPortalLite root={container}>{children}</FloatingPortalLite>
    </TooltipPortalContext.Provider>
  );
};

namespace TooltipPortal {
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

TooltipPortal.propTypes /* remove-proptypes */ = {
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

export { TooltipPortal };
