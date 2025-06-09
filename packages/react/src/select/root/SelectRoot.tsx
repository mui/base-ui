'use client';
import * as React from 'react';
import { type SelectOpenChangeReason, useSelectRoot } from './useSelectRoot';
import { SelectRootContext, SelectFloatingContext } from './SelectRootContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useForkRef } from '../../utils/useForkRef';
import { SelectItemTemplate } from '../item-template/SelectItemTemplate';

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
    actionsRef,
    inputRef,
    onOpenChangeComplete,
    items,
  } = props;

  const itemTemplateComponent = React.Children.toArray(props.children).find(
    (child) => React.isValidElement(child) && child.type === SelectItemTemplate,
  ) as React.ReactElement<SelectItemTemplate.Props> | undefined;

  let itemTemplate: ((item: SelectRoot.SelectOption<Value>) => React.ReactNode) | undefined;

  if (itemTemplateComponent) {
    itemTemplate = itemTemplateComponent.props.children;
  }

  const { rootContext, floatingContext } = useSelectRoot<Value>({
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
    itemTemplate,
  });
  const store = rootContext.store;

  const { setDirty, validityData, validationMode } = useFieldRootContext();

  const value = store.state.value;

  const ref = useForkRef(inputRef, rootContext.fieldControlValidation.inputRef);

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
            id,
            name: rootContext.name,
            disabled: rootContext.disabled,
            required: rootContext.required,
            readOnly: rootContext.readOnly,
            value: serializedValue,
            ref,
            style: visuallyHidden,
            tabIndex: -1,
            'aria-hidden': true,
          })}
        />
      </SelectFloatingContext.Provider>
    </SelectRootContext.Provider>
  );
};

export namespace SelectRoot {
  export interface Props<Value> extends Omit<useSelectRoot.Parameters<Value>, 'itemTemplate'> {
    children?: React.ReactNode;
    /**
     * A ref to access the hidden input element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
  }

  export interface State {}

  export type Actions = useSelectRoot.Actions;

  export type OpenChangeReason = SelectOpenChangeReason;

  export interface SelectOption<Value> {
    value: Value;
    label: string;
    disabled?: boolean;
  }
}

export interface SelectRoot {
  <Value>(props: SelectRoot.Props<Value>): React.JSX.Element;
}
