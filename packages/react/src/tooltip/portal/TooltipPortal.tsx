'use client';
import * as React from 'react';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { TooltipPortalContext } from './TooltipPortalContext';
import { FloatingPortalLite } from '../../utils/FloatingPortalLite';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export const TooltipPortal = React.forwardRef(function TooltipPortal(
  props: TooltipPortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, keepMounted = false, ...portalProps } = props;

  const { mounted } = useTooltipRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <TooltipPortalContext.Provider value={keepMounted}>
      <FloatingPortalLite ref={forwardedRef} {...portalProps}>
        {children}
      </FloatingPortalLite>
    </TooltipPortalContext.Provider>
  );
});

export namespace TooltipPortal {
  export interface Props extends FloatingPortalLite.Props {
    /**
     * Whether to keep the portal mounted in the DOM while the popup is hidden.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * A parent element to render the portal element into.
     */
    container?: FloatingPortalLite.Props['container'];
  }
}
