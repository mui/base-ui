'use client';
import * as React from 'react';
import { isElementDisabled } from '@base-ui/utils/isElementDisabled';
import { warn } from '@base-ui/utils/warn';
import { SafeReact } from '@base-ui/utils/safeReact';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { platform } from '@base-ui/utils/platform';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { safePolygon, useClick, useHoverReferenceInteraction } from '../../floating-ui-react';
import { BaseUIComponentProps, NonNativeButtonProps } from '../../internals/types';
import { useMenuRootContext } from '../root/MenuRootContext';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import { useMenuItem } from '../item/useMenuItem';
import { useRenderElement } from '../../internals/useRenderElement';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useTriggerRegistration } from '../../utils/popups';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { REASONS } from '../../internals/reasons';
import { getMenuItemId } from '../utils/getMenuItemId';

const VOICE_OVER_EXPANDED_PROPS = { 'aria-expanded': undefined };

/**
 * A menu item that opens a submenu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuSubmenuTrigger = React.forwardRef(function MenuSubmenuTrigger(
  componentProps: MenuSubmenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    render,
    className,
    style,
    label,
    id: idProp,
    nativeButton = false,
    openOnHover = true,
    delay = 100,
    closeDelay = 0,
    disabled: disabledProp = false,
    ...elementProps
  } = componentProps;

  const context = useMenuRootContext(true);
  if (context?.type !== 'submenu' || context.parent.type !== 'menu') {
    throw new Error('Base UI: <Menu.SubmenuTrigger> must be placed in <Menu.SubmenuRoot>.');
  }

  const menuPositionerContext = useMenuPositionerContext();

  const { store, parentVirtualFocus } = context;
  const parentMenuStore = context.parent.store;
  const submenuRootContext = useMenuSubmenuRootContext();
  const listItem = useCompositeListItem({ guess: true, label });
  const parentFloatingId = parentMenuStore.useState('floatingId');
  // The trigger is an item in the parent menu, so its ID uses the parent's namespace.
  const id = getMenuItemId(idProp, parentFloatingId, listItem.index);

  const open = store.useState('open');
  const floatingRootContext = store.useState('floatingRootContext');
  const floatingTreeRoot = store.useState('floatingTreeRoot');
  const popupId = store.useState('triggerPopupId', id);
  const baseRegisterTrigger = useTriggerRegistration(id, store);
  // Stable, so the merged ref on the rendered element keeps its identity for the trigger's whole
  // lifetime; the latest `closeDelay` is read when it runs.
  const registerTrigger = useStableCallback((element: Element | null) => {
    baseRegisterTrigger(element);

    const activeTriggerElement = store.select('activeTriggerElement');
    if (
      element !== null &&
      store.select('open') &&
      (activeTriggerElement === element || store.select('activeTriggerId') == null)
    ) {
      store.update({
        activeTriggerId: id ?? null,
        activeTriggerElement: element,
        closeDelay,
      });
    }
  });

  const triggerElementRef = React.useRef<HTMLElement | null>(null);
  const handleTriggerElementRef = React.useCallback(
    (element: HTMLElement | null) => {
      triggerElementRef.current = element;
      store.set('activeTriggerElement', element);
    },
    [store],
  );

  // A stable ref does not re-fire when the id changes, so register the rendered element here
  // instead. On React 17 the id also starts out `undefined`, so this is what registers the trigger
  // at all.
  useIsoLayoutEffect(() => {
    registerTrigger(triggerElementRef.current);
    return () => registerTrigger(null);
  }, [registerTrigger, id, store]);

  store.useSyncedValue('closeDelay', closeDelay);

  const rootDisabled = store.useState('disabled');
  const parentDisabled = parentMenuStore.useState('disabled');
  const disabled = disabledProp || rootDisabled || parentDisabled;

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      const element = triggerElementRef.current;
      if (element && isElementDisabled(element) && !disabled) {
        const ownerStackMessage = SafeReact.captureOwnerStack?.() || '';
        warn(
          `A disabled element was detected on <Menu.SubmenuTrigger>. To properly disable the trigger, use the \`disabled\` prop on the component instead of setting it on the rendered element.${ownerStackMessage}`,
        );
      }
    });
  }

  const itemProps = parentMenuStore.useState('itemProps');
  const highlighted = parentMenuStore.useState('isActive', listItem.index);
  const itemMetadata = React.useMemo(
    () => ({
      type: 'submenu-trigger' as const,
      setActive() {
        if (parentMenuStore.select('highlightItemOnHover')) {
          parentMenuStore.set('activeIndex', listItem.index);
        }
      },
    }),
    [parentMenuStore, listItem.index],
  );

  const { getItemProps, itemRef } = useMenuItem({
    closeOnClick: false,
    disabled,
    highlighted,
    id,
    open,
    store,
    typingRef: parentMenuStore.context.typingRef,
    nativeButton,
    itemMetadata,
    virtualFocus: parentVirtualFocus,
    nodeId: menuPositionerContext?.context.nodeId,
  });

  const hoverEnabled = store.useState('hoverEnabled');

  const hoverProps = useHoverReferenceInteraction(floatingRootContext, {
    enabled: hoverEnabled && openOnHover && !disabled,
    handleClose: safePolygon({ blockPointerEvents: true }),
    mouseOnly: true,
    move: true,
    restMs: delay,
    delay: { open: delay, close: closeDelay },
    shouldOpen: delay > 0 ? () => parentMenuStore.select('allowMouseEnter') : undefined,
    triggerElementRef,
    externalTree: floatingTreeRoot,
    isClosing: () => store.select('transitionStatus') === 'ending',
    // Chrome can drop the trigger's `mouseleave` during a fast pointer sweep,
    // leaving a stale submenu open (see #5152) — cancel from `mouseout` too.
    guardStaleOpen: true,
  });

  const click = useClick(floatingRootContext, {
    enabled: !disabled,
    event: 'mousedown',
    toggle: !openOnHover,
    ignoreMouse: openOnHover,
    stickIfOpen: false,
  });

  const localInteractionProps = click.reference ?? EMPTY_OBJECT;

  const rootTriggerProps = store.useState('triggerProps', true);
  delete rootTriggerProps.id;

  const state: MenuSubmenuTriggerState = { disabled, highlighted, open };

  const openMethod = store.useState('openMethod');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const openedByKeyboard =
    lastOpenChangeReason === REASONS.listNavigation || openMethod === 'keyboard';
  const shouldOmitExpanded = open && openedByKeyboard && platform.screenReader.voiceOver;
  const submenuKeyDownProps = submenuRootContext?.onTriggerKeyDown
    ? { onKeyDown: submenuRootContext.onTriggerKeyDown }
    : undefined;

  const element = useRenderElement('div', componentProps, {
    state,
    stateAttributesMapping: triggerOpenStateMapping,
    props: [
      localInteractionProps,
      hoverProps,
      rootTriggerProps,
      // FilterMenu.SubmenuRoot overrides the generic trigger handler because entry and exit
      // depend on both the parent and child menu orientations.
      submenuKeyDownProps,
      itemProps,
      // Opening a submenu changes the trigger's expanded state while the trigger still holds
      // focus, and VoiceOver announces that state change instead of the submenu item that focus
      // moves to a moment later, so the first item is never announced. Dropping the state while
      // the submenu is open avoids the announcement without claiming the submenu is collapsed;
      // `aria-haspopup` still conveys that the item opens a submenu.
      shouldOmitExpanded ? VOICE_OVER_EXPANDED_PROPS : undefined,
      {
        'aria-controls': popupId,
        // A virtually focused parent keeps real focus on its input, so the trigger must stay out
        // of the tab order.
        tabIndex: parentVirtualFocus || !(open || highlighted) ? -1 : 0,
        onBlur() {
          if (highlighted) {
            parentMenuStore.set('activeIndex', null);
          }
        },
      },
      elementProps,
      // `getItemProps` stays last so `useButton` keeps gating consumer handlers while disabled.
      getItemProps,
    ],
    ref: [forwardedRef, listItem.ref, itemRef, registerTrigger, handleTriggerElementRef],
  });

  return element;
});

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

export interface MenuSubmenuTriggerProps
  extends NonNativeButtonProps, BaseUIComponentProps<'div', MenuSubmenuTriggerState> {
  onClick?: BaseUIComponentProps<'div', MenuSubmenuTriggerState>['onClick'] | undefined;
  /**
   * Overrides the text label to use when the item is matched during keyboard text navigation.
   */
  label?: string | undefined;
  /**
   * @ignore
   */
  id?: string | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * How long to wait before the menu may be opened on hover. Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 100
   */
  delay?: number | undefined;
  /**
   * How long to wait before closing the menu that was opened on hover.
   * Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 0
   */
  closeDelay?: number | undefined;
  /**
   * Whether the menu should also open when the trigger is hovered.
   */
  openOnHover?: boolean | undefined;
}

export namespace MenuSubmenuTrigger {
  export type Props = MenuSubmenuTriggerProps;
  export type State = MenuSubmenuTriggerState;
}
