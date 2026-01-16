'use client';
import * as React from 'react';
import { AdvancedStore, createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';
import type { Form } from '../../form';
import { FormContext } from '../../form/FormContext';
import { TimeoutManager } from '../../utils/TimeoutManager';
import type { FieldValidityData } from './FieldRoot';
import { getCombinedFieldValidityData } from '../utils/getCombinedFieldValidityData';

const invalidSelector = createSelector((state: FieldRootStoreState) =>
  Boolean(
    state.invalidProp ||
    (state.name &&
      {}.hasOwnProperty.call(state.errors, state.name) &&
      state.errors[state.name] !== undefined),
  ),
);

const validSelector = createSelector(
  (state: FieldRootStoreState) => !invalidSelector(state) && state.validityData.state.valid,
);

export const selectors = {
  dirty: createSelector((state: FieldRootStoreState) => state.dirty),
  touched: createSelector((state: FieldRootStoreState) => state.touched),
  disabled: createSelector((state: FieldRootStoreState) => state.disabled),
  focused: createSelector((state: FieldRootStoreState) => state.focused),
  filled: createSelector((state: FieldRootStoreState) => state.filled),
  invalid: invalidSelector,
  valid: validSelector,
  validityData: createSelector((state: FieldRootStoreState) => state.validityData),
  rootState: createSelectorMemoized(
    (state: FieldRootStoreState) => state.disabled,
    (state: FieldRootStoreState) => state.touched,
    (state: FieldRootStoreState) => state.dirty,
    (state: FieldRootStoreState) => state.focused,
    (state: FieldRootStoreState) => state.filled,
    validSelector,
    (disabled, touched, dirty, focused, filled, valid) => ({
      disabled,
      touched,
      dirty,
      valid,
      filled,
      focused,
    }),
  ),
};

const validityKeys = Object.keys(DEFAULT_VALIDITY_STATE) as Array<keyof ValidityState>;

export class FieldRootStore extends AdvancedStore<FieldRootStoreParameters, FieldRootStoreState> {
  private timeoutManager = new TimeoutManager();

  public inputRef = React.createRef<HTMLInputElement>();

  public markedDirty = false;

  constructor(parameters: FieldRootStoreParameters) {
    super(
      parameters,
      {
        // Synced properties
        ...deriveStateFromParameters(parameters),

        // Controllable properties
        dirty: parameters.dirty ?? false,
        touched: parameters.touched ?? false,

        // Internal properties
        focused: false,
        filled: false,
        validityData: {
          state: DEFAULT_VALIDITY_STATE,
          error: '',
          errors: [],
          value: null,
          initialValue: null,
        },
      },
      'FieldRootStore',
    );
  }

  /**
   * Updates the state of the Tree View based on the new parameters provided to the root component.
   */
  public updateStateFromParameters(parameters: FieldRootStoreParameters) {
    const newState = deriveStateFromParameters(parameters) as Partial<FieldRootStoreState>;

    super.applyModelUpdateOnState(parameters, newState, 'dirty');
    super.applyModelUpdateOnState(parameters, newState, 'touched');

    this.update(newState);
    this.parameters = parameters;
  }

  public setDirty = (dirty: boolean) => {
    if (this.parameters.dirty === undefined) {
      this.set('dirty', dirty);
    }
  };

  public setTouched = (touched: boolean) => {
    if (this.parameters.touched === undefined) {
      this.set('touched', touched);
    }
  };

  public setFilled = (filled: boolean) => {
    this.set('filled', filled);
  };

  public setFocused = (focused: boolean) => {
    this.set('focused', focused);
  };

  public setValidityData = (validityData: FieldValidityData) => {
    this.set('validityData', validityData);
  };

  public setInitialValidityData = (initialValue: unknown) => {
    this.set('validityData', {
      ...this.state.validityData,
      initialValue,
    });
  };

  public markDirty = () => {
    this.markedDirty = true;
  };

  public shouldValidateOnChange = () => {
    const validationMode = this.parameters.validationMode;
    return (
      validationMode === 'onChange' ||
      (validationMode === 'onSubmit' && this.parameters.formContext.submitAttemptedRef.current)
    );
  };

  public commitValidation = async (value: unknown, revalidate = false) => {
    const element = this.inputRef.current;
    if (!element) {
      return;
    }

    if (revalidate) {
      if (selectors.valid(this.state) !== false) {
        return;
      }

      const currentNativeValidity = element.validity;

      if (!currentNativeValidity.valueMissing) {
        // The 'valueMissing' (required) condition has been resolved by the user typing.
        // Temporarily mark the field as valid for this onChange event.
        // Other native errors (e.g., typeMismatch) will be caught by full validation on blur or submit.
        const nextValidityData = {
          value,
          state: { ...DEFAULT_VALIDITY_STATE, valid: true },
          error: '',
          errors: [],
          initialValue: this.state.validityData.initialValue,
        };
        element.setCustomValidity('');

        if (this.state.controlId) {
          const currentFieldData = this.parameters.formContext.formRef.current.fields.get(
            this.state.controlId,
          );
          if (currentFieldData) {
            this.parameters.formContext.formRef.current.fields.set(this.state.controlId, {
              ...currentFieldData,
              ...getCombinedFieldValidityData(nextValidityData, false), // invalid = false
            });
          }
        }
        this.setValidityData(nextValidityData);
        return;
      }

      // Value is still missing, or other conditions apply.
      // Let's use a representation of current validity for isOnlyValueMissing.
      const currentNativeValidityObject = validityKeys.reduce(
        (acc, key) => {
          acc[key] = currentNativeValidity[key];
          return acc;
        },
        {} as Record<keyof ValidityState, boolean>,
      );

      // If it's (still) natively invalid due to something other than just valueMissing,
      // then bail from this revalidation on change to avoid "scolding" for other errors.
      if (!currentNativeValidityObject.valid && !isOnlyValueMissing(currentNativeValidityObject)) {
        return;
      }

      // If valueMissing is still true AND it's the only issue, or if the field is now natively valid,
      // let it fall through to the main validation logic below.
    }

    const markedDirty = this.markedDirty;
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
      if (hasOnlyValueMissingError && !markedDirty) {
        computedState.valid = true;
        computedState.valueMissing = false;
      }
      return computedState;
    }

    this.timeoutManager.clearTimeout('inputValidation');

    let result: null | string | string[] = null;
    let validationErrors: string[] = [];

    const nextState = getState(element);

    let defaultValidationMessage;
    const validateOnChange = this.shouldValidateOnChange();

    if (element.validationMessage && !validateOnChange) {
      // not validating on change, if there is a `validationMessage` from
      // native validity, set errors and skip calling the custom validate fn
      defaultValidationMessage = element.validationMessage;
      validationErrors = [element.validationMessage];
    } else {
      // call the validate function because either
      // - validating on change, or
      // - native constraint validations passed, custom validity check is next
      const formValues = Array.from(
        this.parameters.formContext.formRef.current.fields.values(),
      ).reduce((acc, field) => {
        if (field.name) {
          acc[field.name] = field.getValue();
        }
        return acc;
      }, {} as Form.Values);

      const resultOrPromise = this.validate(value, formValues);
      if (
        typeof resultOrPromise === 'object' &&
        resultOrPromise !== null &&
        'then' in resultOrPromise
      ) {
        result = await resultOrPromise;
      } else {
        result = resultOrPromise;
      }

      if (result !== null) {
        nextState.valid = false;
        nextState.customError = true;

        if (Array.isArray(result)) {
          validationErrors = result;
          element.setCustomValidity(result.join('\n'));
        } else if (result) {
          validationErrors = [result];
          element.setCustomValidity(result);
        }
      } else if (validateOnChange) {
        // validate function returned no errors, if validating on change
        // we need to clear the custom validity state
        element.setCustomValidity('');
        nextState.customError = false;

        if (element.validationMessage) {
          defaultValidationMessage = element.validationMessage;
          validationErrors = [element.validationMessage];
        } else if (element.validity.valid && !nextState.valid) {
          nextState.valid = true;
        }
      }
    }

    const nextValidityData = {
      value,
      state: nextState,
      error: defaultValidationMessage ?? (Array.isArray(result) ? result[0] : (result ?? '')),
      errors: validationErrors,
      initialValue: selectors.validityData(this.state).initialValue,
    };

    if (this.state.controlId) {
      const currentFieldData = this.parameters.formContext.formRef.current.fields.get(
        this.state.controlId,
      );
      if (currentFieldData) {
        this.parameters.formContext.formRef.current.fields.set(this.state.controlId, {
          ...currentFieldData,
          ...getCombinedFieldValidityData(nextValidityData, selectors.invalid(this.state)),
        });
      }
    }

    this.setValidityData(nextValidityData);
  };

  public validate = (value: unknown, formValues: Form.Values) => {
    return this.parameters.validate?.(value, formValues) ?? null;
  };

  public runImperativeValidation = () => {
    this.markedDirty = true;
    this.commitValidation(this.state.validityData.value);
  };

  public handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Workaround for https://github.com/facebook/react/issues/9023
    if (event.nativeEvent.defaultPrevented) {
      return;
    }

    this.parameters.formContext.clearErrors(this.state.name);

    if (!this.shouldValidateOnChange()) {
      this.commitValidation(event.currentTarget.value, true);
      return;
    }

    if (selectors.invalid(this.state)) {
      return;
    }

    const element = event.currentTarget;

    if (element.value === '') {
      // Ignore the debounce time for empty values.
      this.commitValidation(element.value);
      return;
    }

    this.timeoutManager.clearTimeout('inputValidation');

    if (this.state.validationDebounceTime) {
      this.timeoutManager.startTimeout('inputValidation', this.state.validationDebounceTime, () => {
        this.commitValidation(element.value);
      });
    } else {
      this.commitValidation(element.value);
    }
  };
}

