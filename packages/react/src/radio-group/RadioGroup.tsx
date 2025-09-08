'use client';
import * as React from 'react';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import type { BaseUIComponentProps, HTMLProps } from '../utils/types';
import { useBaseUiId } from '../utils/useBaseUiId';
import { contains } from '../floating-ui-react/utils';
import { SHIFT } from '../composite/composite';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import { useFormContext } from '../form/FormContext';
import { useField } from '../field/useField';
import { useFieldRootContext } from '../field/root/FieldRootContext';

import { fieldValidityMapping } from '../field/utils/constants';
import type { FieldRoot } from '../field/root/FieldRoot';
import { mergeProps } from '../merge-props';

import { RadioGroupContext } from './RadioGroupContext';
import { type BaseUIEventDetails } from '../utils/createBaseUIEventDetails';

const MODIFIER_KEYS = [SHIFT];

/**
 * Provides a shared state to a series of radio buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Radio Group](https://base-ui.com/react/components/radio)
 */
export const RadioGroup = React.forwardRef(function RadioGroup(
  componentProps: RadioGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp,
    readOnly,
    required,
    onValueChange: onValueChangeProp,
    value: externalValue,
    defaultValue,
    name: nameProp,
    inputRef: inputRefProp,
    id: idProp,
    ...elementProps
  } = componentProps;

  const {
    labelId,
    setTouched: setFieldTouched,
    setFocused,
    validationMode,
    name: fieldName,
    disabled: fieldDisabled,
    state: fieldState,
    fieldControlValidation,
  } = useFieldRootContext();
  const { clearErrors } = useFormContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const id = useBaseUiId(idProp);

  const [checkedValue, setCheckedValueUnwrapped] = useControlled({
    controlled: externalValue,
    default: defaultValue,
    name: 'RadioGroup',
    state: 'value',
  });

  const onValueChange = useEventCallback(onValueChangeProp);

  const setCheckedValue = useEventCallback(
    (value: unknown, eventDetails: RadioGroup.ChangeEventDetails) => {
      onValueChange(value, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setCheckedValueUnwrapped(value);
    },
  );

  const controlRef = React.useRef<HTMLElement>(null);
  const registerControlRef = useEventCallback((element: HTMLElement | null) => {
    if (controlRef.current == null && element != null) {
      controlRef.current = element;
    }
  });

  useField({
    id,
    commitValidation: fieldControlValidation.commitValidation,
    value: checkedValue,
    controlRef,
    name,
    getValue: () => checkedValue ?? null,
  });

  const prevValueRef = React.useRef(checkedValue);

  useIsoLayoutEffect(() => {
    if (prevValueRef.current === checkedValue) {
      return;
    }

    clearErrors(name);

    if (validationMode === 'onChange') {
      fieldControlValidation.commitValidation(checkedValue);
    } else {
      fieldControlValidation.commitValidation(checkedValue, true);
    }
  }, [name, clearErrors, validationMode, checkedValue, fieldControlValidation]);

  useIsoLayoutEffect(() => {
    prevValueRef.current = checkedValue;
  }, [checkedValue]);

  const [touched, setTouched] = React.useState(false);

  const onBlur = useEventCallback((event) => {
    if (!contains(event.currentTarget, event.relatedTarget)) {
      setFieldTouched(true);
      setFocused(false);

      if (validationMode === 'onBlur') {
        fieldControlValidation.commitValidation(checkedValue);
      }
    }
  });

  const onKeyDownCapture = useEventCallback((event) => {
    if (event.key.startsWith('Arrow')) {
      setFieldTouched(true);
      setTouched(true);
      setFocused(true);
    }
  });

  const serializedCheckedValue = React.useMemo(() => {
    if (checkedValue == null) {
      return ''; // avoid uncontrolled -> controlled error
    }
    if (typeof checkedValue === 'string') {
      return checkedValue;
    }
    return JSON.stringify(checkedValue);
  }, [checkedValue]);

  const mergedInputRef = useMergedRefs(fieldControlValidation.inputRef, inputRefProp);

  const inputProps = mergeProps<'input'>(
    {
      value: serializedCheckedValue,
      ref: mergedInputRef,
      id,
      name: serializedCheckedValue ? name : undefined,
      disabled,
      readOnly,
      required,
      'aria-hidden': true,
      tabIndex: -1,
      style: visuallyHidden,
      onFocus() {
        controlRef.current?.focus();
      },
    },
    fieldControlValidation.getInputValidationProps,
  );

  const state: RadioGroup.State = React.useMemo(
    () => ({
      ...fieldState,
      disabled: disabled ?? false,
      required: required ?? false,
      readOnly: readOnly ?? false,
    }),
    [fieldState, disabled, readOnly, required],
  );

  const contextValue: RadioGroupContext = React.useMemo(
    () => ({
      ...fieldState,
      checkedValue,
      disabled,
      name,
      onValueChange,
      readOnly,
      registerControlRef,
      required,
      setCheckedValue,
      setTouched,
      touched,
    }),
    [
      checkedValue,
      disabled,
      fieldState,
      name,
      onValueChange,
      readOnly,
      registerControlRef,
      required,
      setCheckedValue,
      setTouched,
      touched,
    ],
  );

  const defaultProps: HTMLProps = {
    role: 'radiogroup',
    'aria-required': required || undefined,
    'aria-disabled': disabled || undefined,
    'aria-readonly': readOnly || undefined,
    'aria-labelledby': labelId,
    onFocus() {
      setFocused(true);
    },
    onBlur,
    onKeyDownCapture,
  };

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <CompositeRoot
        render={render}
        className={className}
        state={state}
        props={[defaultProps, fieldControlValidation.getValidationProps, elementProps]}
        refs={[forwardedRef]}
        customStyleHookMapping={fieldValidityMapping}
        enableHomeAndEndKeys={false}
        modifierKeys={MODIFIER_KEYS}
        stopEventPropagation
      />
      <input {...inputProps} />
    </RadioGroupContext.Provider>
  );
});

export namespace RadioGroup {
  export interface State extends FieldRoot.State {
    /**
     * Whether the user should be unable to select a different radio button in the group.
     */
    readOnly: boolean | undefined;
  }

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'value'> {
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether the user should be unable to select a different radio button in the group.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Whether the user must choose a value before submitting a form.
     * @default false
     */
    required?: boolean;
    /**
     * Identifies the field when a form is submitted.
     */
    name?: string;
    /**
     * The controlled value of the radio item that should be currently selected.
     *
     * To render an uncontrolled radio group, use the `defaultValue` prop instead.
     */
    value?: unknown;
    /**
     * The uncontrolled value of the radio button that should be initially selected.
     *
     * To render a controlled radio group, use the `value` prop instead.
     */
    defaultValue?: unknown;
    /**
     * Callback fired when the value changes.
     */
    onValueChange?: (value: unknown, eventDetails: ChangeEventDetails) => void;
    /**
     * A ref to access the hidden input element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
  }

  export type ChangeEventReason = 'none';
  export type ChangeEventDetails = BaseUIEventDetails<ChangeEventReason>;
}
