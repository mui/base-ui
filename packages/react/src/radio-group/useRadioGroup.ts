'use client';
import * as React from 'react';
import { contains } from '@floating-ui/react/utils';
import { mergeReactProps } from '../utils/mergeReactProps';
import { useControlled } from '../utils/useControlled';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import { useEnhancedEffect } from '../utils/useEnhancedEffect';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import { useField } from '../field/useField';

export function useRadioGroup(params: useRadioGroup.Parameters) {
  const { disabled = false, name, defaultValue, readOnly, value: externalValue } = params;

  const { labelId, setControlId, setTouched: setFieldTouched } = useFieldRootContext();

  const {
    getValidationProps,
    getInputValidationProps,
    inputRef: inputValidationRef,
    commitValidation,
  } = useFieldControlValidation();

  const id = useBaseUiId();

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  const [checkedValue, setCheckedValue] = useControlled({
    controlled: externalValue,
    default: defaultValue,
    name: 'RadioGroup',
    state: 'value',
  });

  useField({
    id,
    commitValidation,
    value: checkedValue,
    controlRef: inputValidationRef,
  });

  const [touched, setTouched] = React.useState(false);

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(getValidationProps(externalProps), {
        role: 'radiogroup',
        'aria-disabled': disabled || undefined,
        'aria-readonly': readOnly || undefined,
        'aria-labelledby': labelId,
        onBlur(event) {
          if (!contains(event.currentTarget, event.relatedTarget)) {
            setFieldTouched(true);
            commitValidation(checkedValue);
          }
        },
        onKeyDownCapture(event) {
          if (event.key.startsWith('Arrow')) {
            setFieldTouched(true);
            setTouched(true);
          }
        },
      }),
    [
      checkedValue,
      commitValidation,
      disabled,
      getValidationProps,
      labelId,
      readOnly,
      setFieldTouched,
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
      mergeReactProps(getInputValidationProps(externalProps), {
        type: 'hidden',
        value: serializedCheckedValue,
        ref: inputValidationRef,
        id,
        name,
        disabled,
        readOnly,
      }),
    [
      getInputValidationProps,
      serializedCheckedValue,
      inputValidationRef,
      id,
      name,
      disabled,
      readOnly,
    ],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      getInputProps,
      checkedValue,
      setCheckedValue,
      touched,
      setTouched,
    }),
    [getRootProps, getInputProps, checkedValue, setCheckedValue, touched],
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
