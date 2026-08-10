'use client';
import * as React from 'react';
import { REGULAR_ITEM, useMenuItem } from './useMenuItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps, NonNativeButtonProps } from '../../internals/types';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';

const MenuItemImpl = React.forwardRef(function MenuItemImpl(
  componentProps: MenuItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    render,
    className,
    id: idProp,
    label,
    nativeButton = false,
    disabled: disabledProp = false,
    closeOnClick = true,
    style,
    ...elementProps
  } = componentProps;

  const listItem = useCompositeListItem({ guess: true, label });
  const menuPositionerContext = useMenuPositionerContext(true);
  const { store, floatingId } = useMenuRootContext();
  const id = idProp ?? `${floatingId}-${listItem.index}`;

  const rootDisabled = store.useState('disabled');
  const disabled = disabledProp || rootDisabled;
  const highlighted = store.useState('isActive', listItem.index);
  const itemProps = store.useState('itemProps');
  const { getItemProps, itemRef } = useMenuItem({
    closeOnClick,
    disabled,
    highlighted,
    id,
    store,
    nativeButton,
    nodeId: menuPositionerContext?.context.nodeId,
    itemMetadata: REGULAR_ITEM,
  });

  const state: MenuItemState = {
    disabled,
    highlighted,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    props: [itemProps, elementProps, getItemProps],
    ref: [itemRef, forwardedRef, listItem.ref],
  });

  return element;
});

/**
 * An individual interactive item in the menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuItem = React.forwardRef(function MenuItem(
  componentProps: MenuItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { store } = useMenuRootContext();
  const filterIntegration = store.select('filterIntegration');
  const menuItem = <MenuItemImpl {...componentProps} ref={forwardedRef} />;

  return filterIntegration ? (
    // The filter wrapper composes onto MenuItemImpl so its implementation
    // overrides MenuItemImpl's implementation.
    <filterIntegration.Item label={componentProps.label} role="menuitem" render={menuItem} />
  ) : (
    menuItem
  );
});

export interface MenuItemState {
  /**
   * Whether the item should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
}

export interface MenuItemProps
  extends NonNativeButtonProps, BaseUIComponentProps<'div', MenuItemState> {
  /**
   * The click handler for the menu item.
   */
  onClick?: BaseUIComponentProps<'div', MenuItemState>['onClick'] | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Overrides the text label to use when the item is matched during keyboard text navigation,
   * and when filtering.
   */
  label?: string | undefined;
  /**
   * @ignore
   */
  id?: string | undefined;
  /**
   * Whether to close the menu when the item is clicked.
   *
   * @default true
   */
  closeOnClick?: boolean | undefined;
}

export namespace MenuItem {
  export type State = MenuItemState;
  export type Props = MenuItemProps;
}
