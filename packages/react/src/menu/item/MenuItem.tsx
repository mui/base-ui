'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useMenuFilterImpl, useUnfilteredItem } from '../filter-root/MenuFilterContext';
import { REGULAR_ITEM, useMenuItem } from './useMenuItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps, NonNativeButtonProps } from '../../internals/types';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { getMenuItemId } from '../utils/getMenuItemId';

const MenuItemPlain = React.forwardRef(function MenuItem(
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
  const { store, floatingId, virtualFocus, webkitItemSelected } = useMenuRootContext();
  const id = getMenuItemId(idProp, floatingId, listItem.index);

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
    virtualFocus,
    webkitItemSelected,
  });

  const state: MenuItemState = {
    disabled,
    highlighted,
  };

  return useRenderElement('div', componentProps, {
    state,
    props: [itemProps, elementProps, getItemProps],
    ref: [itemRef, forwardedRef, listItem.ref],
  });
});

/**
 * An individual interactive item in the menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuItem = React.forwardRef(function MenuItem(
  props: MenuItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { keywords, ...itemProps } = props;
  const useItemFilter = useMenuFilterImpl()?.useItem ?? useUnfilteredItem;
  const filter = useItemFilter({ label: props.label, keywords, children: props.children });
  const ref = useMergedRefs(forwardedRef, filter.ref);
  if (!filter.visible) {
    return null;
  }
  return <MenuItemPlain {...filter.props} {...itemProps} ref={ref} />;
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
   * Overrides the text label to use when the item is matched during keyboard text navigation.
   */
  label?: string | undefined;
  /**
   * Additional terms the item matches on when filtering inside `Menu.FilterRoot`.
   * A plain menu ignores it.
   */
  keywords?: readonly string[] | undefined;
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
