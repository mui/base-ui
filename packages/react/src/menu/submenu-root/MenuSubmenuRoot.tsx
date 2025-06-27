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
  return (
    <MenuSubmenuRootContext.Provider value>
      <MenuRoot {...props} />
    </MenuSubmenuRootContext.Provider>
  );
}

export namespace MenuSubmenuRoot {
  export interface Props extends Omit<MenuRoot.Props, 'modal' | 'openOnHover'> {
    /**
     * Whether the submenu should open when the trigger is hovered.
     * @default true
     */
    openOnHover?: MenuRoot.Props['openOnHover'];
  }

  export interface State {}
}
