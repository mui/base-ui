'use client';
import * as React from 'react';
import { useSelectRoot } from './useSelectRoot';
import { SelectRootContext } from './SelectRootContext';
import { SelectIndexContext } from './SelectIndexContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { visuallyHidden } from '../../utils/visuallyHidden';

/**
 * Groups all parts of the select.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectRoot: SelectRoot = function SelectRoot<Value>(
  props: SelectRoot.Props<Value>,
): React.JSX.Element {
  const {
    value: valueProp,
    defaultValue = null,
    onValueChange,
    open,
    defaultOpen = false,
    onOpenChange,
    alignItemToTrigger = true,
    name,
    disabled = false,
    readOnly = false,
    required = false,
    modal = true,
    actionsRef,
    onOpenChangeComplete,
  } = props;

  const selectRoot = useSelectRoot<Value>({
    value: valueProp,
    defaultValue,
    onValueChange,
    open,
    defaultOpen,
    onOpenChange,
    alignItemToTrigger,
    name,
    disabled,
    readOnly,
    required,
    modal,
    actionsRef,
    onOpenChangeComplete,
  });

  const { setDirty, validityData, validationMode } = useFieldRootContext();

  const { rootContext } = selectRoot;
  const value = rootContext.value;

  const serializedValue = React.useMemo(() => {
    if (value == null) {
      return ''; // avoid uncontrolled -> controlled error
    }
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }, [value]);

  return (
    <SelectRootContext.Provider value={selectRoot.rootContext}>
      <SelectIndexContext.Provider value={selectRoot.indexContext}>
        {props.children}
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
                  selectRoot.rootContext.fieldControlValidation.commitValidation(exactValue);
                }
              }
            },
            id: rootContext.id,
            name: rootContext.name,
            disabled: rootContext.disabled,
            required: rootContext.required,
            readOnly: rootContext.readOnly,
            value: serializedValue,
            ref: rootContext.fieldControlValidation.inputRef,
            style: visuallyHidden,
            tabIndex: -1,
            'aria-hidden': true,
          })}
        />
      </SelectIndexContext.Provider>
    </SelectRootContext.Provider>
  );
};

namespace SelectRoot {
  export interface Props<Value> extends useSelectRoot.Parameters<Value> {
    children?: React.ReactNode;
  }

  export interface State {}

  export type Actions = useSelectRoot.Actions;
}

interface SelectRoot {
  <Value>(props: SelectRoot.Props<Value>): React.JSX.Element;
}

export { SelectRoot };
