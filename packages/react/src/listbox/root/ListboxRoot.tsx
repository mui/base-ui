'use client';
import * as React from 'react';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { useFieldRootContext } from '../../internals/field-root-context';
import { useRegisterFieldControl } from '../../internals/field-register-control';
import { useFormContext } from '../../internals/form-context';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type {
  BaseUIChangeEventDetails,
  BaseUIHighlightEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useLabelableId } from '../../internals/labelable-provider';
import { stringifyAsValue } from '../../internals/resolveValueLabel';
import {
  compareItemEquality,
  defaultItemEquality,
  findItemIndex,
} from '../../internals/itemEquality';
import { useValueChanged } from '../../internals/useValueChanged';
import { ListboxRootContext } from './ListboxRootContext';
import { ListboxStore } from '../store';
import { useHighlightChangeNotifier } from '../utils/useHighlightChangeNotifier';
import { afterDomSettle } from '../utils/afterDomSettle';

/**
 * Groups all parts of the listbox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export function ListboxRoot<Value, Multiple extends boolean | 'opt-in' | undefined = false>(
  props: ListboxRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const {
    id,
    value: valueProp,
    defaultValue,
    onValueChange,
    name: nameProp,
    disabled: disabledProp = false,
    required = false,
    multiple: multipleProp = false,
    orientation = 'vertical',
    loopFocus = true,
    highlightItemOnHover = true,
    isItemEqualToValue = defaultItemEquality,
    itemToStringLabel,
    itemToStringValue,
    inputRef,
    actionsRef,
    onItemHighlighted,
    children,
  } = props;

  const { clearErrors } = useFormContext();
  const {
    setDirty,
    validityData,
    setFilled,
    name: fieldName,
    disabled: fieldDisabled,
    validation,
  } = useFieldRootContext();

  const generatedId = useLabelableId({ id });

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const multiple = multipleProp !== false;

  // `value` keeps the public shape: a single value, or an array when `multiple` is set.
  const [value, setValueUnwrapped] = useControlled<any>({
    controlled: valueProp,
    default: defaultValue ?? (multiple ? EMPTY_ARRAY : null),
    name: 'Listbox',
    state: 'value',
  });

  // Internally, selection is always tracked as an array of selected values.
  const selectedValues: any[] = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : EMPTY_ARRAY;
    }
    return value == null ? EMPTY_ARRAY : [value];
  }, [value, multiple]);

  const labelsRef = React.useRef<Array<string | null>>([]);
  const valuesRef = React.useRef<Array<any>>([]);
  const disabledItemsRef = React.useRef<Array<boolean | undefined>>([]);
  const typingRef = React.useRef(false);
  const lastSelectedIndexRef = React.useRef<number | null>(null);
  const highlightTimeout = useTimeout();
  const highlightFrame = useAnimationFrame();

  const store = useRefWithInit(
    () =>
      new ListboxStore(
        {
          id: generatedId,
          multiple: multipleProp,
          itemToStringLabel,
          itemToStringValue,
          isItemEqualToValue,
          value: selectedValues,
          orientation,
          disabled,
          name,
          required,
          loopFocus,
          highlightItemOnHover,
        },
        {
          valuesRef,
          labelsRef,
          disabledItemsRef,
          typingRef,
          lastSelectedIndexRef,
          validation,
        },
      ),
  ).current;

  const serializedValue = React.useMemo(
    () =>
      selectedValues.length === 0
        ? ''
        : selectedValues.map((v) => stringifyAsValue(v, itemToStringValue)).join(','),
    [selectedValues, itemToStringValue],
  );

  const fieldStringValue = React.useMemo(
    () => selectedValues.map((v) => stringifyAsValue(v, itemToStringValue)),
    [selectedValues, itemToStringValue],
  );

  const controlRef = useValueAsRef(store.state.listElement);
  const getFieldValue = useStableCallback(() => fieldStringValue);

  useRegisterFieldControl(controlRef, generatedId, value, getFieldValue, !disabled, nameProp);

  useIsoLayoutEffect(() => {
    setFilled(selectedValues.length > 0);
  }, [selectedValues, setFilled]);

  function isSelectedValueDirty(currentValue: unknown) {
    const initialValue = validityData.initialValue;

    if (Array.isArray(currentValue) && Array.isArray(initialValue)) {
      return !areArraysEqual(currentValue, initialValue, (itemValue, initialItemValue) =>
        isItemEqualToValue(itemValue, initialItemValue),
      );
    }

    return !compareItemEquality(currentValue as Value, initialValue as Value, isItemEqualToValue);
  }

  useValueChanged(value, () => {
    clearErrors(name);
    setDirty(isSelectedValueDirty(value));

    validation.change(value);
  });

  // Parts report the next selection as an array; convert it to the public shape.
  const setValue = useStableCallback(
    (nextSelectedValues: any[], eventDetails: ListboxRoot.ChangeEventDetails) => {
      const nextValue = multiple ? nextSelectedValues : (nextSelectedValues[0] ?? null);
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);
    },
  );

  store.useContextCallback('setValue', setValue);

  store.context.validation = validation;

  React.useImperativeHandle(
    actionsRef,
    () => ({
      highlightValue(itemValue: Value, element?: HTMLElement | null) {
        // After a reorder, the composite item indices are stale until
        // two render cycles complete. Wait for the DOM to settle before
        // looking up the new index.
        afterDomSettle(highlightTimeout, highlightFrame, () => {
          const listEl = store.state.listElement;
          if (!listEl) {
            return;
          }

          let target = element;

          if (!target || !target.isConnected) {
            const idx = findItemIndex(valuesRef.current, itemValue, isItemEqualToValue);
            if (idx !== -1) {
              target = listEl.querySelectorAll<HTMLElement>('[role="option"]')[idx];
            }
          }

          if (target) {
            const idx = findItemIndex(valuesRef.current, itemValue, isItemEqualToValue);
            if (idx !== -1) {
              store.set('activeIndex', idx);
              target.focus();
              target.scrollIntoView({ block: 'nearest' });
            }
          }
        });
      },
    }),
    [store, valuesRef, isItemEqualToValue, highlightTimeout, highlightFrame],
  );

  useIsoLayoutEffect(() => {
    store.update({
      id: generatedId,
      multiple: multipleProp,
      value: selectedValues,
      itemToStringLabel,
      itemToStringValue,
      isItemEqualToValue,
      orientation,
      disabled,
      name,
      required,
      loopFocus,
      highlightItemOnHover,
    });
  }, [
    store,
    generatedId,
    multipleProp,
    selectedValues,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
    orientation,
    disabled,
    name,
    required,
    loopFocus,
    highlightItemOnHover,
  ]);

  useHighlightChangeNotifier<Value>({
    store,
    onItemHighlighted,
  });

  const ref = useMergedRefs(inputRef, validation.inputRef);

  const hasSelection = selectedValues.length > 0;

  // Render one hidden <input> per selected value for form submission.
  // The first input carries validation attributes; additional inputs are type="hidden".
  const hiddenInputs = React.useMemo(() => {
    if (!name || selectedValues.length === 0) {
      return null;
    }

    return selectedValues.map((v) => {
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
  }, [selectedValues, name, itemToStringValue]);

  return (
    <ListboxRootContext.Provider value={store}>
      {children}
      <input
        {...validation.getValidationProps(disabled, {
          onFocus() {
            store.state.listElement?.focus({
              focusVisible: true,
            } as FocusOptions);
          },
          // Handle browser autofill: match the autofilled string against registered
          // values to resolve back to the original value type.
          onChange(event: React.ChangeEvent<HTMLInputElement>) {
            // Workaround for https://github.com/facebook/react/issues/9023
            if (event.nativeEvent.defaultPrevented || disabled) {
              return;
            }

            if (multiple) {
              // Browser autofill only writes a single scalar value.
              return;
            }

            const nextValue = event.currentTarget.value;
            const matchingValue = valuesRef.current.find((v) => {
              const candidate = stringifyAsValue(v, itemToStringValue);
              return candidate.toLowerCase() === nextValue.toLowerCase();
            });

            if (matchingValue != null) {
              const details = createChangeEventDetails(REASONS.none, event.nativeEvent);
              setDirty(isSelectedValueDirty(matchingValue));
              setValue([matchingValue], details);
              validation.change(matchingValue);
            }
          },
        })}
        id={generatedId ? `${generatedId}-hidden-input` : undefined}
        name={hasSelection ? undefined : name}
        value={serializedValue}
        disabled={disabled}
        required={required && !hasSelection}
        ref={ref}
        style={name ? visuallyHiddenInput : visuallyHidden}
        tabIndex={-1}
        aria-hidden
      />
      {hiddenInputs}
    </ListboxRootContext.Provider>
  );
}

export interface ListboxRootActions<Value> {
  /**
   * Sets the highlighted item by value. Focuses the item and scrolls it into view.
   * Useful when reordering items externally and needing to restore highlight.
   *
   * When called after a reorder, pass the item's DOM element as the second
   * argument for reliable matching — the element reference survives React's
   * keyed reconciliation even when its position changes.
   */
  highlightValue: (value: Value, element?: HTMLElement | null) => void;
}

