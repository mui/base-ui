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
  } = parameters;

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const popupRef = React.useRef<HTMLElement>(null);
  const [hoverEnabled, setHoverEnabled] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'useMenuRoot',
    state: 'open',
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

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

  const dismiss = useDismiss(floatingRootContext, { bubbles: closeParentOnEsc });

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
      floatingRootContext,
      setTriggerElement,
      getTriggerProps,
      setPositionerElement,
      getPopupProps,
      getItemProps,
      itemDomElements,
      itemLabels,
      mounted,
      transitionStatus,
      popupRef,
      open,
      setOpen,
    }),
    [
      activeIndex,
      floatingRootContext,
      getTriggerProps,
      getPopupProps,
      getItemProps,
      itemDomElements,
      itemLabels,
      mounted,
      transitionStatus,
      open,
      setOpen,
    ],
  );
}

export type MenuOrientation = 'horizontal' | 'vertical';

export namespace useMenuRoot {
  export interface Parameters {
    /**
     * Allows to control whether the Menu is open.
     * This is a controlled counterpart of `defaultOpen`.
     */
    open: boolean | undefined;
    /**
     * Callback fired when the component requests to be opened or closed.
     */
    onOpenChange: ((open: boolean, event?: Event) => void) | undefined;
    /**
     * If `true`, the Menu is initially open.
     */
    defaultOpen: boolean;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
     */
    loop: boolean;
    /**
     * The delay in milliseconds until the menu popup is opened when `openOnHover` is `true`.
     */
    delay: number;
    /**
     * The orientation of the Menu (horizontal or vertical).
     */
    orientation: MenuOrientation;
    /**
     * The direction of the Menu (left-to-right or right-to-left).
     */
    direction: TextDirection;
    /**
     * If `true`, the Menu is disabled.
     */
    disabled: boolean;
    /**
     * Determines if the Menu is nested inside another Menu.
     */
    nested: boolean;
    /**
     * Determines if pressing the Esc key closes the parent menus.
     * This is only applicable for nested menus.
     *
     * If set to `false` pressing Esc closes only the current menu.
     */
    closeParentOnEsc: boolean;
    /**
     * Whether the menu popup opens when the trigger is hovered after the provided `delay`.
     */
    openOnHover: boolean;
    /**
     * Callback fired when the user begins or finishes typing (for typeahead search).
     */
    onTypingChange: (typing: boolean) => void;
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
    setPositionerElement: (element: HTMLElement | null) => void;
    setTriggerElement: (element: HTMLElement | null) => void;
    transitionStatus: TransitionStatus;
  }
}
