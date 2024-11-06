import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
} from '@floating-ui/react';
import { useFieldControlValidation } from '../../Field/Control/useFieldControlValidation';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import { useId } from '../../utils/useId';
import { useControlled } from '../../utils/useControlled';
import { type TransitionStatus, useTransitionStatus } from '../../utils';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useLatestRef } from '../../utils/useLatestRef';
import { useEventCallback } from '../../utils/useEventCallback';
import { warn } from '../../utils/warn';
import type { SelectRootContext } from './SelectRootContext';
import type { SelectIndexContext } from './SelectIndexContext';

export function useSelectRoot<T>(params: useSelectRoot.Parameters<T>): useSelectRoot.ReturnValue {
  const {
    value: valueProp,
    defaultValue,
    onValueChange,
    open: openProp,
    defaultOpen,
    onOpenChange,
    alignOptionToTrigger: alignOptionToTriggerParam = true,
    loop = true,
    animated = false,
    name,
    disabled = false,
    readOnly = false,
    required = false,
  } = params;

  const id = useId();

  const { setDirty, validityData, validationMode } = useFieldRootContext();
  const fieldControlValidation = useFieldControlValidation();

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [label, setLabel] = React.useState('');
  const [touchModality, setTouchModality] = React.useState(false);

  const alignOptionToTrigger = Boolean(alignOptionToTriggerParam && !touchModality);

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'Select',
    state: 'value',
  });

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'Select',
    state: 'open',
  });

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const valueRef = React.useRef<HTMLSpanElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const typingRef = React.useRef(false);
  const selectedOptionTextRef = React.useRef<HTMLSpanElement | null>(null);
  const selectionRef = React.useRef({
    allowSelectedMouseUp: false,
    allowUnselectedMouseUp: false,
    allowSelect: false,
  });

  const liveValueRef = useLatestRef(value);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, animated);

  const runOnceAnimationsFinish = useAnimationsFinished(popupRef);

  const setOpen = useEventCallback((nextOpen: boolean, event?: Event) => {
    onOpenChange?.(nextOpen, event);
    setOpenUnwrapped(nextOpen);

    function handleUnmounted() {
      ReactDOM.flushSync(() => {
        setMounted(false);
      });
    }

    if (!nextOpen) {
      if (animated) {
        runOnceAnimationsFinish(handleUnmounted);
      } else {
        handleUnmounted();
      }
    }
  });

  const setValue = useEventCallback((nextValue: any, event?: Event) => {
    onValueChange?.(nextValue, event);
    setValueUnwrapped(nextValue);

    setDirty(nextValue !== validityData.initialValue);

    if (validationMode === 'onChange') {
      fieldControlValidation.commitValidation(nextValue);
    }

    const index = valuesRef.current.indexOf(nextValue);
    setSelectedIndex(index);
    setLabel(labelsRef.current[index] ?? '');
  });

  useEnhancedEffect(() => {
    // Wait for the items to have registered their values in `valuesRef`.
    queueMicrotask(() => {
      const v = liveValueRef.current;
      const stringValue = typeof v === 'string' || v === null ? v : JSON.stringify(v);
      const index = valuesRef.current.indexOf(stringValue);
      if (index !== -1) {
        setSelectedIndex(index);
        setLabel(labelsRef.current[index] ?? '');
      } else if (v) {
        warn(`The value \`${stringValue}\` is not present in the Select options.`);
      }
    });
  }, [liveValueRef]);

  const floatingRootContext = useFloatingRootContext({
    open,
    onOpenChange: setOpen,
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
  });

  const click = useClick(floatingRootContext, {
    event: 'mousedown',
  });

  const dismiss = useDismiss(floatingRootContext);

  const role = useRole(floatingRootContext, { role: 'select' });

  const listNavigation = useListNavigation(floatingRootContext, {
    listRef,
    activeIndex,
    selectedIndex,
    loop,
    onNavigate: setActiveIndex,
  });

  const typehaead = useTypeahead(floatingRootContext, {
    listRef: labelsRef,
    activeIndex,
    selectedIndex,
    onMatch(index) {
      if (open) {
        setActiveIndex(index);
      } else {
        setSelectedIndex(index);
        setLabel(labelsRef.current[index] ?? '');
      }
    },
    onTypingChange(typing) {
      typingRef.current = typing;
    },
  });

  const {
    getReferenceProps: getRootTriggerProps,
    getFloatingProps: getRootPositionerProps,
    getItemProps,
  } = useInteractions([click, dismiss, role, listNavigation, typehaead]);

  const rootContext = React.useMemo(
    () => ({
      id,
      name,
      required,
      disabled,
      readOnly,
      triggerElement,
      setTriggerElement,
      positionerElement,
      setPositionerElement,
      value,
      setValue,
      open,
      setOpen,
      mounted,
      setMounted,
      label,
      setLabel,
      valueRef,
      valuesRef,
      labelsRef,
      typingRef,
      selectionRef,
      getRootPositionerProps,
      getRootTriggerProps,
      getItemProps,
      listRef,
      popupRef,
      selectedOptionTextRef,
      floatingRootContext,
      touchModality,
      setTouchModality,
      alignOptionToTrigger,
      transitionStatus,
      fieldControlValidation,
    }),
    [
      id,
      name,
      required,
      disabled,
      readOnly,
      triggerElement,
      positionerElement,
      value,
      setValue,
      open,
      setOpen,
      mounted,
      setMounted,
      label,
      getRootPositionerProps,
      getRootTriggerProps,
      getItemProps,
      floatingRootContext,
      touchModality,
      alignOptionToTrigger,
      transitionStatus,
      fieldControlValidation,
    ],
  );

  const indexContext = React.useMemo(
    () => ({
      activeIndex,
      setActiveIndex,
      selectedIndex,
      setSelectedIndex,
    }),
    [activeIndex, selectedIndex],
  );

  return React.useMemo(
    () => ({
      rootContext,
      indexContext,
    }),
    [rootContext, indexContext],
  );
}

