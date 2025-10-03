'use client';
import * as React from 'react';
import { MenuRoot } from '../root/MenuRoot';
import { MenuSubmenuRootContext } from './MenuSubmenuRootContext';

export { useMenuSubmenuRootContext } from './MenuSubmenuRootContext';

/**
 * Groups all parts of a submenu.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuSubmenuRoot(props: MenuSubmenuRoot.Props) {
  const { closeParentOnEsc = false } = props;

  return (
    <MenuSubmenuRootContext.Provider value>
      <MenuRoot closeParentOnEsc={closeParentOnEsc} {...props} />
    </MenuSubmenuRootContext.Provider>
  );
}

export interface MenuSubmenuRootProps
  extends Omit<MenuRoot.Props, 'modal' | 'openOnHover' | 'onOpenChange'> {
  /**
   * Whether the submenu should open when the trigger is hovered.
   * @default true
   */
  openOnHover?: MenuRoot.Props['openOnHover'];
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: MenuSubmenuRootChangeEventDetails) => void;
}

export interface MenuSubmenuRootState {}

export type MenuSubmenuRootChangeEventReason = MenuRoot.ChangeEventReason;
export type MenuSubmenuRootChangeEventDetails = MenuRoot.ChangeEventDetails;

export namespace MenuSubmenuRoot {
  export type Props = MenuSubmenuRootProps;
  export type State = MenuSubmenuRootState;
  export type ChangeEventReason = MenuSubmenuRootChangeEventReason;
  export type ChangeEventDetails = MenuSubmenuRootChangeEventDetails;
}
