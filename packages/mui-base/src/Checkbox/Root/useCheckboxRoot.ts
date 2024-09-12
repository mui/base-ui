import * as React from 'react';
import type { UseCheckboxRootParameters, UseCheckboxRootReturnValue } from './CheckboxRoot.types';
import { useControlled } from '../../utils/useControlled';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useId } from '../../utils/useId';
import { useEventCallback } from '../../utils/useEventCallback';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import { useFieldControlValidation } from '../../Field/Control/useFieldControlValidation';
import { useField } from '../../Field/useField';

export function useCheckboxRoot(params: UseCheckboxRootParameters): UseCheckboxRootReturnValue {
  const {
    id: idProp,
    checked: externalChecked,
    inputRef: externalInputRef,
    onCheckedChange: onCheckedChangeProp = () => {},
    name,
    defaultChecked = false,
    readOnly = false,
    required = false,
    autoFocus = false,
    indeterminate = false,
    disabled = false,
  } = params;

  const [checked, setCheckedState] = useControlled({
    controlled: externalChecked,
    default: defaultChecked,
    name: 'Checkbox',
    state: 'checked',
  });

  const { labelId, setControlId, setTouched, setDirty, validityData, setValidityData } =
    useFieldRootContext();

  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const {
    getValidationProps,
    getInputValidationProps,
    inputRef: inputValidationRef,
    commitValidation,
  } = useFieldControlValidation();

  const onCheckedChange = useEventCallback(onCheckedChangeProp);
  const id = useId(idProp);

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  useField({
    id,
    commitValidation,
    value: checked,
    controlRef: buttonRef,
  });

  const inputRef = React.useRef<HTMLInputElement>(null);
  const mergedInputRef = useForkRef(externalInputRef, inputRef, inputValidationRef);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  useEnhancedEffect(() => {
    if (validityData.initialValue === null && checked !== validityData.initialValue) {
      setValidityData((prev) => ({ ...prev, initialValue: checked }));
    }
  }, [checked, setValidityData, validityData.initialValue]);

  const getButtonProps: UseCheckboxRootReturnValue['getButtonProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'button'>(getValidationProps(externalProps), {
        ref: buttonRef,
        value: 'off',
        type: 'button',
        role: 'checkbox',
        'aria-checked': indeterminate ? 'mixed' : checked,
        'aria-disabled': disabled || undefined,
        'aria-readonly': readOnly || undefined,
        'aria-labelledby': labelId,
        onBlur() {
          const element = inputRef.current;
          if (!element) {
            return;
          }
          setTouched(true);
          commitValidation(element.checked);
        },
        onClick(event) {
          if (event.defaultPrevented || readOnly) {
            return;
          }

          event.preventDefault();

          inputRef.current?.click();
        },
      }),
    [
      getValidationProps,
      indeterminate,
      checked,
      disabled,
      readOnly,
      labelId,
      setTouched,
      commitValidation,
    ],
  );

  const getInputProps: UseCheckboxRootReturnValue['getInputProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'input'>(getInputValidationProps(externalProps), {
        id,
        checked,
        disabled,
        name,
        required,
        autoFocus,
        ref: mergedInputRef,
        style: visuallyHidden,
        tabIndex: -1,
        type: 'checkbox',
        'aria-hidden': true,
        // @ts-ignore
        inert: 'true',
        onChange(event) {
          // Workaround for https://github.com/facebook/react/issues/9023
          if (event.nativeEvent.defaultPrevented) {
            return;
          }

          const nextChecked = event.target.checked;

          setDirty(nextChecked !== validityData.initialValue);
          setCheckedState(nextChecked);
          onCheckedChange?.(nextChecked, event.nativeEvent);
        },
      }),
    [
      getInputValidationProps,
      id,
      checked,
      disabled,
      name,
      required,
      autoFocus,
      mergedInputRef,
      setDirty,
      validityData.initialValue,
      setCheckedState,
      onCheckedChange,
    ],
  );

  return React.useMemo(
    () => ({
      checked,
      getButtonProps,
      getInputProps,
    }),
    [checked, getButtonProps, getInputProps],
  );
}
