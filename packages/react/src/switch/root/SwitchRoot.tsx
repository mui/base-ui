'use client';
import * as React from 'react';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';
import { useButton } from '../../use-button';
import { SwitchRootContext } from './SwitchRootContext';
import { stateAttributesMapping } from '../stateAttributesMapping';
import { useField } from '../../field/useField';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFormContext } from '../../form/FormContext';
import { BaseUIEventDetails } from '../../types';
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';

/**
 * Represents the switch itself.
 * Renders a `<button>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 */
export const SwitchRoot = React.forwardRef(function SwitchRoot(
  componentProps: SwitchRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    checked: checkedProp,
    className,
    defaultChecked,
    id: idProp,
    inputRef: externalInputRef,
    nativeButton = true,
    onCheckedChange: onCheckedChangeProp,
    readOnly = false,
    required = false,
    disabled: disabledProp = false,
    render,
    ...elementProps
  } = componentProps;

  const { clearErrors } = useFormContext();
  const {
    state: fieldState,
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
  const name = fieldName ?? elementProps.name;

  const {
    getValidationProps,
    getInputValidationProps,
    inputRef: inputValidationRef,
    commitValidation,
  } = useFieldControlValidation();

  const onCheckedChange = useEventCallback(onCheckedChangeProp);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleInputRef = useMergedRefs(inputRef, externalInputRef, inputValidationRef);

  const switchRef = React.useRef<HTMLButtonElement | null>(null);

  const id = useBaseUiId(idProp);

  useIsoLayoutEffect(() => {
    const element = switchRef.current;
    if (!element) {
      return undefined;
    }

    if (element.closest('label') != null) {
      setControlId(idProp ?? null);
    } else {
      setControlId(id);
    }

    return () => {
      setControlId(undefined);
    };
  }, [id, idProp, setControlId]);

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
    controlRef: switchRef,
    name,
    getValue: () => checked,
  });

  useIsoLayoutEffect(() => {
    if (inputRef.current) {
      setFilled(inputRef.current.checked);
    }
  }, [inputRef, setFilled]);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const rootProps: React.ComponentPropsWithRef<'button'> = React.useMemo(
    () => ({
      id,
      role: 'switch',
      disabled,
      'aria-checked': checked,
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

        if (validationMode === 'onBlur') {
          commitValidation(element.checked);
        }
      },
      onClick(event) {
        if (event.defaultPrevented || readOnly) {
          return;
        }

        inputRef?.current?.click();
      },
    }),
    [
      id,
      disabled,
      checked,
      readOnly,
      labelId,
      setFocused,
      setTouched,
      commitValidation,
      validationMode,
      inputRef,
    ],
  );

  const inputProps: React.ComponentPropsWithRef<'input'> = React.useMemo(
    () =>
      mergeProps<'input'>(
        {
          checked,
          disabled,
          id: !name ? `${id}-input` : undefined,
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
            const eventDetails = createBaseUIEventDetails('none', event.nativeEvent);

            onCheckedChange?.(nextChecked, eventDetails);

            if (eventDetails.isCanceled) {
              return;
            }

            clearErrors(name);
            setDirty(nextChecked !== validityData.initialValue);
            setFilled(nextChecked);
            setCheckedState(nextChecked);

            if (validationMode === 'onChange') {
              commitValidation(nextChecked);
            } else {
              commitValidation(nextChecked, true);
            }
          },
        },
        getInputValidationProps,
      ),
    [
      checked,
      clearErrors,
      commitValidation,
      disabled,
      getInputValidationProps,
      handleInputRef,
      id,
      name,
      onCheckedChange,
      required,
      setCheckedState,
      setDirty,
      setFilled,
      validationMode,
      validityData.initialValue,
    ],
  );

  const state: SwitchRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      checked,
      disabled,
      readOnly,
      required,
    }),
    [fieldState, checked, disabled, readOnly, required],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, switchRef, buttonRef],
    props: [rootProps, getValidationProps, elementProps, getButtonProps],
    stateAttributesMapping,
  });

  return (
    <SwitchRootContext.Provider value={state}>
      {element}
      {!checked && elementProps.name && (
        <input type="hidden" name={elementProps.name} value="off" />
      )}
      <input {...inputProps} />
    </SwitchRootContext.Provider>
  );
});

export namespace SwitchRoot {
  export interface Props
    extends NativeButtonProps,
      Omit<BaseUIComponentProps<'button', SwitchRoot.State>, 'onChange'> {
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
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * A ref to access the hidden `<input>` element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
    /**
     * Identifies the field when a form is submitted.
     */
    name?: string;
    /**
     * Event handler called when the switch is activated or deactivated.
     */
    onCheckedChange?: (checked: boolean, eventDetails: ChangeEventDetails) => void;
    /**
     * Whether the user should be unable to activate or deactivate the switch.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Whether the user must activate the switch before submitting a form.
     * @default false
     */
    required?: boolean;
  }

  export interface State extends FieldRoot.State {
    /**
     * Whether the switch is currently active.
     */
    checked: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the user should be unable to activate or deactivate the switch.
     */
    readOnly: boolean;
    /**
     * Whether the user must activate the switch before submitting a form.
     */
    required: boolean;
  }

  export type ChangeEventReason = 'none';
  export type ChangeEventDetails = BaseUIEventDetails<ChangeEventReason>;
}
