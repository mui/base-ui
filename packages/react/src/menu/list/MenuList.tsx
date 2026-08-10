'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { FilterDropdownList } from '../../filter-dropdown/list/FilterDropdownList';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useMenuRootContext } from '../root/MenuRootContext';

const MENU_LIST_ROLE = 'menu';

const MenuListImpl = React.forwardRef(function MenuListImpl(
  componentProps: MenuList.Props,
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
  const filterable = store.select('filterable');
  const menuList = <MenuListImpl {...componentProps} ref={forwardedRef} />;

  return filterable ? (
    // FilterDropdownList composes onto MenuListImpl so its implementation
    // overrides MenuListImpl's implementation.
    <FilterDropdownList id={componentProps.id} role={MENU_LIST_ROLE} render={menuList} />
  ) : (
    menuList
  );
});

export interface MenuListState {}
export interface MenuListProps extends BaseUIComponentProps<'div', MenuListState> {}

export namespace MenuList {
  export type State = MenuListState;
  export type Props = MenuListProps;
}
