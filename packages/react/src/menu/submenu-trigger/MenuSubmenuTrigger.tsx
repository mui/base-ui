'use client';
import * as React from 'react';
import {
  safePolygon,
  useClick,
  useHoverReferenceInteraction,
  useInteractions,
} from '../../floating-ui-react';
import { BaseUIComponentProps, NonNativeButtonProps } from '../../utils/types';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useMenuItem } from '../item/useMenuItem';
import { useRenderElement } from '../../utils/useRenderElement';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useTriggerRegistration } from '../../utils/popupStoreUtils';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';

/**
 * A menu item that opens a submenu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuSubmenuTrigger = React.forwardRef(function SubmenuTriggerComponent(
  componentProps: MenuSubmenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    render,
    className,
    label,
    id: idProp,
    nativeButton = false,
    openOnHover = true,
    delay = 100,
    closeDelay = 0,
    disabled: disabledProp = false,
    ...elementProps
  } = componentProps;

  const listItem = useCompositeListItem();
  const menuPositionerContext = useMenuPositionerContext();

  const { store } = useMenuRootContext();
  const rootTriggerProps = store.useState('activeTriggerProps');
  const open = store.useState('open');
  const menuDisabled = store.useState('disabled');
  const hoverEnabled = store.useState('hoverEnabled');
  const allowMouseEnter = store.useState('allowMouseEnter');
  const floatingRootContext = store.useState('floatingRootContext');
  const floatingTreeRoot = store.useState('floatingTreeRoot');

  const thisTriggerId = useBaseUiId(idProp);
  const registerTrigger = useTriggerRegistration(thisTriggerId, store);

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);

  const disabled = disabledProp || menuDisabled;

  const submenuRootContext = useMenuSubmenuRootContext();
  if (!submenuRootContext?.parentMenu) {
    throw new Error('Base UI: <Menu.SubmenuTrigger> must be placed in <Menu.SubmenuRoot>.');
  }

  store.useSyncedValue('closeDelay', closeDelay);

  const parentMenuStore = submenuRootContext.parentMenu;

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
    id: thisTriggerId,
    store,
    nativeButton,
    itemMetadata,
    nodeId: menuPositionerContext?.nodeId,
  });

  const hoverProps = useHoverReferenceInteraction(floatingRootContext, {
    enabled: hoverEnabled && openOnHover && !disabled,
    handleClose: safePolygon({ blockPointerEvents: true }),
    mouseOnly: true,
    move: true,
    restMs: allowMouseEnter ? delay : undefined,
    delay: { open: allowMouseEnter ? delay : 10 ** 10, close: closeDelay },
    triggerElement,
    externalTree: floatingTreeRoot,
  });

  const click = useClick(floatingRootContext, {
    enabled: !disabled,
    event: 'mousedown',
    toggle: !openOnHover,
    ignoreMouse: openOnHover,
    stickIfOpen: false,
  });

  const localInteractionProps = useInteractions([click]);

  delete rootTriggerProps.id;

  const state: MenuSubmenuTrigger.State = React.useMemo(
    () => ({ disabled, highlighted, open }),
    [disabled, highlighted, open],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    stateAttributesMapping: triggerOpenStateMapping,
    props: [
      localInteractionProps.getReferenceProps(),
      hoverProps,
      rootTriggerProps,
      itemProps,
      {
        tabIndex: open || highlighted ? 0 : -1,
        onBlur() {
          if (highlighted) {
            parentMenuStore.set('activeIndex', null);
          }
        },
      },
      elementProps,
      getItemProps,
    ],
    ref: [forwardedRef, listItem.ref, itemRef, registerTrigger, setTriggerElement],
  });

  return element;
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
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * How long to wait before the menu may be opened on hover. Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 100
   */
  delay?: number;
  /**
   * How long to wait before closing the menu that was opened on hover.
   * Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 0
   */
  closeDelay?: number;
  /**
   * Whether the menu should also open when the trigger is hovered.
   */
  openOnHover?: boolean;
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
