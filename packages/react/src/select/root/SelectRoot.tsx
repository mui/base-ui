'use client';
import * as React from 'react';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { useForkRef } from '@base-ui-components/utils/useForkRef';
import { useSelectRoot } from './useSelectRoot';
import { SelectRootContext, SelectFloatingContext } from './SelectRootContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { serializeValue } from '../../utils/serializeValue';
import type { BaseOpenChangeReason } from '../../utils/translateOpenChangeReason';

/**
 * Groups all parts of the select.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectRoot<Value>(props: SelectRoot.SingleProps<Value>): React.JSX.Element;
export function SelectRoot<Value>(props: SelectRoot.MultipleProps<Value>): React.JSX.Element;
export function SelectRoot<Value>(props: SelectRoot.Props<Value>): React.JSX.Element {
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
    multiple = false,
  } = props;

  const { rootContext, floatingContext, value } = useSelectRoot<Value>({
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

  const { setDirty, validityData, validationMode, controlId } = useFieldRootContext();

  const ref = useForkRef(inputRef, rootContext.fieldControlValidation.inputRef);

  const serializedValue = React.useMemo(() => {
    if (multiple && Array.isArray(value) && value.length === 0) {
      return '';
    }

    return serializeValue(value);
  }, [multiple, value]);

  const hiddenInputs = React.useMemo(() => {
    if (!multiple || !Array.isArray(value) || !rootContext.name) {
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
  }, [multiple, value, rootContext.name]);

  return (
    <SelectRootContext.Provider value={rootContext}>
      <SelectFloatingContext.Provider value={floatingContext}>
        {props.children}
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
                if (multiple) {
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
                    rootContext.setValue?.(exactValue, event.nativeEvent);

                    if (validationMode === 'onChange') {
                      rootContext.fieldControlValidation.commitValidation(exactValue);
                    }
                  }
                }
              });
            },
            id: id || controlId || undefined,
            name: multiple ? undefined : rootContext.name,
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

export namespace SelectRoot {
  export interface Props<Value> {
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
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: SelectRoot.OpenChangeReason | undefined,
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

  export interface State {}

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = BaseOpenChangeReason | 'window-resize';

  export interface SingleProps<Value> extends Props<Value> {
    /**
     * Whether multiple items can be selected.
     * @default false
     */
    multiple?: false | undefined;
  }

  export interface MultipleProps<Value>
    extends Omit<Props<Value>, 'multiple' | 'value' | 'defaultValue' | 'onValueChange'> {
    /**
     * Whether multiple items can be selected.
     * @default false
     */
    multiple: true;
    value?: Value[] | null;
    defaultValue?: Value[] | null;
    onValueChange?: (value: Value[], event?: Event) => void;
  }
}
