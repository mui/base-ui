'use client';
import * as React from 'react';
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
  FloatingRootContext,
} from '@floating-ui/react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';
import { useTransitionStatus, type TransitionStatus } from '../../utils/useTransitionStatus';
import { useEventCallback } from '../../utils/useEventCallback';
import { useControlled } from '../../utils/useControlled';
import { TYPEAHEAD_RESET_MS } from '../../utils/constants';
import { useAfterExitAnimation } from '../../utils/useAfterExitAnimation';
import type { TextDirection } from '../../direction-provider/DirectionContext';
import { useScrollLock } from '../../utils/useScrollLock';

const EMPTY_ARRAY: never[] = [];

export function useMenuRoot(parameters: useMenuRoot.Parameters): useMenuRoot.ReturnValue {
  const {
    open: openParam,
    defaultOpen,
    onOpenChange,
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
  const popupRef = React.useRef<HTMLElement>(null);
  const positionerRef = React.useRef<HTMLElement | null>(null);
  const [hoverEnabled, setHoverEnabled] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [backdropRendered, setBackdropRendered] = React.useState(false);

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

  useScrollLock(open && modal && backdropRendered, triggerElement);

  const setOpen = useEventCallback((nextOpen: boolean, event?: Event) => {
    onOpenChange?.(nextOpen, event);
    setOpenUnwrapped(nextOpen);
  });

  useAfterExitAnimation({
    open,
    animatedElementRef: popupRef,
    onFinished: () => setMounted(false),
  });

  const floatingRootContext = useFloatingRootContext({
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
    open,
    onOpenChange: setOpen,
  });

  const hover = useHover(floatingRootContext, {
    enabled: hoverEnabled && openOnHover && !disabled,
    handleClose: safePolygon({ blockPointerEvents: true }),
    mouseOnly: true,
    delay: {
      open: delay,
    },
  });

  const click = useClick(floatingRootContext, {
    enabled: !disabled,
    event: 'mousedown',
    toggle: !nested,
    ignoreMouse: nested,
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

  const getTriggerProps = React.useCallback(
    (externalProps?: GenericHTMLProps) =>
      getReferenceProps(
        mergeReactProps(externalProps, {
          onMouseEnter: () => {
            setHoverEnabled(true);
          },
        }),
      ),
    [getReferenceProps],
  );

  const getPopupProps = React.useCallback(
    (externalProps?: GenericHTMLProps) =>
      getFloatingProps(
        mergeReactProps(externalProps, {
          onMouseEnter: () => {
            setHoverEnabled(false);
          },
        }),
      ),
    [getFloatingProps],
  );

  return React.useMemo(
    () => ({
      activeIndex,
      allowMouseUpTriggerRef,
      floatingRootContext,
      getItemProps,
      getPopupProps,
      getTriggerProps,
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
      backdropRendered,
      setBackdropRendered,
    }),
    [
      activeIndex,
      floatingRootContext,
      getItemProps,
      getPopupProps,
      getTriggerProps,
      itemDomElements,
      itemLabels,
      mounted,
      open,
      positionerRef,
      setOpen,
      transitionStatus,
      backdropRendered,
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
    onOpenChange: ((open: boolean, event?: Event) => void) | undefined;
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
  }

  export interface ReturnValue {
    activeIndex: number | null;
    floatingRootContext: FloatingRootContext;
    getItemProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
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
    backdropRendered: boolean;
    setBackdropRendered: (value: boolean) => void;
  }
}
