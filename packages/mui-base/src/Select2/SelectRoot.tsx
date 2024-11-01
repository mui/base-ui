'use client';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
} from '@floating-ui/react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useControlled } from '../utils/useControlled';
import { TransitionStatus, useTransitionStatus } from '../utils';
import { useAnimationsFinished } from '../utils/useAnimationsFinished';
import { GenericHTMLProps } from '../utils/types';
import { useEventCallback } from '../utils/useEventCallback';
import { useLatestRef } from '../utils/useLatestRef';
import { useEnhancedEffect } from '../utils/useEnhancedEffect';
import { warn } from '../utils/warn';
import { useFieldRootContext } from '../Field/Root/FieldRootContext';
import { useFieldControlValidation } from '../Field/Control/useFieldControlValidation';
import { useId } from '../utils/useId';

export interface SelectRootContext extends useFieldControlValidation.ReturnValue {
  value: any;
  setValue: (nextValue: any, event?: Event) => void;
  open: boolean;
  setOpen: (nextOpen: boolean, event?: Event) => void;
  mounted: boolean;
  disabled: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  transitionStatus: TransitionStatus;
  triggerElement: HTMLElement | null;
  setTriggerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  positionerElement: HTMLElement | null;
  setPositionerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  listRef: React.MutableRefObject<Array<HTMLElement | null>>;
  popupRef: React.MutableRefObject<HTMLDivElement | null>;
  getRootTriggerProps: (props?: GenericHTMLProps) => GenericHTMLProps;
  getRootPositionerProps: (props?: GenericHTMLProps) => GenericHTMLProps;
  getItemProps: (
    props?: GenericHTMLProps & { active?: boolean; selected?: boolean },
  ) => Record<string, unknown>;
  floatingRootContext: ReturnType<typeof useFloatingRootContext>;
  label: string;
  setLabel: React.Dispatch<React.SetStateAction<string>>;
  valuesRef: React.MutableRefObject<Array<any>>;
  valueRef: React.MutableRefObject<HTMLSpanElement | null>;
  selectedOptionTextRef: React.MutableRefObject<HTMLSpanElement | null>;
  labelsRef: React.MutableRefObject<Array<string | null>>;
  touchModality: boolean;
  setTouchModality: React.Dispatch<React.SetStateAction<boolean>>;
  alignOptionToTrigger: boolean;
  innerFallback: boolean;
  typingRef: React.MutableRefObject<boolean>;
  selectionRef: React.MutableRefObject<{
    allowMouseUp: boolean;
    allowSelect: boolean;
  }>;
  id: string | undefined;
}

interface SelectIndexContext {
  activeIndex: number | null;
  setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
  selectedIndex: number | null;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

const SelectRootContext = React.createContext<SelectRootContext | null>(null);
const SelectIndexContext = React.createContext<SelectIndexContext | null>(null);

export function useSelectIndexContext() {
  const context = React.useContext(SelectIndexContext);
  if (context === null) {
    throw new Error('useSelectIndexContext must be used within a SelectIndexContext');
  }
  return context;
}

export function useSelectRootContext() {
  const context = React.useContext(SelectRootContext);
  if (context === null) {
    throw new Error('useSelectRootContext must be used within a SelectRoot');
  }
  return context;
}

export const SelectRoot: SelectRoot = function SelectRoot<Value>(
  props: SelectRoot.Props<Value>,
): React.JSX.Element {
  const {
    children,
    value: valueProp,
    onValueChange,
    defaultValue,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    animated,
    loop = true,
    disabled = false,
    alignOptionToTrigger: alignOptionToTriggerProp = true,
  } = props;

  const id = useId();

  const { setDirty, validityData, validationMode } = useFieldRootContext();
  const fieldControlValidation = useFieldControlValidation();

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [label, setLabel] = React.useState('');
  const [touchModality, setTouchModality] = React.useState(false);

  const alignOptionToTrigger = alignOptionToTriggerProp && !touchModality;

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
  const selectionRef = React.useRef({ allowMouseUp: false, allowSelect: false });

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

  const innerFallback = false;

  const rootContextValue = React.useMemo(
    () => ({
      id,
      open,
      setOpen,
      mounted,
      setMounted,
      value,
      setValue,
      disabled,
      transitionStatus,
      label,
      setLabel,
      valueRef,
      valuesRef,
      labelsRef,
      triggerElement,
      setTriggerElement,
      positionerElement,
      setPositionerElement,
      getRootPositionerProps,
      getRootTriggerProps,
      getItemProps,
      activeIndex,
      setActiveIndex,
      selectedIndex,
      setSelectedIndex,
      listRef,
      popupRef,
      selectedOptionTextRef,
      floatingRootContext,
      touchModality,
      setTouchModality,
      alignOptionToTrigger,
      innerFallback,
      typingRef,
      selectionRef,
      ...fieldControlValidation,
    }),
    [
      id,
      open,
      setOpen,
      mounted,
      setMounted,
      value,
      setValue,
      disabled,
      transitionStatus,
      label,
      valueRef,
      triggerElement,
      positionerElement,
      getRootPositionerProps,
      getRootTriggerProps,
      getItemProps,
      activeIndex,
      selectedIndex,
      floatingRootContext,
      touchModality,
      alignOptionToTrigger,
      innerFallback,
      fieldControlValidation,
    ],
  );

  const indexContextValue = React.useMemo(
    () => ({
      activeIndex,
      setActiveIndex,
      selectedIndex,
      setSelectedIndex,
    }),
    [activeIndex, setActiveIndex, selectedIndex, setSelectedIndex],
  );

  return (
    <SelectRootContext.Provider value={rootContextValue}>
      <SelectIndexContext.Provider value={indexContextValue}>
        {children}
      </SelectIndexContext.Provider>
    </SelectRootContext.Provider>
  );
};

namespace SelectRoot {
  export interface Props<Value> {
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
  }
}

interface SelectRoot {
  <Value>(props: SelectRoot.Props<Value>): React.JSX.Element;
  propTypes?: any;
}
