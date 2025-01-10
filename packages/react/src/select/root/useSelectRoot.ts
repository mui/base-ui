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
    id: idProp,
    disabled = false,
    readOnly = false,
    required = false,
    alignItemToTrigger: alignItemToTriggerParam = true,
    modal = false,
  } = params;

  const { setDirty, validityData, validationMode, setControlId } = useFieldRootContext();
  const fieldControlValidation = useFieldControlValidation();

  const id = useBaseUiId(idProp);

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

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

    // Workaround `enableFocusInside` in Floating UI setting `tabindex=0` of a non-highlighted
    // option upon close when tabbing out due to `keepMounted=true`:
    // https://github.com/floating-ui/floating-ui/pull/3004/files#diff-962a7439cdeb09ea98d4b622a45d517bce07ad8c3f866e089bda05f4b0bbd875R194-R199
    // This otherwise causes options to retain `tabindex=0` incorrectly when the popup is closed
    // when tabbing outside.
    if (!nextOpen && activeIndex !== null) {
      const activeOption = listRef.current[activeIndex];
      // Wait for Floating UI's focus effect to have fired
      queueMicrotask(() => {
        activeOption?.setAttribute('tabindex', '-1');
      });
    }
  });

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    setActiveIndex(null);
  });

  useAfterExitAnimation({
    enabled: !params.action,
    open,
    animatedElementRef: popupRef,
    onFinished: handleUnmount,
  });

  React.useImperativeHandle(params.action, () => ({ unmount: handleUnmount }), [handleUnmount]);

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

  const hasRegisteredRef = React.useRef(false);

  const registerSelectedItem = useEventCallback((suppliedIndex: number | undefined) => {
    if (suppliedIndex !== undefined) {
      hasRegisteredRef.current = true;
    }

    const stringValue = typeof value === 'string' || value === null ? value : JSON.stringify(value);
    const index = suppliedIndex ?? valuesRef.current.indexOf(stringValue);

    if (index !== -1) {
      setSelectedIndex(index);
      setLabel(labelsRef.current[index] ?? '');
    } else if (value) {
      warn(`The value \`${stringValue}\` is not present in the select items.`);
    }
  });

  useEnhancedEffect(() => {
    if (!hasRegisteredRef.current) {
      return;
    }

    registerSelectedItem(undefined);
  }, [value, registerSelectedItem]);

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

  const dismiss = useDismiss(floatingRootContext, {
    bubbles: false,
    outsidePressEvent: 'mousedown',
  });

  const role = useRole(floatingRootContext, {
    role: 'select',
  });

  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: !readOnly,
    listRef,
    activeIndex,
    selectedIndex,
    onNavigate(nextActiveIndex) {
      // Retain the highlight while transitioning out.
      if (nextActiveIndex === null && !open) {
        return;
      }

      setActiveIndex(nextActiveIndex);
    },
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
      modal,
      registerSelectedItem,
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
      modal,
      registerSelectedItem,
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
     * Identifies the field when a form is submitted.
     */
    name?: string;
    /**
     * The id of the Select.
     */
    id?: string;
    /**
     * Whether the user must choose a value before submitting a form.
     * @default false
     */
    required?: boolean;
    /**
     * Whether the user should be unable to choose a different option from the select menu.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Whether the component should ignore user interaction.
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
     * The uncontrolled value of the select when it’s initially rendered.
     *
     * To render a controlled select, use the `value` prop instead.
     * @default null
     */
    defaultValue?: Value | null;
    /**
     * Whether the select menu is initially open.
     *
     * To render a controlled select menu, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the select menu is opened or closed.
     */
    onOpenChange?: (open: boolean, event: Event | undefined) => void;
    /**
     * Whether the select menu is currently open.
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
    /**
     * Whether the select should prevent outside clicks and lock page scroll when open.
     * @default true
     */
    modal?: boolean;
    /**
     * A ref to imperative actions.
     */
    action?: React.RefObject<{ unmount: () => void }>;
  }

  export interface ReturnValue {
    rootContext: SelectRootContext;
    indexContext: SelectIndexContext;
  }
}
