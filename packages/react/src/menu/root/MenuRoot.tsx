'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import { fastComponent } from '@base-ui/utils/fastHooks';
import { useBaseUiId } from '../../internals/useBaseUiId';
import {
  FloatingTree,
  useDismiss,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useListNavigation,
  useTypeahead,
  useSyncedFloatingRootContext,
} from '../../floating-ui-react';
import { MenuRootContext, useMenuRootContext } from './MenuRootContext';
import { MenubarContext, useMenubarContext } from '../../menubar/MenubarContext';
import { TYPEAHEAD_RESET_MS } from '../../internals/constants';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import {
  createChangeEventDetails,
  type BaseUIChangeEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  ContextMenuRootContext,
  useContextMenuRootContext,
} from '../../context-menu/root/ContextMenuRootContext';
import { mergeProps, mergePropsN } from '../../merge-props';
import { useAnimationsFinished } from '../../internals/useAnimationsFinished';
import {
  isCrossOrientationOpenKey,
  isMainOrientationKey,
} from '../../floating-ui-react/utils/listNavigation';
import type { BaseUIEvent, HTMLProps } from '../../internals/types';
import { MenuStore, type State as MenuStoreState } from '../store/MenuStore';
import { MenuHandle } from '../store/MenuHandle';
import {
  attachPreventUnmountOnClose,
  FOCUSABLE_POPUP_PROPS,
  PayloadChildRenderFunction,
  createPopupOpenState,
  PopupHandleAttachment,
  useImplicitActiveTrigger,
  useOpenStateTransitions,
  usePopupInteractionProps,
} from '../../utils/popups';

interface MenuRootInternalProps<Payload> extends MenuRoot.Props<Payload> {
  /**
   * @ignore
   * Marks this root as a submenu of the enclosing menu.
   */
  isSubmenu?: boolean | undefined;
  /**
   * @ignore
   * Keeps real focus on an element inside the popup and navigates the list with
   * `aria-activedescendant`.
   */
  virtualFocus?: boolean | undefined;
}