type ListboxInputValue<Value, Multiple extends boolean | 'opt-in' | undefined> = Multiple extends
  true | 'opt-in'
  ? readonly Value[]
  : Value;

type ListboxOutputValue<Value, Multiple extends boolean | 'opt-in' | undefined> = Multiple extends
  true | 'opt-in'
  ? Value[]
  : Value;

export interface ListboxRootProps<Value, Multiple extends boolean | 'opt-in' | undefined = false> {
  children?: React.ReactNode;
  /**
   * A ref to imperative actions.
   */
  actionsRef?: React.Ref<ListboxRootActions<Value>> | undefined;
  /**
   * A ref to access the hidden input element.
   */
  inputRef?: React.Ref<HTMLInputElement> | undefined;
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined;
  /**
   * The id of the Listbox.
   */
  id?: string | undefined;
  /**
   * Whether the user must choose a value before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether multiple items can be selected, and how selecting an item affects the current selection.
   * - `false`: only one item can be selected.
   * - `true`: each item is toggled independently.
   * - `'opt-in'`: selecting an item moves the current selection to it, and users hold a modifier key
   *   to select more than one item. On touch devices, where there are no modifier keys, it behaves
   *   like `true`.
   * @default false
   */
  multiple?: Multiple | undefined;
  /**
   * The orientation of the listbox for keyboard navigation.
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal' | undefined;
  /**
   * Whether keyboard navigation loops back to the first/last item.
   * @default true
   */
  loopFocus?: boolean | undefined;
  /**
   * Whether moving the pointer over items should highlight them.
   * @default true
   */
  highlightItemOnHover?: boolean | undefined;
  /**
   * Custom comparison logic used to determine if a listbox item value matches the current selected value.
   * Defaults to `Object.is` comparison.
   */
  isItemEqualToValue?: ((itemValue: Value, value: Value) => boolean) | undefined;
  /**
   * Converts an object value to a string label for display.
   */
  itemToStringLabel?: ((itemValue: Value) => string) | undefined;
  /**
   * Converts an object value to a string representation for form submission.
   */
  itemToStringValue?: ((itemValue: Value) => string) | undefined;
  /**
   * The uncontrolled value of the listbox when it's initially rendered.
   *
   * To render a controlled listbox, use the `value` prop instead.
   */
  defaultValue?: ListboxInputValue<Value, Multiple> | null | undefined;
  /**
   * The value of the listbox. Use when controlled.
   */
  value?: ListboxInputValue<Value, Multiple> | null | undefined;
  /**
   * Event handler called when the value of the listbox changes.
   */
  onValueChange?:
    | ((
        value:
          ListboxOutputValue<Value, Multiple> | (Multiple extends true | 'opt-in' ? never : null),
        eventDetails: ListboxRootChangeEventDetails,
      ) => void)
    | undefined;
  /**
   * Callback fired when an item is highlighted or unhighlighted.
   * Receives the highlighted item value (or `undefined` if no item is highlighted) and event details with a `reason` property describing why the highlight changed.
   * The `reason` can be:
   * - `'keyboard'`: the highlight changed due to keyboard navigation or typeahead.
   * - `'pointer'`: the highlight changed due to pointer hovering. The event may be a `MouseEvent`
   *   rather than a `PointerEvent`.
   * - `'none'`: the highlight changed for another reason, such as an item receiving focus.
   */
  onItemHighlighted?:
    | ((itemValue: Value | undefined, eventDetails: ListboxRootHighlightEventDetails) => void)
    | undefined;
}

export interface ListboxRootState {}

export type ListboxRootChangeEventReason =
  typeof REASONS.itemPress | typeof REASONS.listNavigation | typeof REASONS.none;

export type ListboxRootChangeEventDetails = BaseUIChangeEventDetails<ListboxRootChangeEventReason>;

export type ListboxRootHighlightEventReason =
  typeof REASONS.keyboard | typeof REASONS.pointer | typeof REASONS.none;

export type ListboxRootHighlightEventDetails = BaseUIHighlightEventDetails<
  ListboxRootHighlightEventReason,
  {
    /**
     * The index of the highlighted item in the list, or `-1` when no item is highlighted.
     */
    index: number;
  }
>;

export namespace ListboxRoot {
  export type Props<
    Value,
    Multiple extends boolean | 'opt-in' | undefined = false,
  > = ListboxRootProps<Value, Multiple>;
  export type State = ListboxRootState;
  export type Actions<Value> = ListboxRootActions<Value>;
  export type ChangeEventReason = ListboxRootChangeEventReason;
  export type ChangeEventDetails = ListboxRootChangeEventDetails;
  export type HighlightEventReason = ListboxRootHighlightEventReason;
  export type HighlightEventDetails = ListboxRootHighlightEventDetails;
}
