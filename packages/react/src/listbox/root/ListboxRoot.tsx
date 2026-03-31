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
import { ListboxRootContext } from './ListboxRootContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { ListboxStore } from '../store';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useFormContext } from '../../form/FormContext';
import { useField } from '../../field/useField';
import { stringifyAsValue } from '../../utils/resolveValueLabel';
import { EMPTY_ARRAY } from '../../utils/constants';
import { defaultItemEquality, findItemIndex } from '../../utils/itemEquality';
import { useValueChanged } from '../../utils/useValueChanged';
import type { SelectionMode } from '../utils/selectionReducer';
import { isMultipleSelectionMode } from '../utils/selectionReducer';
import { useHighlightChangeNotifier } from '../utils/useHighlightChangeNotifier';
import { afterDomSettle } from '../utils/afterDomSettle';

/**
 * Groups all parts of the listbox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export function ListboxRoot<Value>(props: ListboxRoot.Props<Value>): React.JSX.Element {
  const {
    id,
    value: valueProp,
    defaultValue,
    onValueChange,
    name: nameProp,
    disabled: disabledProp = false,
    required = false,
    selectionMode = 'single',
    orientation = 'vertical',
    loopFocus = true,
    highlightItemOnHover = true,
    isItemEqualToValue = defaultItemEquality,
    itemToStringLabel,
    itemToStringValue,
    inputRef,
    actionsRef,
    onHighlightChange,
    loading = false,
    onLoadMore,
    children,
  } = props;

  const { clearErrors } = useFormContext();
  const {
    setDirty,
    shouldValidateOnChange,
    validityData,
    setFilled,
    name: fieldName,
    disabled: fieldDisabled,
    validation,
  } = useFieldRootContext();

  const generatedId = useLabelableId({ id });

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  // Value is always an array regardless of selection mode.
  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue ?? (EMPTY_ARRAY as any[]),
    name: 'Listbox',
    state: 'value',
  });

  const labelsRef = React.useRef<Array<string | null>>([]);
  const valuesRef = React.useRef<Array<any>>([]);
  const disabledItemsRef = React.useRef<Array<boolean | undefined>>([]);
  const groupIdsRef = React.useRef<Array<string | undefined>>([]);
  const typingRef = React.useRef(false);
  const lastSelectedIndexRef = React.useRef<number | null>(null);
  const pointerMoveSuppressedRef = React.useRef(false);
  const highlightTimeout = useTimeout();
  const highlightFrame = useAnimationFrame();

  const store = useRefWithInit(
    () =>
      new ListboxStore(
        {
          id: generatedId,
          selectionMode,
          itemToStringLabel,
          itemToStringValue,
          isItemEqualToValue,
          value,
          loading,
          loadingProp: loading,
          hasOnLoadMore: onLoadMore !== undefined,
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
          groupIdsRef,
          typingRef,
          lastSelectedIndexRef,
          pointerMoveSuppressedRef,
          validation,
        },
      ),
  ).current;

  // Value is always an array — serialize each element for form submission.
  const serializedValue = React.useMemo(
    () =>
      value.length === 0 ? '' : value.map((v) => stringifyAsValue(v, itemToStringValue)).join(','),
    [value, itemToStringValue],
  );

  const fieldStringValue = React.useMemo(
    () => value.map((v) => stringifyAsValue(v, itemToStringValue)),
    [value, itemToStringValue],
  );

  const controlRef = useValueAsRef(store.state.listElement);

  useField({
    id: generatedId,
    commit: validation.commit,
    value,
    controlRef,
    name,
    getValue: () => fieldStringValue,
  });

  useIsoLayoutEffect(() => {
    setFilled(Array.isArray(value) && value.length > 0);
  }, [value, setFilled]);

  useValueChanged(value, () => {
    clearErrors(name);
    setDirty(value !== validityData.initialValue);

    if (shouldValidateOnChange()) {
      validation.commit(value);
    } else {
      validation.commit(value, true);
    }
  });

  const setValue = useStableCallback(
    (nextValue: any, eventDetails: ListboxRoot.ChangeEventDetails) => {
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);
    },
  );

  store.useContextCallback('setValue', setValue);

  store.context.validation = validation;
  store.context.onLoadMore = onLoadMore;

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
      selectionMode,
      value: value as any[],
      itemToStringLabel,
      itemToStringValue,
      isItemEqualToValue,
      loading,
      loadingProp: loading,
      hasOnLoadMore: onLoadMore !== undefined,
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
    selectionMode,
    value,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
    loading,
    onLoadMore,
    orientation,
    disabled,
    name,
    required,
    loopFocus,
    highlightItemOnHover,
  ]);

  const { requestHighlightReconcile } = useHighlightChangeNotifier<Value>({
    store,
    onHighlightChange,
  });

  store.useContextCallback('requestHighlightReconcile', requestHighlightReconcile);

  const ref = useMergedRefs(inputRef, validation.inputRef);

  const hasSelection = Array.isArray(value) && value.length > 0;

  // Render one hidden <input> per selected value for form submission.
  // The first input carries validation attributes; additional inputs are type="hidden".
  const hiddenInputs = React.useMemo(() => {
    if (!Array.isArray(value) || !name || value.length === 0) {
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
  }, [value, name, itemToStringValue]);

  return (
    <ListboxRootContext.Provider value={store}>
      {children}
      <input
        {...validation.getInputValidationProps({
          onFocus() {
            store.state.listElement?.focus({
              // @ts-expect-error - focusVisible is not yet in the lib.dom.d.ts
              focusVisible: true,
            });
          },
        })}
        id={generatedId ? `${generatedId}-hidden-input` : undefined}
        name={hasSelection ? undefined : name}
        value={serializedValue}
        // Handle browser autofill: match the autofilled string against registered
        // values to resolve back to the original value type.
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          // Workaround for https://github.com/facebook/react/issues/9023
          if (event.nativeEvent.defaultPrevented) {
            return;
          }

          if (isMultipleSelectionMode(selectionMode)) {
            // Browser autofill only writes a single scalar value.
            return;
          }

          const nextValue = event.target.value;
          const matchingValue = valuesRef.current.find((v) => {
            const candidate = stringifyAsValue(v, itemToStringValue);
            return candidate.toLowerCase() === nextValue.toLowerCase();
          });

          if (matchingValue != null) {
            const details = createChangeEventDetails(REASONS.none, event.nativeEvent);
            setDirty(matchingValue !== validityData.initialValue);
            setValue([matchingValue], details);
            if (shouldValidateOnChange()) {
              validation.commit([matchingValue]);
            }
          }
        }}
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

export interface ListboxRootProps<Value> {
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
   * Determines how user interactions affect the selection.
   * - `'none'` — Items cannot be selected.
   * - `'single'` — Only one item can be selected at a time.
   * - `'multiple'` — Clicking toggles items. Shift+Click selects a range.
   * - `'explicit-multiple'` — Like a file browser: plain click replaces the selection,
   *    Ctrl/Cmd+Click toggles, Shift+Click selects a range.
   * @default 'single'
   */
  selectionMode?: SelectionMode | undefined;
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
  defaultValue?: Value[] | undefined;
  /**
   * The value of the listbox. Use when controlled. Always an array.
   */
  value?: Value[] | undefined;
  /**
   * Event handler called when the value of the listbox changes.
   */
  onValueChange?:
    | ((value: Value[], eventDetails: ListboxRootChangeEventDetails) => void)
    | undefined;
  /**
   * Event handler called when the highlighted item changes.
   * Receives the highlighted item's value and DOM element, or `null` for both
   * when no item is highlighted.
   */
  onHighlightChange?: ((value: Value | null, element: HTMLElement | null) => void) | undefined;
  /**
   * Whether items are currently being loaded.
   * @default false
   */
  loading?: boolean | undefined;
  /**
   * Event handler called when more items should be loaded.
   */
  onLoadMore?: (() => void) | undefined;
}

export interface ListboxRootState {}

export type ListboxRootChangeEventReason =
  | typeof REASONS.itemPress
  | typeof REASONS.listNavigation
  | typeof REASONS.none;

export type ListboxRootChangeEventDetails = BaseUIChangeEventDetails<ListboxRootChangeEventReason>;

export namespace ListboxRoot {
  export type Props<Value> = ListboxRootProps<Value>;
  export type State = ListboxRootState;
  export type Actions<Value> = ListboxRootActions<Value>;
  export type ChangeEventReason = ListboxRootChangeEventReason;
  export type ChangeEventDetails = ListboxRootChangeEventDetails;
}
