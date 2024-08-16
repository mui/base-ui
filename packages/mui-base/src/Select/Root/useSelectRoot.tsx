'use client';
import * as React from 'react';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useInnerOffset,
  useInteractions,
  UseInteractionsReturn,
  useListNavigation,
  useRole,
  useTypeahead,
  type FloatingRootContext,
  type SideObject,
} from '@floating-ui/react';
import type { GenericHTMLProps } from '../../utils/types';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useEventCallback } from '../../utils/useEventCallback';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { useControlled } from '../../utils/useControlled';

const EMPTY_ARRAY: never[] = [];

/**
 *
 * API:
 *
 * - [useSelectRoot API](https://mui.com/base-ui/api/use-select-root/)
 */
export function useSelectRoot(params: useSelectRoot.Parameters): useSelectRoot.ReturnValue {
  const {
    animated,
    open: openParam,
    defaultOpen,
    onOpenChange,
    disabled,
    loop,
    value,
    onValueChange,
    defaultValue,
  } = params;

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [selectedIndex, setSelectedIndexUnwrapped] = React.useState<number | null>(null);
  const [innerOffset, setInnerOffset] = React.useState(0);

  const popupRef = React.useRef<HTMLElement>(null);
  const typingRef = React.useRef(false);
  const elementsRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const selectionRef = React.useRef({ mouseUp: false, select: false });
  const overflowRef = React.useRef<SideObject>({ top: 0, bottom: 0, left: 0, right: 0 });
  const selectedDelayedIndexRef = React.useRef<number | null>(null);

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'Select',
    state: 'open',
  });

  if (innerOffset !== 0 && !open) {
    setInnerOffset(0);
  }

  const [selectedValue, setSelectedValueUnwrapped] = useControlled({
    controlled: value,
    default: defaultValue,
    name: 'Select',
    state: 'selectedValue',
  });

  const setSelectedIndex = useEventCallback((index: number | null) => {
    const nextValue = index === null ? '' : labelsRef.current[index] || '';
    setSelectedValueUnwrapped(nextValue);
    onValueChange?.(nextValue);

    // Wait for any close animations to finish before updating the selected index so that the
    // inner item anchoring is delayed until the popup is closed.
    selectedDelayedIndexRef.current = index;
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, animated);

  const runOnceAnimationsFinish = useAnimationsFinished(popupRef);

  const setOpen = useEventCallback((nextOpen: boolean, event?: Event) => {
    onOpenChange?.(nextOpen, event);
    setOpenUnwrapped(nextOpen);

    function handleUnmounted() {
      setMounted(false);
      setSelectedIndexUnwrapped(selectedDelayedIndexRef.current);
    }

    if (!nextOpen) {
      if (animated) {
        runOnceAnimationsFinish(handleUnmounted);
      } else {
        handleUnmounted();
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

  const click = useClick(floatingRootContext, {
    enabled: !disabled,
    event: 'mousedown',
  });

  const dismiss = useDismiss(floatingRootContext, {
    enabled: !disabled,
  });

  const role = useRole(floatingRootContext, {
    role: 'select',
  });

  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: !disabled,
    listRef: elementsRef,
    disabledIndices: EMPTY_ARRAY,
    activeIndex,
    selectedIndex,
    loop,
    onNavigate: setActiveIndex,
  });

  const typeahead = useTypeahead(floatingRootContext, {
    listRef: labelsRef,
    activeIndex,
    resetMs: 500,
    onMatch: open ? setActiveIndex : setSelectedIndex,
    onTypingChange(typing) {
      typingRef.current = typing;
    },
  });

  const innerOffsetInteractionProps = useInnerOffset(floatingRootContext, {
    onChange: setInnerOffset,
    overflowRef,
    scrollRef: popupRef,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNavigation,
    typeahead,
    innerOffsetInteractionProps,
  ]);

  const getTriggerProps = React.useCallback(
    (externalProps?: GenericHTMLProps) => getReferenceProps(externalProps),
    [getReferenceProps],
  );

  const getPopupProps = React.useCallback(
    (externalProps?: GenericHTMLProps) => getFloatingProps(externalProps),
    [getFloatingProps],
  );

  return React.useMemo(
    () => ({
      activeIndex,
      setActiveIndex,
      selectedIndex,
      setSelectedIndex,
      selectedValue,
      floatingRootContext,
      triggerElement,
      setTriggerElement,
      getTriggerProps,
      setPositionerElement,
      getPopupProps,
      getItemProps,
      elementsRef,
      labelsRef,
      mounted,
      transitionStatus,
      popupRef,
      open,
      setOpen,
      typingRef,
      selectionRef,
      overflowRef,
      innerOffset,
    }),
    [
      activeIndex,
      selectedIndex,
      setSelectedIndex,
      selectedValue,
      floatingRootContext,
      triggerElement,
      getTriggerProps,
      getPopupProps,
      getItemProps,
      mounted,
      transitionStatus,
      open,
      setOpen,
      innerOffset,
    ],
  );
}

export namespace useSelectRoot {
  export interface Parameters {
    /**
     * If `true`, the Select supports CSS-based animations and transitions.
     * It is kept in the DOM until the animation completes.
     */
    animated: boolean;
    /**
     * Allows to control whether the Select is open.
     * This is a controlled counterpart of `defaultOpen`.
     */
    open: boolean | undefined;
    /**
     * Callback fired when the component requests to be opened or closed.
     */
    onOpenChange: ((open: boolean, event: Event | undefined) => void) | undefined;
    /**
     * If `true`, the Select is initially open.
     */
    defaultOpen: boolean;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
     */
    loop: boolean;
    /**
     * If `true`, the Select is disabled.
     */
    disabled: boolean;
    value?: string;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
    anchorToItem?: boolean;
  }

  export interface ReturnValue {
    activeIndex: number | null;
    setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
    selectedIndex: number | null;
    setSelectedIndex: (index: number | null) => void;
    selectedValue: string | null;
    floatingRootContext: FloatingRootContext;
    getItemProps: UseInteractionsReturn['getItemProps'];
    getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    elementsRef: React.MutableRefObject<(HTMLElement | null)[]>;
    labelsRef: React.MutableRefObject<(string | null)[]>;
    mounted: boolean;
    open: boolean;
    popupRef: React.RefObject<HTMLElement | null>;
    setOpen: (open: boolean, event: Event | undefined) => void;
    setPositionerElement: (element: HTMLElement | null) => void;
    setTriggerElement: (element: HTMLElement | null) => void;
    transitionStatus: 'entering' | 'exiting' | undefined;
    triggerElement: HTMLElement | null;
    typingRef: React.MutableRefObject<boolean>;
    selectionRef: React.MutableRefObject<{
      mouseUp: boolean;
      select: boolean;
    }>;
    innerOffset: number;
    overflowRef: React.MutableRefObject<SideObject>;
  }
}
