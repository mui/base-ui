'use client';
import * as React from 'react';
import { useControlled } from '../../utils/useControlled';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useEventCallback } from '../../utils/useEventCallback';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useField } from '../../field/useField';
import { useCheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';

export function useCheckboxRoot(params: UseCheckboxRoot.Parameters): UseCheckboxRoot.ReturnValue {
  const {
    id: idProp,
    checked: externalChecked,
    inputRef: externalInputRef,
    onCheckedChange: onCheckedChangeProp,
    name,
    value,
    defaultChecked = false,
    readOnly = false,
    required = false,
    autoFocus = false,
    indeterminate = false,
    disabled = false,
  } = params;

  const groupContext = useCheckboxGroupContext();
  const groupValue = groupContext?.value;
  const setGroupValue = groupContext?.setValue;
  const defaultGroupValue = groupContext?.defaultValue;

  const [checked, setCheckedState] = useControlled({
    controlled: name && groupValue ? groupValue.includes(name) : externalChecked,
    default: name && defaultGroupValue ? defaultGroupValue.includes(name) : defaultChecked,
    name: 'Checkbox',
    state: 'checked',
  });

  const { labelId, setControlId, setTouched, setDirty, validityData, setFilled, setFocused } =
    useFieldRootContext();

  const buttonRef = React.useRef<HTMLButtonElement>(null);

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

  useField({
    id,
    commitValidation,
    value: checked,
    controlRef: buttonRef,
  });

  const inputRef = React.useRef<HTMLInputElement>(null);
  const mergedInputRef = useForkRef(externalInputRef, inputRef, inputValidationRef);

  useEnhancedEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
      if (checked) {
        setFilled(true);
      }
    }
  }, [checked, indeterminate, setFilled]);

  const getButtonProps: UseCheckboxRoot.ReturnValue['getButtonProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'button'>(getValidationProps(externalProps), {
        id,
        ref: buttonRef,
        type: 'button',
        role: 'checkbox',
        disabled,
        'aria-checked': indeterminate ? 'mixed' : checked,
        'aria-readonly': readOnly || undefined,
        'aria-labelledby': labelId,
        onFocus() {
          setFocused(true);
        },
        onBlur() {
          const element = inputRef.current;
          if (!element) {
            return;
          }

          setTouched(true);
          setFocused(false);
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
      id,
      disabled,
      indeterminate,
      checked,
      readOnly,
      labelId,
      setFocused,
      setTouched,
      commitValidation,
    ],
  );

  const getInputProps: UseCheckboxRoot.ReturnValue['getInputProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'input'>(getInputValidationProps(externalProps), {
        checked,
        disabled,
        name,
        // React <19 sets an empty value if `undefined` is passed explicitly
        // To avoid this, we only set the value if it's defined
        ...(value !== undefined ? { value } : {}),
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

          if (!groupContext) {
            setFilled(nextChecked);
          }

          setDirty(nextChecked !== validityData.initialValue);
          setCheckedState(nextChecked);
          onCheckedChange?.(nextChecked, event.nativeEvent);

          if (name && groupValue && setGroupValue) {
            const nextGroupValue = nextChecked
              ? [...groupValue, name]
              : groupValue.filter((item) => item !== name);
            setGroupValue(nextGroupValue, event.nativeEvent);
            setFilled(nextGroupValue.length > 0);
          }
        },
      }),
    [
      getInputValidationProps,
      checked,
      disabled,
      name,
      value,
      required,
      autoFocus,
      mergedInputRef,
      groupContext,
      setDirty,
      validityData.initialValue,
      setCheckedState,
      onCheckedChange,
      groupValue,
      setGroupValue,
      setFilled,
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
     * Identifies the field when a form is submitted.
     * @default undefined
     */
    name?: string;
    /**
     * Whether the checkbox is currently ticked.
     *
     * To render an uncontrolled checkbox, use the `defaultChecked` prop instead.
     * @default undefined
     */
    checked?: boolean;
    /**
     * Whether the checkbox is initially ticked.
     *
     * To render a controlled checkbox, use the `checked` prop instead.
     * @default false
     */
    defaultChecked?: boolean;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Event handler called when the checkbox is ticked or unticked.
     *
     * @param {boolean} checked The new checked state.
     * @param {Event} event The corresponding event that initiated the change.
     */
    onCheckedChange?: (checked: boolean, event: Event) => void;
    /**
     * Whether the user should be unable to tick or untick the checkbox.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Whether the user must tick the checkbox before submitting a form.
     * @default false
     */
    required?: boolean;
    /**
     * Whether to focus the element on page load.
     * @default false
     */
    autoFocus?: boolean;
    /**
     * Whether the checkbox is in a mixed state: neither ticked, nor unticked.
     * @default false
     */
    indeterminate?: boolean;
    /**
     * A React ref to access the hidden `<input>` element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
    /**
     * Whether the checkbox controls a group of child checkboxes.
     *
     * Must be used in a [Checkbox Group](https://base-ui.com/react/components/checkbox-group).
     * @default false
     */
    parent?: boolean;
    /**
     * The value of the selected checkbox.
     */
    value?: string | number;
  }

  export interface ReturnValue {
    /**
     * Whether the checkbox is currently ticked.
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
