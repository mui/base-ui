'use client';
import * as React from 'react';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { useSelectRoot } from './useSelectRoot';
import { SelectRootContext, SelectFloatingContext } from './SelectRootContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import {
  type BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { stringifyAsValue } from '../../utils/resolveValueLabel';

/**
 * Groups all parts of the select.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectRoot<Value, Multiple extends boolean | undefined = false>(
  props: SelectRootControlledProps<Value, Multiple>,
): React.JSX.Element;
export function SelectRoot<Value, Multiple extends boolean | undefined = false>(
  props: SelectRootUncontrolledProps<Value, Multiple>,
): React.JSX.Element;
export function SelectRoot<Value, Multiple extends boolean | undefined = false>(
  props: SelectRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const {
    id,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    open,
    defaultOpen = false,
    onOpenChange,
    name,
    disabled = false,
    readOnly = false,
    required = false,
    modal = true,
    actionsRef,
    inputRef,
    onOpenChangeComplete,
    items,
    multiple,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
    children,
  } = props;

  const { rootContext, floatingContext, value } = useSelectRoot<Value, Multiple>({
    id,
    value: valueProp,
    defaultValue,
    onValueChange,
    open,
    defaultOpen,
    onOpenChange,
    name,
    disabled,
    readOnly,
    required,
    modal,
    actionsRef,
    onOpenChangeComplete,
    items,
    multiple,
    itemToStringLabel,
    itemToStringValue,
    isItemEqualToValue,
  });
  const store = rootContext.store;
  const isMultiple = multiple ?? false;

  const { setDirty, validityData, validationMode, controlId } = useFieldRootContext();

  const ref = useMergedRefs(inputRef, rootContext.fieldControlValidation.inputRef);

  const serializedValue = React.useMemo(() => {
    if (isMultiple && Array.isArray(value) && value.length === 0) {
      return '';
    }
    return stringifyAsValue(value, itemToStringValue);
  }, [isMultiple, value, itemToStringValue]);

  const hiddenInputs = React.useMemo(() => {
    if (!isMultiple || !Array.isArray(value) || !rootContext.name) {
      return null;
    }

    return value.map((v) => {
      const currentSerializedValue = stringifyAsValue(v, itemToStringValue);
      return (
        <input
          key={currentSerializedValue}
          type="hidden"
          name={rootContext.name}
          value={currentSerializedValue}
        />
      );
    });
  }, [isMultiple, value, rootContext.name, itemToStringValue]);

  return (
    <SelectRootContext.Provider value={rootContext}>
      <SelectFloatingContext.Provider value={floatingContext}>
        {children}
        <input
          {...rootContext.fieldControlValidation.getInputValidationProps({
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
              const details = createChangeEventDetails('none', event.nativeEvent);

              function handleChange() {
                if (isMultiple) {
                  // Browser autofill only writes a single scalar value.
                  return;
                }

                // Handle single selection: match against registered values using serialization
                const matchingValue = rootContext.valuesRef.current.find((v) => {
                  const candidate = stringifyAsValue(v, itemToStringValue);
                  if (candidate.toLowerCase() === nextValue.toLowerCase()) {
                    return true;
                  }
                  return false;
                });

                if (matchingValue != null) {
                  setDirty(matchingValue !== validityData.initialValue);
                  rootContext.setValue?.(matchingValue, details);

                  if (validationMode === 'onChange') {
                    rootContext.fieldControlValidation.commitValidation(matchingValue);
                  }
                }
              }

              store.set('forceMount', true);
              queueMicrotask(handleChange);
            },
            id: id || controlId || undefined,
            name: isMultiple ? undefined : rootContext.name,
            value: serializedValue,
            disabled: rootContext.disabled,
            required: rootContext.required,
            readOnly: rootContext.readOnly,
            ref,
            style: visuallyHidden,
            tabIndex: -1,
            'aria-hidden': true,
          })}
        />
        {hiddenInputs}
      </SelectFloatingContext.Provider>
    </SelectRootContext.Provider>
  );
}

interface SelectRootProps<Value> {
  children?: React.ReactNode;
  /**
   * A ref to access the hidden input element.
   */
  inputRef?: React.Ref<HTMLInputElement>;
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
   * Whether the user should be unable to choose a different option from the select popup.
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
  multiple?: boolean;
  /**
   * The value of the select.
   */
  value?: Value;
  /**
   * Callback fired when the value of the select changes. Use when controlled.
   */
  onValueChange?: (value: Value, eventDetails: SelectRoot.ChangeEventDetails) => void;
  /**
   * The uncontrolled value of the select when it’s initially rendered.
   *
   * To render a controlled select, use the `value` prop instead.
   * @default null
   */
  defaultValue?: Value | null;
  /**
   * Whether the select popup is initially open.
   *
   * To render a controlled select popup, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Event handler called when the select popup is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: SelectRoot.ChangeEventDetails) => void;
  /**
   * Event handler called after any animations complete when the select popup is opened or closed.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * Whether the select popup is currently open.
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
  actionsRef?: React.RefObject<SelectRoot.Actions>;
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
  items?: Record<string, React.ReactNode> | ReadonlyArray<{ label: React.ReactNode; value: Value }>;
  /**
   * When the item values are objects (`<Select.Item value={object}>`), this function converts the object value to a string representation for display in the trigger.
   * If the shape of the object is `{ value, label }`, the label will be used automatically without needing to specify this prop.
   */
  itemToStringLabel?: (itemValue: Value) => string;
  /**
   * When the item values are objects (`<Select.Item value={object}>`), this function converts the object value to a string representation for form submission.
   * If the shape of the object is `{ value, label }`, the value will be used automatically without needing to specify this prop.
   */
  itemToStringValue?: (itemValue: Value) => string;
  /**
   * Custom comparison logic used to determine if a select item value matches the current selected value. Useful when item values are objects without matching referentially.
   * Defaults to `Object.is` comparison.
   */
  isItemEqualToValue?: (itemValue: Value, value: Value) => boolean;
}

