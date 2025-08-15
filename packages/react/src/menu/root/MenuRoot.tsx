'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useId } from '@base-ui-components/utils/useId';
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
import {
  type BaseOpenChangeReason,
  translateOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import {
  ContextMenuRootContext,
  useContextMenuRootContext,
} from '../../context-menu/root/ContextMenuRootContext';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { useMixedToggleClickHandler } from '../../utils/useMixedToggleClickHander';
import { mergeProps } from '../../merge-props';

const EMPTY_ARRAY: never[] = [];
const EMPTY_REF = { current: false };

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
    disabled = false,
    modal: modalProp,
    loop = true,
    orientation = 'vertical',
    actionsRef,
    openOnHover: openOnHoverProp,
    delay = 100,
    closeDelay = 0,
    closeParentOnEsc = true,
  } = props;

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [positionerElement, setPositionerElementUnwrapped] = React.useState<HTMLElement | null>(
    null,
  );
  const [instantType, setInstantType] = React.useState<'dismiss' | 'click' | 'group'>();
  const [hoverEnabled, setHoverEnabled] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [lastOpenChangeReason, setLastOpenChangeReason] =
    React.useState<MenuRoot.OpenChangeReason | null>(null);
  const [stickIfOpen, setStickIfOpen] = React.useState(true);
  const [allowMouseEnterState, setAllowMouseEnterState] = React.useState(false);

  const openEventRef = React.useRef<Event | null>(null);
  const popupRef = React.useRef<HTMLElement>(null);
  const positionerRef = React.useRef<HTMLElement | null>(null);

  const itemDomElements = React.useRef<(HTMLElement | null)[]>([]);
  const itemLabels = React.useRef<(string | null)[]>([]);

  const stickIfOpenTimeout = useTimeout();
  const contextMenuContext = useContextMenuRootContext(true);
  const isSubmenu = useMenuSubmenuRootContext();

  let parent: MenuParent;
  {
    const parentContext = useMenuRootContext(true);
    const menubarContext = useMenubarContext(true);

    if (isSubmenu && parentContext) {
      parent = {
        type: 'menu',
        context: parentContext,
      };
    } else if (menubarContext) {
      parent = {
        type: 'menubar',
        context: menubarContext,
      };
      // Making sure it's not a Menu nested inside a ContextMenuTrigger. ContextMenu parentContext is always undefined (ContextMenuRoot is instantiated with `<MenuRootContext.Provider value={undefined}>`)
    } else if (contextMenuContext && !parentContext) {
      parent = {
        type: 'context-menu',
        context: contextMenuContext,
      };
    } else {
      parent = {
        type: undefined,
      };
    }
  }

  let rootId = useId();

  if (parent.type !== undefined) {
    rootId = parent.context.rootId;
  }

  const modal =
    (parent.type === undefined || parent.type === 'context-menu') && (modalProp ?? true);

  // If this menu is a submenu, it should inherit `allowMouseEnter` from its
  // parent. Otherwise it manages the state on its own.
  const allowMouseEnter =
    parent.type === 'menu' ? parent.context.allowMouseEnter : allowMouseEnterState;
  const setAllowMouseEnter =
    parent.type === 'menu' ? parent.context.setAllowMouseEnter : setAllowMouseEnterState;

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

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'MenuRoot',
    state: 'open',
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

  const setPositionerElement = React.useCallback((value: HTMLElement | null) => {
    positionerRef.current = value;
    setPositionerElementUnwrapped(value);
  }, []);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const {
    openMethod,
    triggerProps: interactionTypeProps,
    reset: resetOpenInteractionType,
  } = useOpenInteractionType(open);

  useScrollLock({
    enabled: open && modal && lastOpenChangeReason !== 'trigger-hover' && openMethod !== 'touch',
    mounted,
    open,
    referenceElement: positionerElement,
  });

  if (!open && !hoverEnabled) {
    setHoverEnabled(true);
  }

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    setStickIfOpen(true);
    setAllowMouseEnter(false);
    onOpenChangeComplete?.(false);
    resetOpenInteractionType();
  });

  useOpenChangeComplete({
    enabled: !actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  const allowTouchToCloseRef = React.useRef(true);
  const allowTouchToCloseTimeout = useTimeout();

  const setOpen = useEventCallback(
    (
      nextOpen: boolean,
      event: Event | undefined,
      reason: MenuRoot.OpenChangeReason | undefined,
    ) => {
      if (open === nextOpen) {
        return;
      }

      if (
        nextOpen === false &&
        event?.type === 'click' &&
        (event as PointerEvent).pointerType === 'touch' &&
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
        const activeOption = itemDomElements.current[activeIndex];
        // Wait for Floating UI's focus effect to have fired
        queueMicrotask(() => {
          activeOption?.setAttribute('tabindex', '-1');
        });
      }

      // Prevent the menu from closing on mobile devices that have a delayed click event.
      // In some cases the menu, when tapped, will fire the focus event first and then the click event.
      // Without this guard, the menu will close immediately after opening.
      if (nextOpen && reason === 'trigger-focus') {
        allowTouchToCloseRef.current = false;
        allowTouchToCloseTimeout.start(300, () => {
          allowTouchToCloseRef.current = true;
        });
      } else {
        allowTouchToCloseRef.current = true;
        allowTouchToCloseTimeout.clear();
      }

      const isKeyboardClick =
        (reason === 'trigger-press' || reason === 'item-press') &&
        (event as MouseEvent).detail === 0 &&
        event?.isTrusted;
      const isDismissClose = !nextOpen && (reason === 'escape-key' || reason == null);

      function changeState() {
        onOpenChange?.(nextOpen, event, reason);
        setOpenUnwrapped(nextOpen);
        setLastOpenChangeReason(reason ?? null);
        openEventRef.current = event ?? null;
      }

      if (reason === 'trigger-hover') {
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
        (reason === 'trigger-focus' ||
          reason === 'focus-out' ||
          reason === 'trigger-hover' ||
          reason === 'list-navigation' ||
          reason === 'sibling-open')
      ) {
        setInstantType('group');
      } else if (isKeyboardClick || isDismissClose) {
        setInstantType(isKeyboardClick ? 'click' : 'dismiss');
      } else {
        setInstantType(undefined);
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
    onOpenChange(openValue, eventValue, reasonValue) {
      setOpen(openValue, eventValue, translateOpenChangeReason(reasonValue));
    },
  });

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

  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: !disabled,
    listRef: itemDomElements,
    activeIndex,
    nested: parent.type !== undefined,
    loop,
    orientation,
    parentOrientation: parent.type === 'menubar' ? parent.context.orientation : undefined,
    rtl: direction === 'rtl',
    disabledIndices: EMPTY_ARRAY,
    onNavigate: setActiveIndex,
    openOnArrowKeyDown: parent.type !== 'context-menu',
  });

  const typingRef = React.useRef(false);

  const onTypingChange = React.useCallback((nextTyping: boolean) => {
    typingRef.current = nextTyping;
  }, []);

  const typeahead = useTypeahead(floatingRootContext, {
    listRef: itemLabels,
    activeIndex,
    resetMs: TYPEAHEAD_RESET_MS,
    onMatch: (index) => {
      if (open && index !== activeIndex) {
        setActiveIndex(index);
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
          setHoverEnabled(true);
        },
        onMouseMove() {
          setAllowMouseEnter(true);
        },
      },
      interactionTypeProps,
      mixedToggleHandlers,
    );
    delete referenceProps.role;
    return referenceProps;
  }, [getReferenceProps, mixedToggleHandlers, setAllowMouseEnter, interactionTypeProps]);

  const popupProps = React.useMemo(
    () =>
      getFloatingProps({
        onMouseEnter() {
          if (!openOnHover || parent.type === 'menu') {
            setHoverEnabled(false);
          }
        },
        onMouseMove() {
          setAllowMouseEnter(true);
        },
        onClick() {
          if (openOnHover) {
            setHoverEnabled(false);
          }
        },
      }),
    [getFloatingProps, openOnHover, parent.type, setAllowMouseEnter],
  );

  const itemProps = React.useMemo(() => getItemProps(), [getItemProps]);

  const context = React.useMemo(
    () => ({
      activeIndex,
      setActiveIndex,
      allowMouseUpTriggerRef: parent.type ? parent.context.allowMouseUpTriggerRef : EMPTY_REF,
      floatingRootContext,
      itemProps,
      popupProps,
      triggerProps,
      itemDomElements,
      itemLabels,
      mounted,
      open,
      popupRef,
      positionerRef,
      setOpen,
      setPositionerElement,
      triggerElement,
      setTriggerElement,
      transitionStatus,
      lastOpenChangeReason,
      instantType,
      onOpenChangeComplete,
      setHoverEnabled,
      typingRef,
      modal,
      disabled,
      parent,
      rootId,
      allowMouseEnter,
      setAllowMouseEnter,
    }),
    [
      activeIndex,
      floatingRootContext,
      itemProps,
      popupProps,
      triggerProps,
      itemDomElements,
      itemLabels,
      mounted,
      open,
      positionerRef,
      setOpen,
      transitionStatus,
      triggerElement,
      setPositionerElement,
      lastOpenChangeReason,
      instantType,
      onOpenChangeComplete,
      modal,
      disabled,
      parent,
      rootId,
      allowMouseEnter,
      setAllowMouseEnter,
    ],
  );

  const content = <MenuRootContext.Provider value={context}>{children}</MenuRootContext.Provider>;

  if (parent.type === undefined || parent.type === 'context-menu') {
    // set up a FloatingTree to provide the context to nested menus
    return <FloatingTree>{content}</FloatingTree>;
  }

  return content;
};

export namespace MenuRoot {
  export interface Props {
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
    loop?: boolean;
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
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: OpenChangeReason | undefined,
    ) => void;
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
    orientation?: Orientation;
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
    actionsRef?: React.RefObject<Actions>;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = BaseOpenChangeReason | 'sibling-open';

  export type Orientation = 'horizontal' | 'vertical';

  export interface Actions {
    unmount: () => void;
  }
}

export type MenuParent =
  | {
      type: 'menu';
      context: MenuRootContext;
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
