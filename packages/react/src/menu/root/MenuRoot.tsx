'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useBaseUiId } from '@base-ui/react/internals/useBaseUiId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useControlled } from '@base-ui/utils/useControlled';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import { fastComponent } from '@base-ui/utils/fastHooks';
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
import { mergeProps } from '../../merge-props';
import { useAnimationsFinished } from '../../internals/useAnimationsFinished';
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
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import type { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRoot';
import {
  MenuFilterIntegrationContext,
  useMenuFilterIntegration,
} from './MenuFilterIntegrationContext';
import {
  MenuDerivedItemsContext,
  type MenuDerivedItemsContext as MenuDerivedItemsContextValue,
} from './MenuDerivedItemsContext';

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
    items,
    filter: filterProp,
    inputValue: inputValueProp,
    defaultInputValue = '',
    onInputValueChange,
  } = props;

  // Filterability comes from the entrypoint, not the prop: only `filter-menu` supplies the
  // integration. That keeps the filtering implementation out of an ordinary menu's bundle, and
  // makes the mode fixed for the menu's lifetime without a mount-time latch.
  const filterIntegration = useMenuFilterIntegration();
  const filterable = filterIntegration !== null;
  const [inputValue, setInputValue] = useControlled({
    controlled: inputValueProp,
    default: defaultInputValue,
    name: 'Menu',
    state: 'inputValue',
  });

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
      filterable,
      filterIntegration,
      rootId,
      instantType: seededInstantType,
    },
    floatingId,
    floatingParentNodeIdFromContext != null,
  );

  const handleInputValueChange = useStableCallback(
    (nextInputValue: string, eventDetails: MenuRoot.InputValueChangeEventDetails) => {
      onInputValueChange?.(nextInputValue, eventDetails);

      if (eventDetails.isCanceled || nextInputValue === inputValue) {
        return;
      }

      setInputValue(nextInputValue);
      // Filtering compacts the list, so a numeric active index would point at a different item
      // or at none at all. Return virtual focus to the input instead.
      store.set('activeIndex', null);
    },
  );

  // `items` is the data source for the list when provided: a function child of `Menu.List`
  // renders one node per entry, and a filterable menu narrows the entries to the query before
  // they render, so filtered-out items never mount.
  const hasItems = items !== undefined;
  const matchesItem = React.useMemo(
    () => filterProp ?? filterIntegration?.getDefaultFilter(),
    [filterProp, filterIntegration],
  );
  const query = inputValue.trim();

  const filteredItems: readonly any[] = React.useMemo(() => {
    if (!hasItems) {
      return EMPTY_ARRAY;
    }
    // `matchesItem` always exists when filterable; the check doubles as type narrowing.
    if (!filterable || query === '' || matchesItem === undefined) {
      return items;
    }
    return items.filter((item) => matchesItem(item, query));
  }, [hasItems, filterable, query, items, matchesItem]);

  const noMatches = hasItems && query !== '' && filteredItems.length === 0;

  const derivedItemsContextValue: MenuDerivedItemsContextValue = React.useMemo(
    () => ({ hasItems, filteredItems }),
    [hasItems, filteredItems],
  );

  store.useControlledProp('openProp', openProp);
  store.useControlledProp('triggerIdProp', triggerIdProp);

  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  const floatingTreeRoot = store.useState('floatingTreeRoot');
  const floatingNodeIdFromContext = useFloatingNodeId(floatingTreeRoot);

  const open = store.useState('open');
  const activeTriggerId = store.useState('activeTriggerId');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const positionerElement = store.useState('positionerElement');
  const hoverEnabled = store.useState('hoverEnabled');
  const disabled = store.useState('disabled');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
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
    filterable,
    filterIntegration,
    highlightItemOnHover,
    modal: parent.type === undefined ? modalProp : undefined,
    openMethod,
    rootId,
  });

  useImplicitActiveTrigger(store);
  const { forceUnmount, transitionStatus } = useOpenStateTransitions(
    open,
    store,
    () => {
      store.update({ allowMouseEnter: false, inputFocusVisible: false });
      // The root outlives the popup. Reset only after unmount so the filtered contents remain
      // stable during an exit transition and a prevented or interrupted unmount keeps the query.
      if (inputValue !== '') {
        handleInputValueChange('', createChangeEventDetails(REASONS.popupClose));
      }
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
      const isKeyboardOpen = nextOpen && (reason === REASONS.listNavigation || isKeyboardClick);

      openEventRef.current = eventDetails.event;

      const popupOpenState = createPopupOpenState(
        store.state,
        nextOpen,
        eventDetails.trigger,
        shouldPreventUnmountOnClose(),
      ) as ReturnType<typeof createPopupOpenState> & {
        openChangeReason: MenuRoot.ChangeEventReason;
        instantType: MenuStoreState<Payload>['instantType'];
        inputFocusVisible: boolean;
      };

      popupOpenState.openChangeReason = reason;
      popupOpenState.inputFocusVisible = filterable && isKeyboardOpen;

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
  // Filterable menus keep DOM focus on their input and navigate items virtually.
  const virtual = filterable;
  const listNavigation = useListNavigation(floatingRootContext, {
    id: floatingId,
    enabled: !disabled,
    listRef: store.context.itemDomElements,
    activeIndex,
    nested: parent.type !== undefined,
    virtual,
    loopFocus,
    // Clear the active descendant at a list boundary so virtual focus returns to the filter
    // input before navigation loops to the other end.
    allowEscape: filterable,
    focusItemOnOpen: filterable ? false : undefined,
    orientation,
    parentOrientation: parent.type === 'menubar' ? parent.context.orientation : undefined,
    rtl: direction === 'rtl',
    disabledIndices: EMPTY_ARRAY,
    onNavigate(nextActiveIndex, event) {
      const inputFocusVisible = filterable && nextActiveIndex === null && event?.type === 'keydown';

      if (inputFocusVisible) {
        store.context.inputRef.current?.focus({ preventScroll: true });
      }

      store.update({ activeIndex: nextActiveIndex, inputFocusVisible });
    },
    openOnArrowKeyDown: parent.type !== 'context-menu',
    // Nested menus use the tree to coordinate with their parent. A top-level virtual menu
    // also needs it to restore its active descendant when one of its submenus closes.
    externalTree: nested || virtual ? floatingTreeRoot : undefined,
    focusItemOnHover: highlightItemOnHover,
  });

  const onTyping = React.useCallback(
    (nextTyping: boolean) => {
      store.context.typingRef.current = nextTyping;
    },
    [store],
  );

  const typeahead = useTypeahead(floatingRootContext, {
    enabled: !disabled,
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

  const activeTriggerProps = React.useMemo(() => {
    const mergedProps = mergeProps(
      typeahead.reference,
      filterable ? listNavigation.trigger : listNavigation.reference,
      dismiss.reference,
      {
        onMouseMove() {
          store.set('allowMouseEnter', true);
        },
      },
      interactionTypeProps,
    );

    mergedProps['aria-haspopup'] = 'menu';
    mergedProps['aria-expanded'] = open;

    return mergedProps;
  }, [
    store,
    typeahead.reference,
    listNavigation.reference,
    listNavigation.trigger,
    filterable,
    dismiss.reference,
    interactionTypeProps,
    open,
  ]);

  const inactiveTriggerProps = React.useMemo(() => {
    const mergedProps = mergeProps(listNavigation.trigger, dismiss.trigger, interactionTypeProps);

    mergedProps['aria-haspopup'] = 'menu';
    mergedProps['aria-expanded'] = false;

    return mergedProps;
  }, [listNavigation.trigger, dismiss.trigger, interactionTypeProps]);

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

  usePopupInteractionProps(store, {
    floatingRootContext,
    activeTriggerProps,
    inactiveTriggerProps,
    popupProps,
    itemProps: listNavigation.item ?? EMPTY_OBJECT,
    inputProps: listNavigation.reference ?? EMPTY_OBJECT,
  });

  const context: MenuRootContext<Payload> = React.useMemo(
    () => ({
      store,
      type: isSubmenu ? 'submenu' : 'menu',
      parent: parentFromContext,
      floatingId,
      setFloatingId,
    }),
    [store, isSubmenu, parentFromContext, floatingId],
  );

  const menu = (
    <MenuRootContext.Provider value={context as MenuRootContext}>
      {handle && <PopupHandleAttachment handle={handle} store={store} />}
      {/* A nested menu is only filterable if its own root is a filterable one, so the
          integration must not reach the subtree through context. Parts read it from their
          own store instead. */}
      <MenuFilterIntegrationContext.Provider value={null}>
        {typeof children === 'function' ? children({ payload }) : children}
      </MenuFilterIntegrationContext.Provider>
    </MenuRootContext.Provider>
  );

  let content = filterIntegration ? (
    <filterIntegration.Root
      open={open}
      empty={noMatches}
      value={inputValue}
      onValueChange={handleInputValueChange}
      // Menu handles can render a trigger outside this provider, so mirror
      // the active trigger for that detached case.
      triggerId={activeTriggerId}
      triggerElement={activeTriggerElement}
    >
      {menu}
    </filterIntegration.Root>
  ) : (
    menu
  );

  if (parent.type === undefined || parent.type === 'context-menu') {
    // set up a FloatingTree to provide the context to nested menus
    content = <FloatingTree externalTree={floatingTreeRoot}>{content}</FloatingTree>;
  }

  return (
    <MenuDerivedItemsContext.Provider value={derivedItemsContextValue}>
      {content}
    </MenuDerivedItemsContext.Provider>
  );
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

export type MenuFilter = (item: any, query: string) => boolean;

// These are deliberately not a discriminated union on `filter`. `Omit`, `Pick`, and object rest
// all collapse a union into one object type with widened members, which then matches no branch,
// so a typed wrapper like `interface MyProps extends Omit<Menu.Root.Props, 'children'>` would not
// compile. Misuse is reported at runtime instead: `Menu.Input` throws without `filter`.
interface MenuRootFilterProps {
  /**
   * Customizes how items match the query. The function receives the `items` entry and the
   * trimmed query.
   * Only a filterable menu (`FilterMenu.Root` or `FilterMenu.SubmenuRoot`) filters.
   */
  filter?: MenuFilter | undefined;
  /**
   * The uncontrolled input value when the menu is initially rendered.
   * Only applies to a filterable menu (`FilterMenu`).
   *
   * To render a controlled filter input, use the `inputValue` prop instead.
   * @default ''
   */
  defaultInputValue?: string | undefined;
  /**
   * The input value. Use when controlled.
   * Only applies to a filterable menu (`FilterMenu`).
   */
  inputValue?: string | undefined;
  /**
   * Event handler called when the input value changes.
   * Only applies to a filterable menu (`FilterMenu`).
   */
  onInputValueChange?:
    | ((value: string, eventDetails: MenuRootInputValueChangeEventDetails) => void)
    | undefined;
}

export type MenuRootProps<Payload = unknown> = MenuRootBaseProps<Payload> & MenuRootFilterProps;

interface MenuRootBaseProps<Payload = unknown> {
  /**
   * The items to render the list from. Pass a function as the `children` of `Menu.List` to
   * render one item per entry. A filterable menu narrows the entries to the query before they
   * render, so the list contents derive from this data rather than from the rendered DOM.
   */
  items?: readonly any[] | undefined;
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

export type MenuRootInputValueChangeEventReason = FilterDropdownRoot.ChangeEventReason;
export type MenuRootInputValueChangeEventDetails = FilterDropdownRoot.ChangeEventDetails;

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
  export type InputValueChangeEventReason = MenuRootInputValueChangeEventReason;
  export type InputValueChangeEventDetails = MenuRootInputValueChangeEventDetails;
  export type Orientation = MenuRootOrientation;
}
