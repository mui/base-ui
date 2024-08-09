'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';
import { useFieldRootContext } from '../Root/FieldRootContext';
import { useFieldControlValidation } from './useFieldControlValidation';

interface UseFieldControlParameters {
  id?: string;
  name?: string;
  value: string | number | readonly string[];
}

/**
 *
 * API:
 *
 * - [useFieldControl API](https://mui.com/base-ui/api/use-field-control/)
 */
export function useFieldControl(params: UseFieldControlParameters) {
  const { id: idProp, name, value } = params;

  const { setControlId, labelId, disabled, setTouched, setDirty, validityData, setValidityData } =
    useFieldRootContext();

  const { getValidationProps, getInputValidationProps, commitValidation, inputRef } =
    useFieldControlValidation();

  useEnhancedEffect(() => {
    if (validityData.initialValue === null && value !== validityData.initialValue) {
      setValidityData((prev) => ({ ...prev, initialValue: value }));
    }
  }, [setValidityData, validityData.initialValue, value]);

  const id = useId(idProp);

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  const getControlProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'input'>(getValidationProps(getInputValidationProps(externalProps)), {
        id,
        disabled,
        name,
        ref: inputRef,
        'aria-labelledby': labelId,
        onChange(event) {
          setDirty(event.currentTarget.value !== validityData.initialValue);
        },
        onBlur(event) {
          setTouched(true);
          commitValidation(event.currentTarget.value);
        },
        onKeyDown(event) {
          if (event.currentTarget.tagName === 'INPUT' && event.key === 'Enter') {
            setTouched(true);
            commitValidation(event.currentTarget.value);
          }
        },
      }),
    [
      getValidationProps,
      getInputValidationProps,
      id,
      disabled,
      name,
      inputRef,
      labelId,
      setDirty,
      validityData.initialValue,
      setTouched,
      commitValidation,
    ],
  );

  return React.useMemo(
    () => ({
      getControlProps,
    }),
    [getControlProps],
  );
}
