'use client';
import * as React from 'react';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useOnFirstRender } from '@base-ui/utils/useOnFirstRender';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useStore, Store } from '@base-ui/utils/store';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
  useTypeahead,
} from '../../floating-ui-react';
import { SelectRootContext, SelectFloatingContext } from './SelectRootContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { selectors, type State as StoreState } from '../store';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useFormContext } from '../../form/FormContext';
import { useField } from '../../field/useField';
import { stringifyAsValue } from '../../utils/resolveValueLabel';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '../../utils/constants';
import { defaultItemEquality, findItemIndex } from '../../utils/itemEquality';
import { useValueChanged } from '../../utils/useValueChanged';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { mergeProps } from '../../merge-props';

/**
 * Groups all parts of the select.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectRoot<Value, Multiple extends boolean | undefined = false>(
  props: SelectRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const {
    id,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    name: nameProp,
    autoComplete,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    modal = true,
    actionsRef,
    inputRef,
    onOpenChangeComplete,
    items,
    multiple = false,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue = defaultItemEquality,
    highlightItemOnHover = true,
    children,
  } = props;

  const { clearErrors } = useFormContext();
  const {
    setDirty,
    setTouched,
    setFocused,
    shouldValidateOnChange,
    validityData,
    setFilled,
    name: fieldName,
    disabled: fieldDisabled,
    validation,
    validationMode,
  } = useFieldRootContext();

  const generatedId = useLabelableId({ id });

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: multiple ? (defaultValue ?? EMPTY_ARRAY) : defaultValue,
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
  const scrollHandlerRef = React.useRef<((el: HTMLDivElement) => void) | null>(null);
  const scrollArrowsMountedCountRef = React.useRef(0);
  const valueRef = React.useRef<HTMLSpanElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const typingRef = React.useRef(false);
  const keyboardActiveRef = React.useRef(false);
  const selectedItemTextRef = React.useRef<HTMLSpanElement | null>(null);
  const selectionRef = React.useRef({
    allowSelectedMouseUp: false,
    allowUnselectedMouseUp: false,
  });
  const alignItemWithTriggerActiveRef = React.useRef(false);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const {
    openMethod,
    triggerProps: interactionTypeProps,
    reset: resetOpenInteractionType,
  } = useOpenInteractionType(open);

  const store = useRefWithInit(
    () =>
      new Store<StoreState>({
        id: generatedId,
        modal,
        multiple,
        itemToStringLabel,
        itemToStringValue,
        isItemEqualToValue,
        value,
        open,
        mounted,
        transitionStatus,
        items,
        forceMount: false,
        openMethod: null,
        activeIndex: null,
        selectedIndex: null,
        popupProps: {},
        triggerProps: {},
        triggerElement: null,
        positionerElement: null,
        listElement: null,
        scrollUpArrowVisible: false,
        scrollDownArrowVisible: false,
        hasScrollArrows: false,
      }),
  ).current;

  const activeIndex = useStore(store, selectors.activeIndex);
  const selectedIndex = useStore(store, selectors.selectedIndex);
  const triggerElement = useStore(store, selectors.triggerElement);
  const positionerElement = useStore(store, selectors.positionerElement);

  const serializedValue = React.useMemo(() => {
    if (multiple && Array.isArray(value) && value.length === 0) {
      return '';
    }
    return stringifyAsValue(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);

  const fieldStringValue = React.useMemo(() => {
    if (multiple && Array.isArray(value)) {
      return value.map((currentValue) => stringifyAsValue(currentValue, itemToStringValue));
    }
    return stringifyAsValue(value, itemToStringValue);
  }, [multiple, value, itemToStringValue]);

  const controlRef = useValueAsRef(store.state.triggerElement);

  useField({
    id: generatedId,
    commit: validation.commit,
    value,
    controlRef,
    name,
    getValue: () => fieldStringValue,
  });

  const initialValueRef = React.useRef(value);
  useIsoLayoutEffect(() => {
    // Ensure the values and labels are registered for programmatic value changes.
    if (value !== initialValueRef.current) {
      store.set('forceMount', true);
    }
  }, [store, value]);

  useIsoLayoutEffect(() => {
    setFilled(multiple ? Array.isArray(value) && value.length > 0 : value != null);
  }, [multiple, value, setFilled]);

  useIsoLayoutEffect(
    function syncSelectedIndex() {
      if (open) {
        return;
      }

      const registry = valuesRef.current;

      if (multiple) {
        const currentValue = Array.isArray(value) ? value : [];
        if (currentValue.length === 0) {
          store.set('selectedIndex', null);
          return;
        }

        const lastValue = currentValue[currentValue.length - 1];
        const lastIndex = findItemIndex(registry, lastValue, isItemEqualToValue);
        store.set('selectedIndex', lastIndex === -1 ? null : lastIndex);
        return;
      }

      const index = findItemIndex(registry, value as Value, isItemEqualToValue);
      store.set('selectedIndex', index === -1 ? null : index);
    },
    [multiple, open, value, valuesRef, isItemEqualToValue, store],
  );

  useValueChanged(value, () => {
    clearErrors(name);
    setDirty(value !== validityData.initialValue);

    if (shouldValidateOnChange()) {
      validation.commit(value);
    } else {
      validation.commit(value, true);
    }
  });

  const setOpen = useStableCallback(
    (nextOpen: boolean, eventDetails: SelectRoot.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setOpenUnwrapped(nextOpen);

      if (
        !nextOpen &&
        (eventDetails.reason === REASONS.focusOut || eventDetails.reason === REASONS.outsidePress)
      ) {
        setTouched(true);
        setFocused(false);

        if (validationMode === 'onBlur') {
          validation.commit(value);
        }
      }

      // The active index will sync to the last selected index on the next open.
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

  const handleUnmount = useStableCallback(() => {
    setMounted(false);
    store.set('activeIndex', null);
    resetOpenInteractionType();
    onOpenChangeComplete?.(false);
  });

  useOpenChangeComplete({
    enabled: !actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const setValue = useStableCallback(
    (nextValue: any, eventDetails: SelectRoot.ChangeEventDetails) => {
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);
    },
  );

  const handleScrollArrowVisibility = useStableCallback(() => {
    const scroller = store.state.listElement || popupRef.current;
    if (!scroller) {
      return;
    }

    const viewportTop = scroller.scrollTop;
    const viewportBottom = scroller.scrollTop + scroller.clientHeight;
    const shouldShowUp = viewportTop > 1;
    const shouldShowDown = viewportBottom < scroller.scrollHeight - 1;

    if (store.state.scrollUpArrowVisible !== shouldShowUp) {
      store.set('scrollUpArrowVisible', shouldShowUp);
    }
    if (store.state.scrollDownArrowVisible !== shouldShowDown) {
      store.set('scrollDownArrowVisible', shouldShowDown);
    }
  });

  const floatingContext = useFloatingRootContext({
    open,
    onOpenChange: setOpen,
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
  });

  const click = useClick(floatingContext, {
    enabled: !readOnly && !disabled,
    event: 'mousedown',
  });

  const dismiss = useDismiss(floatingContext, {
    bubbles: false,
  });

  const listNavigation = useListNavigation(floatingContext, {
    enabled: !readOnly && !disabled,
    listRef,
    activeIndex,
    selectedIndex,
    disabledIndices: EMPTY_ARRAY as number[],
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

  const typeahead = useTypeahead(floatingContext, {
    enabled: !readOnly && !disabled && (open || !multiple),
    listRef: labelsRef,
    activeIndex,
    selectedIndex,
    onMatch(index) {
      if (open) {
        store.set('activeIndex', index);
      } else {
        setValue(valuesRef.current[index], createChangeEventDetails('none'));
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
    listNavigation,
    typeahead,
  ]);

  const mergedTriggerProps = React.useMemo(() => {
    return mergeProps(
      getReferenceProps(),
      interactionTypeProps,
      generatedId ? { id: generatedId } : EMPTY_OBJECT,
    );
  }, [getReferenceProps, interactionTypeProps, generatedId]);

  useOnFirstRender(() => {
    store.update({
      popupProps: getFloatingProps(),
      triggerProps: mergedTriggerProps,
    });
  });

  useIsoLayoutEffect(() => {
    store.update({
      id: generatedId,
      modal,
      multiple,
      value,
      open,
      mounted,
      transitionStatus,
      popupProps: getFloatingProps(),
      triggerProps: mergedTriggerProps,
      items,
      itemToStringLabel,
      itemToStringValue,
      isItemEqualToValue,
      openMethod,
    });
  }, [
    store,
    generatedId,
    modal,
    multiple,
    value,
    open,
    mounted,
    transitionStatus,
    getFloatingProps,
    mergedTriggerProps,
    items,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
    openMethod,
  ]);

  const contextValue: SelectRootContext = React.useMemo(
    () => ({
      store,
      name,
      required,
      disabled,
      readOnly,
      multiple,
      itemToStringLabel,
      itemToStringValue,
      highlightItemOnHover,
      setValue,
      setOpen,
      listRef,
      popupRef,
      scrollHandlerRef,
      handleScrollArrowVisibility,
      scrollArrowsMountedCountRef,
      getItemProps,
      events: floatingContext.context.events,
      valueRef,
      valuesRef,
      labelsRef,
      typingRef,
      selectionRef,
      selectedItemTextRef,
      validation,
      onOpenChangeComplete,
      keyboardActiveRef,
      alignItemWithTriggerActiveRef,
      initialValueRef,
    }),
    [
      store,
      name,
      required,
      disabled,
      readOnly,
      multiple,
      itemToStringLabel,
      itemToStringValue,
      highlightItemOnHover,
      setValue,
      setOpen,
      getItemProps,
      floatingContext.context.events,
      validation,
      onOpenChangeComplete,
      handleScrollArrowVisibility,
    ],
  );

  const ref = useMergedRefs(inputRef, validation.inputRef);

  const hasMultipleSelection = multiple && Array.isArray(value) && value.length > 0;
  const hiddenInputName = multiple ? undefined : name;

  const hiddenInputs = React.useMemo(() => {
    if (!multiple || !Array.isArray(value) || !name) {
      return null;
    }

    return value.map((v) => {
      const currentSerializedValue = stringifyAsValue(v, itemToStringValue);
      return (
        <input
          key={currentSerializedValue}
          type="hidden"
          name={name}
          value={currentSerializedValue}
        />
      );
    });
  }, [multiple, value, name, itemToStringValue]);

  return (
    <SelectRootContext.Provider value={contextValue}>
      <SelectFloatingContext.Provider value={floatingContext}>
        {children}
        <input
          {...validation.getInputValidationProps({
            onFocus() {
              // Move focus to the trigger element when the hidden input is focused.
              store.state.triggerElement?.focus({
                // Supported in Chrome from 144 (January 2026)
                // @ts-expect-error - focusVisible is not yet in the lib.dom.d.ts
                focusVisible: true,
              });
            },
            // Handle browser autofill.
            onChange(event: React.ChangeEvent<HTMLInputElement>) {
              // Workaround for https://github.com/facebook/react/issues/9023
              if (event.nativeEvent.defaultPrevented) {
                return;
              }

              const nextValue = event.target.value;
              const details = createChangeEventDetails(REASONS.none, event.nativeEvent);

              function handleChange() {
                if (multiple) {
                  // Browser autofill only writes a single scalar value.
                  return;
                }

                // Handle single selection: match against registered values using serialization
                const matchingValue = valuesRef.current.find((v) => {
                  const candidate = stringifyAsValue(v, itemToStringValue);
                  if (candidate.toLowerCase() === nextValue.toLowerCase()) {
                    return true;
                  }
                  return false;
                });

                if (matchingValue != null) {
                  setDirty(matchingValue !== validityData.initialValue);
                  setValue(matchingValue, details);

                  if (shouldValidateOnChange()) {
                    validation.commit(matchingValue);
                  }
                }
              }

              store.set('forceMount', true);
              queueMicrotask(handleChange);
            },
          })}
          id={generatedId && hiddenInputName == null ? `${generatedId}-hidden-input` : undefined}
          name={hiddenInputName}
          autoComplete={autoComplete}
          value={serializedValue}
          disabled={disabled}
          required={required && !hasMultipleSelection}
          readOnly={readOnly}
          ref={ref}
          style={name ? visuallyHiddenInput : visuallyHidden}
          tabIndex={-1}
          aria-hidden
        />
        {hiddenInputs}
      </SelectFloatingContext.Provider>
    </SelectRootContext.Provider>
  );
}

type SelectValueType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

export interface SelectRootProps<Value, Multiple extends boolean | undefined = false> {
  children?: React.ReactNode;
  /**
   * A ref to access the hidden input element.
   */
  inputRef?: React.Ref<HTMLInputElement> | undefined;
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined;
  /**
   * Provides a hint to the browser for autofill.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
   */
  autoComplete?: string | undefined;
  /**
   * The id of the Select.
   */
  id?: string | undefined;
  /**
   * Whether the user must choose a value before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
  /**
   * Whether the user should be unable to choose a different option from the select popup.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether multiple items can be selected.
   * @default false
   */
  multiple?: Multiple | undefined;
  /**
   * Whether moving the pointer over items should highlight them.
   * Disabling this prop allows CSS `:hover` to be differentiated from the `:focus` (`data-highlighted`) state.
   * @default true
   */
  highlightItemOnHover?: boolean | undefined;
  /**
   * Whether the select popup is initially open.
   *
   * To render a controlled select popup, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the select popup is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: SelectRootChangeEventDetails) => void) | undefined;
  /**
   * Event handler called after any animations complete when the select popup is opened or closed.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * Whether the select popup is currently open.
   */
  open?: boolean | undefined;
  /**
   * Determines if the select enters a modal state when open.
   * - `true`: user interaction is limited to the select: document page scroll is locked and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * @default true
   */
  modal?: boolean | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the select will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the select manually.
   * Useful when the select's animation is controlled by an external library.
   */
  actionsRef?: React.RefObject<SelectRootActions | null> | undefined;
  /**
   * Data structure of the items rendered in the select popup.
   * When specified, `<Select.Value>` renders the label of the selected item instead of the raw value.
   * @example
   * ```tsx
   * const items = {
   *   sans: 'Sans-serif',
   *   serif: 'Serif',
   *   mono: 'Monospace',
   *   cursive: 'Cursive',
   * };
   * <Select.Root items={items} />
   * ```
   */
  items?:
    | Record<string, React.ReactNode>
    | ReadonlyArray<{ label: React.ReactNode; value: any }>
    | undefined;
  /**
   * When the item values are objects (`<Select.Item value={object}>`), this function converts the object value to a string representation for display in the trigger.
   * If the shape of the object is `{ value, label }`, the label will be used automatically without needing to specify this prop.
   */
  itemToStringLabel?: ((itemValue: Value) => string) | undefined;
  /**
   * When the item values are objects (`<Select.Item value={object}>`), this function converts the object value to a string representation for form submission.
   * If the shape of the object is `{ value, label }`, the value will be used automatically without needing to specify this prop.
   */
  itemToStringValue?: ((itemValue: Value) => string) | undefined;
  /**
   * Custom comparison logic used to determine if a select item value matches the current selected value. Useful when item values are objects without matching referentially.
   * Defaults to `Object.is` comparison.
   */
  isItemEqualToValue?: ((itemValue: Value, value: Value) => boolean) | undefined;
  /**
   * The uncontrolled value of the select when it’s initially rendered.
   *
   * To render a controlled select, use the `value` prop instead.
   */
  defaultValue?: SelectValueType<Value, Multiple> | null | undefined;
  /**
   * The value of the select. Use when controlled.
   */
  value?: SelectValueType<Value, Multiple> | null | undefined;
  /**
   * Event handler called when the value of the select changes.
   */
  onValueChange?:
    | ((
        value: SelectValueType<Value, Multiple> | (Multiple extends true ? never : null),
        eventDetails: SelectRootChangeEventDetails,
      ) => void)
    | undefined;
}

export interface SelectRootState {}

export interface SelectRootActions {
  unmount: () => void;
}

export type SelectRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.windowResize
  | typeof REASONS.itemPress
  | typeof REASONS.focusOut
  | typeof REASONS.listNavigation
  | typeof REASONS.cancelOpen
  | typeof REASONS.none;

export type SelectRootChangeEventDetails = BaseUIChangeEventDetails<SelectRootChangeEventReason>;

export namespace SelectRoot {
  export type Props<Value, Multiple extends boolean | undefined = false> = SelectRootProps<
    Value,
    Multiple
  >;
  export type State = SelectRootState;
  export type Actions = SelectRootActions;
  export type ChangeEventReason = SelectRootChangeEventReason;
  export type ChangeEventDetails = SelectRootChangeEventDetails;
}
