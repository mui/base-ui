'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useId } from '@base-ui-components/utils/useId';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useAnimationFrame } from '@base-ui-components/utils/useAnimationFrame';
import { EMPTY_ARRAY } from '@base-ui-components/utils/empty';
import {
  FloatingTree,
  useClick,
  useDismiss,
  useFloatingRootContext,
  useFocus,
  useHover,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
  safePolygon,
} from '../../floating-ui-react';
import { MenuRootContext, useMenuRootContext } from './MenuRootContext';
import { MenubarContext, useMenubarContext } from '../../menubar/MenubarContext';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { PATIENT_CLICK_THRESHOLD, TYPEAHEAD_RESET_MS } from '../../utils/constants';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useDirection } from '../../direction-provider/DirectionContext';
import { useScrollLock } from '../../utils/useScrollLock';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import type { FloatingUIOpenChangeDetails } from '../../utils/types';
import type { BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import {
  ContextMenuRootContext,
  useContextMenuRootContext,
} from '../../context-menu/root/ContextMenuRootContext';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { useMixedToggleClickHandler } from '../../utils/useMixedToggleClickHander';
import { mergeProps } from '../../merge-props';
import { useFloatingParentNodeId } from '../../floating-ui-react/components/FloatingTree';
import { MenuStore } from '../store/MenuStore';

/**
 * Groups all parts of the menu.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuRoot: React.FC<MenuRoot.Props> = function MenuRoot(props) {
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
    openOnHover: openOnHoverProp,
    delay = 100,
    closeDelay = 0,
    closeParentOnEsc = true,
  } = props;

  const contextMenuContext = useContextMenuRootContext(true);
  const parentContext = useMenuRootContext(true);
  const menubarContext = useMenubarContext(true);
  const isSubmenu = useMenuSubmenuRootContext();

  const parent: MenuParent = React.useMemo(() => {
    if (isSubmenu && parentContext) {
      return {
        type: 'menu',
        store: parentContext.store,
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
    if (contextMenuContext && !parentContext) {
      return {
        type: 'context-menu',
        context: contextMenuContext,
      };
    }

    return {
      type: undefined,
    };
  }, [contextMenuContext, parentContext, menubarContext, isSubmenu]);

  const store = useRefWithInit(() => new MenuStore({ parent })).current;
  store.useControlledProp('open', openProp, defaultOpen);
  store.useSyncedValues({
    disabled: disabledProp,
    modal: modalProp,
    rootId: useId(),
    parent,
  });
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  const open = store.useState('open');
  const triggerElement = store.useState('triggerElement');
  const positionerElement = store.useState('positionerElement');
  const hoverEnabled = store.useState('hoverEnabled');
  const modal = store.useState('modal');
  const disabled = store.useState('disabled');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const allowMouseEnter = store.useState('allowMouseEnter');
  const activeIndex = store.useState('activeIndex');

  const [stickIfOpen, setStickIfOpen] = React.useState(true);
  const openEventRef = React.useRef<Event | null>(null);
  const stickIfOpenTimeout = useTimeout();
  const nested = useFloatingParentNodeId() != null;

  let floatingEvents: ReturnType<typeof useFloatingRootContext>['events'];

  if (process.env.NODE_ENV !== 'production') {
    if (parent.type !== undefined && modalProp !== undefined) {
      console.warn(
        'Base UI: The `modal` prop is not supported on nested menus. It will be ignored.',
      );
    }
  }

  const openOnHover =
    openOnHoverProp ??
    (parent.type === 'menu' || (parent.type === 'menubar' && parent.context.hasSubmenuOpen));

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

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  store.useSyncedValues({ mounted, transitionStatus });

  const { triggerProps: interactionTypeProps, reset: resetOpenInteractionType } =
    useOpenInteractionType(open);

  useScrollLock(open && modal && lastOpenChangeReason !== REASONS.triggerHover, positionerElement);

  useIsoLayoutEffect(() => {
    if (!open && !hoverEnabled) {
      store.set('hoverEnabled', true);
    }
  }, [open, hoverEnabled, store]);

  const handleUnmount = useStableCallback(() => {
    setMounted(false);
    setStickIfOpen(true);

    store.update({
      mounted: false,
      allowMouseEnter: false,
    });

    store.context.onOpenChangeComplete?.(false);
    resetOpenInteractionType();
  });

  useOpenChangeComplete({
    enabled: !actionsRef,
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  const allowTouchToCloseRef = React.useRef(true);
  const allowTouchToCloseTimeout = useTimeout();

  const setOpen = useStableCallback(
    (nextOpen: boolean, eventDetails: MenuRoot.ChangeEventDetails) => {
      const reason = eventDetails.reason;

      if (open === nextOpen) {
        return;
      }

      onOpenChange?.(nextOpen, eventDetails);

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

      function changeState() {
        store.set('open', nextOpen);
        store.set('lastOpenChangeReason', reason ?? null);
        openEventRef.current = eventDetails.event ?? null;
      }

      if (reason === REASONS.triggerHover) {
        // Only allow "patient" clicks to close the menu if it's open.
        // If they clicked within 500ms of the menu opening, keep it open.
        setStickIfOpen(true);
        stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
          setStickIfOpen(false);
        });

        ReactDOM.flushSync(changeState);
      } else {
        changeState();
      }

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

  React.useImperativeHandle(actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

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

  React.useEffect(() => {
    if (!open) {
      stickIfOpenTimeout.clear();
    }
  }, [stickIfOpenTimeout, open]);

  const floatingRootContext = useFloatingRootContext({
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
    open,
    onOpenChange: setOpen,
  });

  store.useSyncedValue('floatingRootContext', floatingRootContext);

  floatingEvents = floatingRootContext.events;

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

  const hover = useHover(floatingRootContext, {
    enabled:
      hoverEnabled &&
      openOnHover &&
      !disabled &&
      parent.type !== 'context-menu' &&
      (parent.type !== 'menubar' || (parent.context.hasSubmenuOpen && !open)),
    handleClose: safePolygon({ blockPointerEvents: true }),
    mouseOnly: true,
    move: parent.type === 'menu',
    restMs:
      parent.type === undefined || (parent.type === 'menu' && allowMouseEnter) ? delay : undefined,
    delay:
      parent.type === 'menu'
        ? { open: allowMouseEnter ? delay : 10 ** 10, close: closeDelay }
        : { close: closeDelay },
  });

  const focus = useFocus(floatingRootContext, {
    enabled:
      !disabled &&
      !open &&
      parent.type === 'menubar' &&
      parent.context.hasSubmenuOpen &&
      !contextMenuContext,
  });

  const click = useClick(floatingRootContext, {
    enabled: !disabled && parent.type !== 'context-menu',
    event: open && parent.type === 'menubar' ? 'click' : 'mousedown',
    toggle: !openOnHover || parent.type !== 'menu',
    ignoreMouse: openOnHover && parent.type === 'menu',
    stickIfOpen: parent.type === undefined ? stickIfOpen : false,
  });

  const dismiss = useDismiss(floatingRootContext, {
    enabled: !disabled,
    bubbles: closeParentOnEsc && parent.type === 'menu',
    outsidePress() {
      if (parent.type !== 'context-menu' || openEventRef.current?.type === 'contextmenu') {
        return true;
      }

      return allowOutsidePressDismissalRef.current;
    },
  });

  const role = useRole(floatingRootContext, {
    role: 'menu',
  });

  const direction = useDirection();

  const setActiveIndex = React.useCallback(
    (index: number | null) => {
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

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    hover,
    click,
    dismiss,
    focus,
    role,
    listNavigation,
    typeahead,
  ]);

  const mixedToggleHandlers = useMixedToggleClickHandler({
    open,
    enabled: parent.type === 'menubar',
    mouseDownAction: 'open',
  });

  const triggerProps = React.useMemo(() => {
    const referenceProps = mergeProps(
      getReferenceProps(),
      {
        onMouseEnter() {
          store.set('hoverEnabled', true);
        },
        onMouseMove() {
          store.set('allowMouseEnter', true);
        },
      },
      interactionTypeProps,
      mixedToggleHandlers,
    );
    delete referenceProps.role;
    return referenceProps;
  }, [getReferenceProps, mixedToggleHandlers, store, interactionTypeProps]);

  const disableHoverTimeout = useAnimationFrame();

  const popupProps = React.useMemo(
    () =>
      getFloatingProps({
        onMouseEnter() {
          if (!openOnHover || parent.type === 'menu') {
            disableHoverTimeout.request(() => store.set('hoverEnabled', false));
          }
        },
        onMouseMove() {
          store.set('allowMouseEnter', true);
        },
        onClick() {
          if (openOnHover) {
            store.set('hoverEnabled', false);
          }
        },
      }),
    [getFloatingProps, openOnHover, parent.type, disableHoverTimeout, store],
  );

  const itemProps = React.useMemo(() => getItemProps(), [getItemProps]);

  store.useSyncedValues({
    triggerProps,
    popupProps,
    itemProps,
  });

  const context = React.useMemo(
    () => ({
      store,
    }),
    [store],
  );

  const content = <MenuRootContext.Provider value={context}>{children}</MenuRootContext.Provider>;

  if (parent.type === undefined || parent.type === 'context-menu') {
    // set up a FloatingTree to provide the context to nested menus
    return <FloatingTree>{content}</FloatingTree>;
  }

  return content;
};

export interface MenuRootProps {
  children: React.ReactNode;
  /**
   * Whether the menu is initially open.
   *
   * To render a controlled menu, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Whether to loop keyboard focus back to the first item
   * when the end of the list is reached while using the arrow keys.
   * @default true
   */
  loopFocus?: boolean;
  /**
   * Determines if the menu enters a modal state when open.
   * - `true`: user interaction is limited to the menu: document page scroll is locked and and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * @default true
   */
  modal?: boolean;
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: MenuRoot.ChangeEventDetails) => void;
  /**
   * Event handler called after any animations complete when the menu is closed.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * Whether the menu is currently open.
   */
  open?: boolean;
  /**
   * The visual orientation of the menu.
   * Controls whether roving focus uses up/down or left/right arrow keys.
   * @default 'vertical'
   */
  orientation?: MenuRoot.Orientation;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * When in a submenu, determines whether pressing the Escape key
   * closes the entire menu, or only the current child menu.
   * @default true
   */
  closeParentOnEsc?: boolean;
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
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the menu will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the menu manually.
   * Useful when the menu's animation is controlled by an external library.
   */
  actionsRef?: React.RefObject<MenuRoot.Actions>;
}

export interface MenuRootActions {
  unmount: () => void;
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
  | typeof REASONS.none;

export type MenuRootChangeEventDetails = BaseUIChangeEventDetails<MenuRoot.ChangeEventReason>;

export type MenuRootOrientation = 'horizontal' | 'vertical';

export type MenuParent =
  | {
      type: 'menu';
      store: MenuStore;
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
  export type Props = MenuRootProps;
  export type Actions = MenuRootActions;
  export type ChangeEventReason = MenuRootChangeEventReason;
  export type ChangeEventDetails = MenuRootChangeEventDetails;
  export type Orientation = MenuRootOrientation;
}
