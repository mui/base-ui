'use client';
import * as React from 'react';
import { useFloatingTree } from '../../floating-ui-react';
import { BaseUIComponentProps, NonNativeButtonProps } from '../../utils/types';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useMenuItem } from '../item/useMenuItem';
import { useRenderElement } from '../../utils/useRenderElement';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';

/**
 * A menu item that opens a submenu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuSubmenuTrigger = React.forwardRef(function SubmenuTriggerComponent(
  componentProps: MenuSubmenuTrigger.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    render,
    className,
    label,
    id: idProp,
    nativeButton = false,
    ...elementProps
  } = componentProps;

  const listItem = useCompositeListItem();
  const menuPositionerContext = useMenuPositionerContext();
  const id = useBaseUiId(idProp);
  const { events: menuEvents } = useFloatingTree()!;

  const { store } = useMenuRootContext();
  const rootTriggerProps = store.useState('activeTriggerProps');
  const open = store.useState('open');
  const parent = store.useState('parent');
  const disabled = store.useState('disabled');

  if (parent.type !== 'menu') {
    throw new Error('Base UI: <Menu.SubmenuTrigger> must be placed in <Menu.SubmenuRoot>.');
  }

  const parentMenuStore = parent.store;
  const itemProps = parentMenuStore.useState('itemProps');
  const highlighted = parentMenuStore.useState('isActive', listItem.index);

  const itemMetadata = React.useMemo(
    () => ({
      type: 'submenu-trigger' as const,
      setActive: () => parentMenuStore.set('activeIndex', listItem.index),
    }),
    [parentMenuStore, listItem.index],
  );

  const { getItemProps, itemRef } = useMenuItem({
    closeOnClick: false,
    disabled,
    highlighted,
    id,
    menuEvents,
    store,
    nativeButton,
    itemMetadata,
    nodeId: menuPositionerContext?.floatingContext.nodeId,
  });

  const state: MenuSubmenuTrigger.State = React.useMemo(
    () => ({ disabled, highlighted, open }),
    [disabled, highlighted, open],
  );

  return useRenderElement('div', componentProps, {
    state,
    stateAttributesMapping: triggerOpenStateMapping,
    props: [
      rootTriggerProps,
      itemProps,
      elementProps,
      getItemProps,
      {
        tabIndex: open || highlighted ? 0 : -1,
        onBlur() {
          if (highlighted) {
            parentMenuStore.set('activeIndex', null);
          }
        },
      },
    ],
    ref: [forwardedRef, listItem.ref, itemRef, store.useStateSetter('triggerElement')],
  });
});

export interface MenuSubmenuTriggerProps
  extends NonNativeButtonProps,
    BaseUIComponentProps<'div', MenuSubmenuTrigger.State> {
  onClick?: React.MouseEventHandler<HTMLElement>;
  /**
   * Overrides the text label to use when the item is matched during keyboard text navigation.
   */
  label?: string;
  /**
   * @ignore
   */
  id?: string;
}

export interface MenuSubmenuTriggerState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
  /**
   * Whether the menu is currently open.
   */
  open: boolean;
}

export namespace MenuSubmenuTrigger {
  export type Props = MenuSubmenuTriggerProps;
  export type State = MenuSubmenuTriggerState;
}
