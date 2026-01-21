'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useOnFirstRender } from '@base-ui/utils/useOnFirstRender';
import { useScrollLock } from '@base-ui/utils/useScrollLock';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { fastComponent } from '@base-ui/utils/fastHooks';
import {
  FloatingEvents,
  FloatingTree,
  useDismiss,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
  useSyncedFloatingRootContext,
} from '../../floating-ui-react';
import { MenuRootContext, useMenuRootContext } from './MenuRootContext';
import { MenubarContext, useMenubarContext } from '../../menubar/MenubarContext';
import { TYPEAHEAD_RESET_MS } from '../../utils/constants';
import { useDirection } from '../../direction-provider/DirectionContext';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import type { FloatingUIOpenChangeDetails } from '../../utils/types';
import {
  createChangeEventDetails,
  type BaseUIChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import {
  ContextMenuRootContext,
  useContextMenuRootContext,
} from '../../context-menu/root/ContextMenuRootContext';
import { mergeProps } from '../../merge-props';
import { MenuStore, State } from '../store/MenuStore';
import { MenuHandle } from '../store/MenuHandle';
import {
  PayloadChildRenderFunction,
  useImplicitActiveTrigger,
  useOpenStateTransitions,
} from '../../utils/popups';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';

/**
 * Groups all parts of the menu.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuRoot = fastComponent(function MenuRoot<Payload>(props: MenuRoot.Props<Payload>) {
  const {
    children,
    open: openProp,
    onOpenChange,
    onOpenChangeComplete,
    defaultOpen = false,
    disabled: disabledProp = false,
    modal: modalProp,
    loopFocus = true,
    orientation = 'vertical',
    actionsRef,
    closeParentOnEsc = false,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null,
    highlightItemOnHover = true,
  } = props;

  const contextMenuContext = useContextMenuRootContext(true);
  const parentMenuRootContext = useMenuRootContext(true);
  const menubarContext = useMenubarContext(true);
  const isSubmenu = useMenuSubmenuRootContext();

  const parentFromContext: MenuParent = React.useMemo(() => {
    if (isSubmenu && parentMenuRootContext) {
      return {
        type: 'menu',
        store: parentMenuRootContext.store,
      };
    }

    if (menubarContext) {
      return {
        type: 'menubar',
        context: menubarContext,
      };
    }

    // Ensure this is not a Menu nested inside ContextMenu.Trigger.
    // ContextMenu parentContext is always undefined as ContextMenu.Root is instantiated with
    // <MenuRootContext.Provider value={undefined}>
    if (contextMenuContext && !parentMenuRootContext) {
      return {
        type: 'context-menu',
        context: contextMenuContext,
      };
    }

    return {
      type: undefined,
    };
  }, [contextMenuContext, parentMenuRootContext, menubarContext, isSubmenu]);

  const store = MenuStore.useStore(handle?.store, {
    open: defaultOpen,
    openProp,
    activeTriggerId: defaultTriggerIdProp,
    triggerIdProp,
    parent: parentFromContext,
  });

  // Support initially open state when uncontrolled
  useOnFirstRender(() => {
    if (openProp === undefined && store.state.open === false && defaultOpen === true) {
      store.update({
        open: true,
        activeTriggerId: defaultTriggerIdProp,
      });
    }
  });

  store.useControlledProp('openProp', openProp);
  store.useControlledProp('triggerIdProp', triggerIdProp);

  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  const floatingTreeRoot = store.useState('floatingTreeRoot');
  const floatingNodeIdFromContext = useFloatingNodeId(floatingTreeRoot);
  const floatingParentNodeIdFromContext = useFloatingParentNodeId();

  useIsoLayoutEffect(() => {
    if (contextMenuContext && !parentMenuRootContext) {
      // This is a context menu root.
      // It doesn't support detached triggers yet, so we have to sync the parent context manually.
      store.update({
        parent: {
          type: 'context-menu',
          context: contextMenuContext,
        },
        floatingNodeId: floatingNodeIdFromContext,
        floatingParentNodeId: floatingParentNodeIdFromContext,
      });
    } else if (parentMenuRootContext) {
      store.update({
        floatingNodeId: floatingNodeIdFromContext,
        floatingParentNodeId: floatingParentNodeIdFromContext,
      });
    }
  }, [
    contextMenuContext,
    parentMenuRootContext,
    floatingNodeIdFromContext,
    floatingParentNodeIdFromContext,
    store,
  ]);

  const open = store.useState('open');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const positionerElement = store.useState('positionerElement');
  const hoverEnabled = store.useState('hoverEnabled');
  const modal = store.useState('modal');
  const disabled = store.useState('disabled');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const parent = store.useState('parent');

  const activeIndex = store.useState('activeIndex');
  const payload = store.useState('payload') as Payload | undefined;
  const floatingParentNodeId = store.useState('floatingParentNodeId');

  const openEventRef = React.useRef<Event | null>(null);

  const nested = floatingParentNodeId != null;

  let floatingEvents: FloatingEvents;

  if (process.env.NODE_ENV !== 'production') {
    if (parent.type !== undefined && modalProp !== undefined) {
      console.warn(
        'Base UI: The `modal` prop is not supported on nested menus. It will be ignored.',
      );
    }
  }

  store.useSyncedValues({
    disabled: disabledProp,
    modal: parent.type === undefined ? modalProp : undefined,
    rootId: useId(),
  });

  const {
    openMethod,
    triggerProps: interactionTypeProps,
    reset: resetOpenInteractionType,
  } = useOpenInteractionType(open);

  useImplicitActiveTrigger(store);
  const { forceUnmount } = useOpenStateTransitions(open, store, () => {
    store.update({ allowMouseEnter: false, stickIfOpen: true });
    resetOpenInteractionType();
  });

  const allowOutsidePressDismissalRef = React.useRef(parent.type !== 'context-menu');
  const allowOutsidePressDismissalTimeout = useTimeout();

  React.useEffect(() => {
    if (!open) {
      openEventRef.current = null;
    }

    if (parent.type !== 'context-menu') {
      return;
    }

    if (!open) {
      allowOutsidePressDismissalTimeout.clear();
      allowOutsidePressDismissalRef.current = false;
      return;
    }

    // With `mousedown` outside press events and long press touch input, there
    // needs to be a grace period after opening to ensure the dismissal event
    // doesn't fire immediately after open.
    allowOutsidePressDismissalTimeout.start(500, () => {
      allowOutsidePressDismissalRef.current = true;
    });
  }, [allowOutsidePressDismissalTimeout, open, parent.type]);

  useScrollLock(
    open && modal && lastOpenChangeReason !== REASONS.triggerHover && openMethod !== 'touch',
    positionerElement,
  );

  useIsoLayoutEffect(() => {
    if (!open && !hoverEnabled) {
      store.set('hoverEnabled', true);
    }
  }, [open, hoverEnabled, store]);

  const allowTouchToCloseRef = React.useRef(true);
  const allowTouchToCloseTimeout = useTimeout();

  const setOpen = useStableCallback(
    (
      nextOpen: boolean,
      eventDetails: Omit<MenuRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
    ) => {
      const reason = eventDetails.reason;

      if (
        open === nextOpen &&
        eventDetails.trigger === activeTriggerElement &&
        lastOpenChangeReason === reason
      ) {
        return;
      }

      (eventDetails as MenuRoot.ChangeEventDetails).preventUnmountOnClose = () => {
        store.set('preventUnmountingOnClose', true);
      };

      // Do not immediately reset the activeTriggerId to allow
      // exit animations to play and focus to be returned correctly.
      if (!nextOpen && eventDetails.trigger == null) {
        eventDetails.trigger = activeTriggerElement ?? undefined;
      }

      onOpenChange?.(nextOpen, eventDetails as MenuRoot.ChangeEventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      const details: FloatingUIOpenChangeDetails = {
        open: nextOpen,
        nativeEvent: eventDetails.event,
        reason: eventDetails.reason,
        nested,
      };

      floatingEvents?.emit('openchange', details);

      const nativeEvent = eventDetails.event as Event;
      if (
        nextOpen === false &&
        nativeEvent?.type === 'click' &&
        (nativeEvent as PointerEvent).pointerType === 'touch' &&
        !allowTouchToCloseRef.current
      ) {
        return;
      }

      // Workaround `enableFocusInside` in Floating UI setting `tabindex=0` of a non-highlighted
      // option upon close when tabbing out due to `keepMounted=true`:
      // https://github.com/floating-ui/floating-ui/pull/3004/files#diff-962a7439cdeb09ea98d4b622a45d517bce07ad8c3f866e089bda05f4b0bbd875R194-R199
      // This otherwise causes options to retain `tabindex=0` incorrectly when the popup is closed
      // when tabbing outside.
      if (!nextOpen && activeIndex !== null) {
        const activeOption = store.context.itemDomElements.current[activeIndex];
        // Wait for Floating UI's focus effect to have fired
        queueMicrotask(() => {
          activeOption?.setAttribute('tabindex', '-1');
        });
      }

      // Prevent the menu from closing on mobile devices that have a delayed click event.
      // In some cases the menu, when tapped, will fire the focus event first and then the click event.
      // Without this guard, the menu will close immediately after opening.
      if (nextOpen && reason === REASONS.triggerFocus) {
        allowTouchToCloseRef.current = false;
        allowTouchToCloseTimeout.start(300, () => {
          allowTouchToCloseRef.current = true;
        });
      } else {
        allowTouchToCloseRef.current = true;
        allowTouchToCloseTimeout.clear();
      }

      const isKeyboardClick =
        (reason === REASONS.triggerPress || reason === REASONS.itemPress) &&
        (nativeEvent as MouseEvent).detail === 0 &&
        nativeEvent?.isTrusted;
      const isDismissClose = !nextOpen && (reason === REASONS.escapeKey || reason == null);

      const updatedState: Partial<State<Payload>> = { open: nextOpen, openChangeReason: reason };
      openEventRef.current = eventDetails.event ?? null;

      // If a popup is closing, the `trigger` may be null.
      // We want to keep the previous value so that exit animations are played and focus is returned correctly.
      const newTriggerId = eventDetails.trigger?.id ?? null;
      if (newTriggerId || nextOpen) {
        updatedState.activeTriggerId = newTriggerId;
        updatedState.activeTriggerElement = eventDetails.trigger ?? null;
      }

      store.update(updatedState);

      if (
        parent.type === 'menubar' &&
        (reason === REASONS.triggerFocus ||
          reason === REASONS.focusOut ||
          reason === REASONS.triggerHover ||
          reason === REASONS.listNavigation ||
          reason === REASONS.siblingOpen)
      ) {
        store.set('instantType', 'group');
      } else if (isKeyboardClick || isDismissClose) {
        store.set('instantType', isKeyboardClick ? 'click' : 'dismiss');
      } else {
        store.set('instantType', undefined);
      }
    },
  );

  const createMenuEventDetails = React.useCallback(
    (reason: MenuRoot.ChangeEventReason) => {
      const details: MenuRoot.ChangeEventDetails =
        createChangeEventDetails<MenuRoot.ChangeEventReason>(reason) as MenuRoot.ChangeEventDetails;
      details.preventUnmountOnClose = () => {
        store.set('preventUnmountingOnClose', true);
      };

      return details;
    },
    [store],
  );

  const handleImperativeClose = React.useCallback(() => {
    store.setOpen(false, createMenuEventDetails(REASONS.imperativeAction));
  }, [store, createMenuEventDetails]);

  React.useImperativeHandle(
    actionsRef,
    () => ({ unmount: forceUnmount, close: handleImperativeClose }),
    [forceUnmount, handleImperativeClose],
  );

  let ctx: ContextMenuRootContext | undefined;
  if (parent.type === 'context-menu') {
    ctx = parent.context;
  }

  React.useImperativeHandle<HTMLElement | null, HTMLElement | null>(
    ctx?.positionerRef,
    () => positionerElement,
    [positionerElement],
  );

  React.useImperativeHandle(ctx?.actionsRef, () => ({ setOpen }), [setOpen]);

  const floatingRootContext = useSyncedFloatingRootContext({
    popupStore: store,
    onOpenChange: setOpen,
  });

  floatingEvents = floatingRootContext.context.events;

  React.useEffect(() => {
    const handleSetOpenEvent = ({
      open: nextOpen,
      eventDetails,
    }: {
      open: boolean;
      eventDetails: MenuRoot.ChangeEventDetails;
    }) => setOpen(nextOpen, eventDetails);

    floatingEvents.on('setOpen', handleSetOpenEvent);

    return () => {
      floatingEvents?.off('setOpen', handleSetOpenEvent);
    };
  }, [floatingEvents, setOpen]);

  const dismiss = useDismiss(floatingRootContext, {
    enabled: !disabled,
    bubbles: { escapeKey: closeParentOnEsc && parent.type === 'menu' },
    outsidePress() {
      if (parent.type !== 'context-menu' || openEventRef.current?.type === 'contextmenu') {
        return true;
      }

      return allowOutsidePressDismissalRef.current;
    },
    externalTree: nested ? floatingTreeRoot : undefined,
  });

  const role = useRole(floatingRootContext, {
    role: 'menu',
  });

  const direction = useDirection();

  const setActiveIndex = React.useCallback(
    (index: number | null) => {
      if (store.select('activeIndex') === index) {
        return;
      }
      store.set('activeIndex', index);
    },
    [store],
  );

  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: !disabled,
    listRef: store.context.itemDomElements,
    activeIndex,
    nested: parent.type !== undefined,
    loopFocus,
    orientation,
    parentOrientation: parent.type === 'menubar' ? parent.context.orientation : undefined,
    rtl: direction === 'rtl',
    disabledIndices: EMPTY_ARRAY,
    onNavigate: setActiveIndex,
    openOnArrowKeyDown: parent.type !== 'context-menu',
    externalTree: nested ? floatingTreeRoot : undefined,
    focusItemOnHover: highlightItemOnHover,
  });

  const onTypingChange = React.useCallback(
    (nextTyping: boolean) => {
      store.context.typingRef.current = nextTyping;
    },
    [store],
  );

  const typeahead = useTypeahead(floatingRootContext, {
    listRef: store.context.itemLabels,
    activeIndex,
    resetMs: TYPEAHEAD_RESET_MS,
    onMatch: (index) => {
      if (open && index !== activeIndex) {
        store.set('activeIndex', index);
      }
    },
    onTypingChange,
  });

  const { getReferenceProps, getFloatingProps, getItemProps, getTriggerProps } = useInteractions([
    dismiss,
    role,
    listNavigation,
    typeahead,
  ]);

  const activeTriggerProps = React.useMemo(() => {
    const mergedProps = mergeProps(
      getReferenceProps(),
      {
        onMouseMove() {
          store.set('allowMouseEnter', true);
        },
      },
      interactionTypeProps,
    );

    delete mergedProps.role;
    return mergedProps;
  }, [getReferenceProps, store, interactionTypeProps]);

  const inactiveTriggerProps = React.useMemo(() => {
    const triggerProps = getTriggerProps();
    if (!triggerProps) {
      return triggerProps;
    }

    const mergedProps = mergeProps(triggerProps, interactionTypeProps);
    delete mergedProps.role;
    delete mergedProps['aria-controls'];
    return mergedProps;
  }, [getTriggerProps, interactionTypeProps]);

  const popupProps = React.useMemo(
    () =>
      getFloatingProps({
        onMouseMove() {
          store.set('allowMouseEnter', true);
          if (parent.type === 'menu') {
            store.set('hoverEnabled', false);
          }
        },
        onClick() {
          if (store.select('hoverEnabled')) {
            store.set('hoverEnabled', false);
          }
        },
        onKeyDown(event) {
          // The Menubar's CompositeRoot captures keyboard events via
          // event delegation. This works well when Menu.Root is nested inside Menubar,
          // but with detached triggers we need to manually forward the event to the CompositeRoot.
          const relay = store.select('keyboardEventRelay');
          if (relay && !event.isPropagationStopped()) {
            relay(event);
          }
        },
      }),
    [getFloatingProps, parent.type, store],
  );

  const itemProps = React.useMemo(() => getItemProps(), [getItemProps]);

  store.useSyncedValues({
    floatingRootContext,
    activeTriggerProps,
    inactiveTriggerProps,
    popupProps,
    itemProps,
  });

  const context: MenuRootContext<Payload> = React.useMemo(
    () => ({
      store,
      parent: parentFromContext,
    }),
    [store, parentFromContext],
  );

  const content = (
    <MenuRootContext.Provider value={context as MenuRootContext}>
      {typeof children === 'function' ? children({ payload }) : children}
    </MenuRootContext.Provider>
  );

  if (parent.type === undefined || parent.type === 'context-menu') {
    // set up a FloatingTree to provide the context to nested menus
    return <FloatingTree externalTree={floatingTreeRoot}>{content}</FloatingTree>;
  }

  return content;
});

export interface MenuRootProps<Payload = unknown> {
  /**
   * Whether the menu is initially open.
   *
   * To render a controlled menu, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Whether to loop keyboard focus back to the first item
   * when the end of the list is reached while using the arrow keys.
   * @default true
   */
  loopFocus?: boolean | undefined;
  /**
   * Whether moving the pointer over items should highlight them.
   * Disabling this prop allows CSS `:hover` to be differentiated from the `:focus` (`data-highlighted`) state.
   * @default true
   */
  highlightItemOnHover?: boolean | undefined;
  /**
   * Determines if the menu enters a modal state when open.
   * - `true`: user interaction is limited to the menu: document page scroll is locked and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * @default true
   */
  modal?: boolean | undefined;
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: MenuRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Event handler called after any animations complete when the menu is closed.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * Whether the menu is currently open.
   */
  open?: boolean | undefined;
  /**
   * The visual orientation of the menu.
   * Controls whether roving focus uses up/down or left/right arrow keys.
   * @default 'vertical'
   */
  orientation?: MenuRoot.Orientation | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * When in a submenu, determines whether pressing the Escape key
   * closes the entire menu, or only the current child menu.
   * @default false
   */
  closeParentOnEsc?: boolean | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the menu will not be unmounted when closed.
   *    Instead, the `unmount` function must be called to unmount the menu manually.
   *   Useful when the menu's animation is controlled by an external library.
   * - `close`: When specified, the menu can be closed imperatively.
   */
  actionsRef?: React.RefObject<MenuRoot.Actions | null> | undefined;
  /**
   * ID of the trigger that the popover is associated with.
   * This is useful in conjunction with the `open` prop to create a controlled popover.
   * There's no need to specify this prop when the popover is uncontrolled (i.e. when the `open` prop is not set).
   */
  triggerId?: (string | null) | undefined;
  /**
   * ID of the trigger that the popover is associated with.
   * This is useful in conjunction with the `defaultOpen` prop to create an initially open popover.
   */
  defaultTriggerId?: (string | null) | undefined;
  /**
   * A handle to associate the menu with a trigger.
   * If specified, allows external triggers to control the menu's open state.
   */
  handle?: MenuHandle<Payload> | undefined;
  /**
   * The content of the popover.
   * This can be a regular React node or a render function that receives the `payload` of the active trigger.
   */
  children?: React.ReactNode | PayloadChildRenderFunction<Payload>;
}

