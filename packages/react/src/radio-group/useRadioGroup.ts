'use client';
import * as React from 'react';
import { contains } from '@floating-ui/react/utils';
import { mergeReactProps } from '../utils/mergeReactProps';
import { useControlled } from '../utils/useControlled';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import { useField } from '../field/useField';

export function useRadioGroup(params: useRadioGroup.Parameters) {
  const { disabled = false, name, defaultValue, readOnly, value: externalValue } = params;

  const {
    labelId,
    setTouched: setFieldTouched,
    setFocused,
    validationMode,
  } = useFieldRootContext();

  const fieldControlValidation = useFieldControlValidation();

  const id = useBaseUiId();

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
      mergeReactProps<'div'>(fieldControlValidation.getValidationProps(externalProps), {
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
      }),
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
      mergeReactProps<'input'>(fieldControlValidation.getInputValidationProps(externalProps), {
        type: 'hidden',
        value: serializedCheckedValue,
        ref: fieldControlValidation.inputRef,
        id,
        name,
        disabled,
        readOnly,
      }),
    [fieldControlValidation, serializedCheckedValue, id, name, disabled, readOnly],
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
    readOnly?: boolean;
    defaultValue?: unknown;
    value?: unknown;
  }
}
