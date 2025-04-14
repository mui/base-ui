'use client';
import * as React from 'react';
import { contains } from '@floating-ui/react/utils';
import { mergeProps } from '../merge-props';
import { useControlled } from '../utils/useControlled';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import { useField } from '../field/useField';
import { useForkRef, visuallyHidden } from '../utils';

export function useRadioGroup(params: useRadioGroup.Parameters) {
  const {
    disabled: disabledProp = false,
    required,
    name: nameProp,
    defaultValue,
    readOnly,
    value: externalValue,
    inputRef: inputRefProp,
  } = params;

  const {
    labelId,
    setTouched: setFieldTouched,
    setFocused,
    validationMode,
    name: fieldName,
    disabled: fieldDisabled,
  } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const fieldControlValidation = useFieldControlValidation();

  const id = useBaseUiId();

  const ref = useForkRef(fieldControlValidation.inputRef, inputRefProp);

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

  const [touched, setTouched] = React.useState(false);

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'div'>(
        {
          role: 'radiogroup',
          'aria-disabled': disabled || undefined,
          'aria-readonly': readOnly || undefined,
          'aria-labelledby': labelId,
          onFocus() {
            setFocused(true);
          },
          onBlur(event) {
            if (!contains(event.currentTarget, event.relatedTarget)) {
              setFieldTouched(true);
              setFocused(false);

              if (validationMode === 'onBlur') {
                fieldControlValidation.commitValidation(checkedValue);
              }
            }
          },
          onKeyDownCapture(event) {
            if (event.key.startsWith('Arrow')) {
              setFieldTouched(true);
              setTouched(true);
              setFocused(true);
            }
          },
        },
        fieldControlValidation.getValidationProps(externalProps),
      ),
    [
      fieldControlValidation,
      disabled,
      readOnly,
      labelId,
      setFocused,
      setFieldTouched,
      validationMode,
      checkedValue,
    ],
  );

  const serializedCheckedValue = React.useMemo(() => {
    if (checkedValue == null) {
      return ''; // avoid uncontrolled -> controlled error
    }
    if (typeof checkedValue === 'string') {
      return checkedValue;
    }
    return JSON.stringify(checkedValue);
  }, [checkedValue]);

  const getInputProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'input'>(
        {
          value: serializedCheckedValue,
          ref,
          id,
          name,
          disabled,
          readOnly,
          required,
          'aria-hidden': true,
          tabIndex: -1,
          style: visuallyHidden,
        },
        fieldControlValidation.getInputValidationProps(externalProps),
      ),
    [serializedCheckedValue, ref, id, name, disabled, readOnly, required, fieldControlValidation],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      getInputProps,
      checkedValue,
      setCheckedValue,
      touched,
      setTouched,
      fieldControlValidation,
    }),
    [getRootProps, getInputProps, checkedValue, setCheckedValue, touched, fieldControlValidation],
  );
}

namespace useRadioGroup {
  export interface Parameters {
    name?: string;
    disabled?: boolean;
    required?: boolean;
    readOnly?: boolean;
    defaultValue?: unknown;
    value?: unknown;
    inputRef?: React.Ref<HTMLInputElement>;
  }
}
