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
 * DOM position is not considered: field registration is context-driven, so portaled inputs
 * (for example inside a dialog) still belong to the form.
 */
function isEligibleInput(input: HTMLInputElement, formElement: HTMLFormElement | null) {
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
 * Custom validity messages this hook set itself, so that clearing them doesn't wipe a message set
 * by other code. Components can own a validity condition that no native constraint expresses (for
 * example a date field whose sections spell out February 30th) and surface it through
 * `setCustomValidity`, and the field must not silently drop it while revalidating.
 * Ownership is tracked by message equality: a message set by other code that is identical to the
 * currently owned one is indistinguishable from it and is cleared as owned.
 */
const ownedCustomValidity = new WeakMap<HTMLInputElement, string>();

function setOwnCustomValidity(element: HTMLInputElement, message: string) {
  element.setCustomValidity(message);
  ownedCustomValidity.set(element, message);
}

function clearOwnCustomValidity(element: HTMLInputElement) {
  const ownMessage = ownedCustomValidity.get(element);
  if (ownMessage === undefined) {
    return;
  }

  // `validationMessage` is empty on elements barred from constraint validation (disabled ones, for
  // example), so the message can only be compared when the element is able to report it. On a
  // barred element the clear proceeds unchecked: a message that overwrote this hook's own one
  // while the element was barred cannot be told apart and is knowingly wiped.
  if (element.willValidate && element.validationMessage !== ownMessage) {
    // The message was overwritten by other code, so it is no longer this hook's to clear.
    ownedCustomValidity.delete(element);
    return;
  }

  element.setCustomValidity('');
  ownedCustomValidity.delete(element);
}

function clearCustomValidity(element: HTMLInputElement | null, inputs: RegisteredInputs) {
  for (const input of inputs.keys()) {
    clearOwnCustomValidity(input);
  }
  if (element) {
    clearOwnCustomValidity(element);
  }
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

    function publishAllValid(externalInvalid?: boolean) {
      const nextValidityData = {
        value,
        state: { ...DEFAULT_VALIDITY_STATE, valid: true },
        error: '',
        errors: [],
        initialValue: validityData.initialValue,
      };
      updateRegisteredFieldValidity(nextValidityData, externalInvalid);
      setValidityData(nextValidityData);
    }

    // A field can own several inputs (such as a checkbox or radio group), but only the last-mounted
    // one wins the shared `inputRef`. Validate against the registry instead so every input counts;
    // `inputRef` is the fallback only when no inputs are registered.
    const element =
      registeredInputs.size > 0
        ? findRepresentativeInput(registeredInputs, elementRef.current)
        : inputRef.current;
    // A field with no eligible input has no native constraint, but its custom validator still
    // applies to the logical value at the configured validation boundary.

    if (revalidate) {
      if (state.valid !== false || !element) {
        return;
      }

      const currentNativeValidity = element.validity;

      if (!currentNativeValidity.valueMissing) {
        clearCustomValidity(element, registeredInputs);

        if (!element.validity.customError) {
          // The 'valueMissing' (required) condition has been resolved by the user typing.
          // Temporarily mark the field as valid for this onChange event.
          // Other native errors (e.g., typeMismatch) will be caught by full validation on blur or submit.
          // The required value is now present; ignore stale external invalid state for this pass.
          publishAllValid(false);
          return;
        }

        // A custom validity message set outside of this hook survived the clear, so the field is
        // still invalid. Publish the element's actual state so the just-resolved `valueMissing`
        // error is not left on display.
        const nextValidityData = {
          value,
          state: getState(element),
          error: element.validationMessage,
          errors: [element.validationMessage],
          initialValue: validityData.initialValue,
        };
        updateRegisteredFieldValidity(nextValidityData, false);
        setValidityData(nextValidityData);
        return;
      }

      // Avoid surfacing another error during change revalidation while the required value is
      // still missing. The full validity state is published at the configured blur or submit
      // boundary instead.
      for (const key of validityKeys) {
        if (key !== 'valid' && key !== 'valueMissing' && currentNativeValidity[key]) {
          return;
        }
      }

      // Value is still missing and it is the only native error: fall through to the main
      // validation logic below.
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

    timeout.clear();

    let result: null | string | string[] = null;
    let validationErrors: string[] = [];

    // With no representative input the field carries no native constraint, so start from an
    // all-valid native state and let the custom `validate` result below decide the outcome.
    const nextState: Record<keyof ValidityState, boolean> = element
      ? getState(element)
      : { ...DEFAULT_VALIDITY_STATE, valid: true };

    let defaultValidationMessage;
    const isValidatingOnChange = shouldValidateOnChange();

    if (element && element.validationMessage && !isValidatingOnChange) {
      // not validating on change, if there is a `validationMessage` from
      // native validity, set errors and skip calling the custom validate fn
      defaultValidationMessage = element.validationMessage;
      validationErrors = [element.validationMessage];
    } else {
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
      if (
        typeof resultOrPromise === 'object' &&
        resultOrPromise !== null &&
        'then' in resultOrPromise
      ) {
        result = await resultOrPromise;
        if (validationCommitId !== validationCommitIdRef.current) {
          return;
        }
      } else {
        result = resultOrPromise;
      }

      if (result !== null) {
        nextState.valid = false;
        nextState.customError = true;

        if (Array.isArray(result)) {
          validationErrors = result;
          if (element) {
            setOwnCustomValidity(element, result.join('\n'));
          }
        } else if (result) {
          validationErrors = [result];
          if (element) {
            setOwnCustomValidity(element, result);
          }
        }
      } else if (isValidatingOnChange) {
        // The validate function returned no errors while validating on change, so clear the
        // custom validity state this hook set on a previous commit.
        clearCustomValidity(element, registeredInputs);
        // A custom validity message set outside of this hook survives the clear above, so read the
        // remaining state off the element instead of assuming there is no custom error left.
        nextState.customError = element?.validity.customError ?? false;
        if (nextState.customError) {
          // The message may have appeared while an async `validate` was pending, after `nextState`
          // was snapshotted, so `valid` must be re-derived alongside `customError`.
          nextState.valid = false;
        }

        if (element && element.validationMessage) {
          defaultValidationMessage = element.validationMessage;
          validationErrors = [element.validationMessage];
        } else if ((!element || element.validity.valid) && !nextState.valid) {
          nextState.valid = true;
        }
      }
    }

    const nextValidityData = {
      value,
      state: nextState,
      error: defaultValidationMessage ?? (Array.isArray(result) ? result[0] : (result ?? '')),
      errors: validationErrors,
      initialValue: validityData.initialValue,
    };

    // Keep Form-level errors part of overall field validity for submit blocking/focus logic.
    updateRegisteredFieldValidity(nextValidityData);

    setValidityData(nextValidityData);
  });

  const change = useStableCallback((value: unknown) => {
    timeout.clear();
    const validateOnChange = shouldValidateOnChange();

    if (validateOnChange && value !== '' && validationDebounceTime) {
      validationCommitIdRef.current += 1;
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
  change: (value: unknown) => void;
}
