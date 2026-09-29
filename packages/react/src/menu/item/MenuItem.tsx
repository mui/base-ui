'use client';
import * as React from 'react';
import { useMenuFilterItem } from '../filter-root/MenuFilterContext';
import { REGULAR_ITEM, useMenuItem } from './useMenuItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { useBaseUiId } from '../../internals/useBaseUiId';
import type { BaseUIComponentProps, NonNativeButtonProps } from '../../internals/types';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';

const MenuItemPlain = React.forwardRef(function MenuItemPlain(
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

  const { store } = useMenuRootContext();

  const listItem = useCompositeListItem({ guess: true, label });
  const id = useBaseUiId(idProp);

  const rootDisabled = store.useState('disabled');
  const highlighted = store.useState('isActive', listItem.index);
  const nodeId = store.useState('floatingNodeId');
  const itemProps = store.useState('itemProps');

  const disabled = disabledProp || rootDisabled;

  const { getItemProps, itemRef } = useMenuItem({
    closeOnClick,
    disabled,
    highlighted,
    id,
    store,
    nativeButton,
    nodeId,
    itemMetadata: REGULAR_ITEM,
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
  const filterItem = useMenuFilterItem(props, forwardedRef);

  if (!filterItem.visible) {
    return null;
  }

  return <MenuItemPlain {...props} ref={filterItem.ref} />;
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
   * Overrides the text used for keyboard text navigation and filtering inside
   * `Menu.FilterProvider`. Falls back to the rendered text when not provided.
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
