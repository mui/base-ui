'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  safePolygon,
  useClick,
  useDismiss,
  useFloatingRootContext,
  useHover,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
  type FloatingRootContext,
} from '@floating-ui/react';
import { GenericHTMLProps } from '../../utils/types';
import { useTransitionStatus, type TransitionStatus } from '../../utils/useTransitionStatus';
import { useEventCallback } from '../../utils/useEventCallback';
import { useControlled } from '../../utils/useControlled';
import { PATIENT_CLICK_THRESHOLD, TYPEAHEAD_RESET_MS } from '../../utils/constants';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import type { TextDirection } from '../../direction-provider/DirectionContext';
import { useScrollLock } from '../../utils/useScrollLock';
import {
  type OpenChangeReason,
  translateOpenChangeReason,
} from '../../utils/translateOpenChangeReason';

const EMPTY_ARRAY: never[] = [];

export function useMenuRoot(parameters: useMenuRoot.Parameters): useMenuRoot.ReturnValue {
  const {
    open: openParam,
    defaultOpen,
    onOpenChange,
    onOpenChangeComplete,
    orientation,
    direction,
    disabled,
    nested,
    closeParentOnEsc,
    loop,
    delay,
    openOnHover,
    onTypingChange,
    modal,
  } = parameters;

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [positionerElement, setPositionerElementUnwrapped] = React.useState<HTMLElement | null>(
    null,
  );
  const [instantType, setInstantType] = React.useState<'dismiss' | 'click'>();
  const [hoverEnabled, setHoverEnabled] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [openReason, setOpenReason] = React.useState<OpenChangeReason | null>(null);
  const [stickIfOpen, setStickIfOpen] = React.useState(true);

  const popupRef = React.useRef<HTMLElement>(null);
  const positionerRef = React.useRef<HTMLElement | null>(null);
  const stickIfOpenTimeoutRef = React.useRef(-1);

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

  const allowMouseUpTriggerRef = React.useRef(false);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  useScrollLock(open && modal, triggerElement);

  const setOpen = useEventCallback(
    (nextOpen: boolean, event?: Event, reason?: OpenChangeReason) => {
      onOpenChange?.(nextOpen, event);
      setOpenUnwrapped(nextOpen);

      if (nextOpen) {
        setOpenReason(reason ?? null);
      }
    },
  );

  if (!open && !hoverEnabled) {
    setHoverEnabled(true);
  }

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    setOpenReason(null);
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
    return () => {
      clearStickIfOpenTimeout();
    };
  }, [clearStickIfOpenTimeout]);

  const floatingRootContext = useFloatingRootContext({
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
    open,
    onOpenChange(openValue, eventValue, reasonValue) {
      const isHover = reasonValue === 'hover' || reasonValue === 'safe-polygon';
      const isKeyboardClick = reasonValue === 'click' && (eventValue as MouseEvent).detail === 0;
      const isDismissClose = !openValue && (reasonValue === 'escape-key' || reasonValue == null);

      function changeState() {
        setOpen(openValue, eventValue, translateOpenChangeReason(reasonValue));
      }

      if (isHover) {
        // Only allow "patient" clicks to close the popover if it's open.
        // If they clicked within 500ms of the popover opening, keep it open.
        clearStickIfOpenTimeout();
        stickIfOpenTimeoutRef.current = window.setTimeout(() => {
          setStickIfOpen(false);
        }, PATIENT_CLICK_THRESHOLD);

        ReactDOM.flushSync(changeState);
      } else {
        changeState();
      }

      if (isKeyboardClick || isDismissClose) {
        setInstantType(isKeyboardClick ? 'click' : 'dismiss');
      } else {
        setInstantType(undefined);
      }
    },
  });

  const hover = useHover(floatingRootContext, {
    enabled: hoverEnabled && openOnHover && !disabled && openReason !== 'click',
    handleClose: safePolygon({ blockPointerEvents: true }),
    mouseOnly: true,
    move: false,
    delay: {
      open: delay,
    },
  });

  const click = useClick(floatingRootContext, {
    enabled: !disabled,
    event: 'mousedown',
    toggle: !nested,
    ignoreMouse: nested,
    stickIfOpen,
  });

  const dismiss = useDismiss(floatingRootContext, {
    bubbles: closeParentOnEsc && nested,
    outsidePressEvent: 'mousedown',
  });

  const role = useRole(floatingRootContext, {
    role: 'menu',
  });

  const itemDomElements = React.useRef<(HTMLElement | null)[]>([]);
  const itemLabels = React.useRef<(string | null)[]>([]);

  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: !disabled,
    listRef: itemDomElements,
    activeIndex,
    nested,
    loop,
    orientation,
    rtl: direction === 'rtl',
    disabledIndices: EMPTY_ARRAY,
    onNavigate: setActiveIndex,
  });

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
          if (!openOnHover || nested) {
            setHoverEnabled(false);
          }
        },
        onClick() {
          if (openOnHover) {
            setHoverEnabled(false);
          }
        },
      }),
    [getFloatingProps, openOnHover, nested],
  );

  const itemProps = React.useMemo(() => getItemProps(), [getItemProps]);

  return React.useMemo(
    () => ({
      activeIndex,
      allowMouseUpTriggerRef,
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
      openReason,
      instantType,
      onOpenChangeComplete,
      setHoverEnabled,
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
      openReason,
      instantType,
      onOpenChangeComplete,
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
    onOpenChange: ((open: boolean, event?: Event, reason?: OpenChangeReason) => void) | undefined;
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
     * Text direction of the menu (left to right or right to left).
     */
    direction: TextDirection;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Determines if the Menu is nested inside another Menu.
     */
    nested: boolean;
    /**
     * When in a submenu, determines whether pressing the Escape key
     * closes the entire menu, or only the current child menu.
     */
    closeParentOnEsc: boolean;
    /**
     * Whether the menu should also open when the trigger is hovered.
     */
    openOnHover: boolean;
    /**
     * Callback fired when the user begins or finishes typing (for typeahead search).
     */
    onTypingChange: (typing: boolean) => void;
    modal: boolean;
    /**
     * A ref to imperative actions.
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
    setOpen: (open: boolean, event: Event | undefined) => void;
    positionerRef: React.RefObject<HTMLElement | null>;
    setPositionerElement: (element: HTMLElement | null) => void;
    setTriggerElement: (element: HTMLElement | null) => void;
    transitionStatus: TransitionStatus;
    allowMouseUpTriggerRef: React.RefObject<boolean>;
    openReason: OpenChangeReason | null;
    instantType: 'dismiss' | 'click' | undefined;
    onOpenChangeComplete: ((open: boolean) => void) | undefined;
    setHoverEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  }

  export interface Actions {
    unmount: () => void;
  }
}
