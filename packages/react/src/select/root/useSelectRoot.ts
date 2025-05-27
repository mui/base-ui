import * as React from 'react';
import {
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
} from '@floating-ui/react';
import { useClick } from '../../utils/floating-ui/useClick';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { useTransitionStatus } from '../../utils';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { warn } from '../../utils/warn';
import type { SelectRootContext } from './SelectRootContext';
import type { SelectIndexContext } from './SelectIndexContext';
import {
  translateOpenChangeReason,
  type BaseOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useFormContext } from '../../form/FormContext';
import { useLatestRef } from '../../utils/useLatestRef';
import { useField } from '../../field/useField';

export type SelectOpenChangeReason = BaseOpenChangeReason | 'window-resize';

const EMPTY_ARRAY: never[] = [];

export function useSelectRoot<Value>(
  params: Omit<useSelectRoot.Parameters<Value>, 'multiple' | 'onValueChange'> & {
    multiple?: false;
    onValueChange?: (value: Value, event?: Event) => void;
  },
): useSelectRoot.ReturnValue;

export function useSelectRoot<Value>(
  params: Omit<useSelectRoot.Parameters<Value>, 'multiple' | 'onValueChange'> & {
    multiple: true;
    onValueChange?: (value: Value[], event?: Event) => void;
  },
): useSelectRoot.ReturnValue;
export function useSelectRoot(params: any): useSelectRoot.ReturnValue {
  const {
    id: idProp,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    modal = false,
    multiple = false,
    name: nameProp,
    onOpenChangeComplete,
  } = params;

  const { clearErrors } = useFormContext();
  const {
    setDirty,
    validityData,
    validationMode,
    setControlId,
    setFilled,
    name: fieldName,
    disabled: fieldDisabled,
  } = useFieldRootContext();
  const fieldControlValidation = useFieldControlValidation();

  const id = useBaseUiId(idProp);

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  useModernLayoutEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  const [value, setValueUnwrapped] = useControlled({
    controlled: params.value,
    default: multiple && params.defaultValue === undefined ? [] : params.defaultValue,
    name: 'Select',
    state: 'value',
  });

  const [open, setOpenUnwrapped] = useControlled({
    controlled: params.open,
    default: params.defaultOpen,
    name: 'Select',
    state: 'open',
  });

  const isValueControlled = params.value !== undefined;

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const valueRef = React.useRef<HTMLSpanElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const typingRef = React.useRef(false);
  const keyboardActiveRef = React.useRef(false);
  const selectedItemTextRef = React.useRef<HTMLSpanElement | null>(null);
  const selectionRef = React.useRef({
    allowSelectedMouseUp: false,
    allowUnselectedMouseUp: false,
    allowSelect: false,
  });
  const alignItemWithTriggerActiveRef = React.useRef(false);

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const [typeaheadReady, setTypeaheadReady] = React.useState(open);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [label, setLabel] = React.useState('');
  const [touchModality, setTouchModality] = React.useState(false);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const controlRef = useLatestRef(triggerElement);
  const commitValidation = fieldControlValidation.commitValidation;

  const updateValue = useEventCallback((nextValue: any) => {
    const index = valuesRef.current.indexOf(nextValue);
    setSelectedIndex(index === -1 ? null : index);
    setLabel(labelsRef.current[index] ?? '');
    clearErrors(name);
    setDirty(nextValue !== validityData.initialValue);
  });

  useField({
    id,
    commitValidation,
    value,
    controlRef,
  });

  const prevValueRef = React.useRef(value);

  useModernLayoutEffect(() => {
    if (prevValueRef.current === value) {
      return;
    }

    clearErrors(name);
    commitValidation?.(value, true);
    if (validationMode === 'onChange') {
      commitValidation?.(value);
    }
  }, [value, commitValidation, clearErrors, name, validationMode]);

  useModernLayoutEffect(() => {
    setFilled(value !== null);
    if (prevValueRef.current !== value) {
      updateValue(value);
    }
  }, [setFilled, updateValue, value]);

  useModernLayoutEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  const setOpen = useEventCallback(
    (nextOpen: boolean, event: Event | undefined, reason: SelectOpenChangeReason | undefined) => {
      params.onOpenChange?.(nextOpen, event, reason);
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
    },
  );

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    setActiveIndex(null);
    onOpenChangeComplete?.(false);
    if (multiple && Array.isArray(value)) {
      const { indices } = getMultiValueData();
      if (indices.length > 0) {
        setSelectedIndex(indices[indices.length - 1]);
      } else {
        setSelectedIndex(null);
      }
    }
  });

  useOpenChangeComplete({
    enabled: !params.actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(params.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  function getMultiValueData(val = value) {
    let selectedValues: any[] = [];
    if (Array.isArray(val)) {
      selectedValues = val;
    } else if (val != null) {
      selectedValues = [val];
    } else {
      selectedValues = [];
    }

    const indices = selectedValues.map((v) => valuesRef.current.indexOf(v)).filter((i) => i !== -1);
    const labels = indices.map((i) => labelsRef.current[i] ?? '').join(', ');

    return {
      indices,
      labels,
    };
  }

  const setValue = useEventCallback((nextValue: any, event?: Event) => {
    if (multiple) {
      const currentVal = value;
      let currentSelectedItems: any[];

      if (Array.isArray(currentVal)) {
        currentSelectedItems = currentVal;
      } else if (currentVal != null) {
        currentSelectedItems = [currentVal];
      } else {
        currentSelectedItems = [];
      }

      const itemIsInArray = currentSelectedItems.includes(nextValue);
      const newValueArray = itemIsInArray
        ? currentSelectedItems.filter((v) => v !== nextValue)
        : [...currentSelectedItems, nextValue];

      params.onValueChange?.(newValueArray, event);
      setValueUnwrapped(newValueArray);
      setDirty(
        newValueArray.length > 0 ||
          (Array.isArray(validityData.initialValue) &&
            validityData.initialValue.length > 0 &&
            newValueArray.length !== validityData.initialValue.length) ||
          (!Array.isArray(validityData.initialValue) && newValueArray.length > 0),
      );
      clearErrors(name);

      const { labels } = getMultiValueData(newValueArray);
      if (newValueArray.length > 0) {
        setLabel(labels);
      } else {
        setSelectedIndex(null);
        setLabel('');
      }
      return;
    }

    params.onValueChange?.(nextValue, event);
    setValueUnwrapped(nextValue);
    setDirty(nextValue !== validityData.initialValue);
    clearErrors(name);

    const index = valuesRef.current.indexOf(nextValue);
    setSelectedIndex(index);
    setLabel(labelsRef.current[index] ?? '');

    if (!isValueControlled) {
      updateValue(nextValue);
    }
  });

  const hasRegisteredRef = React.useRef(false);

  const registerSelectedItem = useEventCallback((suppliedIndex: number | undefined) => {
    if (suppliedIndex !== undefined) {
      hasRegisteredRef.current = true;
    }

    if (multiple && Array.isArray(value)) {
      const { labels } = getMultiValueData(value);
      if (value.length > 0) {
        setLabel(labels);
      } else {
        setSelectedIndex(null);
        setLabel('');
      }
      return;
    }

    const index = suppliedIndex ?? valuesRef.current.indexOf(value);
    const hasIndex = index !== -1;

    if (hasIndex || value === null) {
      setSelectedIndex(hasIndex ? index : null);
      setLabel(hasIndex ? (labelsRef.current[index] ?? '') : '');
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      if (value) {
        const stringValue =
          typeof value === 'string' || value === null ? value : JSON.stringify(value);
        warn(`The value \`${stringValue}\` is not present in the select items.`);
      }
    }
  });

  useModernLayoutEffect(() => {
    if (!hasRegisteredRef.current) {
      return;
    }

    registerSelectedItem(undefined);
  }, [value, registerSelectedItem, multiple]);

  const floatingRootContext = useFloatingRootContext({
    open,
    onOpenChange(nextOpen, event, reason) {
      setOpen(nextOpen, event, translateOpenChangeReason(reason));
    },
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
  });

  const click = useClick(floatingRootContext, {
    enabled: !readOnly && !disabled,
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
    enabled: !readOnly && !disabled,
    listRef,
    activeIndex,
    selectedIndex,
    disabledIndices: EMPTY_ARRAY,
    onNavigate(nextActiveIndex) {
      // Retain the highlight while transitioning out.
      if (nextActiveIndex === null && !open) {
        return;
      }

      setActiveIndex(nextActiveIndex);
    },
    // Implement our own listeners since `onPointerLeave` on each option fires while scrolling with
    // the `alignItemWithTrigger=true`, causing a performance issue on Chrome.
    focusItemOnHover: false,
  });

  const typeahead = useTypeahead(floatingRootContext, {
    enabled: !readOnly && !disabled,
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

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNavigation,
    typeahead,
  ]);

  const rootContext: SelectRootContext = React.useMemo(
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
      typeaheadReady,
      setTypeaheadReady,
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
      triggerProps: getReferenceProps(),
      popupProps: getFloatingProps(),
      getItemProps,
      listRef,
      popupRef,
      selectedItemTextRef,
      floatingRootContext,
      touchModality,
      setTouchModality,
      transitionStatus,
      fieldControlValidation,
      modal,
      multiple,
      registerSelectedItem,
      onOpenChangeComplete,
      keyboardActiveRef,
      alignItemWithTriggerActiveRef,
    }),
    [
      id,
      name,
      required,
      disabled,
      readOnly,
      triggerElement,
      positionerElement,
      typeaheadReady,
      value,
      setValue,
      open,
      setOpen,
      mounted,
      setMounted,
      label,
      getReferenceProps,
      getFloatingProps,
      getItemProps,
      floatingRootContext,
      touchModality,
      transitionStatus,
      fieldControlValidation,
      modal,
      multiple,
      registerSelectedItem,
      onOpenChangeComplete,
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
  export interface SingleSelectionParameters<Value> {
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
     * Whether multiple items can be selected.
     * @default false
     */
    multiple?: false;
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
     * @type (open: boolean, event?: Event, reason?: Select.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: SelectOpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the select menu is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * Whether the select menu is currently open.
     */
    open?: boolean;
    /**
     * Determines if the select enters a modal state when open.
     * - `true`: user interaction is limited to the select: document page scroll is locked and and pointer interactions on outside elements are disabled.
     * - `false`: user interaction with the rest of the document is allowed.
     * @default true
     */
    modal?: boolean;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the select will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the select manually.
     * Useful when the select's animation is controlled by an external library.
     */
    actionsRef?: React.RefObject<Actions>;
  }

  export interface MultipleSelectionParameters<Value>
    extends Omit<SingleSelectionParameters<Value>, 'multiple'> {
    /**
     * Whether multiple items can be selected.
     * @default false
     */
    multiple: true;
  }

  export type Parameters<Value> =
    | SingleSelectionParameters<Value>
    | MultipleSelectionParameters<Value>;

  export interface ReturnValue {
    rootContext: SelectRootContext;
    indexContext: SelectIndexContext;
  }

  export interface Actions {
    unmount: () => void;
  }
}
