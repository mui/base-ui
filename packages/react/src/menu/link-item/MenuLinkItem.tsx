'use client';
import * as React from 'react';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps } from '../../utils/types';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useMenuItemCommonProps } from '../item/useMenuItemCommonProps';

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
  const {
    render,
    className,
    id: idProp,
    label,
    closeOnClick = false,
    ...elementProps
  } = componentProps;

  const linkRef = React.useRef<HTMLAnchorElement | null>(null);

  const listItem = useCompositeListItem({ label });
  const menuPositionerContext = useMenuPositionerContext(true);
  const nodeId = menuPositionerContext?.nodeId;

  const id = useBaseUiId(idProp);

  const { store } = useMenuRootContext();
  const highlighted = store.useState('isActive', listItem.index);
  const itemProps = store.useState('itemProps');

  const commonProps = useMenuItemCommonProps({
    closeOnClick,
    highlighted,
    id,
    nodeId,
    store,
    itemRef: linkRef,
  });

  const state: MenuLinkItem.State = React.useMemo(
    () => ({
      highlighted,
    }),
    [highlighted],
  );

  return useRenderElement('a', componentProps, {
    state,
    props: [itemProps, elementProps, commonProps],
    ref: [linkRef, forwardedRef, listItem.ref],
  });
});

export interface MenuLinkItemState {
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
}

export interface MenuLinkItemProps extends BaseUIComponentProps<'a', MenuLinkItem.State> {
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
