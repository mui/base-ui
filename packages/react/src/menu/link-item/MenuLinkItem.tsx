'use client';
import * as React from 'react';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useMenuItemCommonProps } from '../item/useMenuItemCommonProps';
import { REGULAR_ITEM } from '../item/useMenuItem';
import { useButton } from '../../internals/use-button';
import { mergeProps } from '../../merge-props';

const MenuLinkItemImpl = React.forwardRef(function MenuLinkItemImpl(
  componentProps: MenuLinkItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    render,
    className,
    id: idProp,
    label,
    closeOnClick = false,
    style,
    ...elementProps
  } = componentProps;

  const linkRef = React.useRef<HTMLAnchorElement | null>(null);

  const listItem = useCompositeListItem({ guess: true, label });
  const menuPositionerContext = useMenuPositionerContext(true);
  const nodeId = menuPositionerContext?.context.nodeId;
  const { store, floatingId } = useMenuRootContext();
  const id = idProp ?? `${floatingId}-${listItem.index}`;

  const highlighted = store.useState('isActive', listItem.index);
  const itemProps = store.useState('itemProps');
  const typingRef = store.context.typingRef;

  const { getButtonProps, buttonRef } = useButton({
    native: false,
    composite: true,
  });

  const commonProps = useMenuItemCommonProps({
    closeOnClick,
    highlighted,
    id,
    nodeId,
    store,
    typingRef,
    itemRef: linkRef,
    itemMetadata: REGULAR_ITEM,
  });

  function getItemProps(externalProps?: HTMLProps): HTMLProps {
    return mergeProps<'a'>(commonProps, externalProps, getButtonProps);
  }

  const state: MenuLinkItemState = { highlighted };

  return useRenderElement('a', componentProps, {
    state,
    props: [itemProps, elementProps, getItemProps],
    ref: [linkRef, buttonRef, forwardedRef, listItem.ref],
  });
});

/**
 * A link in the menu that can be used to navigate to a different page or section.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuLinkItem = React.forwardRef(function MenuLinkItem(
  componentProps: MenuLinkItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { store } = useMenuRootContext();
  const filterIntegration = store.select('filterIntegration');
  const menuLinkItem = <MenuLinkItemImpl {...componentProps} ref={forwardedRef} />;

  return filterIntegration ? (
    // The filter wrapper composes onto MenuLinkItemImpl so its implementation
    // overrides MenuLinkItemImpl's implementation.
    <filterIntegration.Item label={componentProps.label} role="menuitem" render={menuLinkItem} />
  ) : (
    menuLinkItem
  );
});

export interface MenuLinkItemState {
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
}

export interface MenuLinkItemProps extends BaseUIComponentProps<
  'a',
  MenuLinkItemState,
  React.ComponentPropsWithRef<'a'>
> {
  /**
   * Overrides the text label to use when the item is matched during keyboard text navigation.
   */
  label?: string | undefined;
  /**
   * @ignore
   */
  id?: string | undefined;
  /**
   * Whether to close the menu when the item is clicked.
   * @default false
   */
  closeOnClick?: boolean | undefined;
}

export namespace MenuLinkItem {
  export type State = MenuLinkItemState;
  export type Props = MenuLinkItemProps;
}
