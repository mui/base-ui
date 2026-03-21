'use client';
import * as React from 'react';
import { SafeReact } from '@base-ui/utils/safeReact';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { visuallyHidden, visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { warn } from '@base-ui/utils/warn';
import { CompositeList } from '../../composite/list/CompositeList';
import { useField } from '../../field/useField';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import type { FieldRootState } from '../../field/root/FieldRoot';
import { useFormContext } from '../../form/FormContext';
import { useLabelableContext } from '../../labelable-provider/LabelableContext';
import { useAriaLabelledBy } from '../../labelable-provider/useAriaLabelledBy';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { useRenderElement } from '../../utils/useRenderElement';
import { useValueChanged } from '../../utils/useValueChanged';
import type { BaseUIComponentProps } from '../../utils/types';
import {
  createChangeEventDetails,
  createGenericEventDetails,
  type BaseUIChangeEventDetails,
  type BaseUIGenericEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { OTPFieldRootContext } from './OTPFieldRootContext';
import { rootStateAttributesMapping } from '../utils/stateAttributesMapping';
import { getOTPValidationConfig, normalizeOTPValue, type OTPValidationType } from '../utils/otp';

/**
 * Groups all OTP field parts and manages their state.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI OTP Field](https://base-ui.com/react/components/otp-field)
 */
export const OTPFieldRoot = React.forwardRef(function OTPFieldRoot(
  componentProps: OTPFieldRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    id: idProp,
    autoComplete = 'one-time-code',
    defaultValue,
    value: valueProp,
    onValueChange,
    onValueComplete: onValueCompleteProp,
    form,
    length,
    autoSubmit = false,
    type = 'text',
    validationType = 'numeric',
    sanitizeValue,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    name: nameProp,
    render,
    className,
    ...elementProps
  } = componentProps;

  const {
    setDirty,
    validityData,
    disabled: fieldDisabled,
    setFilled,
    invalid,
    name: fieldName,
    state: fieldState,
    validation,
    validationMode,
    shouldValidateOnChange,
    setFocused,
    setTouched,
  } = useFieldRootContext();
  const { clearErrors } = useFormContext();
  const { labelId } = useLabelableContext();

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  const [valueUnwrapped, setValueUnwrapped] = useControlled<string>({
    controlled: valueProp,
    default: defaultValue,
    name: 'OTPField',
    state: 'value',
  });

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const pendingFocusIndexRef = React.useRef<number | null>(null);
  const pendingCompleteValueRef = React.useRef<{
    value: string;
    eventDetails: OTPFieldRoot.CompleteEventDetails;
  } | null>(null);
  const [inputCount, setInputCount] = React.useState(0);
  const firstInputRef = React.useMemo(
    () =>
      ({
        get current() {
          return inputRefs.current[0] ?? null;
        },
      }) as React.RefObject<HTMLInputElement | null>,
    [],
  );

  const id = useLabelableId({ id: idProp });
  const ariaLabelledBy = useAriaLabelledBy(undefined, labelId, firstInputRef, true, id);
  const validationConfig = getOTPValidationConfig(validationType);
  const pattern = validationConfig?.pattern;
  const hiddenInputPattern = pattern?.replace('{1}', `{${length}}`);
  const inputMode = validationConfig?.inputMode;

  const value = normalizeOTPValue(valueUnwrapped, length, validationType, sanitizeValue);
  const valueRef = useValueAsRef(value);
  const filled = value !== '';

  const [focusedIndex, setFocusedIndex] = React.useState(() => Math.min(value.length, length - 1));
  const [focused, setFocusedState] = React.useState(false);

  const activeIndex = focused
    ? Math.min(focusedIndex, Math.max(length - 1, 0))
    : Math.min(value.length, length - 1);

  useIsoLayoutEffect(() => {
    setFilled(filled);
  }, [filled, setFilled]);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (inputCount === 0 || inputCount === length) {
        return;
      }

      const ownerStackMessage = SafeReact.captureOwnerStack?.() || '';
      const message =
        '<OTPField.Root> `length` must match the number of rendered ' +
        `<OTPField.Input /> parts. Received \`length={${length}}\` but rendered ` +
        `${inputCount} input${inputCount === 1 ? '' : 's'}.`;
      warn(message, ownerStackMessage);
    }, [inputCount, length]);
  }

  useField({
    id,
    name,
    commit: validation.commit,
    value,
    getValue: () => valueRef.current,
    controlRef: firstInputRef,
  });

  const focusInput = useStableCallback((index: number) => {
    const targetIndex = Math.min(Math.max(index, 0), Math.max(inputRefs.current.length - 1, 0));
    const target = inputRefs.current[targetIndex];
    target?.focus();
    target?.select();
  });

  const queueFocusInput = useStableCallback((index: number) => {
    pendingFocusIndexRef.current = index;
  });

  const requestSubmit = useStableCallback(() => {
    let formElement = validation.inputRef.current?.form ?? inputRefs.current[0]?.form ?? null;

    if (form) {
      const associatedElement = (rootRef.current?.ownerDocument ?? document).getElementById(form);
      if (associatedElement?.tagName === 'FORM') {
        formElement = associatedElement as HTMLFormElement;
      }
    }

    if (formElement && typeof formElement.requestSubmit === 'function') {
      formElement.requestSubmit();
    }
  });

  useValueChanged(value, () => {
    clearErrors(name);
    setDirty(value !== validityData.initialValue);

    if (shouldValidateOnChange()) {
      validation.commit(value);
    } else {
      validation.commit(value, true);
    }

    const pendingCompleteValue = pendingCompleteValueRef.current;

    if (pendingCompleteValue != null) {
      pendingCompleteValueRef.current = null;

      if (pendingCompleteValue.value === value) {
        onValueCompleteProp?.(value, pendingCompleteValue.eventDetails);

        if (autoSubmit) {
          requestSubmit();
        }
      }
    }

    const pendingFocusIndex = pendingFocusIndexRef.current;

    if (pendingFocusIndex != null) {
      pendingFocusIndexRef.current = null;
      focusInput(pendingFocusIndex);
    }
  });

  const setValue = useStableCallback(
    (nextValue: string, details: OTPFieldRoot.ChangeEventDetails) => {
      const normalizedValue = normalizeOTPValue(nextValue, length, validationType, sanitizeValue);

      onValueChange?.(normalizedValue, details);

      if (details.isCanceled) {
        return;
      }

      setValueUnwrapped(normalizedValue);
      if (normalizedValue.length === length && valueRef.current.length !== length) {
        pendingCompleteValueRef.current = {
          value: normalizedValue,
          eventDetails: createGenericEventDetails(details.reason, details.event),
        };
      } else if (normalizedValue.length !== length) {
        pendingCompleteValueRef.current = null;
      }
    },
  );

  const handleInputFocus = useStableCallback(
    (index: number, event: React.FocusEvent<HTMLInputElement>) => {
      if (index > valueRef.current.length) {
        focusInput(Math.min(valueRef.current.length, length - 1));
        return;
      }

      setFocusedIndex(index);
      setFocusedState(true);
      setFocused(true);
      event.currentTarget.select();
    },
  );

  const handleInputBlur = useStableCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && rootRef.current?.contains(nextTarget)) {
      return;
    }

    setTouched(true);
    setFocusedState(false);
    setFocused(false);

    if (validationMode === 'onBlur') {
      validation.commit(valueRef.current);
    }
  });

  const getInputId = React.useCallback(
    (index: number) => {
      if (id == null) {
        return undefined;
      }

      return index === 0 ? id : `${id}-${index + 1}`;
    },
    [id],
  );

  const state: OTPFieldRootState = React.useMemo(
    () => ({
      ...fieldState,
      complete: value.length === length,
      disabled,
      filled,
      focused,
      length,
      readOnly,
      required,
      value,
    }),
    [fieldState, value, length, disabled, filled, focused, readOnly, required],
  );

  const contextValue = React.useMemo(
    () => ({
      ariaLabelledBy,
      autoComplete,
      activeIndex,
      disabled,
      form,
      focusInput,
      queueFocusInput,
      getInputId,
      handleInputBlur,
      handleInputFocus,
      id,
      inputMode,
      invalid,
      length,
      pattern,
      readOnly,
      required,
      sanitizeValue,
      setValue,
      state,
      type,
      validationType,
      value,
    }),
    [
      ariaLabelledBy,
      autoComplete,
      activeIndex,
      disabled,
      focusInput,
      form,
      getInputId,
      handleInputBlur,
      handleInputFocus,
      id,
      inputMode,
      invalid,
      length,
      pattern,
      queueFocusInput,
      readOnly,
      required,
      sanitizeValue,
      setValue,
      state,
      type,
      validationType,
      value,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, rootRef],
    state,
    props: elementProps,
    stateAttributesMapping: rootStateAttributesMapping,
  });

  return (
    <CompositeList
      elementsRef={inputRefs}
      onMapChange={(newMap) => {
        setInputCount(newMap.size);
      }}
    >
      <OTPFieldRootContext.Provider value={contextValue}>
        {element}
        <OTPFieldHiddenInput
          autoComplete={autoComplete}
          disabled={disabled}
          focusInput={focusInput}
          form={form}
          id={id}
          inputMode={inputMode}
          length={length}
          name={name}
          pattern={hiddenInputPattern}
          readOnly={readOnly}
          sanitizeValue={sanitizeValue}
          required={required}
          setValue={setValue}
          validationType={validationType}
          validation={validation}
          value={value}
        />
      </OTPFieldRootContext.Provider>
    </CompositeList>
  );
});

