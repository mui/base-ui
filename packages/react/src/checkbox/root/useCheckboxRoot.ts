'use client';
import * as React from 'react';
import { useControlled } from '../../utils/useControlled';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useForkRef } from '../../utils/useForkRef';
import { mergeProps } from '../../merge-props';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useEventCallback } from '../../utils/useEventCallback';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useButton } from '../../use-button/useButton';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useField } from '../../field/useField';
import { useCheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';
import { useFormContext } from '../../form/FormContext';

const EMPTY = {};

export const PARENT_CHECKBOX = 'data-parent';

export function useCheckboxRoot(params: useCheckboxRoot.Parameters): useCheckboxRoot.ReturnValue {
  const {
    id: idProp,
    checked: externalChecked,
    inputRef: externalInputRef,
    onCheckedChange: onCheckedChangeProp,
    name: nameProp,
    value: valueProp,
    defaultChecked = false,
    readOnly = false,
    required = false,
    indeterminate = false,
    parent = false,
    disabled: disabledProp = false,
    nativeButton = true,
  } = params;

  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const groupContext = useCheckboxGroupContext();
  const groupValue = groupContext?.value;
  const setGroupValue = groupContext?.setValue;
  const defaultGroupValue = groupContext?.defaultValue;

  const { clearErrors } = useFormContext();
  const {
    labelId,
    setControlId,
    setTouched,
    setDirty,
    validityData,
    setFilled,
    setFocused,
    validationMode,
    disabled: fieldDisabled,
    name: fieldName,
  } = useFieldRootContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const value = valueProp ?? name;

  const { getButtonProps } = useButton({
    disabled,
    buttonRef,
    native: nativeButton,
  });

  const localFieldControlValidation = useFieldControlValidation();
  const fieldControlValidation =
    groupContext?.fieldControlValidation ?? localFieldControlValidation;

  const [checked, setCheckedState] = useControlled({
    controlled: value && groupValue && !parent ? groupValue.includes(value) : externalChecked,
    default:
      value && defaultGroupValue && !parent ? defaultGroupValue.includes(value) : defaultChecked,
    name: 'Checkbox',
    state: 'checked',
  });

  const onCheckedChange = useEventCallback(onCheckedChangeProp);
  const id = useBaseUiId(idProp);

  useModernLayoutEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  useField({
    enabled: !groupContext,
    id,
    commitValidation: fieldControlValidation.commitValidation,
    value: checked,
    controlRef: buttonRef,
  });

  const inputRef = React.useRef<HTMLInputElement>(null);
  const mergedInputRef = useForkRef(externalInputRef, inputRef, fieldControlValidation.inputRef);

  useModernLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
      if (checked) {
        setFilled(true);
      }
    }
  }, [checked, indeterminate, setFilled]);

  const getRootProps: useCheckboxRoot.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'button'>(
        {
          id,
          ref: buttonRef,
          role: 'checkbox',
          disabled,
          'aria-checked': indeterminate ? 'mixed' : checked,
          'aria-readonly': readOnly || undefined,
          'aria-required': required || undefined,
          'aria-labelledby': labelId,
          [PARENT_CHECKBOX as string]: parent ? '' : undefined,
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

            if (validationMode === 'onBlur') {
              fieldControlValidation.commitValidation(groupContext ? groupValue : element.checked);
            }
          },
          onClick(event) {
            if (event.defaultPrevented || readOnly) {
              return;
            }

            event.preventDefault();

            inputRef.current?.click();
          },
        },
        fieldControlValidation.getValidationProps(externalProps),
        getButtonProps,
      ),
    [
      getButtonProps,
      id,
      disabled,
      indeterminate,
      checked,
      readOnly,
      required,
      labelId,
      setFocused,
      setTouched,
      validationMode,
      groupContext,
      groupValue,
      fieldControlValidation,
      parent,
    ],
  );

  const getInputProps: useCheckboxRoot.ReturnValue['getInputProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'input'>(
        {
          checked,
          disabled,
          name: parent ? undefined : name,
          // React <19 sets an empty value if `undefined` is passed explicitly
          // To avoid this, we only set the value if it's defined
          ...(valueProp !== undefined
            ? { value: (groupContext ? checked && valueProp : valueProp) || '' }
            : EMPTY),
          required,
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
            clearErrors(name);

            if (!groupContext) {
              setFilled(nextChecked);

              if (validationMode === 'onChange') {
                fieldControlValidation.commitValidation(nextChecked);
              } else {
                fieldControlValidation.commitValidation(nextChecked, true);
              }
            }

            if (value && groupValue && setGroupValue && !parent) {
              const nextGroupValue = nextChecked
                ? [...groupValue, value]
                : groupValue.filter((item) => item !== value);

              setGroupValue(nextGroupValue, event.nativeEvent);
              setFilled(nextGroupValue.length > 0);

              if (validationMode === 'onChange') {
                fieldControlValidation.commitValidation(nextGroupValue);
              } else {
                fieldControlValidation.commitValidation(nextGroupValue, true);
              }
            }
          },
        },
        groupContext
          ? fieldControlValidation.getValidationProps(externalProps)
          : fieldControlValidation.getInputValidationProps(externalProps),
      ),
    [
      checked,
      disabled,
      name,
      valueProp,
      required,
      mergedInputRef,
      setDirty,
      validityData.initialValue,
      setCheckedState,
      onCheckedChange,
      clearErrors,
      groupContext,
      groupValue,
      setGroupValue,
      parent,
      setFilled,
      validationMode,
      value,
      fieldControlValidation,
    ],
  );

  return React.useMemo(
    () => ({
      checked,
      getRootProps,
      getInputProps,
    }),
    [checked, getRootProps, getInputProps],
  );
}

export namespace useCheckboxRoot {
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
     * Whether the checkbox is in a mixed state: neither ticked, nor unticked.
     * @default false
     */
    indeterminate?: boolean;
    /**
     * A ref to access the hidden `<input>` element.
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
     * Determines whether the component is being rendered as a native button.
     * @default true
     */
    nativeButton?: boolean;
    /**
     * The value of the selected checkbox.
     */
    value?: string;
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
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'button'>,
    ) => React.ComponentPropsWithRef<'button'>;
  }
}
