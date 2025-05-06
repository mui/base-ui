'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  safePolygon,
  useClick,
  useDismiss,
  useFloatingRootContext,
  useFocus,
  useHover,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
  type FloatingRootContext,
} from '@floating-ui/react';
import { MenuRootContext, useMenuRootContext } from './MenuRootContext';
import { MenubarContext, useMenubarContext } from '../../menubar/MenubarContext';
import { GenericHTMLProps } from '../../utils/types';
import { useTransitionStatus, type TransitionStatus } from '../../utils/useTransitionStatus';
import { useEventCallback } from '../../utils/useEventCallback';
import { useControlled } from '../../utils/useControlled';
import { PATIENT_CLICK_THRESHOLD, TYPEAHEAD_RESET_MS } from '../../utils/constants';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useDirection } from '../../direction-provider/DirectionContext';
import { useScrollLock } from '../../utils/useScrollLock';
import {
  type OpenChangeReason,
  translateOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { ownerDocument } from '../../utils/owner';

const EMPTY_ARRAY: never[] = [];

export function useMenuRoot(parameters: useMenuRoot.Parameters): useMenuRoot.ReturnValue {
  const {
    open: openParam,
    defaultOpen,
    onOpenChange,
    onOpenChangeComplete,
    orientation,
    disabled,
    closeParentOnEsc,
    loop,
    delay,
    openOnHover: openOnHoverParam,
    modal: modalParam,
  } = parameters;

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [positionerElement, setPositionerElementUnwrapped] = React.useState<HTMLElement | null>(
    null,
  );
  const [instantType, setInstantType] = React.useState<'dismiss' | 'click' | 'group'>();
  const [hoverEnabled, setHoverEnabled] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [lastOpenChangeReason, setLastOpenChangeReason] = React.useState<OpenChangeReason | null>(
    null,
  );
  const [stickIfOpen, setStickIfOpen] = React.useState(true);

  const popupRef = React.useRef<HTMLElement>(null);
  const positionerRef = React.useRef<HTMLElement | null>(null);
  const stickIfOpenTimeoutRef = React.useRef(-1);

  let parent: useMenuRoot.ReturnValue['parent'];
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
    } else {
      parent = {
        type: undefined,
      };
    }
  }

  const modal = parent.type === undefined && (modalParam ?? true);

  if (process.env.NODE_ENV !== 'production') {
    if (parent.type !== undefined && modalParam !== undefined) {
      console.warn(
        'Base UI: The `modal` prop is not supported on nested menus. It will be ignored.',
      );
    }
  }

  const openOnHover =
    openOnHoverParam ??
    (parent.type === 'menu' || (parent.type === 'menubar' && parent.context.hasSubmenuOpen));

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'useMenuRoot',
    state: 'open',
  });

  const setPositionerElement = React.useCallback((value: HTMLElement | null) => {
    positionerRef.current = value;
    setPositionerElementUnwrapped(value);
  }, []);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  useScrollLock({
    enabled: open && modal && lastOpenChangeReason !== 'hover',
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
    enabled: !parameters.actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(parameters.actionsRef, () => ({ unmount: handleUnmount }), [
    handleUnmount,
  ]);

  const clearStickIfOpenTimeout = useEventCallback(() => {
    clearTimeout(stickIfOpenTimeoutRef.current);
  });

  React.useEffect(() => {
    if (!open) {
      clearStickIfOpenTimeout();
    }
  }, [clearStickIfOpenTimeout, open]);

  React.useEffect(() => {
    return clearStickIfOpenTimeout;
  }, [clearStickIfOpenTimeout]);

  const ignoreClickRef = React.useRef(false);

  const setOpen = useEventCallback(
    (nextOpen: boolean, event: Event | undefined, reason: OpenChangeReason | undefined) => {
      if (open === nextOpen) {
        return;
      }

      // As the menu opens on mousedown and closes on click,
      // we need to ignore the click event immediately following mousedown.
      if (event?.type === 'click' && ignoreClickRef.current) {
        ignoreClickRef.current = false;
        return;
      }

      if (nextOpen && event?.type === 'mousedown') {
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
        (reason === 'click' || reason === 'item-press') && (event as MouseEvent).detail === 0;
      const isDismissClose = !nextOpen && (reason === 'escape-key' || reason == null);

      function changeState() {
        onOpenChange?.(nextOpen, event, reason);
        setOpenUnwrapped(nextOpen);

        setLastOpenChangeReason(reason ?? null);
      }

      if (reason === 'hover') {
        // Only allow "patient" clicks to close the menu if it's open.
        // If they clicked within 500ms of the menu opening, keep it open.
        clearStickIfOpenTimeout();
        setStickIfOpen(true);
        stickIfOpenTimeoutRef.current = window.setTimeout(() => {
          setStickIfOpen(false);
        }, PATIENT_CLICK_THRESHOLD);

        ReactDOM.flushSync(changeState);
      } else {
        changeState();
      }

      if (
        parent.type === 'menubar' &&
        (reason === 'focus' ||
          reason === 'focus-out' ||
          reason === 'hover' ||
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
      (parent.type !== 'menubar' || (parent.context.hasSubmenuOpen && !open)),
    handleClose: safePolygon({ blockPointerEvents: true }),
    mouseOnly: true,
    move: parent.type === 'menu',
    restMs: parent.type !== undefined ? undefined : delay,
    delay: parent.type === 'menu' ? { open: delay } : 0,
  });

  const focus = useFocus(floatingRootContext, {
    enabled: !disabled && !open && parent.type === 'menubar' && parent.context.hasSubmenuOpen,
  });

  const click = useClick(floatingRootContext, {
    enabled: !disabled,
    event: open ? 'click' : 'mousedown',
    toggle: !openOnHover || parent.type !== 'menu',
    ignoreMouse: openOnHover && parent.type === 'menu',
    stickIfOpen: parent.type === undefined ? stickIfOpen : false,
  });

  const dismiss = useDismiss(floatingRootContext, {
    bubbles: closeParentOnEsc && parent.type === 'menu',
    outsidePressEvent: 'mousedown',
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

  const allowMouseUpTriggerRef = React.useRef(false);

  return React.useMemo(
    () => ({
      activeIndex,
      setActiveIndex,
      allowMouseUpTriggerRef:
        parent.type !== undefined ? parent.context.allowMouseUpTriggerRef : allowMouseUpTriggerRef,
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
}

export type MenuOrientation = 'horizontal' | 'vertical';

export namespace useMenuRoot {
  export interface Parameters {
    /**
     * Whether the menu is currently open.
     */
    open: boolean | undefined;
    /**
     * Event handler called when the menu is opened or closed.
     */
    onOpenChange:
      | ((open: boolean, event: Event | undefined, reason: OpenChangeReason | undefined) => void)
      | undefined;
    /**
     * Event handler called after any animations complete when the menu is opened or closed.
     */
    onOpenChangeComplete: ((open: boolean) => void) | undefined;
    /**
     * Whether the menu is initially open.
     *
     * To render a controlled menu, use the `open` prop instead.
     */
    defaultOpen: boolean;
    /**
     * Whether to loop keyboard focus back to the first item
     * when the end of the list is reached while using the arrow keys.
     */
    loop: boolean;
    /**
     * How long to wait before the menu may be opened on hover. Specified in milliseconds.
     *
     * Requires the `openOnHover` prop.
     */
    delay: number;
    /**
     * The visual orientation of the menu.
     * Controls whether roving focus uses up/down or left/right arrow keys.
     */
    orientation: MenuOrientation;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * When in a submenu, determines whether pressing the Escape key
     * closes the entire menu, or only the current child menu.
     */
    closeParentOnEsc: boolean;
    /**
     * Whether the menu should also open when the trigger is hovered.
     */
    openOnHover: boolean | undefined;
    /**
     * Determines if the menu enters a modal state when open.
     * - `true`: user interaction is limited to the menu: document page scroll is locked and and pointer interactions on outside elements are disabled.
     * - `false`: doesn't lock document scroll or block pointer interactions.
     * @default true
     */
    modal: boolean | undefined;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the menu will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the menu manually.
     * Useful when the menu's animation is controlled by an external library.
     */
    actionsRef: React.RefObject<Actions> | undefined;
  }

  export interface ReturnValue {
    activeIndex: number | null;
    floatingRootContext: FloatingRootContext;
    itemProps: GenericHTMLProps;
    popupProps: GenericHTMLProps;
    triggerProps: GenericHTMLProps;
    itemDomElements: React.MutableRefObject<(HTMLElement | null)[]>;
    itemLabels: React.MutableRefObject<(string | null)[]>;
    mounted: boolean;
    open: boolean;
    popupRef: React.RefObject<HTMLElement | null>;
    setOpen: (
      open: boolean,
      event: Event | undefined,
      reason: OpenChangeReason | undefined,
    ) => void;
    positionerRef: React.RefObject<HTMLElement | null>;
    setPositionerElement: (element: HTMLElement | null) => void;
    setTriggerElement: (element: HTMLElement | null) => void;
    transitionStatus: TransitionStatus;
    allowMouseUpTriggerRef: React.RefObject<boolean>;
    lastOpenChangeReason: OpenChangeReason | null;
    instantType: 'dismiss' | 'click' | 'group' | undefined;
    onOpenChangeComplete: ((open: boolean) => void) | undefined;
    setHoverEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
    typingRef: React.RefObject<boolean>;
    modal: boolean;
    disabled: boolean;
    parent: MenuParent;
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
        type: undefined;
      };

  export interface Actions {
    unmount: () => void;
  }
}
