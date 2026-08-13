'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
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
  const listNavigationProps = store.useState('listProps');
  const listRole = elementProps.role ?? MENU_LIST_ROLE;

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setListElement],
    props: [
      filterable ? listNavigationProps : undefined,
      {
        role: listRole,
        // VoiceOver switches into menu interaction mode as soon as the menu is exposed, which
        // prevents dialog/input focus from being announced. Keep the menu subtree hidden until
        // Down Arrow moves navigation (and DOM focus) into the results. Scoped to WebKit so
        // other ATs keep browse-mode discovery of the items.
        'aria-hidden':
          filterable && activeIndex === null && platform.engine.webkit ? true : undefined,
        onFocus(event) {
          if (event.target === event.currentTarget) {
            store.set('inputFocusVisible', false);
          }
        },
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
  const menuList = <MenuListImpl {...componentProps} ref={forwardedRef} />;

  return filterIntegration ? (
    // The filter wrapper composes onto MenuListImpl so its implementation
    // overrides MenuListImpl's implementation.
    <filterIntegration.List id={componentProps.id} role={MENU_LIST_ROLE} render={menuList} />
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
