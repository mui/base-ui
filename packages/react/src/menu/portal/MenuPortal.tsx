'use client';
import * as React from 'react';
import { FloatingPortal } from '../../floating-ui-react';
import { useMenuRootContext } from '../root/MenuRootContext';
import { MenuPortalContext } from './MenuPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuPortal = React.forwardRef(function MenuPortal(
  props: MenuPortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, keepMounted = false, ...portalProps } = props;

  const { mounted } = useMenuRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <MenuPortalContext.Provider value={keepMounted}>
      <FloatingPortal ref={forwardedRef} {...portalProps}>
        {children}
      </FloatingPortal>
    </MenuPortalContext.Provider>
  );
});

export namespace MenuPortal {
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
