'use client';
import * as React from 'react';
import { useSelectRoot } from './useSelectRoot';
import { SelectRootContext } from './SelectRootContext';
import { SelectIndexContext } from './SelectIndexContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useForkRef } from '../../utils/useForkRef';

/**
 * Groups all parts of the select.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectRoot: SelectRoot = function SelectRoot<Value>(
  props: SelectRoot.Props<Value>,
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
    multiple,
    actionsRef,
    inputRef,
    onOpenChangeComplete,
    children,
  } = props;

  const params: SelectRoot.SingleSelectProps<Value> = {
    id,
    value: valueProp,
    defaultValue,
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
    onValueChange,
  };

  if (multiple) {
    (params as unknown as SelectRoot.MultiSelectProps<Value>).multiple = true;
  }

  const selectRoot = useSelectRoot(params);

  const { setDirty, validityData, validationMode } = useFieldRootContext();

  const { rootContext, indexContext } = selectRoot;
  const value = rootContext.value;

  const ref = useForkRef(inputRef, rootContext.fieldControlValidation.inputRef);

  const serializedValue = React.useMemo(() => {
    if (value == null) {
      return '';
    }
    return typeof value === 'string' ? value : JSON.stringify(value);
  }, [value]);

  return (
    <SelectRootContext.Provider value={rootContext}>
      <SelectIndexContext.Provider value={indexContext}>
        {children}
        <input
          {...rootContext.fieldControlValidation.getInputValidationProps({
            onFocus() {
              // Move focus to the trigger element when the hidden input is focused.
              rootContext.triggerElement?.focus();
            },
            // Handle browser autofill.
            onChange(event: React.ChangeEvent<HTMLSelectElement>) {
              // Workaround for https://github.com/facebook/react/issues/9023
              if (event.nativeEvent.defaultPrevented) {
                return;
              }

              const nextValue = event.target.value;

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
            },
            id: rootContext.id,
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
        {multiple &&
          Array.isArray(value) &&
          value.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
      </SelectIndexContext.Provider>
    </SelectRootContext.Provider>
  );
};

export interface SelectRoot {
  <Value>(props: SelectRoot.Props<Value>): React.JSX.Element;
}

export namespace SelectRoot {
  export interface SingleSelectProps<Value>
    extends Omit<useSelectRoot.Parameters<Value>, 'multiple'> {
    children?: React.ReactNode;
    /**
     * Whether multiple items can be selected.
     * @default false
     */
    multiple?: false;
    /**
     * A ref to access the hidden input element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
  }

  export interface MultiSelectProps<Value>
    extends Omit<useSelectRoot.Parameters<Value>, 'multiple'> {
    children?: React.ReactNode;
    /**
     * Whether multiple items can be selected.
     * @default false
     */
    multiple: true;
    /**
     * A ref to access the hidden input element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
  }

  export type Props<Value> = SingleSelectProps<Value> | MultiSelectProps<Value>;
}