export interface MenuRootActions {
  unmount: () => void;
  close: () => void;
}

export type MenuRootChangeEventReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.focusOut
  | typeof REASONS.listNavigation
  | typeof REASONS.escapeKey
  | typeof REASONS.itemPress
  | typeof REASONS.closePress
  | typeof REASONS.siblingOpen
  | typeof REASONS.cancelOpen
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type MenuRootChangeEventDetails = BaseUIChangeEventDetails<MenuRoot.ChangeEventReason> & {
  preventUnmountOnClose(): void;
};

export type MenuRootOrientation = 'horizontal' | 'vertical';

export type MenuParent =
  | {
      type: 'menu';
      store: MenuStore<unknown>;
    }
  | {
      type: 'menubar';
      context: MenubarContext;
    }
  | {
      type: 'context-menu';
      context: ContextMenuRootContext;
    }
  | {
      type: 'nested-context-menu';
      context: ContextMenuRootContext;
      menuContext: MenuRootContext;
    }
  | {
      type: undefined;
    };

export namespace MenuRoot {
  export type Props<Payload = unknown> = MenuRootProps<Payload>;
  export type Actions = MenuRootActions;
  export type ChangeEventReason = MenuRootChangeEventReason;
  export type ChangeEventDetails = MenuRootChangeEventDetails;
  export type Orientation = MenuRootOrientation;
}
