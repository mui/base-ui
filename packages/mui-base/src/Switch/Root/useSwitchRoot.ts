'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import type { UseSwitchRootParameters, UseSwitchRootReturnValue } from './SwitchRoot.types';
import { useControlled } from '../../utils/useControlled';
import { useForkRef } from '../../utils/useForkRef';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEventCallback } from '../../utils/useEventCallback';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import { useId } from '../../utils/useId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useFieldControlValidation } from '../../Field/Control/useFieldControlValidation';
import { useFormRootContext } from '../../Form/Root/FormRootContext';
import { getCombinedFieldValidityData } from '../../Field/utils/getCombinedFieldValidityData';

/**
 * The basic building block for creating custom switches.
 *
 * Demos:
 *
 * - [Switch](https://mui.com/base-ui/react-switch/#hook)
 *
 * API:
 *
 * - [useSwitchRoot API](https://mui.com/base-ui/react-switch/hooks-api/#use-switch-root)
 */
export function useSwitchRoot(params: UseSwitchRootParameters): UseSwitchRootReturnValue {
  const {
    id: idProp,
    checked: checkedProp,
    onCheckedChange: onCheckedChangeProp = () => {},
    defaultChecked,
    name,
    readOnly,
    required,
    disabled = false,
    inputRef: externalInputRef,
  } = params;

  const {
    labelId,
    setControlId,
    setTouched,
    setDirty,
    validityData,
    setValidityData,
    markedDirtyRef,
    invalid,
  } = useFieldRootContext();

  const { formRef } = useFormRootContext();

  const {
    getValidationProps,
    getInputValidationProps,
    inputRef: inputValidationRef,
    commitValidation,
  } = useFieldControlValidation();

  const onCheckedChange = useEventCallback(onCheckedChangeProp);
  const id = useId(idProp);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const handleInputRef = useForkRef(inputRef, externalInputRef, inputValidationRef);

  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  useEnhancedEffect(() => {
    if (id) {
      formRef.current.fields.set(id, {
        controlRef: buttonRef,
        validityData: getCombinedFieldValidityData(validityData, invalid),
        validate() {
          if (!inputValidationRef.current) {
            return;
          }

          const controlValue = inputValidationRef.current.checked;
          markedDirtyRef.current = true;

          // Synchronously update the validity state so the submit event can be prevented.
          ReactDOM.flushSync(() => commitValidation(controlValue));
        },
      });
    }
  }, [commitValidation, formRef, id, inputValidationRef, validityData, invalid, markedDirtyRef]);

  const [checked, setCheckedState] = useControlled({
    controlled: checkedProp,
    default: Boolean(defaultChecked),
    name: 'Switch',
    state: 'checked',
  });

  useEnhancedEffect(() => {
    if (validityData.initialValue === null && checked !== validityData.initialValue) {
      setValidityData((prev) => ({ ...prev, initialValue: checked }));
    }
  }, [checked, setValidityData, validityData.initialValue]);

  const getButtonProps = React.useCallback(
    (otherProps = {}) =>
      mergeReactProps<'button'>(getValidationProps(otherProps), {
        ref: buttonRef,
        type: 'button',
        role: 'switch',
        'aria-checked': checked,
        'aria-disabled': disabled || undefined,
        'aria-readonly': readOnly,
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

          inputRef.current?.click();
        },
      }),
    [getValidationProps, checked, disabled, readOnly, labelId, setTouched, commitValidation],
  );

  const getInputProps = React.useCallback(
    (otherProps = {}) =>
      mergeReactProps<'input'>(getInputValidationProps(otherProps), {
        id,
        checked,
        disabled,
        name,
        required,
        style: visuallyHidden,
        tabIndex: -1,
        type: 'checkbox',
        'aria-hidden': true,
        ref: handleInputRef,
        onChange(event) {
          // Workaround for https://github.com/facebook/react/issues/9023
          if (event.nativeEvent.defaultPrevented) {
            return;
          }

          const nextChecked = event.target.checked;

          setDirty(nextChecked !== validityData.initialValue);
          setCheckedState(nextChecked);
          onCheckedChange?.(nextChecked, event);
        },
      }),
    [
      getInputValidationProps,
      id,
      checked,
      disabled,
      name,
      required,
      handleInputRef,
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
