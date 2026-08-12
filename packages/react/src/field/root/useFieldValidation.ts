'use client';
import * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import { mergeProps } from '../../merge-props';
import { DEFAULT_VALIDITY_STATE } from '../../internals/field-constants/constants';
import { useFormContext } from '../../internals/form-context/FormContext';
import type { Form } from '../../form';
import { getCombinedFieldValidityData } from '../utils/getCombinedFieldValidityData';
import type { HTMLProps } from '../../internals/types';
import type { FieldValidityData, FieldRootState } from './FieldRoot';

const validityKeys = Object.keys(DEFAULT_VALIDITY_STATE) as Array<keyof ValidityState>;

export type RegisteredInput = {
  controlRef: React.RefObject<HTMLElement | null>;
  value: string | undefined;
};

export type RegisteredInputs = Map<HTMLInputElement, RegisteredInput>;

/**
 * Whether an input participates in the surrounding Base UI Form. Inputs that are effectively
 * disabled, or whose `form` attribute explicitly associates them with another form, are excluded.
 * DOM position only matters when it associates the input with a different form. Otherwise, field
 * registration is context-driven, so portaled inputs (for example inside a dialog) still belong to
 * the form for both validation and values projected into `onFormSubmit`.
 */
export function isEligibleInput(input: HTMLInputElement, formElement: HTMLFormElement | null) {
  if (input.matches(':disabled')) {
    return false;
  }

  if (!formElement || input.form === formElement) {
    return true;
  }

  // React context crosses portal boundaries. An unassociated portaled input still participates in
  // contextual validation, unless an explicit `form` attribute opts it out of the surrounding Form.
  return input.form === null && !input.hasAttribute('form');
}

/**
 * Picks the input whose native validity should represent a field that owns several inputs (such as a
 * checkbox or radio group). Prefers the first eligible currently-invalid input, where "first" follows
 * registration order (mount order), and otherwise returns the first eligible input.
 */
function findRepresentativeInput(
  inputs: RegisteredInputs,
  formElement: HTMLFormElement | null,
): HTMLInputElement | null {
  let fallback: HTMLInputElement | null = null;
  for (const input of inputs.keys()) {
    if (!isEligibleInput(input, formElement)) {
      continue;
    }
    if (!input.validity.valid) {
      return input;
    }
    fallback ??= input;
  }
  return fallback;
}

/**
 * A synthetic validity state carrying no native constraint errors: all valid, or failing only
 * `customError`.
 */
function makeState(customError: boolean): Record<keyof ValidityState, boolean> {
  return { ...DEFAULT_VALIDITY_STATE, valid: !customError, customError };
}

function getNativeErrors(element: HTMLInputElement | null): string[] {
  return element && element.validationMessage ? [element.validationMessage] : [];
}

