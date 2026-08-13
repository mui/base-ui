'use client';
import * as React from 'react';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useOnFirstRender } from '@base-ui/utils/useOnFirstRender';
import { isElementDisabled } from '@base-ui/utils/isElementDisabled';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useStore, ReactStore } from '@base-ui/utils/store';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useListNavigation,
  useTypeahead,
} from '../../floating-ui-react';
import { SelectRootContext } from './SelectRootContext';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useRegisterFieldControl } from '../../internals/field-register-control/useRegisterFieldControl';
import { useLabelableId } from '../../internals/labelable-provider/useLabelableId';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import { selectors, type RegisteredItem, type State as StoreState } from '../store';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { useFormContext } from '../../internals/form-context/FormContext';
import { type Group, stringifyAsLabel, stringifyAsValue } from '../../internals/resolveValueLabel';
import {
  compareItemEquality,
  defaultItemEquality,
  isSelectedValueDirty,
} from '../../internals/itemEquality';
import { useValueChanged } from '../../internals/useValueChanged';
import { useItemRegistry } from '../../internals/useItemRegistry';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { getMaxScrollOffset, normalizeScrollOffset } from '../../utils/scrollEdges';
import { FOCUSABLE_POPUP_PROPS } from '../../utils/popups';
import { mergeProps } from '../../merge-props';

