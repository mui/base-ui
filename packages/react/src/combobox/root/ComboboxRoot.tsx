import * as React from 'react';
import {
  ElementProps,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
} from '@floating-ui/react';
import { contains, getTarget } from '@floating-ui/react/utils';
import { useClick } from '../../utils/floating-ui/useClick';
import {
  BaseOpenChangeReason,
  translateOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { ComboboxFloatingContext, ComboboxRootContext } from './ComboboxRootContext';
import { useControlled, useModernLayoutEffect, useTransitionStatus } from '../../utils';
import { selectors, type State as StoreState } from '../store';
import { Store, useSelector } from '../../utils/store';
import { useLazyRef } from '../../utils/useLazyRef';
import { useEventCallback } from '../../utils/useEventCallback';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useOnFirstRender } from '../../utils/useOnFirstRender';
import { CompositeList } from '../../composite/list/CompositeList';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFormContext } from '../../form/FormContext';
import { useField } from '../../field/useField';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useForkRef } from '../../utils/useForkRef';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useLatestRef } from '../../utils/useLatestRef';

/**
 * Groups all parts of a combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxRoot<Value, Multiple extends boolean = false>(
  props: ComboboxRoot.Props<Value, Multiple>,
) {
  const {
    id: idProp,
    onOpenChangeComplete,
    defaultValue,
    selectable = false,
    onItemHighlighted: onItemHighlightedProp,
    multiple = false as Multiple,
    name: nameProp,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    inputRef: inputRefProp,
  } = props;

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

  // Memoize the initial uncontrolled value so its reference stays stable
  const defaultUncontrolledValue = React.useMemo((): Multiple extends true ? Value[] : Value => {
    if (multiple) {
      return (
        defaultValue !== null && defaultValue !== undefined ? defaultValue : []
      ) as Multiple extends true ? Value[] : Value;
    }
    return (
      defaultValue !== null && defaultValue !== undefined ? defaultValue : ''
    ) as Multiple extends true ? Value[] : Value;
  }, []);

  const [value, setValueUnwrapped] = useControlled<Multiple extends true ? Value[] : Value>({
    controlled: props.value,
    default: defaultUncontrolledValue,
    name: 'Combobox',
    state: 'value',
  });

  const [openRaw, setOpenUnwrapped] = useControlled({
    controlled: props.open,
    default: props.defaultOpen,
    name: 'Combobox',
    state: 'open',
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(openRaw);

  const store = useLazyRef(
    () =>
      new Store<StoreState>({
        id,
        value,
        open: openRaw,
        mounted,
        transitionStatus,
        inline: false,
        activeIndex: null,
        selectedIndex: null,
        popupProps: {},
        triggerProps: {},
        triggerElement: null,
        positionerElement: null,
        listElement: null,
      }),
  ).current;

  const onItemHighlighted = useEventCallback(onItemHighlightedProp);

  const activeIndex = useSelector(store, selectors.activeIndex);
  const triggerElement = useSelector(store, selectors.triggerElement);
  const positionerElement = useSelector(store, selectors.positionerElement);
  const listElement = useSelector(store, selectors.listElement);
  const inline = useSelector(store, selectors.inline);
  const open = inline ? true : openRaw;

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const keyboardActiveRef = React.useRef(true);
  const allowActiveIndexSyncRef = React.useRef(true);

  const controlRef = useLatestRef(triggerElement);
  const commitValidation = fieldControlValidation.commitValidation;

  const updateValue = useEventCallback((nextValue: Multiple extends true ? Value[] : Value) => {
    clearErrors(name);
    setDirty(nextValue !== validityData.initialValue);
  });

  useField({
    id,
    commitValidation,
    value,
    controlRef,
    name,
    getValue: () => value,
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
    const hasValue = multiple
      ? Array.isArray(value) && value.length > 0
      : value !== null && value !== undefined && value !== '';
    setFilled(hasValue);
    if (prevValueRef.current !== value) {
      updateValue(value);
    }
  }, [setFilled, updateValue, value, multiple]);

  useModernLayoutEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  const setOpen = useEventCallback(
    (nextOpen: boolean, event: Event | undefined, reason: BaseOpenChangeReason | undefined) => {
      props.onOpenChange?.(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
    },
  );

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    store.set('activeIndex', null);
    onItemHighlighted(undefined, 'pointer');
    onOpenChangeComplete?.(false);
  });

  useOpenChangeComplete({
    enabled: !props.actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  const setValue = useEventCallback(
    (
      nextValue: Multiple extends true ? Value[] : Value,
      event: Event | undefined,
      reason: string | undefined,
    ) => {
      props.onValueChange?.(nextValue, event, reason);
      setValueUnwrapped(nextValue);
    },
  );

  React.useImperativeHandle(props.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const hasRegisteredRef = React.useRef(false);

  const registerSelectedItem = useEventCallback((suppliedIndex: number | undefined) => {
    if (suppliedIndex !== undefined) {
      hasRegisteredRef.current = true;
    }

    if (multiple) {
      // For multiple selection, we need to handle arrays
      const currentValue = value as Value[];
      const selectedIndices: number[] = [];

      if (Array.isArray(currentValue)) {
        currentValue.forEach((val) => {
          const index = valuesRef.current.indexOf(val);
          if (index !== -1) {
            selectedIndices.push(index);
          }
        });
      }

      store.apply({ selectedIndex: selectedIndices.length > 0 ? selectedIndices : null });
    } else {
      // Single selection logic (existing)
      const index = suppliedIndex ?? valuesRef.current.indexOf(value);
      const hasIndex = index !== -1;

      if (hasIndex || value === null) {
        store.apply({ selectedIndex: index });
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
    open: inline ? true : open,
    onOpenChange(nextOpen, event, reason) {
      setOpen(nextOpen, event, translateOpenChangeReason(reason));
    },
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
  });

  const role: ElementProps = React.useMemo(
    () => ({
      reference: {
        role: 'combobox',
        'aria-expanded': open ? 'true' : 'false',
        'aria-haspopup': 'listbox',
        'aria-controls': open ? listElement?.id : undefined,
        'aria-autocomplete': 'list',
        autoComplete: 'off',
        spellCheck: 'false',
        autoCorrect: 'off',
        autoCapitalize: 'off',
      },
      floating: {
        role: 'presentation',
      },
    }),
    [open, listElement?.id],
  );

  const click = useClick(floatingRootContext, {
    enabled: !readOnly && !disabled,
    event: 'mousedown-only',
    toggle: false,
  });

  const dismiss = useDismiss(floatingRootContext, {
    enabled: !readOnly && !disabled,
    bubbles: true,
    outsidePress(event) {
      const target = getTarget(event) as Element | null;
      return !contains(triggerRef.current, target);
    },
  });

  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: !readOnly && !disabled,
    listRef,
    activeIndex,
    virtual: true,
    loop: true,
    allowEscape: true,
    focusItemOnOpen: false,
    onNavigate(nextActiveIndex) {
      // Retain the highlight while transitioning out.
      if (nextActiveIndex === null && !open) {
        return;
      }

      const type = keyboardActiveRef.current ? 'keyboard' : 'pointer';
      if (nextActiveIndex !== null) {
        onItemHighlighted(valuesRef.current[nextActiveIndex], type);
      } else {
        onItemHighlighted(undefined, type);
      }

      store.set('activeIndex', nextActiveIndex);
    },
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    role,
    click,
    dismiss,
    listNavigation,
  ]);

  useOnFirstRender(() => {
    // These should be initialized at store creation, but there is an interdependency
    // between some values used in floating hooks above.
    store.apply({
      popupProps: getFloatingProps(),
      triggerProps: getReferenceProps(),
    });
  });

  // Store values that depend on other hooks
  React.useEffect(() => {
    store.apply({
      id,
      value,
      open,
      mounted,
      transitionStatus,
      popupProps: getFloatingProps(),
      triggerProps: getReferenceProps(),
    });
  }, [store, id, value, open, mounted, transitionStatus, getFloatingProps, getReferenceProps]);

  const hiddenInputRef = useForkRef(inputRefProp, fieldControlValidation.inputRef);

  const serializedValue = React.useMemo(() => {
    if (value == null || Array.isArray(value)) {
      return ''; // avoid uncontrolled -> controlled error
    }
    return getFormValue(value);
  }, [value]);

  const contextValue: ComboboxRootContext<Value, Multiple> = React.useMemo(
    () => ({
      selectable,
      mounted,
      value,
      setValue,
      open,
      setOpen,
      listRef,
      popupRef,
      triggerRef,
      valuesRef,
      inputRef,
      keyboardActiveRef,
      allowActiveIndexSyncRef,
      triggerElement,
      positionerElement,
      store,
      getItemProps,
      registerSelectedItem,
      onItemHighlighted,
      multiple,
      name,
      disabled,
      readOnly,
      required,
      fieldControlValidation,
    }),
    [
      selectable,
      mounted,
      open,
      positionerElement,
      setOpen,
      setValue,
      triggerElement,
      value,
      store,
      getItemProps,
      registerSelectedItem,
      onItemHighlighted,
      multiple,
      name,
      disabled,
      readOnly,
      required,
      fieldControlValidation,
    ],
  );

  return (
    <ComboboxRootContext.Provider value={contextValue}>
      <ComboboxFloatingContext.Provider value={floatingRootContext}>
        <CompositeList elementsRef={listRef}>
          {props.children}
          <input
            {...fieldControlValidation.getInputValidationProps({
              onFocus() {
                // Move focus to the trigger element when the hidden input is focused.
                store.state.triggerElement?.focus();
              },
              // Handle browser autofill.
              onChange(event: React.ChangeEvent<HTMLSelectElement>) {
                // Workaround for https://github.com/facebook/react/issues/9023
                if (event.nativeEvent.defaultPrevented) {
                  return;
                }

                const nextValue = event.target.value;

                const exactValue = valuesRef.current.find(
                  (v: any) =>
                    v === nextValue ||
                    (typeof value === 'string' && nextValue.toLowerCase() === v.toLowerCase()),
                );

                if (exactValue != null) {
                  setDirty(exactValue !== validityData.initialValue);
                  setValue?.(exactValue, event.nativeEvent, 'input-change');

                  if (validationMode === 'onChange') {
                    fieldControlValidation.commitValidation(exactValue);
                  }
                }
              },
              id,
              name: multiple ? undefined : name,
              disabled,
              required,
              readOnly,
              value: serializedValue,
              ref: hiddenInputRef,
              style: visuallyHidden,
              tabIndex: -1,
              'aria-hidden': true,
            })}
          />
          {multiple &&
            Array.isArray(value) &&
            value.map((v, index) => (
              <input key={index} type="hidden" name={name} value={getFormValue(v)} />
            ))}
        </CompositeList>
      </ComboboxFloatingContext.Provider>
    </ComboboxRootContext.Provider>
  );
}

export namespace ComboboxRoot {
  export interface State {}

  export interface Props<Value, Multiple extends boolean = false> {
    children?: React.ReactNode;
    /**
     * Identifies the field when a form is submitted.
     */
    name?: string;
    /**
     * The id of the combobox.
     */
    id?: string;
    /**
     * Whether the user must choose a value before submitting a form.
     * @default false
     */
    required?: boolean;
    /**
     * Whether the user should be unable to choose a different option from the combobox popup.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether the combobox allows multiple selections.
     * @default false
     */
    multiple?: Multiple;
    /**
     * The value of the combobox.
     */
    value?: Multiple extends true ? Value[] : Value;
    /**
     * Callback fired when the value of the combobox changes. Use when controlled.
     */
    onValueChange?: (
      value: Multiple extends true ? Value[] : Value,
      event: Event | undefined,
      reason: string | undefined,
    ) => void;
    /**
     * The uncontrolled value of the combobox when it's initially rendered.
     *
     * To render a controlled combobox, use the `value` prop instead.
     * @default null
     */
    defaultValue?: Multiple extends true ? Value[] | null : Value | null;
    /**
     * Whether the combobox popup is initially open.
     *
     * To render a controlled combobox popup, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the combobox popup is opened or closed.
     * @type (open: boolean, event?: Event, reason?: combobox.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: BaseOpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the combobox popup is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * Whether the combobox popup is currently open.
     */
    open?: boolean;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the combobox will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the combobox manually.
     * Useful when the combobox's animation is controlled by an external library.
     */
    actionsRef?: React.RefObject<Actions>;
    /**
     * Whether the combobox should be selectable.
     * @default true
     */
    selectable?: boolean;
    /**
     * Callback fired when the user navigates the list and highlights an item.
     * Passes the item's `value` or `undefined` when no item is highlighted.
     */
    onItemHighlighted?: (value: Value | undefined, type: 'keyboard' | 'pointer') => void;
    /**
     * A ref to the hidden input element used for form submission.
     */
    inputRef?: React.RefObject<HTMLInputElement>;
  }

  export interface Actions {
    unmount: () => void;
  }
}

function getFormValue(value: any) {
  if (value && typeof value === 'object') {
    return value.id ?? value.value ?? value.name ?? String(value);
  }
  return String(value);
}