export function useFieldValidation(
  params: UseFieldValidationParameters,
): UseFieldValidationReturnValue {
  const { elementRef, formRef } = useFormContext();

  const {
    setValidityData,
    validate,
    validityData,
    validationDebounceTime,
    invalid,
    markedDirtyRef,
    state,
    shouldValidateOnChange,
    registeredFieldIdRef,
  } = params;

  const { controlId, getDescriptionProps } = useLabelableContext();

  const timeout = useTimeout();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const registeredInputs = useRefWithInit<RegisteredInputs>(() => new Map()).current;
  const validationCommitIdRef = React.useRef(0);
  // Base UI installs at most one custom validity message per field. Keep its normalized text and
  // the message it displaced so clearing never wipes validity owned by another control.
  const customValidityRef = React.useRef<
    [element: HTMLInputElement, message: string, displaced: string] | null
  >(null);

  function updateCustomValidity(element?: HTMLInputElement, message?: string) {
    if (element) {
      // Only a custom message can be displaced: a failing native constraint reports its own text
      // through `validationMessage`, which must never be reinstalled as a custom validity message.
      const displaced =
        element.willValidate && element.validity.customError ? element.validationMessage : '';
      const ownedMessage = message!.replace(/\r\n?/g, '\n');
      element.setCustomValidity(ownedMessage);
      customValidityRef.current = [element, ownedMessage, displaced];
      return;
    }

    const record = customValidityRef.current;
    customValidityRef.current = null;
    // Another message replacing or withdrawing ours transfers ownership to outside code. Barred
    // controls do not expose `validationMessage`, so the owned message has to be cleared blindly.
    if (record && (!record[0].willValidate || record[0].validationMessage === record[1])) {
      record[0].setCustomValidity(record[2]);
    }
  }

  // Groups register several inputs against a single field so focus, validation, and form-value
  // projection can use the same live controls. This also ensures a `required` checkbox can't be
  // satisfied by another input in the group, matching native per-checkbox behavior.
  const registerInput = React.useCallback(
    (element: HTMLInputElement, registration: RegisteredInput) => {
      registeredInputs.set(element, registration);
      return () => {
        registeredInputs.delete(element);
      };
    },
    [registeredInputs],
  );

  const getInputControl = useStableCallback(() => {
    const element = findRepresentativeInput(registeredInputs, elementRef.current);
    return (element && registeredInputs.get(element)?.controlRef.current) || null;
  });

  const commit = useStableCallback(async (value: unknown, revalidate = false) => {
    validationCommitIdRef.current += 1;
    const validationCommitId = validationCommitIdRef.current;

    function updateRegisteredFieldValidity(
      nextValidityData: FieldValidityData,
      externalInvalid = invalid,
    ) {
      const fieldId = registeredFieldIdRef.current ?? controlId;
      if (fieldId == null) {
        return;
      }

      const currentFieldData = formRef.current.fields.get(fieldId);
      if (!currentFieldData) {
        return;
      }

      const validityDataWithFormErrors = getCombinedFieldValidityData(
        nextValidityData,
        externalInvalid,
      );

      formRef.current.fields.set(fieldId, {
        ...currentFieldData,
        validityData: validityDataWithFormErrors,
      });
    }

    function makeValidityData(
      validityState: Record<keyof ValidityState, boolean>,
      errorMessages: string[],
    ): FieldValidityData {
      // A field that isn't invalid carries no errors: the pristine `valueMissing` suppression in
      // `getState` can leave `valid: true` while the native message is non-empty.
      const errors = validityState.valid === false ? errorMessages : [];
      return {
        value,
        state: validityState,
        error: errors[0] ?? '',
        errors,
        initialValue: validityData.initialValue,
      };
    }

    function publish(
      validityState: Record<keyof ValidityState, boolean>,
      errorMessages: string[],
      externalInvalid?: boolean,
    ) {
      const nextValidityData = makeValidityData(validityState, errorMessages);
      // Keep Form-level errors part of overall field validity for submit blocking/focus logic.
      updateRegisteredFieldValidity(nextValidityData, externalInvalid);
      setValidityData(nextValidityData);
    }

    function getState(el: HTMLInputElement) {
      const computedState = validityKeys.reduce(
        (acc, key) => {
          acc[key] = el.validity[key];
          return acc;
        },
        {} as Record<keyof ValidityState, boolean>,
      );

      let hasOnlyValueMissingError = false;

      for (const key of validityKeys) {
        if (key === 'valid') {
          continue;
        }
        if (key === 'valueMissing' && computedState[key]) {
          hasOnlyValueMissingError = true;
        } else if (computedState[key]) {
          return computedState;
        }
      }

      // Only make `valueMissing` mark the field invalid if it's been changed
      // to reduce error noise.
      if (hasOnlyValueMissingError && !markedDirtyRef.current) {
        computedState.valid = true;
        computedState.valueMissing = false;
      }
      return computedState;
    }

    // A field can own several inputs (such as a checkbox or radio group), but only the last-mounted
    // one wins the shared `inputRef`. Validate against the registry instead so every input counts;
    // `inputRef` is the fallback only when no inputs are registered.
    function resolveRepresentativeInput() {
      return registeredInputs.size > 0
        ? findRepresentativeInput(registeredInputs, elementRef.current)
        : inputRef.current;
    }

    // A field with no eligible input has no native constraint, but its custom validator still
    // applies to the logical value at the configured validation boundary.
    let element = resolveRepresentativeInput();

    function refreshState() {
      element = resolveRepresentativeInput();
      return element ? getState(element) : makeState(false);
    }

    if (revalidate) {
      if (state.valid !== false || !element) {
        return;
      }

      if (!element.validity.valueMissing) {
        // The 'valueMissing' (required) condition has been resolved by the user typing.
        // Temporarily mark the field as valid for this onChange event.
        // Other native errors (e.g., typeMismatch) will be caught by full validation on blur or submit.
        // The required value is now present; ignore stale external invalid state for this pass.
        updateCustomValidity();
        // Clearing can hand representative status to another registered input that kept a
        // message of its own, so resolve it again. A message set by other code that survived the
        // clear keeps the field invalid; publish that error alone so other native errors remain
        // deferred until blur or submit.
        const currentElement = resolveRepresentativeInput();
        const foreign = currentElement?.validity.customError ? currentElement : null;
        publish(makeState(foreign !== null), getNativeErrors(foreign), false);
        return;
      }

      // A stale custom error can coexist with valueMissing, but defer any other native errors.
      for (const key of validityKeys) {
        if (
          key !== 'valid' &&
          key !== 'valueMissing' &&
          key !== 'customError' &&
          element.validity[key]
        ) {
          return;
        }
      }

      // Value is still missing: publish the current native state so valueMissing and the changed
      // value are observable immediately. Full custom validation still waits for its boundary.
    }

    timeout.clear();

    // Residue this hook installed for a previous result would otherwise read back as a native
    // constraint message below and skip `validate`, blocking submission until the user retypes.
    updateCustomValidity();

    let nextState = refreshState();
    let validationErrors = getNativeErrors(element);

    const isValidatingOnChange = shouldValidateOnChange();

    // Not validating on change with a standing native constraint (or a message set by other
    // code): skip the custom validate function.
    if (validationErrors.length === 0 || isValidatingOnChange) {
      // call the validate function because either
      // - validating on change, or
      // - native constraint validations passed, custom validity check is next
      const formValues = Array.from(formRef.current.fields.values()).reduce((acc, field) => {
        if (field.name) {
          acc[field.name] = field.getValue();
        }
        return acc;
      }, {} as Form.Values);

      const resultOrPromise = validate(value, formValues);
      let result: string | string[] | null;

      if (
        typeof resultOrPromise === 'object' &&
        resultOrPromise !== null &&
        'then' in resultOrPromise
      ) {
        // Async results don't participate in submit-time validation, so retire the previous
        // result while the validator runs: a stale error must not keep blocking submission.
        updateRegisteredFieldValidity(makeValidityData(nextState, validationErrors));
        result = await resultOrPromise;
        if (validationCommitId !== validationCommitIdRef.current) {
          return;
        }
        // The DOM may have moved on while awaiting.
        nextState = refreshState();
      } else {
        result = resultOrPromise;
      }

      // `null`, `undefined`, `''`, and `[]` all mean the value is valid.
      validationErrors = result == null || result === '' ? [] : ([] as string[]).concat(result);

      if (validationErrors.length > 0) {
        nextState.valid = false;
        nextState.customError = true;
        if (element) {
          updateCustomValidity(element, validationErrors.join('\n'));
        }
      } else {
        // The validator passed but a native constraint (validating on change) or a message set by
        // other code may stand.
        validationErrors = getNativeErrors(element);
      }
    }

    publish(nextState, validationErrors);
  });

  const change = useStableCallback((value: unknown, cancelPending = false) => {
    timeout.clear();
    validationCommitIdRef.current += 1;
    if (cancelPending) {
      return;
    }

    const validateOnChange = shouldValidateOnChange();

    if (validateOnChange && value !== '' && validationDebounceTime) {
      timeout.start(validationDebounceTime, () => {
        commit(value);
      });
    } else {
      commit(value, !validateOnChange);
    }
  });

  const getValidationProps = React.useCallback(
    (disabled: boolean, externalProps: HTMLProps = {}) =>
      mergeProps<any>(
        getDescriptionProps(externalProps),
        state.valid === false && !state.disabled && !disabled
          ? { 'aria-invalid': true }
          : EMPTY_OBJECT,
      ),
    [getDescriptionProps, state.disabled, state.valid],
  );

  return React.useMemo(
    () => ({
      getValidationProps,
      inputRef,
      registeredInputs,
      registerInput,
      getInputControl,
      commit,
      change,
    }),
    [getValidationProps, registeredInputs, registerInput, getInputControl, commit, change],
  );
}

export interface UseFieldValidationParameters {
  setValidityData: (data: FieldValidityData) => void;
  validate: (
    value: unknown,
    formValues: Form.Values,
  ) => string | string[] | null | Promise<string | string[] | null>;
  validityData: FieldValidityData;
  validationDebounceTime: number;
  invalid: boolean;
  markedDirtyRef: React.RefObject<boolean>;
  state: FieldRootState;
  shouldValidateOnChange: () => boolean;
  registeredFieldIdRef: React.RefObject<string | undefined>;
}

export interface UseFieldValidationReturnValue {
  getValidationProps: (disabled: boolean, props?: HTMLProps) => HTMLProps;
  inputRef: React.RefObject<HTMLInputElement | null>;
  registeredInputs: RegisteredInputs;
  registerInput: (element: HTMLInputElement, registration: RegisteredInput) => void | (() => void);
  getInputControl: () => HTMLElement | null;
  commit: (value: unknown) => Promise<void>;
  change: (value: unknown, cancelPending?: boolean) => void;
}
