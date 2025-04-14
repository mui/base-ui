'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import { NavigationMenuPortalContext } from './NavigationMenuPortalContext';
import { HTMLElementType, refType } from '../../utils/proptypes';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
function NavigationMenuPortal(props: NavigationMenuPortal.Props) {
  const { children, keepMounted = false, container } = props;

  const { mounted } = useNavigationMenuRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <NavigationMenuPortalContext.Provider value={keepMounted}>
      <FloatingPortal root={container}>{children}</FloatingPortal>
    </NavigationMenuPortalContext.Provider>
  );
}

namespace NavigationMenuPortal {
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

NavigationMenuPortal.propTypes /* remove-proptypes */ = {
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

export { NavigationMenuPortal };