/**
 * Groups all parts of the menu.
 * Doesn't render its own HTML element.
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
    isSubmenu = false,
    virtualFocus = false,
  } = props as MenuRootInternalProps<Payload>;

  const contextMenuContext = useContextMenuRootContext(true);
  const parentMenuRootContext = useMenuRootContext(true);
  const menubarContext = useMenubarContext(true);
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

  const rootId = useBaseUiId();
  // React 17 resolves generated ids in an effect, so they must be read live rather than captured
  // in a state initializer.
  const defaultFloatingId = useBaseUiId();
  const [customFloatingId, setFloatingId] = React.useState<string | undefined>(undefined);
  const floatingId = customFloatingId ?? defaultFloatingId;
  const floatingParentNodeIdFromContext = useFloatingParentNodeId();

  const parentMenuStore = parentFromContext.type === 'menu' ? parentFromContext.store : undefined;
  // An initially open submenu should animate in only when the user watches it appear, i.e. when
  // its subtree mounts because the parent popup is playing its own enter transition. A parent
  // that was `defaultOpen` at page load never passes through `'starting'`, and under a
  // `keepMounted` parent these initializers run at page load while the parent's status is still
  // `undefined` — in both cases the submenu is page-load content that must not animate. Gated on
  // being open at mount so a closed submenu doesn't seed `instantType` it would never clear. Read
  // during the first render only — consumed exclusively by first-render initializers below
  // (`useState` and the store's initial state).
  const animateInitialOpen =
    (openProp ?? defaultOpen) && parentMenuStore?.state.transitionStatus === 'starting';

  // Mirror an instantly-opened parent (e.g. keyboard click) so `[data-instant]` styling
  // suppresses the enter transition on both popups or neither. Captured once —
  // `animateInitialOpen` is only meaningful during the first render.
  const seededInstantType = useRefWithInit(() =>
    animateInitialOpen ? parentMenuStore?.state.instantType : undefined,
  ).current;

  const store = useMenuRootStore<Payload>(
    {
      open: defaultOpen,
      openProp,
      activeTriggerId: defaultTriggerIdProp,
      triggerIdProp,
      parent: parentFromContext,
      disabled: disabledProp,
      highlightItemOnHover,
      modal: parentFromContext.type === undefined ? modalProp : undefined,
      rootId,
      instantType: seededInstantType,
    },
    floatingId,
    floatingParentNodeIdFromContext != null,
  );

  // Read by submenu triggers, and not fixed at construction (React 17 ids, `Menu.Popup` id).
  store.useSyncedValue('floatingId', floatingId);

  store.useControlledProp('openProp', openProp);
  store.useControlledProp('triggerIdProp', triggerIdProp);

  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  const floatingTreeRoot = store.useState('floatingTreeRoot');
  const floatingNodeIdFromContext = useFloatingNodeId(floatingTreeRoot);

  const open = store.useState('open');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const positionerElement = store.useState('positionerElement');
  const hoverEnabled = store.useState('hoverEnabled');
  const disabled = store.useState('disabled');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const openedByKeyboard = store.useState('openedByKeyboard');
  const parent = store.useState('parent');

  const activeIndex = store.useState('activeIndex');
  const payload = store.useState('payload') as Payload | undefined;
  const floatingParentNodeId = store.useState('floatingParentNodeId');

  const openEventRef = React.useRef<Event | null>(null);
  const allowOutsidePressDismissalRef = React.useRef(parent.type !== 'context-menu');
  const allowOutsidePressDismissalTimeout = useTimeout();
  const allowTouchToCloseRef = React.useRef(true);
  const allowTouchToCloseTimeout = useTimeout();

  const nested = floatingParentNodeId != null;

  if (process.env.NODE_ENV !== 'production') {
    if (parent.type !== undefined && modalProp !== undefined) {
      console.warn(
        'Base UI: The `modal` prop is not supported on nested menus. It will be ignored.',
      );
    }
  }

  const { openMethod, triggerProps: interactionTypeProps } = useOpenInteractionType(open);

  store.useSyncedValues({
    disabled: disabledProp,
    highlightItemOnHover,
    modal: parent.type === undefined ? modalProp : undefined,
    openMethod,
    rootId,
    virtualFocus,
  });

  useImplicitActiveTrigger(store);
  const { forceUnmount, transitionStatus } = useOpenStateTransitions(
    open,
    store,
    () => {
      store.set('allowMouseEnter', false);
    },
    animateInitialOpen,
  );

  const runOnceAnimationsFinish = useAnimationsFinished(store.context.popupRef);

  // An inherited `instantType` is only for the initial reveal. A later controlled `open` flip
  // bypasses `setOpen`, so nothing would reset it and `[data-instant]` would wrongly suppress
  // every subsequent transition. Clear it once the enter phase settles, unless an interactive
  // open change already replaced it.
  React.useEffect(() => {
    if (seededInstantType === undefined) {
      return undefined;
    }

    const clearSeededInstantType = () => {
      if (store.state.instantType === seededInstantType) {
        store.set('instantType', undefined);
      }
    };

    // A controlled close can interrupt the initial enter before the animations-finished cleanup
    // below fires (its abort cancels the pending callback, and a closed popup schedules no new
    // one). Nothing is left to protect once closing starts — the exit's suppression was already
    // decided at its trigger commit — so clear now or the next reopen renders a stale
    // `[data-instant]`.
    if (!open) {
      clearSeededInstantType();
      return undefined;
    }

    if (transitionStatus !== undefined) {
      return undefined;
    }

    // With no popup element (e.g. its subtree is suspended or waiting on data), there is no
    // enter transition to protect, and `useAnimationsFinished` would return without invoking the
    // callback — a ref assignment alone would never rerun this effect, leaving the seed stuck.
    // Clear immediately: a popup that appears after the reveal settles is page-load-like content.
    if (store.context.popupRef.current == null) {
      clearSeededInstantType();
      return undefined;
    }

    const abortController = new AbortController();
    runOnceAnimationsFinish(clearSeededInstantType, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [seededInstantType, open, transitionStatus, runOnceAnimationsFinish, store]);

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

  useIsoLayoutEffect(() => {
    if (!open && !hoverEnabled) {
      store.set('hoverEnabled', true);
    }
  }, [open, hoverEnabled, store]);

  const setOpen = useStableCallback(
    (
      nextOpen: boolean,
      eventDetails: Omit<MenuRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
    ) => {
      const reason = eventDetails.reason;

      // Read the store directly, as relayed tree events and stale hover timers can request
      // a close after the state changed but before this component re-rendered.
      if (!nextOpen && !store.select('open')) {
        return;
      }

      if (
        open === nextOpen &&
        eventDetails.trigger === activeTriggerElement &&
        lastOpenChangeReason === reason
      ) {
        return;
      }

      const shouldPreventUnmountOnClose = attachPreventUnmountOnClose(
        eventDetails as MenuRoot.ChangeEventDetails,
      );

      // Do not immediately reset the activeTriggerId to allow
      // exit animations to play and focus to be returned correctly.
      if (!nextOpen && eventDetails.trigger == null) {
        eventDetails.trigger = activeTriggerElement ?? undefined;
      }

      onOpenChange?.(nextOpen, eventDetails as MenuRoot.ChangeEventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      store.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);

      const nativeEvent = eventDetails.event as Event;
      if (
        nextOpen === false &&
        nativeEvent?.type === 'click' &&
        (nativeEvent as PointerEvent).pointerType === 'touch' &&
        !allowTouchToCloseRef.current
      ) {
        return;
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

      // Keyboard and assistive-technology activations produce `detail === 0` clicks;
      // mouse-gesture clicks (including the synthesized drag-release click from
      // `useMenuItemCommonProps`) carry `detail >= 1`.
      const isKeyboardClick =
        (reason === REASONS.triggerPress || reason === REASONS.itemPress) &&
        (nativeEvent as MouseEvent).detail === 0;
      const isDismissClose = !nextOpen && (reason === REASONS.escapeKey || reason == null);
      openEventRef.current = eventDetails.event;

      const popupOpenState = createPopupOpenState(
        store.state,
        nextOpen,
        eventDetails.trigger,
        shouldPreventUnmountOnClose(),
      ) as ReturnType<typeof createPopupOpenState> & {
        openChangeReason: MenuRoot.ChangeEventReason;
        instantType: MenuStoreState<Payload>['instantType'];
      };

      popupOpenState.openChangeReason = reason;

      if (
        parent.type === 'menubar' &&
        (reason === REASONS.triggerFocus ||
          reason === REASONS.focusOut ||
          reason === REASONS.triggerHover ||
          reason === REASONS.listNavigation ||
          reason === REASONS.siblingOpen)
      ) {
        popupOpenState.instantType = 'group';
      } else if (isKeyboardClick || isDismissClose) {
        popupOpenState.instantType = isKeyboardClick ? 'click' : 'dismiss';
      } else {
        popupOpenState.instantType = undefined;
      }

      // `instantType` must land in the same update that mounts the popup subtree: in React 17
      // legacy mode this `update` can flush synchronously, and a separate `instantType` write
      // after it would come too late for an initially open submenu seeding its own store from
      // this one during that flush.
      store.update(popupOpenState);
    },
  );

  const floatingRootContext = useSyncedFloatingRootContext({
    popupStore: store,
    floatingRootContext: store.state.floatingRootContext,
    floatingId,
    nested: floatingParentNodeIdFromContext != null,
    onOpenChange: setOpen,
  });

  const floatingEvents = floatingRootContext.context.events;

  // Registered in a layout effect (not a passive one) so `setOpen` emits from imperative
  // `MenuHandle.open()` calls made in the same commit this root mounts — e.g. from another layout
  // effect during a route-transition handoff — are received instead of being silently dropped.
  useIsoLayoutEffect(() => {
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

  const handleImperativeClose = React.useCallback(() => {
    store.setOpen(false, createChangeEventDetails(REASONS.imperativeAction));
  }, [store]);

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

  const direction = useDirection();
  const focusItemOnOpen = (parent.type !== undefined && openedByKeyboard) || undefined;

  const listNavigation = useListNavigation(floatingRootContext, {
    id: floatingId,
    enabled: !disabled,
    listRef: store.context.itemDomElements,
    activeIndex,
    virtual: virtualFocus,
    loopFocus,
    // Virtual focus opens with the input focused and nothing highlighted, so the first arrow key
    // enters the list from the top rather than moving off a seeded item.
    focusItemOnOpen: virtualFocus ? false : focusItemOnOpen,
    allowEscape: virtualFocus && loopFocus,
    orientation,
    rtl: direction === 'rtl',
    disabledIndices: EMPTY_ARRAY,
    onNavigate(nextActiveIndex) {
      store.set('activeIndex', nextActiveIndex);
    },
    openOnArrowKeyDown: parent.type !== 'context-menu',
    focusItemOnHover: highlightItemOnHover,
  });

  const onTyping = React.useCallback(
    (nextTyping: boolean) => {
      store.context.typingRef.current = nextTyping;
    },
    [store],
  );

  const typeahead = useTypeahead(floatingRootContext, {
    // Typing goes to the input when it owns focus, so typeahead would race the query.
    enabled: !disabled && !virtualFocus,
    listRef: store.context.itemLabels,
    elementsRef: store.context.itemDomElements,
    activeIndex,
    resetMs: TYPEAHEAD_RESET_MS,
    onMatch: (index) => {
      if (open && index !== activeIndex) {
        store.set('activeIndex', index);
      }
    },
    onTyping,
  });

  // A menubar whose orientation matches this menu's shares its arrow keys with the menubar's own
  // roving focus. The menubar owns its main axis, so the trigger must leave those keys to the
  // composite and open on the cross-axis key instead.
  const menubarOrientation = parent.type === 'menubar' ? parent.context.orientation : undefined;
  const menubarTriggerProps = React.useMemo<HTMLProps>(() => {
    if (menubarOrientation !== orientation) {
      return EMPTY_OBJECT;
    }

    return {
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
        if (isMainOrientationKey(event.key, menubarOrientation)) {
          event.preventBaseUIHandler();
          return;
        }

        if (
          !store.select('open') &&
          isCrossOrientationOpenKey(event.key, menubarOrientation, direction === 'rtl')
        ) {
          event.preventBaseUIHandler();
          event.preventDefault();
          event.stopPropagation();
          store.setOpen(
            true,
            createChangeEventDetails(
              REASONS.listNavigation,
              event.nativeEvent,
              event.currentTarget,
            ),
          );
        }
      },
    };
  }, [menubarOrientation, orientation, store, direction]);

  // Under virtual focus an element inside the popup holds real focus, so it takes the
  // navigation's reference props (`aria-activedescendant` and the key handling) and the trigger
  // keeps only the props that open the menu.
  const openTriggerProps = React.useMemo(() => {
    if (!virtualFocus) {
      return listNavigation.reference;
    }

    const triggerProps = { ...listNavigation.trigger };
    // Focusing the trigger while the menu is open must not seed the virtual highlight. This can
    // happen before a pointer press closes the menu in Safari.
    delete triggerProps.onFocus;
    return triggerProps;
  }, [virtualFocus, listNavigation.reference, listNavigation.trigger]);
  const inputProps = virtualFocus ? (listNavigation.reference ?? EMPTY_OBJECT) : EMPTY_OBJECT;

  const activeTriggerProps = React.useMemo(() => {
    const mergedProps = mergePropsN([
      typeahead.reference,
      openTriggerProps,
      dismiss.reference,
      {
        onMouseMove() {
          store.set('allowMouseEnter', true);
        },
      },
      menubarTriggerProps,
      interactionTypeProps,
    ]);

    mergedProps['aria-haspopup'] = 'menu';
    mergedProps['aria-expanded'] = open;

    return mergedProps;
  }, [
    store,
    typeahead.reference,
    openTriggerProps,
    dismiss.reference,
    menubarTriggerProps,
    interactionTypeProps,
    open,
  ]);

  const inactiveTriggerProps = React.useMemo(() => {
    const mergedProps = mergeProps(
      listNavigation.trigger,
      dismiss.trigger,
      menubarTriggerProps,
      interactionTypeProps,
    );

    mergedProps['aria-haspopup'] = 'menu';
    mergedProps['aria-expanded'] = false;

    return mergedProps;
  }, [listNavigation.trigger, dismiss.trigger, menubarTriggerProps, interactionTypeProps]);

  // The initial render has no store subscribers yet. Seed these props before triggers render so
  // the synchronization effect below doesn't make every trigger render twice in the first commit.
  useRefWithInit(() => {
    store.update({ inactiveTriggerProps });
    return null;
  });

  const popupProps = React.useMemo(
    () =>
      mergeProps(
        FOCUSABLE_POPUP_PROPS,
        {
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
          onKeyDown(event: React.KeyboardEvent) {
            // The Menubar's CompositeRoot captures keyboard events via
            // event delegation. This works well when Menu.Root is nested inside Menubar,
            // but with detached triggers we need to manually forward the event to the CompositeRoot.
            const relay = store.select('keyboardEventRelay');
            if (relay && !event.isPropagationStopped()) {
              relay(event);
            }
          },
        },
        typeahead.floating,
        listNavigation.floating,
        dismiss.floating,
      ),
    [typeahead.floating, listNavigation.floating, dismiss.floating, store, parent.type],
  );

  const itemProps = listNavigation.item ?? EMPTY_OBJECT;

  usePopupInteractionProps(store, {
    floatingRootContext,
    activeTriggerProps,
    inactiveTriggerProps,
    popupProps,
    itemProps,
    inputProps,
  });

  const context: MenuRootContext<Payload> = React.useMemo(
    () => ({
      store,
      type: isSubmenu ? 'submenu' : 'menu',
      parent: parentFromContext,
      orientation,
      floatingId,
      setFloatingId,
    }),
    [store, isSubmenu, parentFromContext, orientation, floatingId],
  );

  const menu = (
    <MenuRootContext.Provider value={context as MenuRootContext}>
      {handle && <PopupHandleAttachment handle={handle} store={store} />}
      {typeof children === 'function' ? children({ payload }) : children}
    </MenuRootContext.Provider>
  );

  let content = menu;

  if (parent.type === undefined || parent.type === 'context-menu') {
    // set up a FloatingTree to provide the context to nested menus
    content = <FloatingTree externalTree={floatingTreeRoot}>{content}</FloatingTree>;
  }

  return content;
});

function useMenuRootStore<Payload>(
  initialState: Partial<MenuStoreState<Payload>>,
  floatingId: string | undefined,
  nested: boolean,
) {
  // The store is owned by this Root instance and created exactly once. It is not tied to the handle:
  // the handle attaches to it, so swapping the handle re-attaches rather than recreating state.
  // Default values are only initial values; controlled values and root state are synced after creation.
  // Unlike other popups, Menu wires its floating root context separately (it relays open changes
  // through an event).
  const store = useRefWithInit(
    () => new MenuStore<Payload>(initialState, floatingId, nested),
  ).current;

  return store;
}

export interface MenuRootState {}

export type MenuRootProps<Payload = unknown> = MenuRootBaseProps<Payload>;

interface MenuRootBaseProps<Payload = unknown> {
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
   *
   * On touch devices, a `true` modal blocks outside taps but leaves the page scrollable unless the popup spans nearly the full viewport width, matching native iOS behavior.
   *
   * Nested menus ignore this prop, and menus opened by hover are never modal.
   * @default true
   */
  modal?: boolean | undefined;
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: MenuRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Event handler called after any animations complete when the menu is opened or closed.
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
   * - `unmount`: Manually unmounts the menu.
   *   Call this after any externally controlled closing animation finishes.
   * - `close`: When specified, the menu can be closed imperatively.
   */
  actionsRef?: React.RefObject<MenuRoot.Actions | null> | undefined;
  /**
   * ID of the trigger that the menu is associated with.
   * This is useful in conjunction with the `open` prop to create a controlled menu.
   * There's no need to specify this prop when the menu is uncontrolled (that is, when the `open` prop is not set).
   */
  triggerId?: string | null | undefined;
  /**
   * ID of the trigger that the menu is associated with.
   * This is useful in conjunction with the `defaultOpen` prop to create an initially open menu.
   */
  defaultTriggerId?: string | null | undefined;
  /**
   * A handle to associate the menu with a trigger.
   * If specified, allows external triggers to control the menu's open state.
   */
  handle?: MenuHandle<Payload> | undefined;
  /**
   * The content of the menu.
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
  export type State = MenuRootState;
  export type Props<Payload = unknown> = MenuRootProps<Payload>;
  export type Actions = MenuRootActions;
  export type ChangeEventReason = MenuRootChangeEventReason;
  export type ChangeEventDetails = MenuRootChangeEventDetails;
  export type Orientation = MenuRootOrientation;
}

/** `MenuRoot` with the internal props visible, which the public signature hides. */
export const MenuRootInternal = MenuRoot as <Payload>(
  props: MenuRootInternalProps<Payload>,
) => React.JSX.Element;
