import * as React from 'react';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
} from '@floating-ui/react';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { type TransitionStatus, useTransitionStatus } from '../../utils';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { warn } from '../../utils/warn';
import type { SelectRootContext } from './SelectRootContext';
import type { SelectIndexContext } from './SelectIndexContext';
import { useAfterExitAnimation } from '../../utils/useAfterExitAnimation';

export function useSelectRoot<T>(params: useSelectRoot.Parameters<T>): useSelectRoot.ReturnValue {
  const {
    disabled = false,
    readOnly = false,
    required = false,
    alignItemToTrigger: alignItemToTriggerParam = true,
  } = params;

  const id = useBaseUiId();

  const { setDirty, validityData, validationMode } = useFieldRootContext();
  const fieldControlValidation = useFieldControlValidation();

  const [value, setValueUnwrapped] = useControlled({
    controlled: params.value,
    default: params.defaultValue,
    name: 'Select',
    state: 'value',
  });

  const [open, setOpenUnwrapped] = useControlled({
    controlled: params.open,
    default: params.defaultOpen,
    name: 'Select',
    state: 'open',
  });

  const [controlledAlignItemToTrigger, setcontrolledAlignItemToTrigger] =
    React.useState(alignItemToTriggerParam);

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const valueRef = React.useRef<HTMLSpanElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const typingRef = React.useRef(false);
  const selectedItemTextRef = React.useRef<HTMLSpanElement | null>(null);
  const selectionRef = React.useRef({
    allowSelectedMouseUp: false,
    allowUnselectedMouseUp: false,
    allowSelect: false,
  });

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [label, setLabel] = React.useState('');
  const [touchModality, setTouchModality] = React.useState(false);
  const [scrollUpArrowVisible, setScrollUpArrowVisible] = React.useState(false);
  const [scrollDownArrowVisible, setScrollDownArrowVisible] = React.useState(false);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const alignItemToTrigger = Boolean(mounted && controlledAlignItemToTrigger && !touchModality);

  if (!mounted && controlledAlignItemToTrigger !== alignItemToTriggerParam) {
    setcontrolledAlignItemToTrigger(alignItemToTriggerParam);
  }

  if (!alignItemToTriggerParam || !mounted) {
    if (scrollUpArrowVisible) {
      setScrollUpArrowVisible(false);
    }
    if (scrollDownArrowVisible) {
      setScrollDownArrowVisible(false);
    }
  }

  const setOpen = useEventCallback((nextOpen: boolean, event?: Event) => {
    params.onOpenChange?.(nextOpen, event);
    setOpenUnwrapped(nextOpen);
  });

  useAfterExitAnimation({
    open,
    animatedElementRef: popupRef,
    onFinished: () => setMounted(false),
  });

  const setValue = useEventCallback((nextValue: any, event?: Event) => {
    params.onValueChange?.(nextValue, event);
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
      const stringValue =
        typeof value === 'string' || value === null ? value : JSON.stringify(value);
      const index = valuesRef.current.indexOf(stringValue);
      if (index !== -1) {
        setSelectedIndex(index);
        setLabel(labelsRef.current[index] ?? '');
      } else if (value) {
        warn(`The value \`${stringValue}\` is not present in the select items.`);
      }
    });
  }, [value]);

  const floatingRootContext = useFloatingRootContext({
    open,
    onOpenChange: setOpen,
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
  });

  const click = useClick(floatingRootContext, {
    enabled: !readOnly,
    event: 'mousedown',
  });

  const dismiss = useDismiss(floatingRootContext);

  const role = useRole(floatingRootContext, {
    role: 'select',
  });

  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: !readOnly,
    listRef,
    activeIndex,
    selectedIndex,
    onNavigate: setActiveIndex,
    // Implement our own listeners since `onPointerLeave` on each option fires while scrolling with
    // the `alignItemToTrigger` prop enabled, causing a performance issue on Chrome.
    focusItemOnHover: false,
  });

  const typehaead = useTypeahead(floatingRootContext, {
    enabled: !readOnly,
    listRef: labelsRef,
    activeIndex,
    selectedIndex,
    onMatch(index) {
      if (open) {
        setActiveIndex(index);
      } else {
        setValue(valuesRef.current[index]);
      }
    },
    onTypingChange(typing) {
      // FIXME: Floating UI doesn't support allowing space to select an item while the popup is
      // closed and the trigger isn't a native <button>.
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
      name: params.name,
      required,
      disabled,
      readOnly,
      triggerElement,
      setTriggerElement,
      positionerElement,
      setPositionerElement,
      scrollUpArrowVisible,
      setScrollUpArrowVisible,
      scrollDownArrowVisible,
      setScrollDownArrowVisible,
      setcontrolledAlignItemToTrigger,
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
      selectedItemTextRef,
      floatingRootContext,
      touchModality,
      setTouchModality,
      alignItemToTrigger,
      transitionStatus,
      fieldControlValidation,
    }),
    [
      id,
      params.name,
      required,
      disabled,
      readOnly,
      triggerElement,
      positionerElement,
      scrollUpArrowVisible,
      scrollDownArrowVisible,
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
      alignItemToTrigger,
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
    [activeIndex, selectedIndex, setActiveIndex],
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
     * Whether the component should ignore user actions.
     * @default false
     */
    disabled?: boolean;
    /**
     * The value of the select.
     */
    value?: Value | null;
    /**
     * Callback fired when the value of the select changes. Use when controlled.
     */
    onValueChange?: (value: Value, event?: Event) => void;
    /**
     * The default value of the select.
     * @default null
     */
    defaultValue?: Value | null;
    /**
     * Whether the select menu is initially open.
     * To render a controlled select menu, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
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
     * Determines if the selected item inside the popup should align to the trigger element.
     * @default true
     */
    alignItemToTrigger?: boolean;
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
