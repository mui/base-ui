'use client';
import * as React from 'react';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps } from '../../utils/types';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { REASONS } from '../../utils/reasons';

export const MenuLink = React.forwardRef(function MenuLink(
  componentProps: MenuLink.Props,
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

  const contextMenuContext = useContextMenuRootContext(true);
  const isContextMenu = contextMenuContext !== undefined;

  const id = useBaseUiId(idProp);

  const { store } = useMenuRootContext();
  const { events: menuEvents } = store.useState('floatingTreeRoot');
  const highlighted = store.useState('isActive', listItem.index);
  const itemProps = store.useState('itemProps');

  const state: MenuLink.State = React.useMemo(
    () => ({
      highlighted,
    }),
    [highlighted],
  );

  return useRenderElement('a', componentProps, {
    state,
    props: [
      itemProps,
      elementProps,
      {
        id,
        tabIndex: highlighted ? 0 : -1,
        onMouseMove(event) {
          if (!nodeId) {
            return;
          }

          // Inform the floating tree that a menu item within this menu was hovered/moved over
          // so unrelated descendant submenus can be closed.
          menuEvents.emit('itemhover', {
            nodeId,
            target: event.currentTarget,
          });
        },
        onClick(event) {
          if (closeOnClick) {
            menuEvents.emit('close', { domEvent: event, reason: REASONS.itemPress });
          }
        },
        onMouseUp(event) {
          if (
            linkRef.current &&
            store.context.allowMouseUpTriggerRef.current &&
            (!isContextMenu || event.button === 2)
          ) {
            // This fires whenever the user clicks on the trigger, moves the cursor, and releases it over the item.
            // We trigger the click and override the `closeOnClick` preference to always close the menu.
            linkRef.current.click();
          }
        },
      },
    ],
    ref: [linkRef, forwardedRef, listItem.ref],
  });
});

export interface MenuLinkState {
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
}

export interface MenuLinkProps extends BaseUIComponentProps<'a', MenuLink.State> {
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
   * @default false
   */
  closeOnClick?: boolean;
}

export namespace MenuLink {
  export type State = MenuLinkState;
  export type Props = MenuLinkProps;
}
