'use client';
import * as React from 'react';
import { useControlled } from '../../utils/useControlled';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useId } from '../../utils/useId';
import { useEventCallback } from '../../utils/useEventCallback';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useField } from '../../field/useField';

export function useCheckboxRoot(params: UseCheckboxRoot.Parameters): UseCheckboxRoot.ReturnValue {
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

  const { labelId, setControlId, setTouched, setDirty, validityData } = useFieldRootContext();

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

  const getButtonProps: UseCheckboxRoot.ReturnValue['getButtonProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'button'>(getValidationProps(externalProps), {
        ref: buttonRef,
        value: 'off',
        type: 'button',
        role: 'checkbox',
        disabled,
        'aria-checked': indeterminate ? 'mixed' : checked,
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

  const getInputProps: UseCheckboxRoot.ReturnValue['getInputProps'] = React.useCallback(
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

export namespace UseCheckboxRoot {
  export interface Parameters {
    /**
     * The id of the input element.
     */
    id?: string;
    /**
     * Name of the underlying input element.
     *
     * @default undefined
     */
    name?: string;
    /**
     * If `true`, the component is checked.
     *
     * @default undefined
     */
    checked?: boolean;
    /**
     * The default checked state. Use when the component is not controlled.
     *
     * @default false
     */
    defaultChecked?: boolean;
    /**
     * If `true`, the component is disabled.
     *
     * @default false
     */
    disabled?: boolean;
    /**
     * Callback fired when the checked state is changed.
     *
     * @param {boolean} checked The new checked state.
     * @param {Event} event The event source of the callback.
     */
    onCheckedChange?: (checked: boolean, event: Event) => void;
    /**
     * If `true`, the component is read only.
     *
     * @default false
     */
    readOnly?: boolean;
    /**
     * If `true`, the `input` element is required.
     *
     * @default false
     */
    required?: boolean;
    /**
     * If `true`, the checkbox is focused on mount.
     *
     * @default false
     */
    autoFocus?: boolean;
    /**
     * If `true`, the checkbox will be indeterminate.
     *
     * @default false
     */
    indeterminate?: boolean;
    /**
     * The ref to the input element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
    /**
     * If `true`, the checkbox is a parent checkbox for a group of child checkboxes.
     * @default false
     */
    parent?: boolean;
  }

  export interface ReturnValue {
    /**
     * If `true`, the checkbox is checked.
     */
    checked: boolean;
    /**
     * Resolver for the input element's props.
     * @param externalProps custom props for the input element
     * @returns props that should be spread on the input element
     */
    getInputProps: (
      externalProps?: React.ComponentPropsWithRef<'input'>,
    ) => React.ComponentPropsWithRef<'input'>;
    /**
     * Resolver for the button element's props.
     * @param externalProps custom props for the button element
     * @returns props that should be spread on the button element
     */
    getButtonProps: (
      externalProps?: React.ComponentPropsWithRef<'button'>,
    ) => React.ComponentPropsWithRef<'button'>;
  }
}
