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
import { useLazyRef } from '../../utils/useLazyRef';
import { useControlled } from '../../utils/useControlled';
import { useTransitionStatus } from '../../utils';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { useSelector, Store } from '../../utils/store';
import { warn } from '../../utils/warn';
import { selectors, State } from '../store';
import type { SelectRootContext } from './SelectRootContext';
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

export function useSelectRoot<T>(params: useSelectRoot.Parameters<T>): useSelectRoot.ReturnValue {
  const {
    id: idProp,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    modal = false,
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
  const [label, setLabel] = React.useState('');
  const [touchModality, setTouchModality] = React.useState(false);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const store = useLazyRef(
    () =>
      new Store<State>({
        open,
        mounted,
        activeIndex: null,
        selectedIndex: null,
      }),
  ).current;

  React.useEffect(() => {
    store.update({ ...store.state, open, mounted });
  }, [open, mounted]);

  const activeIndex = useSelector(store, selectors.activeIndex);
  const selectedIndex = useSelector(store, selectors.selectedIndex);

  const controlRef = useLatestRef(triggerElement);
  const commitValidation = fieldControlValidation.commitValidation;

  const updateValue = useEventCallback((nextValue: any) => {
    const index = valuesRef.current.indexOf(nextValue);

    store.set('selectedIndex', index === -1 ? null : index);

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
      if (!nextOpen && store.state.activeIndex !== null) {
        const activeOption = listRef.current[store.state.activeIndex];
        // Wait for Floating UI's focus effect to have fired
        queueMicrotask(() => {
          activeOption?.setAttribute('tabindex', '-1');
        });
      }
    },
  );

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    store.set('activeIndex', null);
    onOpenChangeComplete?.(false);
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

  const setValue = useEventCallback((nextValue: any, event?: Event) => {
    params.onValueChange?.(nextValue, event);
    setValueUnwrapped(nextValue);

    if (!isValueControlled) {
      updateValue(nextValue);
    }
  });

  const hasRegisteredRef = React.useRef(false);

  const registerSelectedItem = useEventCallback((suppliedIndex: number | undefined) => {
    if (suppliedIndex !== undefined) {
      hasRegisteredRef.current = true;
    }

    const index = suppliedIndex ?? valuesRef.current.indexOf(value);
    const hasIndex = index !== -1;

    if (hasIndex || value === null) {
      store.set('selectedIndex', index);
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
  }, [value, registerSelectedItem]);

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

      store.set('activeIndex', nextActiveIndex);
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
        store.set('activeIndex', index);
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

  const rootContext: SelectRootContext = React.useMemo(() => {
    const c = {
      store,
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
      setOpen,
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
      registerSelectedItem,
      onOpenChangeComplete,
      keyboardActiveRef,
      alignItemWithTriggerActiveRef,
    };
    console.log(c);
    return c;
  }, [
    store,
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
    registerSelectedItem,
    onOpenChangeComplete,
  ]);

  return rootContext;
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

  export type ReturnValue = SelectRootContext;

  export interface Actions {
    unmount: () => void;
  }
}
