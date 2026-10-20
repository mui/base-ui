'use client';
import * as React from 'react';
import { visuallyHiddenInput, visuallyHiddenInputPinned } from '@base-ui/utils/visuallyHidden';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useOnFirstRender } from '@base-ui/utils/useOnFirstRender';
import { usePreviousValue } from '@base-ui/utils/usePreviousValue';
import { isElementDisabled } from '@base-ui/utils/isElementDisabled';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useClick } from '../../utils/popups/interactions/useClick';
import { useDismiss } from '../../utils/popups/interactions/useDismiss';
import { useListNavigation } from '../../utils/popups/interactions/useListNavigation';
import { useTypeahead } from '../../utils/popups/interactions/useTypeahead';
import { SelectRootContext, SelectSelectionContext } from './SelectRootContext';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useRegisterFieldControl } from '../../internals/field-register-control/useRegisterFieldControl';
import { useLabelableId } from '../../internals/labelable-provider/useLabelableId';
import { SelectStore, selectors } from '../store';
import {
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../internals/createBaseUIEventDetails';
import type {
  BaseUIChangeEventDetails,
  BaseUIHighlightEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { getHighlightReason } from '../../utils/getHighlightReason';
import { REASONS } from '../../internals/reasons';
import { FOCUSABLE_POPUP_PROPS } from '../../utils/popups/popupStoreUtils';
import { useFormContext } from '../../internals/form-context/FormContext';
import { stringifyAsLabel, stringifyAsValue } from '../../internals/resolveValueLabel';
import type { Group } from '../../internals/resolveValueLabel';
import {
  compareItemEquality,
  defaultItemEquality,
  findSelectionIndex,
  isSelectedValueDirty,
} from '../../internals/itemEquality';
import { useValueChanged } from '../../internals/useValueChanged';
import { useOpenInteractionType } from '../../utils/popups/interactions/useOpenInteractionType';
import { getMaxScrollOffset, normalizeScrollOffset } from '../../utils/scrollEdges';
import { mergeProps } from '../../merge-props';
import { NOOP } from '../../internals/noop';
import { getHiddenInputType } from '../../internals/getHiddenInputType';
import { useSingleAnchorPopupRoot } from '../../utils/popups/popupRoot';
import { createInitialPopupStoreState, createPopupStoreContext } from '../../utils/popups/store';
import { handleHiddenInputInvalid } from '../../internals/handleHiddenInputInvalid';
import { SelectFilterProviderContext } from '../filter-provider/SelectFilterProviderContext';

/** Set by the filter root, which keeps real focus on its input inside the popup. */
interface SelectRootInternalProps<
  Value,
  Multiple extends boolean | undefined,
> extends SelectRoot.Props<Value, Multiple> {
  /**
   * Whether the select is wrapped in `Select.FilterProvider`. Real focus stays on `Select.Input`
   * while the list is navigated with `aria-activedescendant`.
   */
  filterable?: boolean | undefined;
  allowEscape?: boolean | undefined;
  resetOnPointerLeave?: boolean | undefined;
}

export function SelectRootInternal<Value, Multiple extends boolean | undefined = false>(
  props: SelectRootInternalProps<Value, Multiple>,
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
    onItemHighlighted: onItemHighlightedProp,
    children,
    filterable = false,
    allowEscape,
    resetOnPointerLeave,
  } = props;

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
    setValidityData,
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

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const scrollHandlerRef = React.useRef<((el: HTMLDivElement) => void) | null>(null);
  const scrollArrowsMountedCountRef = React.useRef(0);
  const valueRef = React.useRef<HTMLSpanElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const typingRef = React.useRef(false);
  const firstItemTextRef = React.useRef<HTMLElement | null>(null);
  const selectedItemTextRef = React.useRef<HTMLElement | null>(null);
  const selectionRef = React.useRef({
    allowSelectedMouseUp: false,
    allowUnselectedMouseUp: false,
    dragY: 0,
  });
  const alignItemWithTriggerActiveRef = React.useRef(false);
  const initialValueRef = React.useRef(value);

  // Calls `onOpenChange` for every open change that isn't ignored, then applies the select's own
  // handling of an accepted change before the store commits it.
  const handleOpenChange = useStableCallback(
    (nextOpen: boolean, eventDetails: SelectRoot.OpenChangeEventDetails) => {
      onOpenChange?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

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

  const { store, open } = useSingleAnchorPopupRoot(
    {
      open: openProp,
      defaultOpen,
      onOpenChange: handleOpenChange,
      onOpenChangeComplete,
      actionsRef,
    },
    (initialState, defaultPopupId) =>
      new SelectStore(
        {
          ...createInitialPopupStoreState(defaultPopupId),
          ...initialState,
          id: generatedId,
          labelId: undefined,
          modal,
          selectionMode: multiple ? 'multiple' : 'single',
          disabled,
          readOnly,
          required,
          highlightItemOnHover,
          itemToStringLabel,
          itemToStringValue,
          isItemEqualToValue,
          selectedValue: value,
          items,
          forceMounted: false,
          openMethod: null,
          activeIndex: null,
          selectedIndex: null,
          itemRoot: { props: EMPTY_OBJECT, multiple, disabled, readOnly, isItemEqualToValue },
          triggerElement: null,
          listElement: null,
          popupSide: null,
          scrollUpArrowVisible: false,
          scrollDownArrowVisible: false,
          hasScrollArrows: false,
          keyboardOpen: false,
          navigateFromSelected: false,
          inputProps: EMPTY_OBJECT,
          highlightedItem: undefined,
        },
        {
          ...createPopupStoreContext(),
          isItemEqualToValue,
          setValue: NOOP,
          handleScrollArrowVisibility: NOOP,
          syncHighlight: NOOP,
          listRef,
          popupRef,
          scrollHandlerRef,
          scrollArrowsMountedCountRef,
          valueRef,
          valuesRef,
          labelsRef,
          typingRef,
          selectionRef,
          firstItemTextRef,
          selectedItemTextRef,
          alignItemWithTriggerActiveRef,
          initialValueRef,
          filterable,
        },
        selectors,
      ),
  );

  const { openMethod, triggerProps: interactionTypeProps } = useOpenInteractionType(open);

  const activeIndex = store.useState('activeIndex');
  const selectedIndex = store.useState('selectedIndex');
  const keyboardOpen = store.useState('keyboardOpen');
  const navigateFromSelected = store.useState('navigateFromSelected');
  const triggerElement = store.useState('triggerElement');

  const previousOpenMethod = usePreviousValue(openMethod);
  const renderedOpenMethod = openMethod ?? previousOpenMethod;

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

  // Mirror the `hasSelectedValue` store selector so the Field's filled state agrees with the
  // trigger/value placeholder semantics (a value serializing to `''` counts as empty).
  const hasSelectedValue = multiple
    ? Array.isArray(value) && value.length > 0
    : value != null && serializedValue !== '';

  useIsoLayoutEffect(() => {
    setFilled(hasSelectedValue);
  }, [hasSelectedValue, setFilled]);

  useIsoLayoutEffect(
    function syncSelectedIndex() {
      const nextIndex = findSelectionIndex(valuesRef.current, value, isItemEqualToValue, multiple);

      if (nextIndex === null) {
        selectedItemTextRef.current = null;
      }

      if (open) {
        return;
      }

      store.set('selectedIndex', nextIndex);
    },
    [multiple, open, value, isItemEqualToValue, store],
  );

  useValueChanged(value, () => {
    clearErrors(name);
    setDirty(isSelectedValueDirty(value, validityData.initialValue, isItemEqualToValue));

    validation.change(value);
  });

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

  // `readOnly` locks the value, not the interaction: the popup can be opened and browsed so the
  // user can see the available options and which one is selected. Committing a value is blocked
  // separately in `SelectItem` and in the hidden input's autofill handler.
  const click = useClick(store, {
    enabled: !disabled,
    event: 'mousedown',
  });

  const dismiss = useDismiss(store);

  const onItemHighlighted = useStableCallback(onItemHighlightedProp);
  // The navigation event behind the next highlight change, reported as its reason.
  const highlightEventRef = React.useRef<Event | undefined>(undefined);
  const reportedHighlightRef = React.useRef<{ index: number | null; value: any }>({
    index: null,
    value: undefined,
  });

  // Filtering can move another item into the highlighted index, so the value is compared too.
  function syncHighlight() {
    const index = store.state.activeIndex;
    const value = index === null ? undefined : valuesRef.current[index];
    const reported = reportedHighlightRef.current;
    // A hole is an index whose item hasn't registered its value yet; it syncs once it does.
    if (
      (index !== null && value === undefined) ||
      (index === reported.index && compareItemEquality(value, reported.value, isItemEqualToValue))
    ) {
      return;
    }
    const event = highlightEventRef.current;
    highlightEventRef.current = undefined;
    reportedHighlightRef.current = { index, value };
    if (onItemHighlightedProp) {
      onItemHighlighted(
        value,
        createGenericEventDetails(getHighlightReason(event), event, { index: index ?? -1 }),
      );
    }
  }

  useIsoLayoutEffect(() => store.context.syncHighlight(), [activeIndex, store]);

  const navigationSelectedIndex = filterable && !navigateFromSelected ? null : selectedIndex;

  const listNavigation = useListNavigation(store, {
    enabled: !disabled,
    listRef,
    activeIndex,
    selectedIndex: navigationSelectedIndex,
    disabledIndices: EMPTY_ARRAY,
    virtual: filterable,
    // A filterable select keeps DOM focus on its input. Like an ordinary select, it opens on the
    // selected option; without one, keyboard opens highlight the first option, or the last with
    // ArrowUp. The input remains part of the arrow-key loop.
    focusItemOnOpen: filterable ? keyboardOpen || navigationSelectedIndex !== null : undefined,
    loopFocus: filterable,
    allowEscape,
    resetOnPointerLeave,
    onNavigate(nextActiveIndex, event) {
      // Retain the highlight while transitioning out.
      if (nextActiveIndex === null && !open) {
        return;
      }

      if (nextActiveIndex !== store.state.activeIndex) {
        highlightEventRef.current = event?.nativeEvent;
      }
      store.set('activeIndex', nextActiveIndex);
    },
    focusItemOnHover: highlightItemOnHover,
  });

  const typeahead = useTypeahead(store, {
    // Typeahead on an open popup only moves the highlight, so it remains available while
    // `readOnly`. The closed-trigger variant commits a value instead, so it doesn't. In a
    // filterable select the input owns typing, so typeahead would race the filter query.
    enabled: !disabled && !filterable && (open || (!readOnly && !multiple)),
    listRef: labelsRef,
    activeIndex,
    selectedIndex,
    // Skip disabled items while matching so typeahead advances to the next selectable item
    // (a click can never select a disabled item and native `<select>` skips them too). Resolve
    // the disabled state from the element via the attribute-only `isElementDisabled` so the
    // hidden, force-mounted items used for closed-trigger typeahead aren't dropped by the
    // `elementsRef`/visibility filter that `disabledIndices` deliberately sidesteps.
    disabledIndices: (index) => isElementDisabled(listRef.current[index]),
    onMatch(index, event) {
      if (open) {
        if (index !== store.state.activeIndex) {
          highlightEventRef.current = event.nativeEvent;
        }
        store.set('activeIndex', index);
      } else {
        setValue(valuesRef.current[index], createChangeEventDetails(REASONS.none));
      }
    },
    onTyping(typing) {
      typingRef.current = typing;
    },
  });

  // In a filterable select the input holds real focus, so it takes the navigation's
  // reference props (`aria-activedescendant` and the key handling) and the trigger keeps only
  // the props that open the popup.
  const openTriggerProps = React.useMemo(() => {
    if (!filterable) {
      return listNavigation.reference;
    }
    if (!listNavigation.trigger) {
      return EMPTY_OBJECT;
    }
    // Focusing the trigger while the popup is open must not seed the virtual highlight.
    const { onFocus, ...rest } = listNavigation.trigger;
    return rest;
  }, [filterable, listNavigation.reference, listNavigation.trigger]);

  store.useSyncedValue(
    'inputProps',
    filterable ? (listNavigation.reference ?? EMPTY_OBJECT) : EMPTY_OBJECT,
  );

  // `Select.Trigger` applies the id itself from the store, so it's deliberately not merged here.
  const mergedTriggerProps = React.useMemo(
    () =>
      mergeProps(
        typeahead.reference,
        openTriggerProps,
        dismiss.reference,
        click.reference,
        interactionTypeProps,
      ),
    [
      click.reference,
      typeahead.reference,
      openTriggerProps,
      dismiss.reference,
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

  const itemProps =
    (listNavigation.item as React.HTMLProps<HTMLElement> | undefined) ?? EMPTY_OBJECT;
  const itemRoot = React.useMemo(
    () => ({ props: itemProps, multiple, disabled, readOnly, isItemEqualToValue }),
    [itemProps, multiple, disabled, readOnly, isItemEqualToValue],
  );

  store.useContextCallback('isItemEqualToValue', isItemEqualToValue);
  store.useContextCallback('setValue', setValue);
  store.useContextCallback('handleScrollArrowVisibility', handleScrollArrowVisibility);
  store.useContextCallback('syncHighlight', syncHighlight);

  // The prop bags must be in the store before the parts render. `useSyncedValues` writes in a
  // layout effect, after all descendants have rendered.
  useOnFirstRender(() => {
    store.update({
      popupProps,
      activeTriggerProps: mergedTriggerProps,
      itemRoot,
    });
  });

  store.useSyncedValues({
    id: generatedId,
    modal,
    selectionMode: multiple ? 'multiple' : 'single',
    disabled,
    readOnly,
    required,
    highlightItemOnHover,
    selectedValue: value,
    popupProps,
    activeTriggerProps: mergedTriggerProps,
    itemRoot,
    items,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
    openMethod: renderedOpenMethod,
  });

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

  const selection = React.useMemo(() => ({ value, multiple }), [value, multiple]);

  return (
    <SelectRootContext.Provider value={store}>
      <SelectSelectionContext.Provider value={selection}>
        {children}
      </SelectSelectionContext.Provider>
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
              // which browsers can autofill for primitive values like
              // `value="US">United States`.
              const nextValueLower = nextValue.toLowerCase();
              let matchingIndex = valuesRef.current.findIndex(
                (candidate) =>
                  stringifyAsValue(candidate, itemToStringValue).toLowerCase() === nextValueLower ||
                  stringifyAsLabel(candidate, itemToStringLabel).toLowerCase() === nextValueLower,
              );

              if (matchingIndex === -1) {
                matchingIndex = valuesRef.current.findIndex((_, index) => {
                  const renderedLabel = labelsRef.current[index];
                  return renderedLabel != null && renderedLabel.toLowerCase() === nextValueLower;
                });
              }

              const matchingValue = valuesRef.current[matchingIndex];
              if (matchingValue != null) {
                // `setValue` may be canceled by `onValueChange`; rely on `useValueChanged` to
                // mark the field dirty and run validation only when the value actually changes.
                setValue(matchingValue, details);
              }
            }

            store.set('forceMounted', true);
            queueMicrotask(handleChange);
          },
        })}
        id={generatedId && hiddenInputName == null ? `${generatedId}-hidden-input` : undefined}
        form={form}
        name={hiddenInputName}
        type={getHiddenInputType(setValidityData !== NOOP, name, autoComplete, required, inputRef)}
        autoComplete={autoComplete}
        value={serializedValue}
        disabled={disabled}
        required={required && !(multiple && hasSelectedValue)}
        readOnly={readOnly}
        ref={ref}
        style={name ? visuallyHiddenInput : visuallyHiddenInputPinned}
        onInvalid={handleHiddenInputInvalid}
        tabIndex={-1}
        aria-hidden
        suppressHydrationWarning
      />
      {hiddenInputs}
    </SelectRootContext.Provider>
  );
}

