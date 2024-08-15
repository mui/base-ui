'use client';
import * as React from 'react';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  UseInteractionsReturn,
  useListNavigation,
  useRole,
  useTypeahead,
  type FloatingRootContext,
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

  const popupRef = React.useRef<HTMLElement>(null);
  const typingRef = React.useRef(false);
  const elementsRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'Select',
    state: 'open',
  });

  const [selectedValue, setSelectedValueUnwrapped] = useControlled({
    controlled: value,
    default: defaultValue,
    name: 'Select',
    state: 'selectedValue',
  });

  const setSelectedIndex = useEventCallback((index: number | null) => {
    const nextValue = index === null ? '' : labelsRef.current[index] || '';
    setSelectedIndexUnwrapped(index);
    setSelectedValueUnwrapped(nextValue);
    onValueChange?.(nextValue);
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
    resetMs: 350,
    onMatch: open ? setActiveIndex : setSelectedIndex,
    onTypingChange(typing) {
      typingRef.current = typing;
    },
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNavigation,
    typeahead,
  ]);

  const getTriggerProps = React.useCallback(
    (externalProps?: GenericHTMLProps) => getReferenceProps(externalProps),
    [getReferenceProps],
  );

  const getPositionerProps = React.useCallback(
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
      getPositionerProps,
      getItemProps,
      elementsRef,
      labelsRef,
      mounted,
      transitionStatus,
      popupRef,
      open,
      setOpen,
      typingRef,
    }),
    [
      activeIndex,
      selectedIndex,
      setSelectedIndex,
      selectedValue,
      floatingRootContext,
      triggerElement,
      getTriggerProps,
      getPositionerProps,
      getItemProps,
      mounted,
      transitionStatus,
      open,
      setOpen,
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
  }

  export interface ReturnValue {
    activeIndex: number | null;
    setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
    selectedIndex: number | null;
    setSelectedIndex: (index: number | null) => void;
    selectedValue: string | null;
    floatingRootContext: FloatingRootContext;
    getItemProps: UseInteractionsReturn['getItemProps'];
    getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
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
  }
}
