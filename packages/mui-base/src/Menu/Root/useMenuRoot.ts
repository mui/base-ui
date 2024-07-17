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
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useEventCallback } from '../../utils/useEventCallback';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { useControlled } from '../../utils/useControlled';

const EMPTY_ARRAY: never[] = [];

/**
 *
 * API:
 *
 * - [useMenuRoot API](https://mui.com/base-ui/api/use-menu-root/)
 */
export function useMenuRoot(parameters: useMenuRoot.Parameters): useMenuRoot.ReturnValue {
  const {
    animated,
    open: openParam,
    defaultOpen,
    onOpenChange,
    orientation,
    direction,
    disabled,
    nested,
    escapeClosesParents,
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

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, animated);

  const runOnceAnimationsFinish = useAnimationsFinished(popupRef);
  const setOpen = useEventCallback((nextOpen: boolean, event?: Event) => {
    onOpenChange?.(nextOpen, event);
    setOpenUnwrapped(nextOpen);
    if (!nextOpen) {
      if (animated) {
        runOnceAnimationsFinish(() => setMounted(false));
      } else {
        setMounted(false);
      }
    }
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
    enabled: hoverEnabled && nested && !disabled,
    handleClose: safePolygon(),
    delay: {
      open: 75,
    },
  });

  const click = useClick(floatingRootContext, {
    enabled: nested && !disabled,
    event: 'mousedown',
    toggle: false,
    ignoreMouse: true,
  });

  const dismiss = useDismiss(floatingRootContext, { bubbles: escapeClosesParents });

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
    loop: true,
    orientation,
    rtl: direction === 'rtl',
    disabledIndices: EMPTY_ARRAY,
    onNavigate: setActiveIndex,
  });

  const typeahead = useTypeahead(floatingRootContext, {
    listRef: itemLabels,
    activeIndex,
    resetMs: 350,
    onMatch: (index) => {
      if (open && index !== activeIndex) {
        setActiveIndex(index);
      }
    },
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

  const getPositionerProps = React.useCallback(
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
    () =>
      ({
        activeIndex,
        floatingRootContext,
        triggerElement,
        setTriggerElement,
        getTriggerProps,
        setPositionerElement,
        getPositionerProps,
        getItemProps,
        itemDomElements,
        itemLabels,
        mounted,
        transitionStatus,
        popupRef,
        open,
        setOpen,
      }) satisfies useMenuRoot.ReturnValue,
    [
      activeIndex,
      floatingRootContext,
      triggerElement,
      getTriggerProps,
      getPositionerProps,
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

export type MenuDirection = 'ltr' | 'rtl';

export namespace useMenuRoot {
  export interface Parameters {
    animated: boolean;
    open: boolean | undefined;
    onOpenChange: ((open: boolean, event: Event | undefined) => void) | undefined;
    defaultOpen: boolean;
    orientation: MenuOrientation;
    direction: MenuDirection;
    disabled: boolean;
    nested: boolean;
    escapeClosesParents: boolean;
  }

  export interface ReturnValue {
    activeIndex: number | null;
    floatingRootContext: FloatingRootContext;
    getItemProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    itemDomElements: React.MutableRefObject<(HTMLElement | null)[]>;
    itemLabels: React.MutableRefObject<(string | null)[]>;
    mounted: boolean;
    open: boolean;
    popupRef: React.RefObject<HTMLElement | null>;
    setOpen: (open: boolean, event: Event | undefined) => void;
    setPositionerElement: (element: HTMLElement | null) => void;
    setTriggerElement: (element: HTMLElement | null) => void;
    transitionStatus: 'entering' | 'exiting' | undefined;
    triggerElement: HTMLElement | null;
  }
}