interface OTPFieldHiddenInputProps {
  autoComplete: string | undefined;
  disabled: boolean;
  focusInput: (index: number) => void;
  form: string | undefined;
  id: string | undefined;
  inputMode: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  length: number;
  name: string | undefined;
  pattern: string | undefined;
  readOnly: boolean;
  sanitizeValue: ((value: string) => string) | undefined;
  required: boolean;
  setValue: (value: string, details: OTPFieldRoot.ChangeEventDetails) => void;
  validationType: OTPFieldRoot.ValidationType;
  validation: ReturnType<typeof useFieldRootContext>['validation'];
  value: string;
}

function OTPFieldHiddenInput(props: OTPFieldHiddenInputProps) {
  const {
    autoComplete,
    disabled,
    focusInput,
    form,
    id,
    inputMode,
    length,
    name,
    pattern,
    readOnly,
    sanitizeValue,
    required,
    setValue,
    validationType,
    validation,
    value,
  } = props;
  if (length === 0) {
    return null;
  }

  return (
    <input
      {...validation.getInputValidationProps({
        onFocus() {
          focusInput(0);
        },
        onChange(event) {
          if (event.nativeEvent.defaultPrevented) {
            return;
          }

          setValue(
            normalizeOTPValue(event.currentTarget.value, length, validationType, sanitizeValue),
            createChangeEventDetails(REASONS.inputChange, event.nativeEvent),
          );
        },
      })}
      ref={validation.inputRef}
      type="text"
      id={id && name == null ? `${id}-hidden-input` : undefined}
      form={form}
      name={name}
      value={value}
      autoComplete={autoComplete}
      inputMode={inputMode}
      minLength={length}
      maxLength={length}
      pattern={pattern}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-hidden
      tabIndex={-1}
      style={name ? visuallyHiddenInput : visuallyHidden}
    />
  );
}