/**
 * Groups all parts of the select.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectRoot<Value, Multiple extends boolean | undefined = false>(
  props: SelectRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const filter = React.useContext(SelectFilterProviderContext);
  if (filter === null) {
    return <SelectRootInternal {...props} />;
  }

  // Kept apart from the root's props, where the query's `value` would clash.
  return <filter.Root {...props} filterOptions={filter.options} />;
}

type SelectInputValue<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? readonly Value[]
  : Value;

type SelectOutputValue<Value, Multiple extends boolean | undefined> = Multiple extends true
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
   * Callback fired when an item is highlighted or unhighlighted.
   * Receives the highlighted item value (or `undefined` if no item is highlighted) and event details with a `reason` property describing why the highlight changed.
   * The `reason` can be:
   * - `'keyboard'`: the highlight changed due to keyboard navigation or typeahead.
   * - `'pointer'`: the highlight changed due to pointer hovering. The event may be a `MouseEvent`
   *   rather than a `PointerEvent`.
   * - `'none'`: the highlight changed for another reason, such as filtering, the item list
   *   changing, or the popup opening or closing.
   */
  onItemHighlighted?:
    | ((itemValue: Value | undefined, eventDetails: SelectRoot.HighlightEventDetails) => void)
    | undefined;
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
  onOpenChange?:
    ((open: boolean, eventDetails: SelectRootOpenChangeEventDetails) => void) | undefined;
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
   * - `unmount`: Ends the closing phase of the select after an externally controlled closing animation finishes.
   * Call `preventUnmountOnClose()` in `onOpenChange` first, otherwise the select completes closing on its own.
   * Whether it leaves the DOM is decided by `keepMounted` on the portal.
   * - `close`: Closes the select imperatively when called.
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
  defaultValue?: SelectInputValue<Value, Multiple> | null | undefined;
  /**
   * The value of the select. Use when controlled.
   */
  value?: SelectInputValue<Value, Multiple> | null | undefined;
  /**
   * Event handler called when the value of the select changes.
   */
  onValueChange?:
    | ((
        value: SelectOutputValue<Value, Multiple> | (Multiple extends true ? never : null),
        eventDetails: SelectRootChangeEventDetails,
      ) => void)
    | undefined;
}