type SelectValueType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

type SelectRootBaseProps<Value, Multiple extends boolean | undefined> = Omit<
  SelectRootProps<Value>,
  'multiple' | 'value' | 'defaultValue' | 'onValueChange'
> & {
  /**
   * Whether multiple items can be selected.
   * @default false
   */
  multiple?: Multiple;
  /**
   * The uncontrolled value of the select when it’s initially rendered.
   *
   * To render a controlled select, use the `value` prop instead.
   * @default null
   */
  defaultValue?: SelectValueType<Value, Multiple> | null;
};

type SelectRootControlledProps<Value, Multiple extends boolean | undefined> = SelectRootBaseProps<
  Value,
  Multiple
> & {
  /**
   * The value of the select. Use when controlled.
   */
  value: SelectValueType<Value, Multiple>;
  /**
   * Callback fired when the value of the select changes.
   */
  onValueChange?: (
    value: SelectValueType<Value, Multiple>,
    eventDetails: SelectRoot.ChangeEventDetails,
  ) => void;
};

type SelectRootUncontrolledProps<Value, Multiple extends boolean | undefined> = SelectRootBaseProps<
  Value,
  Multiple
> & {
  /**
   * The value of the select. Use when controlled.
   */
  value?: undefined;
  /**
   * Callback fired when the value of the select changes.
   */
  onValueChange?: (
    value: SelectValueType<Value, Multiple> | (Multiple extends true ? never : null),
    eventDetails: SelectRoot.ChangeEventDetails,
  ) => void;
};

export type SelectRootConditionalProps<Value, Multiple extends boolean | undefined = false> =
  | SelectRootControlledProps<Value, Multiple>
  | SelectRootUncontrolledProps<Value, Multiple>;

export namespace SelectRoot {
  export type Props<
    Value,
    Multiple extends boolean | undefined = false,
  > = SelectRootConditionalProps<Value, Multiple>;

  export interface State {}

  export interface Actions {
    unmount: () => void;
  }

  export type ChangeEventReason =
    | 'trigger-press'
    | 'outside-press'
    | 'escape-key'
    | 'window-resize'
    | 'item-press'
    | 'focus-out'
    | 'list-navigation'
    | 'cancel-open'
    | 'none';
  export type ChangeEventDetails = BaseUIChangeEventDetails<ChangeEventReason>;
}
