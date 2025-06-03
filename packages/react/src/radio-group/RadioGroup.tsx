'use client';
import * as React from 'react';
import { contains } from '../floating-ui-react/utils';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useControlled } from '../utils/useControlled';
import { useForkRef } from '../utils/useForkRef';
import { useModernLayoutEffect } from '../utils/useModernLayoutEffect';
import { useRenderElement } from '../utils/useRenderElement';
import { useEventCallback } from '../utils/useEventCallback';
import type { BaseUIComponentProps } from '../utils/types';
import { visuallyHidden } from '../utils/visuallyHidden';
import { SHIFT } from '../composite/composite';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import { useDirection } from '../direction-provider/DirectionContext';
import { useFormContext } from '../form/FormContext';
import { useField } from '../field/useField';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import { fieldValidityMapping } from '../field/utils/constants';
import type { FieldRoot } from '../field/root/FieldRoot';
import { mergeProps } from '../merge-props';

import { RadioGroupContext } from './RadioGroupContext';

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

  const direction = useDirection();

  const {
    labelId,
    setTouched: setFieldTouched,
    setFocused,
    validationMode,
    name: fieldName,
    disabled: fieldDisabled,
    state: fieldState,
  } = useFieldRootContext();
  const fieldControlValidation = useFieldControlValidation();
  const { clearErrors } = useFormContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const id = useBaseUiId(idProp);

  const [checkedValue, setCheckedValue] = useControlled({
    controlled: externalValue,
    default: defaultValue,
    name: 'RadioGroup',
    state: 'value',
  });

  useField({
    id,
    commitValidation: fieldControlValidation.commitValidation,
    value: checkedValue,
    controlRef: fieldControlValidation.inputRef,
  });

  const prevValueRef = React.useRef(checkedValue);

  useModernLayoutEffect(() => {
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

  useModernLayoutEffect(() => {
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

  const onValueChange = useEventCallback(onValueChangeProp);

  const serializedCheckedValue = React.useMemo(() => {
    if (checkedValue == null) {
      return ''; // avoid uncontrolled -> controlled error
    }
    if (typeof checkedValue === 'string') {
      return checkedValue;
    }
    return JSON.stringify(checkedValue);
  }, [checkedValue]);

  const mergedInputRef = useForkRef(fieldControlValidation.inputRef, inputRefProp);

  const inputProps = mergeProps<'input'>(
    {
      value: serializedCheckedValue,
      ref: mergedInputRef,
      id,
      name,
      disabled,
      readOnly,
      required,
      'aria-hidden': true,
      tabIndex: -1,
      style: visuallyHidden,
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
      required,
      setCheckedValue,
      setTouched,
      touched,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: [
      {
        role: 'radiogroup',
        'aria-disabled': disabled || undefined,
        'aria-readonly': readOnly || undefined,
        'aria-labelledby': labelId,
        onFocus() {
          setFocused(true);
        },
        onBlur,
        onKeyDownCapture,
      },
      fieldControlValidation.getValidationProps,
      elementProps,
    ],
    customStyleHookMapping: fieldValidityMapping,
  });

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <CompositeRoot
        direction={direction}
        enableHomeAndEndKeys={false}
        modifierKeys={MODIFIER_KEYS}
        render={element}
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
    onValueChange?: (value: unknown, event: Event) => void;
    /**
     * A ref to access the hidden input element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
  }
}
