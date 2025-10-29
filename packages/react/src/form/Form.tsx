'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import type { BaseUIComponentProps } from '../utils/types';
import { FormContext } from './FormContext';
import { useRenderElement } from '../utils/useRenderElement';
import { EMPTY_OBJECT } from '../utils/constants';

/**
 * A native form element with consolidated error handling.
 * Renders a `<form>` element.
 *
 * Documentation: [Base UI Form](https://base-ui.com/react/components/form)
 */
export const Form = React.forwardRef(function Form(
  componentProps: Form.Props,
  forwardedRef: React.ForwardedRef<HTMLFormElement>,
) {
  const {
    render,
    className,
    validationMode = 'onSubmit',
    errors,
    onClearErrors,
    onSubmit,
    ...elementProps
  } = componentProps;

  const formRef = React.useRef<FormContext['formRef']['current']>({
    fields: new Map(),
  });
  const submittedRef = React.useRef(false);
  const submitAttemptedRef = React.useRef(false);

  const focusControl = useStableCallback((control: HTMLElement | null) => {
    if (!control) {
      return;
    }
    control.focus();
    if (control.tagName === 'INPUT') {
      (control as HTMLInputElement).select();
    }
  });

  React.useEffect(() => {
    if (!submittedRef.current) {
      return;
    }

    submittedRef.current = false;

    const invalidFields = Array.from(formRef.current.fields.values()).filter(
      (field) => field.validityData.state.valid === false,
    );

    if (invalidFields.length) {
      focusControl(invalidFields[0].controlRef.current);
    }
  }, [errors, focusControl]);

  const element = useRenderElement('form', componentProps, {
    ref: forwardedRef,
    props: [
      {
        noValidate: true,
        onSubmit(event) {
          submitAttemptedRef.current = true;

          let values = Array.from(formRef.current.fields.values());

          // Async validation isn't supported to stop the submit event.
          values.forEach((field) => {
            field.validate();
          });

          values = Array.from(formRef.current.fields.values());

          const invalidFields = values.filter((field) => !field.validityData.state.valid);

          if (invalidFields.length) {
            event.preventDefault();
            focusControl(invalidFields[0].controlRef.current);
          } else {
            submittedRef.current = true;
            onSubmit?.(event as any);
          }
        },
      },
      elementProps,
    ],
  });

  const clearErrors = useStableCallback((name: string | undefined) => {
    if (name && errors && EMPTY_OBJECT.hasOwnProperty.call(errors, name)) {
      const nextErrors = { ...errors };
      delete nextErrors[name];
      onClearErrors?.(nextErrors);
    }
  });

  const contextValue: FormContext = React.useMemo(
    () => ({
      formRef,
      validationMode,
      errors: errors ?? EMPTY_OBJECT,
      clearErrors,
      submitAttemptedRef,
    }),
    [formRef, validationMode, errors, clearErrors],
  );

  return <FormContext.Provider value={contextValue}>{element}</FormContext.Provider>;
});

export interface FormState {}

export interface FormProps extends BaseUIComponentProps<'form', Form.State> {
  /**
   * Determines when the form should be validated.
   * The `validationMode` prop on `<Field.Root>` takes precedence over this.
   *
   * - `onSubmit` (default): validates the field when the form is submitted, afterwards fields will re-validate on change.
   * - `onBlur`: validates a field when it loses focus.
   * - `onChange`: validates the field on every change to its value.
   *
   * @default 'onSubmit'
   */
  validationMode?: FormValidationMode;
  /**
   * An object where the keys correspond to the `name` attribute of the form fields,
   * and the values correspond to the error(s) related to that field.
   */
  errors?: FormContext['errors'];
  /**
   * Event handler called when the `errors` object is cleared.
   */
  onClearErrors?: (errors: FormContext['errors']) => void;
}

export type FormValidationMode = 'onSubmit' | 'onBlur' | 'onChange';

export namespace Form {
  export type Props = FormProps;
  export type State = FormState;
  export type ValidationMode = FormValidationMode;
}
