'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuDerivedItemsContext } from '../root/MenuDerivedItemsContext';

const MENU_LIST_ROLE = 'menu';

const MenuListImpl = React.forwardRef(function MenuListImpl(
  componentProps: Omit<MenuList.Props, 'children'> & { children?: React.ReactNode },
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;
  const { store } = useMenuRootContext();
  const setListElement = store.useStateSetter('listElement');
  const filterable = store.select('filterable');
  const activeIndex = store.useState('activeIndex');
  const listRole = elementProps.role ?? MENU_LIST_ROLE;

  // VoiceOver switches into menu interaction mode as soon as the menu is exposed, which prevents
  // dialog/input focus from being announced. To fix, we match autocomplete behavior by keeping
  // the complete menu subtree hidden until Down Arrow moves virtual focus into the results. This
  // exposes the menu and its items during menu navigation.
  const shouldHideMenuFromAT =
    platform.screenReader.voiceOver &&
    filterable &&
    activeIndex === null &&
    listRole === MENU_LIST_ROLE;

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setListElement],
    props: [
      {
        role: listRole,
        'aria-hidden': shouldHideMenuFromAT ? true : undefined,
      },
      elementProps,
    ],
  });

  return element;
});

/**
 * A container for the menu items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuList = React.forwardRef(function MenuList(
  componentProps: MenuList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { store } = useMenuRootContext();
  const filterIntegration = store.select('filterIntegration');
  const { filteredItems } = useMenuDerivedItemsContext();
  const { children } = componentProps;

  // A function child renders from the root's `items`, already narrowed to the query, so
  // filtered-out items never mount.
  const resolvedChildren = React.useMemo(() => {
    if (typeof children === 'function') {
      return filteredItems.map(children);
    }
    return children;
  }, [children, filteredItems]);

  const menuList = (
    <MenuListImpl {...componentProps} ref={forwardedRef}>
      {resolvedChildren}
    </MenuListImpl>
  );

  return filterIntegration ? (
    // The filter wrapper composes onto MenuListImpl so its implementation
    // overrides MenuListImpl's implementation.
    <filterIntegration.List id={componentProps.id} role={MENU_LIST_ROLE} render={menuList} />
  ) : (
    menuList
  );
});

export interface MenuListState {}
export interface MenuListProps extends Omit<
  BaseUIComponentProps<'div', MenuListState>,
  'children'
> {
  /**
   * A function child renders one node per entry of the root's `items` prop, narrowed to the
   * query in a filterable menu.
   */
  children?: React.ReactNode | ((item: any, index: number) => React.ReactNode);
}

export namespace MenuList {
  export type State = MenuListState;
  export type Props = MenuListProps;
}
