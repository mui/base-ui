'use client';
import * as React from 'react';
import { useFloatingTree } from '../../floating-ui-react';
import { REGULAR_ITEM, useMenuItem } from './useMenuItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, NonNativeButtonProps } from '../../utils/types';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';

/**
 * An individual interactive item in the menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuItem = React.forwardRef(function MenuItem(
  componentProps: MenuItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    render,
    className,
    id: idProp,
    label,
    nativeButton = false,
    disabled = false,
    closeOnClick = true,
    ...elementProps
  } = componentProps;

  const listItem = useCompositeListItem({ label });
  const menuPositionerContext = useMenuPositionerContext(true);
  const id = useBaseUiId(idProp);
  const { events: menuEvents } = useFloatingTree()!;

  const { store } = useMenuRootContext();
  const highlighted = store.useState('isActive', listItem.index);
  const itemProps = store.useState('itemProps');

  const { getItemProps, itemRef } = useMenuItem({
    closeOnClick,
    disabled,
    highlighted,
    id,
    menuEvents,
    store,
    nativeButton,
    nodeId: menuPositionerContext?.floatingContext.nodeId,
    itemMetadata: REGULAR_ITEM,
  });

  const state: MenuItem.State = React.useMemo(
    () => ({
      disabled,
      highlighted,
    }),
    [disabled, highlighted],
  );

  return useRenderElement('div', componentProps, {
    state,
    props: [itemProps, elementProps, getItemProps],
    ref: [itemRef, forwardedRef, listItem.ref],
  });
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
  extends NonNativeButtonProps,
    BaseUIComponentProps<'div', MenuItem.State> {
  /**
   * The click handler for the menu item.
   */
  onClick?: React.MouseEventHandler<HTMLElement>;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * Overrides the text label to use when the item is matched during keyboard text navigation.
   */
  label?: string;
  /**
   * @ignore
   */
  id?: string;
  /**
   * Whether to close the menu when the item is clicked.
   *
   * @default true
   */
  closeOnClick?: boolean;
}

export namespace MenuItem {
  export type State = MenuItemState;
  export type Props = MenuItemProps;
}
