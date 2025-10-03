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

  const id = useBaseUiId(idProp);

  const {
    triggerProps: rootTriggerProps,
    parent,
    setTriggerElement,
    open,
    typingRef,
    disabled,
    allowMouseUpTriggerRef,
  } = useMenuRootContext();
  const menuPositionerContext = useMenuPositionerContext();

  if (parent.type !== 'menu') {
    throw new Error('Base UI: <Menu.SubmenuTrigger> must be placed in <Menu.SubmenuRoot>.');
  }

  const parentMenuContext = parent.context;

  const { activeIndex, itemProps, setActiveIndex } = parentMenuContext;
  const item = useCompositeListItem();

  const highlighted = activeIndex === item.index;

  const { events: menuEvents } = useFloatingTree()!;

  const itemMetadata = React.useMemo(
    () => ({
      type: 'submenu-trigger' as const,
      setActive: () => setActiveIndex(item.index),
      allowMouseEnterEnabled: parentMenuContext.allowMouseEnter,
    }),
    [setActiveIndex, item.index, parentMenuContext.allowMouseEnter],
  );

  const { getItemProps, itemRef } = useMenuItem({
    closeOnClick: false,
    disabled,
    highlighted,
    id,
    menuEvents,
    allowMouseUpTriggerRef,
    typingRef,
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
    ref: [forwardedRef, item.ref, itemRef, setTriggerElement],
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
            setActiveIndex(null);
          }
        },
      },
    ],
  });
});

export interface MenuSubmenuTriggerProps
  extends NonNativeButtonProps,
    BaseUIComponentProps<'div', MenuSubmenuTrigger.State> {
  children?: React.ReactNode;
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
