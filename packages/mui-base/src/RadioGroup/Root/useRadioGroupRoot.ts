import * as React from 'react';
import { contains } from '@floating-ui/react/utils';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useControlled } from '../../utils/useControlled';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';
import { useFieldControlValidation } from '../../Field/Control/useFieldControlValidation';

/**
 *
 * API:
 *
 * - [useRadioGroupRoot API](https://mui.com/base-ui/api/use-radio-group-root/)
 */
export function useRadioGroupRoot(params: useRadioGroupRoot.Parameters) {
  const { disabled = false, name, defaultValue, readOnly, value: externalValue } = params;

  const {
    labelId,
    setDisabled,
    setControlId,
    setTouched: setFieldTouched,
    validityData,
    setValidityData,
  } = useFieldRootContext();

  const {
    getValidationProps,
    getInputValidationProps,
    inputRef: inputValidationRef,
    commitValidation,
  } = useFieldControlValidation();

  useEnhancedEffect(() => {
    setDisabled(disabled);
  }, [disabled, setDisabled]);

  const id = useId();

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

  useEnhancedEffect(() => {
    if (validityData.initialValue === null && checkedValue !== validityData.initialValue) {
      setValidityData((prev) => ({ ...prev, initialValue: checkedValue }));
    }
  }, [checkedValue, setValidityData, validityData.initialValue]);

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

namespace useRadioGroupRoot {
  export interface Parameters {
    name?: string;
    disabled?: boolean;
    readOnly?: boolean;
    defaultValue?: unknown;
    value?: unknown;
  }
}