/**
 * Groups all parts of the select.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectRoot<Value, Multiple extends boolean | undefined = false>(
  componentProps: SelectRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const {
    id,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    defaultOpen = false,
    open: openProp,
    onOpenChange,
    name: nameProp,
    form,
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
  } = componentProps;

  const { clearErrors } = useFormContext();
  const {
    setDirty,
    setTouched,
    setFocused,
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

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'Select',
    state: 'open',
  });

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: multiple ? (defaultValue ?? EMPTY_ARRAY) : defaultValue,
    name: 'Select',
    state: 'value',
  });

  const [registeredItems, registerItem] = useItemRegistry<symbol, RegisteredItem>();
  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const scrollHandlerRef = React.useRef<((el: HTMLDivElement) => void) | null>(null);
  const scrollArrowsMountedCountRef = React.useRef(0);
  const valueRef = React.useRef<HTMLSpanElement | null>(null);
  const typingRef = React.useRef(false);
  const firstItemTextRef = React.useRef<HTMLElement | null>(null);
  const selectionRef = React.useRef({
    allowSelectedMouseUp: false,
    allowUnselectedMouseUp: false,
    dragY: 0,
  });
  const alignItemWithTriggerActiveRef = React.useRef(false);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);
  const { openMethod, triggerProps: interactionTypeProps } = useOpenInteractionType(open);

  const store = useRefWithInit(
    () =>
      new ReactStore<StoreState>({
        id: generatedId,
        labelId: undefined,
        modal,
        multiple,
        itemToStringLabel,
        itemToStringValue,
        isItemEqualToValue,
        registeredItems,
        visibleItemIndexes: new Map(),
        value,
        open,
        mounted,
        transitionStatus,
        items,
        forceMount: false,
        openMethod: null,
        activeIndex: null,
        selectionReferenceItemId: null,
        popupProps: {},
        triggerProps: {},
        triggerElement: null,
        positionerElement: null,
        listElement: null,
        popupSide: null,
        scrollUpArrowVisible: false,
        scrollDownArrowVisible: false,
        hasScrollArrows: false,
      }),
  ).current;

  const activeIndex = useStore(store, selectors.activeIndex);
  const selectionReferenceItemId = useStore(store, selectors.selectionReferenceItemId);
  const visibleItemIndexes = useStore(store, selectors.visibleItemIndexes);
  const triggerElement = useStore(store, selectors.triggerElement);
  const positionerElement = useStore(store, selectors.positionerElement);

  const selectionReferenceIndex = React.useMemo(() => {
    return selectionReferenceItemId == null
      ? null
      : (visibleItemIndexes.get(selectionReferenceItemId) ?? null);
  }, [visibleItemIndexes, selectionReferenceItemId]);

  const serializedValue = React.useMemo(() => {
    // In multiple mode the shared input is nameless; per-value entries are submitted via
    // `hiddenInputs`. Its value is therefore irrelevant, and passing the whole array to
    // `stringifyAsValue` would invoke a user `itemToStringValue` with an array it doesn't expect.
    if (multiple) {
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

  const controlRef = useValueAsRef(triggerElement);
  const getStringifiedValueForForm = useStableCallback(() => fieldStringValue);

  useRegisterFieldControl(
    controlRef,
    generatedId,
    value,
    getStringifiedValueForForm,
    !disabled,
    nameProp,
  );

  const initialValueRef = React.useRef(value);
  // Mirror the `hasSelectedValue` store selector so the Field's filled state agrees with the
  // trigger/value placeholder semantics (a value serializing to `''` counts as empty).
  const hasSelectedValue = multiple
    ? Array.isArray(value) && value.length > 0
    : value != null && serializedValue !== '';

  useIsoLayoutEffect(() => {
    setFilled(hasSelectedValue);
  }, [hasSelectedValue, setFilled]);

  useIsoLayoutEffect(
    function syncSelectionReferenceItemId() {
      let selectionReferenceValue: unknown = value;
      let hasNoSelectionReference = false;

      if (multiple) {
        const currentValue = Array.isArray(value) ? value : [];
        hasNoSelectionReference = currentValue.length === 0;
        selectionReferenceValue = currentValue[currentValue.length - 1];
      }

      const selectionReferenceItem = hasNoSelectionReference
        ? undefined
        : findMatchingItem(store.state.registeredItems, (item) =>
            compareItemEquality(
              item.getValue(),
              selectionReferenceValue as Value,
              isItemEqualToValue,
            ),
          );

      store.set('selectionReferenceItemId', selectionReferenceItem?.id ?? null);
    },
    [multiple, value, isItemEqualToValue, store],
  );

  useValueChanged(value, () => {
    clearErrors(name);
    setDirty(isSelectedValueDirty(value, validityData.initialValue, isItemEqualToValue));

    validation.change(value);
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
    },
  );

  // `items` is the data source for resolving labels and rendering collection children.
  const normalizedItems: readonly any[] = React.useMemo(() => {
    if (items === undefined) {
      return EMPTY_ARRAY;
    }
    if (Array.isArray(items)) {
      return items;
    }
    // The `Record<string, ReactNode>` form is a label map; widen it to the labeled-item shape so
    // one code path covers every accepted input.
    return Object.entries(items).map(([itemValue, label]) => ({ value: itemValue, label }));
  }, [items]);

  const handleUnmount = useStableCallback(() => {
    store.update({
      activeIndex: null,
      openMethod: null,
      scrollUpArrowVisible: false,
      scrollDownArrowVisible: false,
    });
    // Select doesn't unmount when closed, so we need to reset the scroll
    store.state.listElement?.scrollTo?.({ top: 0 });
    setMounted(false);

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

  const handleScrollArrowVisibility = useStableCallback((scroller: HTMLElement) => {
    const maxScrollTop = getMaxScrollOffset(scroller.scrollHeight, scroller.clientHeight);
    const scrollTop = normalizeScrollOffset(scroller.scrollTop, maxScrollTop);
    const shouldShowUp = scrollTop > 0;
    const shouldShowDown = scrollTop < maxScrollTop;

    store.set('scrollUpArrowVisible', shouldShowUp);
    store.set('scrollDownArrowVisible', shouldShowDown);
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

  const dismiss = useDismiss(floatingContext);
  const listNavigation = useListNavigation(floatingContext, {
    id: generatedId,
    enabled: !readOnly && !disabled,
    listRef,
    activeIndex,
    selectedIndex: selectionReferenceIndex,
    disabledIndices: EMPTY_ARRAY,
    focusItemOnHover: highlightItemOnHover,
    onNavigate(nextActiveIndex, _event) {
      // Retain the highlight while transitioning out.
      if (nextActiveIndex === null && !open) {
        return;
      }

      store.set('activeIndex', nextActiveIndex);
    },
  });

  const typeahead = useTypeahead(floatingContext, {
    enabled: !readOnly && !disabled && (open || !multiple),
    listRef: {
      get current() {
        return [...store.state.visibleItemIndexes].map(([id]) => {
          const item = store.state.registeredItems.get(id);
          return item?.getLabel() ?? null;
        });
      },
    },
    activeIndex,
    selectedIndex: selectionReferenceIndex,
    // Skip disabled items while matching so typeahead advances to the next selectable item
    // (a click can never select a disabled item and native `<select>` skips them too). Resolve
    // the disabled state from the element via the attribute-only `isElementDisabled` so the
    // hidden, force-mounted items used for closed-trigger typeahead aren't dropped by the
    // `elementsRef`/visibility filter that `disabledIndices` deliberately sidesteps.
    disabledIndices: (index) => isElementDisabled(listRef.current[index]),
    onMatch(index) {
      if (open) {
        store.set('activeIndex', index);
      } else {
        const itemId = findItemIdByIndex(store.state.visibleItemIndexes, index);
        const item = itemId ? store.state.registeredItems.get(itemId) : undefined;
        if (item) {
          setValue(item.getValue(), createChangeEventDetails('none'));
        }
      }
    },
    onTyping(typing) {
      typingRef.current = typing;
    },
  });

  // `Select.Trigger` applies the id itself from the store, so it's deliberately not merged here.
  const mergedTriggerProps = React.useMemo(
    () =>
      mergeProps(
        typeahead.reference,
        listNavigation.reference,
        dismiss.reference,
        click.reference,
        interactionTypeProps,
      ),
    [
      typeahead.reference,
      listNavigation.reference,
      dismiss.reference,
      click.reference,
      interactionTypeProps,
    ],
  );

  const popupProps = React.useMemo(
    () =>
      mergeProps(
        FOCUSABLE_POPUP_PROPS,
        typeahead.floating,
        listNavigation.floating,
        dismiss.floating,
      ),
    [typeahead.floating, listNavigation.floating, dismiss.floating],
  );

  const itemProps = listNavigation.item ?? EMPTY_OBJECT;
  useOnFirstRender(() => {
    store.update({
      popupProps,
      triggerProps: mergedTriggerProps,
    });
  });

  store.useSyncedValues({
    id: generatedId,
    modal,
    multiple,
    value,
    open,
    mounted,
    transitionStatus,
    popupProps,
    triggerProps: mergedTriggerProps,
    registeredItems,
    items,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
    openMethod,
  });

  const contextValue: SelectRootContext = React.useMemo(
    () => ({
      store,
      floatingContext,
      required,
      disabled,
      readOnly,
      multiple,
      items: normalizedItems,
      highlightItemOnHover,
      registerItem,
      setValue,
      setOpen,
      listRef,
      popupRef,
      scrollHandlerRef,
      handleScrollArrowVisibility,
      scrollArrowsMountedCountRef,
      itemProps,
      valueRef,
      typingRef,
      selectionRef,
      firstItemTextRef,
      validation,
      onOpenChangeComplete,
      alignItemWithTriggerActiveRef,
      initialValueRef,
    }),
    [
      store,
      floatingContext,
      required,
      disabled,
      readOnly,
      multiple,
      normalizedItems,
      highlightItemOnHover,
      registerItem,
      setValue,
      setOpen,
      itemProps,
      validation,
      onOpenChangeComplete,
      handleScrollArrowVisibility,
    ],
  );

  const ref = useMergedRefs(inputRef, validation.inputRef);

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
          form={form}
          name={name}
          value={currentSerializedValue}
          disabled={disabled}
        />
      );
    });
  }, [multiple, value, form, name, itemToStringValue, disabled]);

  const select = (
    <SelectRootContext.Provider value={contextValue}>
      {children}
      <input
        {...validation.getValidationProps(disabled, {
          onFocus() {
            // Move focus to the trigger element when the hidden input is focused.
            store.state.triggerElement?.focus({
              // Supported in Chrome from 144 (January 2026)
              focusVisible: true,
            });
          },
          // Handle browser autofill.
          onChange(event: React.ChangeEvent<HTMLInputElement>) {
            // Workaround for https://github.com/react/react/issues/9023
            if (event.nativeEvent.defaultPrevented || disabled || readOnly) {
              return;
            }

            const nextValue = event.currentTarget.value;
            const details = createChangeEventDetails(REASONS.none, event.nativeEvent);

            function handleChange() {
              if (multiple) {
                // Browser autofill only writes a single scalar value.
                return;
              }

              // Preserve the original serialized matching, then fall back to rendered text,
              // which browsers can autofill for primitive values like `value="US">United States`.
              const nextValueLower = nextValue.toLowerCase();

              let matchingItem = findMatchingItem(store.state.registeredItems, (item) => {
                const itemValue = item.getValue();
                const value = stringifyAsValue(itemValue, itemToStringValue).toLowerCase();
                const label = stringifyAsLabel(itemValue, itemToStringLabel).toLowerCase();
                return value === nextValueLower || label === nextValueLower;
              });

              if (!matchingItem) {
                matchingItem = findMatchingItem(store.state.registeredItems, (item) => {
                  const label = item.getLabel();
                  return label != null && label.toLowerCase() === nextValueLower;
                });
              }

              const matchingValue = matchingItem?.getValue();
              if (matchingValue != null) {
                // `setValue` may be canceled by `onValueChange`; rely on `useValueChanged` to
                // mark the field dirty and run validation only when the value actually changes.
                setValue(matchingValue, details);
              }
            }

            store.set('forceMount', true);
            queueMicrotask(handleChange);
          },
        })}
        id={generatedId && hiddenInputName == null ? `${generatedId}-hidden-input` : undefined}
        form={form}
        name={hiddenInputName}
        autoComplete={autoComplete}
        value={serializedValue}
        disabled={disabled}
        required={required && !(multiple && hasSelectedValue)}
        readOnly={readOnly}
        ref={ref}
        style={name ? visuallyHiddenInput : visuallyHidden}
        tabIndex={-1}
        aria-hidden
        suppressHydrationWarning
      />
      {hiddenInputs}
    </SelectRootContext.Provider>
  );

  return select;
}

function findMatchingItem(
  registeredItems: ReadonlyMap<symbol, RegisteredItem>,
  matches: (item: RegisteredItem) => boolean,
) {
  for (const [id, item] of registeredItems) {
    if (matches(item)) {
      return { ...item, id };
    }
  }
  return undefined;
}

function findItemIdByIndex(visibleItemIndexes: ReadonlyMap<symbol, number>, index: number) {
  for (const [id, itemIndex] of visibleItemIndexes) {
    if (itemIndex === index) {
      return id;
    }
  }
  return undefined;
}

type SelectValueType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

export type SelectRootProps<
  Value,
  Multiple extends boolean | undefined = false,
> = SelectRootBaseProps<Value, Multiple>;

interface SelectRootBaseProps<Value, Multiple extends boolean | undefined = false> {
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
   * Identifies the form that owns the hidden input.
   * Useful when the select is rendered outside the form.
   */
  form?: string | undefined;
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
   *
   * On touch devices, a `true` modal blocks outside taps but leaves the page scrollable unless the popup spans nearly the full viewport width, matching native iOS behavior.
   * @default true
   */
  modal?: boolean | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: Manually unmounts the select.
   * Call this after any externally controlled closing animation finishes.
   */
  actionsRef?: React.RefObject<SelectRootActions | null> | undefined;
  /**
   * Data structure of the items rendered in the select popup.
   * When specified, `<Select.Value>` renders the label of the selected item instead of the raw value.
   * It is also the data source for the list: pass a function child to `<Select.List>` (or use
   * `<Select.Collection>`) to render one item per entry.
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
    | ReadonlyArray<{
        label: React.ReactNode;
        value: any;
      }>
    | ReadonlyArray<Group<any>>
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
   * The uncontrolled value of the select when it's initially rendered.
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