export namespace useSelectRoot {
  export interface Parameters<Value> {
    /**
     * If `true`, the Select supports CSS-based animations and transitions.
     * It is kept in the DOM until the animation completes.
     *
     * @default true
     */
    animated?: boolean;
    children: React.ReactNode;
    /**
     * The name of the Select in the owning form.
     */
    name?: string;
    /**
     * The id of the Select.
     */
    id?: string;
    /**
     * If `true`, the Select is required.
     * @default false
     */
    required?: boolean;
    /**
     * If `true`, the Select is read-only.
     * @default false
     */
    readOnly?: boolean;
    /**
     * If `true`, the Select is disabled.
     *
     * @default false
     */
    disabled?: boolean;
    /**
     * The value of the select.
     */
    value?: Value;
    /**
     * Callback fired when the value of the select changes. Use when controlled.
     */
    onValueChange?: (value: Value, event?: Event) => void;
    /**
     * The default value of the select.
     */
    defaultValue?: Value;
    /**
     * If `true`, the Select is initially open.
     *
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
     * @default true
     */
    loop?: boolean;
    /**
     * Callback fired when the component requests to be opened or closed.
     */
    onOpenChange?: (open: boolean, event: Event | undefined) => void;
    /**
     * Allows to control whether the dropdown is open.
     * This is a controlled counterpart of `defaultOpen`.
     */
    open?: boolean;
    /**
     * Determines if the selected option inside the popup should align to the trigger element.
     * @default true
     */
    alignOptionToTrigger?: boolean;
    /**
     * The transition status of the Select.
     */
    transitionStatus?: TransitionStatus;
  }

  export interface ReturnValue {
    rootContext: SelectRootContext;
    indexContext: SelectIndexContext;
  }
}
