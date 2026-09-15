'use client';
import * as React from 'react';
import { useMenuFilterImpl } from '../filter-root/MenuFilterContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { useBaseUiId } from '../../internals/useBaseUiId';
import type { BaseUIComponentProps } from '../../internals/types';
import { resolveMenuPopupLabel } from '../popup/resolveMenuPopupLabel';

export const MenuListPlain = React.forwardRef(function MenuList(
  componentProps: MenuList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;

  const { store, orientation } = useMenuRootContext();
  const activeTriggerId = store.useState('activeTriggerId');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const setListElement = store.useStateSetter('listElement');

  const id = useBaseUiId(idProp);
  const { ariaLabelledBy } = resolveMenuPopupLabel(
    componentProps,
    activeTriggerElement,
    activeTriggerId,
  );

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, setListElement],
    props: [
      {
        id,
        role: 'menu',
        // `menu` is implicitly vertical, so only the non-default value needs to be rendered.
        'aria-orientation': orientation === 'horizontal' ? 'horizontal' : undefined,
        'aria-labelledby': ariaLabelledBy,
      },
      elementProps,
    ],
  });
});

/**
 * A container for the menu items.
 * When rendered, it takes the `menu` role from the popup, which lets the popup hold other
 * elements such as a filter input.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuList = React.forwardRef(function MenuList(
  props: MenuList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const List = useMenuFilterImpl()?.List ?? MenuListPlain;
  return <List {...props} ref={forwardedRef} />;
});

export interface MenuListState {}

export interface MenuListProps extends BaseUIComponentProps<'div', MenuListState> {
  id?: string | undefined;
}

export namespace MenuList {
  export type Props = MenuListProps;
  export type State = MenuListState;
}
