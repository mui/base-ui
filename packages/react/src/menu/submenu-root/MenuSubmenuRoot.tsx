'use client';
import * as React from 'react';
import { MenuRoot } from '../root/MenuRoot';
import { useMenuRootContext } from '../root/MenuRootContext';
import { MenuSubmenuRootContext } from './MenuSubmenuRootContext';

export { useMenuSubmenuRootContext } from './MenuSubmenuRootContext';

/**
 * Groups all parts of a submenu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuSubmenuRoot(props: MenuSubmenuRoot.Props) {
  // Submenu must be within Menu
  useMenuRootContext();
  return (
    <MenuSubmenuRootContext.Provider value={true}>
      <MenuRoot {...props} />
    </MenuSubmenuRootContext.Provider>
  );
}

type MenuSubmenuRootFilterProps<RootProps = MenuRoot.Props> = RootProps extends MenuRoot.Props
  ? Pick<RootProps, 'filter' | 'defaultInputValue' | 'inputValue' | 'onInputValueChange'>
  : never;

type MenuSubmenuRootBaseProps = Omit<
  MenuRoot.Props,
  | 'modal'
  | 'openOnHover'
  | 'onOpenChange'
  | 'handle'
  | 'triggerId'
  | 'defaultTriggerId'
  | 'filter'
  | 'defaultInputValue'
  | 'inputValue'
  | 'onInputValueChange'
  | 'children'
>;

export type MenuSubmenuRootProps = MenuSubmenuRootBaseProps &
  MenuSubmenuRootFilterProps & {
    /**
     * Event handler called when the menu is opened or closed.
     */
    onOpenChange?:
      | ((open: boolean, eventDetails: MenuSubmenuRoot.ChangeEventDetails) => void)
      | undefined;
    /**
     * When in a submenu, determines whether pressing the Escape key
     * closes the entire menu, or only the current child menu.
     * @default false
     */
    closeParentOnEsc?: boolean | undefined;
    /**
     * The content of the submenu.
     */
    children?: React.ReactNode;
  };

export interface MenuSubmenuRootState {}

export type MenuSubmenuRootChangeEventReason = MenuRoot.ChangeEventReason;
export type MenuSubmenuRootChangeEventDetails = MenuRoot.ChangeEventDetails;

export namespace MenuSubmenuRoot {
  export type Props = MenuSubmenuRootProps;
  export type State = MenuSubmenuRootState;
  export type ChangeEventReason = MenuSubmenuRootChangeEventReason;
  export type ChangeEventDetails = MenuSubmenuRootChangeEventDetails;
}