export interface OTPFieldRootProps extends Omit<
  BaseUIComponentProps<'div', OTPFieldRootState>,
  'onChange' | 'inputMode'
> {
  /**
   * The id of the first input element.
   */
  id?: string | undefined;
  /**
   * The input autocomplete attribute. Applied to the first slot and hidden validation input.
   * @default 'one-time-code'
   */
  autoComplete?: string | undefined;
  /**
   * A string specifying the `form` element with which the hidden input is associated.
   * This string's value must match the id of a `form` element in the same document.
   */
  form?: string | undefined;
  /**
   * The number of OTP input slots.
   */
  length: number;
  /**
   * Whether to submit the owning form when the OTP becomes complete.
   * @default false
   */
  autoSubmit?: boolean | undefined;
  /**
   * The input type of the OTP slots.
   * @default 'text'
   */
  type?: OTPFieldRoot.InputType | undefined;
  /**
   * The type of input validation to apply to the OTP value.
   * @default 'numeric'
   */
  validationType?: OTPFieldRoot.ValidationType | undefined;
  /**
   * Function for custom sanitization when `validationType` is set to `'none'`.
   * This function runs before updating the OTP value from user interactions.
   */
  sanitizeValue?: ((value: string) => string) | undefined;
  /**
   * Whether the user must enter a value before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the user should be unable to change the field value.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string | undefined;
  /**
   * The OTP value.
   */
  value?: string | undefined;
  /**
   * The uncontrolled OTP value when the component is initially rendered.
   */
  defaultValue?: string | undefined;
  /**
   * Callback fired when the OTP value changes.
   *
   * The `eventDetails.reason` indicates what triggered the change:
   * - `'input-change'` for typing or autofill
   * - `'input-clear'` when a character is removed by text input
   * - `'input-paste'` for paste interactions
   * - `'keyboard'` for keyboard navigation that changes the value
   */
  onValueChange?:
    | ((value: string, eventDetails: OTPFieldRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Callback function that is fired when the OTP value becomes complete.
   *
   * It runs later than `onValueChange`, after the internal value update is applied.
   *
   * If `autoSubmit` is enabled, it runs immediately before the owning form is submitted.
   *
   * **Warning**: This is a generic event not a change event.
   */
  onValueComplete?:
    | ((value: string, eventDetails: OTPFieldRoot.CompleteEventDetails) => void)
    | undefined;
}

export interface OTPFieldRootState extends FieldRootState {
  /**
   * Whether all slots are filled.
   */
  complete: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * The number of OTP input slots.
   */
  length: number;
  /**
   * Whether the user should be unable to change the field value.
   */
  readOnly: boolean;
  /**
   * Whether the user must enter a value before submitting a form.
   */
  required: boolean;
  /**
   * The OTP value.
   */
  value: string;
}

export type OTPFieldRootChangeEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.inputClear
  | typeof REASONS.inputPaste
  | typeof REASONS.keyboard;
export type OTPFieldRootChangeEventDetails =
  BaseUIChangeEventDetails<OTPFieldRoot.ChangeEventReason>;

export type OTPFieldRootCompleteEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.inputPaste
  | typeof REASONS.keyboard;
export type OTPFieldRootCompleteEventDetails =
  BaseUIGenericEventDetails<OTPFieldRoot.CompleteEventReason>;

export namespace OTPFieldRoot {
  export type InputType = 'text' | 'password';
  export type State = OTPFieldRootState;
  export type Props = OTPFieldRootProps;
  export type ValidationType = OTPValidationType;
  export type ChangeEventReason = OTPFieldRootChangeEventReason;
  export type ChangeEventDetails = OTPFieldRootChangeEventDetails;
  export type CompleteEventReason = OTPFieldRootCompleteEventReason;
  export type CompleteEventDetails = OTPFieldRootCompleteEventDetails;
}