export interface SelectRootState {}

export interface SelectRootActions {
  unmount: () => void;
  close: () => void;
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
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type SelectRootOpenChangeEventDetails = SelectRootChangeEventDetails & {
  /** Prevents the popup from unmounting until the `unmount` action is called. */
  preventUnmountOnClose: () => void;
};

export type SelectRootChangeEventDetails = BaseUIChangeEventDetails<SelectRootChangeEventReason>;

export type SelectRootHighlightEventReason =
  typeof REASONS.keyboard | typeof REASONS.pointer | typeof REASONS.none;

export type SelectRootHighlightEventDetails = BaseUIHighlightEventDetails<
  SelectRootHighlightEventReason,
  {
    /**
     * The index of the highlighted item in the list, or `-1` when no item is highlighted.
     */
    index: number;
  }
>;

export namespace SelectRoot {
  export type Props<Value, Multiple extends boolean | undefined = false> = SelectRootProps<
    Value,
    Multiple
  >;
  export type State = SelectRootState;
  export type Actions = SelectRootActions;
  export type ChangeEventReason = SelectRootChangeEventReason;
  export type ChangeEventDetails = SelectRootChangeEventDetails;
  export type OpenChangeEventDetails = SelectRootOpenChangeEventDetails;
  export type HighlightEventReason = SelectRootHighlightEventReason;
  export type HighlightEventDetails = SelectRootHighlightEventDetails;
}