function isOnlyValueMissing(state: Record<keyof ValidityState, boolean> | undefined) {
  if (!state || state.valid || !state.valueMissing) {
    return false;
  }

  let onlyValueMissing = false;

  for (const key of validityKeys) {
    if (key === 'valid') {
      continue;
    }
    if (key === 'valueMissing') {
      onlyValueMissing = state[key];
    }
    if (state[key]) {
      onlyValueMissing = false;
    }
  }

  return onlyValueMissing;
}

function deriveStateFromParameters(parameters: FieldRootStoreParameters) {
  return {
    disabled: parameters.disabled,
    invalidProp: parameters.invalidProp,
    controlId: parameters.controlId,
    name: parameters.name,
    validationDebounceTime: parameters.validationDebounceTime,
    errors: parameters.formContext.errors,
  };
}

export interface FieldRootStoreParameters {
  disabled: boolean;
  dirty: boolean | undefined;
  touched: boolean | undefined;
  invalidProp: boolean | undefined;
  name: string | undefined;
  controlId: string | null | undefined;
  validationDebounceTime: number;
  formContext: FormContext;
  validationMode: Form.ValidationMode;
  validate:
    | ((
        value: unknown,
        formValues: Form.Values,
      ) => string | string[] | null | Promise<string | string[] | null>)
    | undefined;
}

interface FieldRootStoreState {
  dirty: boolean;
  touched: boolean;
  focused: boolean;
  filled: boolean;
  disabled: boolean;
  invalidProp: boolean | undefined;
  validityData: FieldValidityData;
  controlId: string | null | undefined;
  name: string | undefined;
  validationDebounceTime: number;
  errors: FormContext['errors'];
}
