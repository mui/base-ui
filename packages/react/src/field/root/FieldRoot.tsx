'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { FieldRootContext } from './FieldRootContext';
import { DEFAULT_VALIDITY_STATE, fieldValidityMapping } from '../utils/constants';
import { useFieldsetRootContext } from '../../fieldset/root/FieldsetRootContext';
import type { Form } from '../../form';
import { useFormContext } from '../../form/FormContext';
import { LabelableProvider } from '../../labelable-provider';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useFieldValidation } from './useFieldValidation';

/**
 * @internal
 */
const FieldRootInner = React.forwardRef(function FieldRootInner(
  componentProps: FieldRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { errors, validationMode: formValidationMode, submitAttemptedRef } = useFormContext();

  const {
    render,
    className,
    validate: validateProp,
    validationDebounceTime = 0,
    validationMode = formValidationMode,
    name,
    disabled: disabledProp = false,
    invalid: invalidProp,
    dirty: dirtyProp,
    touched: touchedProp,
    actionsRef,
    ...elementProps
  } = componentProps;

  const { disabled: disabledFieldset } = useFieldsetRootContext();

  const validate = useStableCallback(validateProp || (() => null));

  const disabled = disabledFieldset || disabledProp;

  const [touchedState, setTouchedUnwrapped] = React.useState(false);
  const [dirtyState, setDirtyUnwrapped] = React.useState(false);
  const [filled, setFilled] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const dirty = dirtyProp ?? dirtyState;
  const touched = touchedProp ?? touchedState;

  const markedDirtyRef = React.useRef(false);

  const setDirty: typeof setDirtyUnwrapped = useStableCallback((value) => {
    if (dirtyProp !== undefined) {
      return;
    }

    if (value) {
      markedDirtyRef.current = true;
    }
    setDirtyUnwrapped(value);
  });

  const setTouched: typeof setTouchedUnwrapped = useStableCallback((value) => {
    if (touchedProp !== undefined) {
      return;
    }
    setTouchedUnwrapped(value);
  });

  const shouldValidateOnChange = useStableCallback(
    () =>
      validationMode === 'onChange' ||
      (validationMode === 'onSubmit' && submitAttemptedRef.current),
  );

  const hasFormError = !!name && Object.hasOwn(errors, name) && errors[name] !== undefined;
  const invalid = invalidProp === true || hasFormError;

  const [validityData, setValidityData] = React.useState<FieldValidityData>({
    state: DEFAULT_VALIDITY_STATE,
    error: '',
    errors: [],
    value: null,
    initialValue: null,
  });

  const valid = !invalid && validityData.state.valid;

  const state: FieldRoot.State = React.useMemo(
    () => ({
      disabled,
      touched,
      dirty,
      valid,
      filled,
      focused,
    }),
    [disabled, touched, dirty, valid, filled, focused],
  );

  const validation = useFieldValidation({
    setValidityData,
    validate,
    validityData,
    validationDebounceTime,
    invalid,
    markedDirtyRef,
    state,
    name,
    shouldValidateOnChange,
  });

  const handleImperativeValidate = React.useCallback(() => {
    markedDirtyRef.current = true;
    validation.commit(validityData.value);
  }, [validation, validityData]);

  React.useImperativeHandle(actionsRef, () => ({ validate: handleImperativeValidate }), [
    handleImperativeValidate,
  ]);

  const contextValue: FieldRootContext = React.useMemo(
    () => ({
      invalid,
      name,
      validityData,
      setValidityData,
      disabled,
      touched,
      setTouched,
      dirty,
      setDirty,
      filled,
      setFilled,
      focused,
      setFocused,
      validate,
      validationMode,
      validationDebounceTime,
      shouldValidateOnChange,
      state,
      markedDirtyRef,
      validation,
    }),
    [
      invalid,
      name,
      validityData,
      disabled,
      touched,
      setTouched,
      dirty,
      setDirty,
      filled,
      setFilled,
      focused,
      setFocused,
      validate,
      validationMode,
      validationDebounceTime,
      shouldValidateOnChange,
      state,
      validation,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping: fieldValidityMapping,
  });

  return <FieldRootContext.Provider value={contextValue}>{element}</FieldRootContext.Provider>;
});

/**
 * Groups all parts of the field.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldRoot = React.forwardRef(function FieldRoot(
  componentProps: FieldRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <LabelableProvider>
      <FieldRootInner {...componentProps} ref={forwardedRef} />
    </LabelableProvider>
  );
});

export interface FieldValidityData {
  state: {
    badInput: boolean;
    customError: boolean;
    patternMismatch: boolean;
    rangeOverflow: boolean;
    rangeUnderflow: boolean;
    stepMismatch: boolean;
    tooLong: boolean;
    tooShort: boolean;
    typeMismatch: boolean;
    valueMissing: boolean;
    valid: boolean | null;
  };
  error: string;
  errors: string[];
  value: unknown;
  initialValue: unknown;
}

export interface FieldRootActions {
  validate: () => void;
}

export interface FieldRootState {
  /** Whether the component should ignore user interaction. */
  disabled: boolean;
  touched: boolean;
  dirty: boolean;
  valid: boolean | null;
  filled: boolean;
  focused: boolean;
}

export interface FieldRootProps extends BaseUIComponentProps<'div', FieldRoot.State> {
  /**
   * Whether the component should ignore user interaction.
   * Takes precedence over the `disabled` prop on the `<Field.Control>` component.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Identifies the field when a form is submitted.
   * Takes precedence over the `name` prop on the `<Field.Control>` component.
   */
  name?: string | undefined;
  /**
   * A function for custom validation. Return a string or an array of strings with
   * the error message(s) if the value is invalid, or `null` if the value is valid.
   * Asynchronous functions are supported, but they do not prevent form submission
   * when using `validationMode="onSubmit"`.
   */
  validate?:
    | ((
        value: unknown,
        formValues: Form.Values,
      ) => string | string[] | null | Promise<string | string[] | null>)
    | undefined;
  /**
   * Determines when the field should be validated.
   * This takes precedence over the `validationMode` prop on `<Form>`.
   *
   * - `onSubmit`: triggers validation when the form is submitted, and re-validates on change after submission.
   * - `onBlur`: triggers validation when the control loses focus.
   * - `onChange`: triggers validation on every change to the control value.
   *
   * @default 'onSubmit'
   */
  validationMode?: Form.ValidationMode | undefined;
  /**
   * How long to wait between `validate` callbacks if
   * `validationMode="onChange"` is used. Specified in milliseconds.
   * @default 0
   */
  validationDebounceTime?: number | undefined;
  /**
   * Whether the field is invalid.
   * Useful when the field state is controlled by an external library.
   */
  invalid?: boolean | undefined;
  /**
   * Whether the field's value has been changed from its initial value.
   * Useful when the field state is controlled by an external library.
   */
  dirty?: boolean | undefined;
  /**
   * Whether the field has been touched.
   * Useful when the field state is controlled by an external library.
   */
  touched?: boolean | undefined;
  /**
   * A ref to imperative actions.
   * - `validate`: Validates the field when called.
   */
  actionsRef?: React.RefObject<FieldRoot.Actions | null> | undefined;
}

export namespace FieldRoot {
  export type State = FieldRootState;
  export type Props = FieldRootProps;
  export type Actions = FieldRootActions;
}
