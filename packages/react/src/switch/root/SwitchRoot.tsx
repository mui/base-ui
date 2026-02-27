'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps, NonNativeButtonProps } from '../../utils/types';
import { mergeProps } from '../../merge-props';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useButton } from '../../use-button';
import { SwitchRootContext } from './SwitchRootContext';
import { stateAttributesMapping } from '../stateAttributesMapping';
import { useField } from '../../field/useField';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFormContext } from '../../form/FormContext';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import { useAriaLabelledBy } from '../../labelable-provider/useAriaLabelledBy';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import type { BaseUIChangeEventDetails } from '../../types';
import { useValueChanged } from '../../utils/useValueChanged';

/**
 * Represents the switch itself.
 * Renders a `<span>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 */
export const SwitchRoot = React.forwardRef(function SwitchRoot(
  componentProps: SwitchRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    checked: checkedProp,
    className,
    defaultChecked,
    'aria-labelledby': ariaLabelledByProp,
    id: idProp,
    inputRef: externalInputRef,
    name: nameProp,
    nativeButton = false,
    onCheckedChange: onCheckedChangeProp,
    readOnly = false,
    required = false,
    disabled: disabledProp = false,
    render,
    uncheckedValue,
    value,
    ...elementProps
  } = componentProps;

  const { clearErrors } = useFormContext();
  const {
    state: fieldState,
    setTouched,
    setDirty,
    validityData,
    setFilled,
    setFocused,
    shouldValidateOnChange,
    validationMode,
    disabled: fieldDisabled,
    name: fieldName,
    validation,
  } = useFieldRootContext();
  const { labelId } = useLabelableContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const onCheckedChange = useStableCallback(onCheckedChangeProp);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleInputRef = useMergedRefs(inputRef, externalInputRef, validation.inputRef);

  const switchRef = React.useRef<HTMLButtonElement | null>(null);

  const id = useBaseUiId();

  const controlId = useLabelableId({
    id: idProp,
    implicit: false,
    controlRef: switchRef,
  });
  const hiddenInputId = nativeButton ? undefined : controlId;

  const [checked, setCheckedState] = useControlled({
    controlled: checkedProp,
    default: Boolean(defaultChecked),
    name: 'Switch',
    state: 'checked',
  });

  useField({
    id,
    commit: validation.commit,
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

  useValueChanged(checked, () => {
    clearErrors(name);
    setDirty(checked !== validityData.initialValue);
    setFilled(checked);

    if (shouldValidateOnChange()) {
      validation.commit(checked);
    } else {
      validation.commit(checked, true);
    }
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });
  const ariaLabelledBy = useAriaLabelledBy(
    ariaLabelledByProp,
    labelId,
    inputRef,
    !nativeButton,
    hiddenInputId,
  );

  const rootProps: React.ComponentPropsWithRef<'span'> = {
    id: nativeButton ? controlId : id,
    role: 'switch',
    'aria-checked': checked,
    'aria-readonly': readOnly || undefined,
    'aria-required': required || undefined,
    'aria-labelledby': ariaLabelledBy,
    onFocus() {
      if (!disabled) {
        setFocused(true);
      }
    },
    onBlur() {
      const element = inputRef.current;
      if (!element || disabled) {
        return;
      }

      setTouched(true);
      setFocused(false);

      if (validationMode === 'onBlur') {
        validation.commit(element.checked);
      }
    },
    onClick(event) {
      if (readOnly || disabled) {
        return;
      }

      event.preventDefault();

      inputRef.current?.dispatchEvent(
        new PointerEvent('click', {
          bubbles: true,
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
        }),
      );
    },
  };

  const inputProps: React.ComponentPropsWithRef<'input'> = React.useMemo(
    () =>
      mergeProps<'input'>(
        {
          checked,
          disabled,
          id: hiddenInputId,
          name,
          required,
          style: name ? visuallyHiddenInput : visuallyHidden,
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
            const eventDetails = createChangeEventDetails(REASONS.none, event.nativeEvent);

            onCheckedChange?.(nextChecked, eventDetails);

            if (eventDetails.isCanceled) {
              return;
            }

            setCheckedState(nextChecked);
          },
          onFocus() {
            switchRef.current?.focus();
          },
        },
        validation.getInputValidationProps,
        // React <19 sets an empty value if `undefined` is passed explicitly
        // To avoid this, we only set the value if it's defined
        value !== undefined ? { value } : EMPTY_OBJECT,
      ),
    [
      checked,
      disabled,
      handleInputRef,
      hiddenInputId,
      name,
      onCheckedChange,
      required,
      setCheckedState,
      validation,
      value,
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

  const element = useRenderElement('span', componentProps, {
    state,
    ref: [forwardedRef, switchRef, buttonRef],
    props: [rootProps, validation.getValidationProps, elementProps, getButtonProps],
    stateAttributesMapping,
  });

  return (
    <SwitchRootContext.Provider value={state}>
      {element}
      {!checked && name && uncheckedValue !== undefined && (
        <input type="hidden" name={name} value={uncheckedValue} />
      )}
      <input {...inputProps} />
    </SwitchRootContext.Provider>
  );
});

export interface SwitchRootState extends FieldRoot.State {
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

export interface SwitchRootProps
  extends NonNativeButtonProps, Omit<BaseUIComponentProps<'span', SwitchRoot.State>, 'onChange'> {
  /**
   * The id of the switch element.
   */
  id?: string | undefined;
  /**
   * Whether the switch is currently active.
   *
   * To render an uncontrolled switch, use the `defaultChecked` prop instead.
   */
  checked?: boolean | undefined;
  /**
   * Whether the switch is initially active.
   *
   * To render a controlled switch, use the `checked` prop instead.
   * @default false
   */
  defaultChecked?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * A ref to access the hidden `<input>` element.
   */
  inputRef?: React.Ref<HTMLInputElement> | undefined;
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined;
  /**
   * Event handler called when the switch is activated or deactivated.
   */
  onCheckedChange?:
    | ((checked: boolean, eventDetails: SwitchRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the user should be unable to activate or deactivate the switch.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Whether the user must activate the switch before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
  /**
   * The value submitted with the form when the switch is on.
   * By default, switch submits the "on" value, matching native checkbox behavior.
   */
  value?: string | undefined;
  /**
   * The value submitted with the form when the switch is off.
   * By default, unchecked switches do not submit any value, matching native checkbox behavior.
   */
  uncheckedValue?: string | undefined;
}

export type SwitchRootChangeEventReason = typeof REASONS.none;
export type SwitchRootChangeEventDetails = BaseUIChangeEventDetails<SwitchRoot.ChangeEventReason>;

export namespace SwitchRoot {
  export type State = SwitchRootState;
  export type Props = SwitchRootProps;
  export type ChangeEventReason = SwitchRootChangeEventReason;
  export type ChangeEventDetails = SwitchRootChangeEventDetails;
}
