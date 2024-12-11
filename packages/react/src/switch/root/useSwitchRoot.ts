'use client';
import * as React from 'react';
import { useControlled } from '../../utils/useControlled';
import { useForkRef } from '../../utils/useForkRef';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEventCallback } from '../../utils/useEventCallback';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useField } from '../../field/useField';

export function useSwitchRoot(params: useSwitchRoot.Parameters): useSwitchRoot.ReturnValue {
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

  const { labelId, setControlId, setTouched, setDirty, validityData } = useFieldRootContext();

  const {
    getValidationProps,
    getInputValidationProps,
    inputRef: inputValidationRef,
    commitValidation,
  } = useFieldControlValidation();

  const onCheckedChange = useEventCallback(onCheckedChangeProp);

  const id = useBaseUiId(idProp);

  useEnhancedEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const handleInputRef = useForkRef(inputRef, externalInputRef, inputValidationRef);

  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  const [checked, setCheckedState] = useControlled({
    controlled: checkedProp,
    default: Boolean(defaultChecked),
    name: 'Switch',
    state: 'checked',
  });

  useField({
    id,
    commitValidation,
    value: checked,
    controlRef: buttonRef,
  });

  const getButtonProps = React.useCallback(
    (otherProps = {}) =>
      mergeReactProps<'button'>(getValidationProps(otherProps), {
        ref: buttonRef,
        type: 'button',
        role: 'switch',
        disabled,
        'aria-checked': checked,
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

export namespace useSwitchRoot {
  export interface Parameters {
    /**
     * The id of the switch element.
     */
    id?: string;
    /**
     * Whether the switch is currently active.
     *
     * To render an uncontrolled switch, use the `defaultChecked` prop instead.
     */
    checked?: boolean;
    /**
     * Whether the switch is initially active.
     *
     * To render a controlled switch, use the `checked` prop instead.
     * @default false
     */
    defaultChecked?: boolean;
    /**
     * Whether the component should ignore user actions.
     * @default false
     */
    disabled?: boolean;
    /**
     * A React ref to access the supplementary `<input>` element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
    /**
     * Identifies the field when a form is submitted.
     */
    name?: string;
    /**
     * Event handler called when the switch is activated or deactivated.
     *
     * @param {boolean} checked The new checked state.
     * @param {React.ChangeEvent<HTMLInputElement>} event The corresponding event that initiated the change.
     */
    onCheckedChange?: (checked: boolean, event: Event) => void;
    /**
     * If `true`, the component is read-only.
     * Functionally, this is equivalent to being disabled, but the assistive technologies will announce this differently.
     *
     * @default false
     */
    readOnly?: boolean;
    /**
     * If `true`, the switch must be checked for the browser validation to pass.
     *
     * @default false
     */
    required?: boolean;
  }

  export interface ReturnValue {
    /**
     * Whether the switch is currently active.
     */
    checked: boolean;
    /**
     * Resolver for the input element's props.
     * @param externalProps Additional props for the input element
     * @returns Props that should be spread on the input element
     */
    getInputProps: (
      externalProps?: React.ComponentPropsWithRef<'input'>,
    ) => React.ComponentPropsWithRef<'input'>;
    /**
     * Resolver for the button element's props.
     * @param externalProps Additional props for the input element
     * @returns Props that should be spread on the button element
     */
    getButtonProps: (
      externalProps?: React.ComponentPropsWithRef<'button'>,
    ) => React.ComponentPropsWithRef<'button'>;
  }
}
