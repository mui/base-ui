'use client';
import * as React from 'react';
import { FloatingPortal } from '../../floating-ui-react';
import type { PortalCommonProps } from '../../floating-ui-react';
import { useMenuRootContext } from '../root/MenuRootContext';
import { MenuPortalContext } from './MenuPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuPortal = React.forwardRef(function MenuPortal(
  props: MenuPortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { keepMounted = false, ...portalProps } = props;

  const { store } = useMenuRootContext();
  const mounted = store.useState('mounted');
  const parent = store.useState('parent');

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  const portalOwnerRole = parent.type === 'menu' || parent.type === 'menubar' ? 'group' : undefined;

  return (
    <MenuPortalContext.Provider value={keepMounted}>
      {/* The hidden `aria-owns` owner needs `group` only under role-constrained parents. */}
      <FloatingPortal ref={forwardedRef} {...portalProps} portalOwnerRole={portalOwnerRole} />
    </MenuPortalContext.Provider>
  );
});

export interface MenuPortalState {}

export interface MenuPortalProps extends PortalCommonProps<MenuPortalState> {
  /**
   * Whether to keep the portal mounted in the DOM while the popup is hidden.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace MenuPortal {
  export type State = MenuPortalState;
  export type Props = MenuPortalProps;
}
