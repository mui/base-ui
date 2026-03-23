'use client';
import * as React from 'react';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { Store } from '@base-ui/utils/store';
import { ListboxRootContext } from './ListboxRootContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { type State as StoreState } from '../store';
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

/**
 * Groups all parts of the listbox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export function ListboxRoot<Value, Multiple extends boolean | undefined = false>(
  props: ListboxRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const {
    id,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    name: nameProp,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    multiple = false,
    orientation = 'vertical',
    loopFocus = true,
    highlightItemOnHover = true,
    isItemEqualToValue = defaultItemEquality,
    itemToStringLabel,
    itemToStringValue,
    inputRef,
    onItemsReorder,
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

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: multiple ? (defaultValue ?? EMPTY_ARRAY) : defaultValue,
    name: 'Listbox',
    state: 'value',
  });

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const valuesRef = React.useRef<Array<any>>([]);
  const typingRef = React.useRef(false);
  const lastSelectedIndexRef = React.useRef<number | null>(null);

  const store = useRefWithInit(
    () =>
      new Store<StoreState>({
        id: generatedId,
        labelId: undefined,
        multiple,
        itemToStringLabel,
        itemToStringValue,
        isItemEqualToValue,
        value,
        activeIndex: null,
        selectedIndex: null,
        listElement: null,
        dragActiveIndex: null,
        dropTargetIndex: null,
        loading,
        orientation,
        disabled,
        readOnly,
      }),
  ).current;

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
    setFilled(multiple ? Array.isArray(value) && value.length > 0 : value != null);
  }, [multiple, value, setFilled]);

  useIsoLayoutEffect(
    function syncSelectedIndex() {
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
    [multiple, value, valuesRef, isItemEqualToValue, store],
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

  const setValue = useStableCallback(
    (nextValue: any, eventDetails: ListboxRoot.ChangeEventDetails) => {
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);
    },
  );

  useIsoLayoutEffect(() => {
    store.update({
      id: generatedId,
      multiple,
      value,
      itemToStringLabel,
      itemToStringValue,
      isItemEqualToValue,
      loading,
      orientation,
      disabled,
      readOnly,
    });
  }, [
    store,
    generatedId,
    multiple,
    value,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
    loading,
    orientation,
    disabled,
    readOnly,
  ]);

  const contextValue: ListboxRootContext = React.useMemo(
    () => ({
      store,
      name,
      required,
      disabled,
      readOnly,
      multiple,
      highlightItemOnHover,
      orientation,
      loopFocus,
      setValue,
      listRef,
      valuesRef,
      labelsRef,
      typingRef,
      lastSelectedIndexRef,
      validation,
      onItemsReorder,
      onLoadMore,
    }),
    [
      store,
      name,
      required,
      disabled,
      readOnly,
      multiple,
      highlightItemOnHover,
      orientation,
      loopFocus,
      setValue,
      validation,
      onItemsReorder,
      onLoadMore,
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
    <ListboxRootContext.Provider value={contextValue}>
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
        id={generatedId && hiddenInputName == null ? `${generatedId}-hidden-input` : undefined}
        name={hiddenInputName}
        value={serializedValue}
        // Handle browser autofill: match the autofilled string against registered
        // values to resolve back to the original value type.
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          // Workaround for https://github.com/facebook/react/issues/9023
          if (event.nativeEvent.defaultPrevented) {
            return;
          }

          if (multiple) {
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
            setValue(matchingValue, details);
            if (shouldValidateOnChange()) {
              validation.commit(matchingValue);
            }
          }
        }}
        disabled={disabled}
        required={required && !hasMultipleSelection}
        readOnly={readOnly}
        ref={ref}
        style={name ? visuallyHiddenInput : visuallyHidden}
        tabIndex={-1}
        aria-hidden
      />
      {hiddenInputs}
    </ListboxRootContext.Provider>
  );
}

type ListboxValueType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

export interface ListboxRootProps<Value, Multiple extends boolean | undefined = false> {
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
   * The id of the Listbox.
   */
  id?: string | undefined;
  /**
   * Whether the user must choose a value before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
  /**
   * Whether the user should be unable to change the selected value.
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
  defaultValue?: ListboxValueType<Value, Multiple> | null | undefined;
  /**
   * The value of the listbox. Use when controlled.
   */
  value?: ListboxValueType<Value, Multiple> | null | undefined;
  /**
   * Event handler called when the value of the listbox changes.
   */
  onValueChange?:
    | ((
        value: ListboxValueType<Value, Multiple> | (Multiple extends true ? never : null),
        eventDetails: ListboxRootChangeEventDetails,
      ) => void)
    | undefined;
  /**
   * Event handler called when items are reordered via drag-and-drop or keyboard.
   */
  onItemsReorder?:
    | ((event: { items: Value[]; reason: 'drag' | 'keyboard' }) => void)
    | undefined;
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

export type ListboxRootChangeEventDetails =
  BaseUIChangeEventDetails<ListboxRootChangeEventReason>;

export namespace ListboxRoot {
  export type Props<Value, Multiple extends boolean | undefined = false> = ListboxRootProps<
    Value,
    Multiple
  >;
  export type State = ListboxRootState;
  export type ChangeEventReason = ListboxRootChangeEventReason;
  export type ChangeEventDetails = ListboxRootChangeEventDetails;
}
