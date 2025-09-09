'use client';
import * as React from 'react';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { useSelectRoot } from './useSelectRoot';
import { SelectRootContext, SelectFloatingContext } from './SelectRootContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { serializeValue } from '../../utils/serializeValue';
import {
  type BaseUIEventDetails,
  createBaseUIEventDetails,
} from '../../utils/createBaseUIEventDetails';

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
  });
  const store = rootContext.store;
  const isMultiple = multiple ?? false;

  const { setDirty, validityData, validationMode, controlId } = useFieldRootContext();

  const ref = useMergedRefs(inputRef, rootContext.fieldControlValidation.inputRef);

  const serializedValue = React.useMemo(() => {
    if (isMultiple && Array.isArray(value) && value.length === 0) {
      return '';
    }

    return serializeValue(value);
  }, [isMultiple, value]);

  const hiddenInputs = React.useMemo(() => {
    if (!isMultiple || !Array.isArray(value) || !rootContext.name) {
      return null;
    }

    return value.map((v) => {
      const currentSerializedValue = serializeValue(v);
      return (
        <input
          key={currentSerializedValue}
          type="hidden"
          name={rootContext.name}
          value={currentSerializedValue}
        />
      );
    });
  }, [isMultiple, value, rootContext.name]);

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

              store.set('forceMount', true);

              queueMicrotask(() => {
                if (isMultiple) {
                  // Browser autofill only ever writes one scalar value per field.
                  // Because a multi-select expects an array, every mainstream engine skips it.
                  // Reliably pre-selecting multiple options therefore has to be done in
                  // application code, not via browser autofill.
                } else {
                  // Handle single selection
                  const exactValue = rootContext.valuesRef.current.find(
                    (v) =>
                      v === nextValue ||
                      (typeof value === 'string' && nextValue.toLowerCase() === v.toLowerCase()),
                  );

                  if (exactValue != null) {
                    setDirty(exactValue !== validityData.initialValue);
                    rootContext.setValue?.(
                      exactValue,
                      createBaseUIEventDetails('none', event.nativeEvent),
                    );

                    if (validationMode === 'onChange') {
                      rootContext.fieldControlValidation.commitValidation(exactValue);
                    }
                  }
                }
              });
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
   * Whether the select menu is initially open.
   *
   * To render a controlled select menu, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Event handler called when the select menu is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: SelectRoot.ChangeEventDetails) => void;
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
  actionsRef?: React.RefObject<SelectRoot.Actions>;
  /**
   * Data structure of the items rendered in the select menu.
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
  items?: Record<string, React.ReactNode> | Array<{ label: React.ReactNode; value: Value }>;
}

type SelectValueType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

export type SelectRootConditionalProps<Value, Multiple extends boolean | undefined = false> = Omit<
  SelectRootProps<Value>,
  'multiple' | 'value' | 'defaultValue' | 'onValueChange'
> & {
  /**
   * Whether multiple items can be selected.
   * @default false
   */
  multiple?: Multiple;
  /**
   * The value of the select.
   */
  value?: SelectValueType<Value, Multiple>;
  /**
   * The uncontrolled value of the select when it’s initially rendered.
   *
   * To render a controlled select, use the `value` prop instead.
   * @default null
   */
  defaultValue?: SelectValueType<Value, Multiple> | null;
  /**
   * Callback fired when the value of the select changes. Use when controlled.
   */
  onValueChange?: (
    value: SelectValueType<Value, Multiple>,
    eventDetails: SelectRoot.ChangeEventDetails,
  ) => void;
};

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
  export type ChangeEventDetails = BaseUIEventDetails<ChangeEventReason>;
}
