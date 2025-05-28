'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  FloatingTree,
  safePolygon,
  useDismiss,
  useFloatingRootContext,
  useFocus,
  useHover,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
} from '@floating-ui/react';
import { useClick } from '../../utils/floating-ui/useClick';
import { MenuRootContext, useMenuRootContext } from './MenuRootContext';
import { MenubarContext, useMenubarContext } from '../../menubar/MenubarContext';
import { useTimeout } from '../../utils/useTimeout';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useEventCallback } from '../../utils/useEventCallback';
import { useControlled } from '../../utils/useControlled';
import { PATIENT_CLICK_THRESHOLD, TYPEAHEAD_RESET_MS } from '../../utils/constants';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useDirection } from '../../direction-provider/DirectionContext';
import { useScrollLock } from '../../utils/useScrollLock';
import {
  type BaseOpenChangeReason,
  translateOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import {
  ContextMenuRootContext,
  useContextMenuRootContext,
} from '../../context-menu/root/ContextMenuRootContext';
import { ownerDocument } from '../../utils/owner';

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
  const openEventRef = React.useRef<Event | null>(null);
  const popupRef = React.useRef<HTMLElement>(null);
  const positionerRef = React.useRef<HTMLElement | null>(null);
  const stickIfOpenTimeout = useTimeout();
  const contextMenuContext = useContextMenuRootContext(true);

  let parent: MenuParent;
  {
    const parentContext = useMenuRootContext(true);
    const menubarContext = useMenubarContext(true);

    if (parentContext) {
      parent = {
        type: 'menu',
        context: parentContext,
      };
    } else if (menubarContext) {
      parent = {
        type: 'menubar',
        context: menubarContext,
      };
    } else if (contextMenuContext) {
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

  const modal =
    (parent.type === undefined || parent.type === 'context-menu') && (modalProp ?? true);

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

  useScrollLock({
    enabled: open && modal && lastOpenChangeReason !== 'trigger-hover',
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
    onOpenChangeComplete?.(false);
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

  const ignoreClickRef = React.useRef(false);
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

      // As the menu opens on mousedown and closes on click,
      // we need to ignore the click event immediately following mousedown.
      if (reason === 'trigger-press' && event?.type === 'click' && ignoreClickRef.current) {
        ignoreClickRef.current = false;
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

      if (reason === 'trigger-press' && nextOpen && event?.type === 'mousedown') {
        ignoreClickRef.current = true;

        ownerDocument(event.currentTarget as Element).addEventListener(
          'click',
          () => {
            ignoreClickRef.current = false;
          },
          { once: true },
        );
      } else {
        ignoreClickRef.current = false;
      }

      const isKeyboardClick =
        (reason === 'trigger-press' || reason === 'item-press') &&
        (event as MouseEvent).detail === 0;
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
    restMs: parent.type !== undefined ? undefined : delay,
    delay: parent.type === 'menu' ? { open: delay, close: closeDelay } : { close: closeDelay },
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
    event: open ? 'click' : 'mousedown',
    toggle: !openOnHover || parent.type !== 'menu',
    ignoreMouse: openOnHover && parent.type === 'menu',
    stickIfOpen: parent.type === undefined ? stickIfOpen : false,
  });

  const dismiss = useDismiss(floatingRootContext, {
    enabled: !disabled,
    bubbles: closeParentOnEsc && parent.type === 'menu',
    outsidePressEvent: 'mousedown',
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

  const itemDomElements = React.useRef<(HTMLElement | null)[]>([]);
  const itemLabels = React.useRef<(string | null)[]>([]);

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

  const triggerProps = React.useMemo(
    () =>
      getReferenceProps({
        onMouseEnter() {
          setHoverEnabled(true);
        },
      }),
    [getReferenceProps],
  );

  const popupProps = React.useMemo(
    () =>
      getFloatingProps({
        onMouseEnter() {
          if (!openOnHover || parent.type === 'menu') {
            setHoverEnabled(false);
          }
        },
        onClick() {
          if (openOnHover) {
            setHoverEnabled(false);
          }
        },
      }),
    [getFloatingProps, openOnHover, parent.type],
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
      setPositionerElement,
      lastOpenChangeReason,
      instantType,
      onOpenChangeComplete,
      modal,
      disabled,
      parent,
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
     * @type (open: boolean, event?: Event, reason?: Menu.Root.OpenChangeReason) => void
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
     *
     * Defaults to `true` for nested menus.
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
