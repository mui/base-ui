'use client';
import * as React from 'react';
import {
  MenuSubmenuRoot,
  type MenuSubmenuRootProps,
  type MenuSubmenuRootState,
} from '../../menu/submenu-root/MenuSubmenuRoot';

/**
 * Groups all parts of a submenu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
export function ContextMenuSubmenuRoot(props: ContextMenuSubmenuRoot.Props) {
  return <MenuSubmenuRoot {...props} />;
}

export interface ContextMenuSubmenuRootProps extends Omit<
  MenuSubmenuRootProps,
  'filter' | 'defaultInputValue' | 'inputValue' | 'onInputValueChange' | 'onOpenChange'
> {
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: ContextMenuSubmenuRoot.ChangeEventDetails) => void)
    | undefined;
}

export type ContextMenuSubmenuRootState = MenuSubmenuRootState;

export namespace ContextMenuSubmenuRoot {
  export type Props = ContextMenuSubmenuRootProps;
  export type State = ContextMenuSubmenuRootState;
  export type ChangeEventReason = MenuSubmenuRoot.ChangeEventReason;
  export type ChangeEventDetails = MenuSubmenuRoot.ChangeEventDetails;
}
