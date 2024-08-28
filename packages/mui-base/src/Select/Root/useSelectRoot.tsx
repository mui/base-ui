'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
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
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import { useFieldControlValidation } from '../../Field/Control/useFieldControlValidation';

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
    value: valueProp,
    onValueChange,
    defaultValue = '',
    alignToItem,
  } = params;

  const { setDirty, validityData, validateOnChange } = useFieldRootContext();
  const fieldControlValidation = useFieldControlValidation();

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [innerOffset, setInnerOffset] = React.useState(0);
  const [innerFallback, setInnerFallback] = React.useState(false);
  const [label, setLabel] = React.useState('');
  const [touchModality, setTouchModality] = React.useState(false);

  const popupRef = React.useRef<HTMLElement>(null);
  const backdropRef = React.useRef<HTMLElement>(null);
  const typingRef = React.useRef(false);
  const elementsRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const valuesRef = React.useRef<Array<string | null>>([]);
  const selectionRef = React.useRef({ mouseUp: false, select: false });
  const overflowRef = React.useRef<SideObject>({ top: 0, bottom: 0, left: 0, right: 0 });

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'Select',
    state: 'open',
  });

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'Select',
    state: 'value',
  });

  const setValue: useSelectRoot.ReturnValue['setValue'] = useEventCallback((nextValue, event) => {
    onValueChange?.(nextValue, event);
    setValueUnwrapped(nextValue);

    setDirty(nextValue !== validityData.initialValue);

    if (validateOnChange) {
      fieldControlValidation.commitValidation(nextValue);
    }

    if (nextValue !== null) {
      const index = valuesRef.current.indexOf(nextValue);
      setSelectedIndex(index);
      setLabel(labelsRef.current[index] ?? '');
    } else {
      setSelectedIndex(null);
      setLabel('');
    }
  });

  useEnhancedEffect(() => {
    // Wait for the items to have registered their values in `valuesRef`.
    queueMicrotask(() => {
      const index = valuesRef.current.indexOf(value);
      if (index !== -1) {
        setSelectedIndex(index);
        setLabel(labelsRef.current[index] ?? '');
      }
    });
  }, [value]);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, animated);

  const runOnceAnimationsFinish = useAnimationsFinished(popupRef);

  const setOpen = useEventCallback((nextOpen: boolean, event?: Event) => {
    onOpenChange?.(nextOpen, event);
    setOpenUnwrapped(nextOpen);

    function handleUnmounted() {
      ReactDOM.flushSync(() => {
        setMounted(false);
      });

      // Ensure these aren't flushed synchronously so they occur after the popup has been unmounted.
      // This ensures the position calculation won't run again (which otherwise leaves
      // `isPositioned` set to `true` incorrectly once closed).
      setInnerOffset(0);
      setInnerFallback(false);
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
    onMatch: open
      ? setActiveIndex
      : (index) => {
          setValue(valuesRef.current[index] ?? '');
        },
    onTypingChange(typing) {
      typingRef.current = typing;
    },
  });

  const innerOffsetInteractionProps = useInnerOffset(floatingRootContext, {
    enabled: alignToItem && !innerFallback,
    onChange: setInnerOffset,
    scrollRef: popupRef,
    overflowRef,
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
      ...fieldControlValidation,
      value,
      setValue,
      label,
      setLabel,
      activeIndex,
      setActiveIndex,
      selectedIndex,
      setSelectedIndex,
      floatingRootContext,
      triggerElement,
      setTriggerElement,
      getTriggerProps,
      positionerElement,
      setPositionerElement,
      getPopupProps,
      getItemProps,
      elementsRef,
      labelsRef,
      valuesRef,
      mounted,
      transitionStatus,
      popupRef,
      backdropRef,
      open,
      setOpen,
      typingRef,
      selectionRef,
      overflowRef,
      innerOffset,
      setInnerOffset,
      innerFallback,
      setInnerFallback,
      touchModality,
      setTouchModality,
    }),
    [
      fieldControlValidation,
      value,
      label,
      setValue,
      activeIndex,
      selectedIndex,
      floatingRootContext,
      triggerElement,
      getTriggerProps,
      positionerElement,
      getPopupProps,
      getItemProps,
      mounted,
      transitionStatus,
      open,
      setOpen,
      innerOffset,
      innerFallback,
      touchModality,
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
    /**
     * The value of the Select. Use when controlled.
     */
    value?: string;
    /**
     * Callback fired when the value of the Select changes. Use when controlled.
     */
    onValueChange?: (value: string, event?: Event) => void;
    /**
     * The default value of the Select.
     * @default ''
     */
    defaultValue?: string;
    /**
     * If `true`, the Select will align to the selected item.
     * @default true
     */
    alignToItem?: boolean;
  }

  export interface ReturnValue extends useFieldControlValidation.ReturnValue {
    value: string;
    setValue: (value: string, event?: Event) => void;
    label: string;
    setLabel: React.Dispatch<React.SetStateAction<string>>;
    activeIndex: number | null;
    setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
    selectedIndex: number | null;
    setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
    floatingRootContext: FloatingRootContext;
    getItemProps: UseInteractionsReturn['getItemProps'];
    getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    elementsRef: React.MutableRefObject<(HTMLElement | null)[]>;
    labelsRef: React.MutableRefObject<(string | null)[]>;
    valuesRef: React.MutableRefObject<(string | null)[]>;
    mounted: boolean;
    open: boolean;
    popupRef: React.RefObject<HTMLElement | null>;
    setOpen: (open: boolean, event: Event | undefined) => void;
    setPositionerElement: (element: HTMLElement | null) => void;
    setTriggerElement: (element: HTMLElement | null) => void;
    transitionStatus: 'entering' | 'exiting' | undefined;
    triggerElement: HTMLElement | null;
    positionerElement: HTMLElement | null;
    typingRef: React.MutableRefObject<boolean>;
    selectionRef: React.MutableRefObject<{
      mouseUp: boolean;
      select: boolean;
    }>;
    innerOffset: number;
    setInnerOffset: React.Dispatch<React.SetStateAction<number>>;
    overflowRef: React.MutableRefObject<SideObject>;
    backdropRef: React.RefObject<HTMLElement>;
    innerFallback: boolean;
    setInnerFallback: React.Dispatch<React.SetStateAction<boolean>>;
    touchModality: boolean;
    setTouchModality: React.Dispatch<React.SetStateAction<boolean>>;
  }
}
