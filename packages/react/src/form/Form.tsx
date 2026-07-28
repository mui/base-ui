'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import {
  createGenericEventDetails,
  type BaseUIGenericEventDetails,
} from '../internals/createBaseUIEventDetails';
import { REASONS } from '../internals/reasons';
import type { BaseUIComponentProps } from '../internals/types';
import { FormContext } from '../internals/form-context/FormContext';
import { useRenderElement } from '../internals/useRenderElement';
import { useValueChanged } from '../internals/useValueChanged';

/**
 * A native form element with consolidated error handling.
 * Renders a `<form>` element.
 *
 * Documentation: [Base UI Form](https://base-ui.com/react/components/form)
 */
export const Form = React.forwardRef(function Form<
  FormValues extends Record<string, any> = Record<string, any>,
>(componentProps: Form.Props<FormValues>, forwardedRef: React.ForwardedRef<HTMLFormElement>) {
  const {
    render,
    className,
    validationMode = 'onSubmit',
    errors: externalErrors,
    onSubmit,
    onFormSubmit,
    actionsRef,
    style,
    ...elementProps
  } = componentProps;

  const formRef = React.useRef<FormContext['formRef']['current']>({
    fields: new Map(),
  });
  const elementRef = React.useRef<HTMLFormElement>(null);
  const submittedRef = React.useRef(false);
  const submitAttemptedRef = React.useRef(false);

  const focusFirstInvalid = useStableCallback(() => {
    // A field can be invalid without a focusable control (for example a checkbox group whose
    // custom validation failed while every checkbox is unmounted, disabled, or reassociated).
    // Keep submission blocked, but move focus to the first invalid field that has a usable control.
    // Registration order can diverge from DOM order (keyed fields reordered without
    // remounting, portals), so pick the first control by document position. For controls
    // in disconnected trees (e.g. separate shadow roots), where document position is
    // implementation-specific, keep registration order.
    let hasInvalid = false;
    let firstControl: HTMLElement | null = null;
    for (const field of formRef.current.fields.values()) {
      if (field.validityData.state.valid !== false) {
        continue;
      }
      hasInvalid = true;
      const control = field.controlRef.current;
      if (control && (!firstControl || comesBeforeInSameTree(control, firstControl))) {
        firstControl = control;
      }
    }
    if (firstControl) {
      firstControl.focus();
      if (firstControl.tagName === 'INPUT') {
        (firstControl as HTMLInputElement).select();
      }
      return true;
    }
    return hasInvalid;
  });

  const [errors, setErrors] = React.useState(externalErrors);

  useValueChanged(externalErrors, () => {
    setErrors(externalErrors);
  });

  React.useEffect(() => {
    if (!submittedRef.current) {
      return;
    }

    submittedRef.current = false;
    focusFirstInvalid();
  }, [errors, focusFirstInvalid]);

  React.useImperativeHandle(
    actionsRef,
    () => ({
      validate(fieldName?: string) {
        if (fieldName) {
          Array.from(formRef.current.fields.values())
            .find((field) => field.name === fieldName)
            ?.validate();
        } else {
          formRef.current.fields.forEach((field) => {
            field.validate();
          });
        }
      },
    }),
    [],
  );

  const element = useRenderElement('form', componentProps, {
    ref: [forwardedRef, elementRef],
    props: [
      {
        noValidate: true,
        onSubmit(event) {
          submitAttemptedRef.current = true;

          // Async validation isn't supported to stop the submit event.
          formRef.current.fields.forEach((field) => {
            field.validate();
          });

          if (focusFirstInvalid()) {
            event.preventDefault();
            return;
          }

          submittedRef.current = true;
          onSubmit?.(event as any);

          if (onFormSubmit) {
            event.preventDefault();

            const formValues = {} as FormValues;
            formRef.current.fields.forEach((field) => {
              if (field.name) {
                (formValues as Record<string, any>)[field.name] = field.getValue();
              }
            });

            onFormSubmit(formValues, createGenericEventDetails(REASONS.none, event.nativeEvent));
          }
        },
      },
      elementProps,
    ],
  });

  const clearErrors = useStableCallback((name: string | undefined) => {
    if (name && errors && Object.hasOwn(errors, name)) {
      const nextErrors = { ...errors };
      delete nextErrors[name];
      setErrors(nextErrors);
    }
  });

  const contextValue: FormContext = React.useMemo(
    () => ({
      elementRef,
      formRef,
      validationMode,
      errors: errors ?? EMPTY_OBJECT,
      clearErrors,
      submitAttemptedRef,
    }),
    [formRef, validationMode, errors, clearErrors],
  );

  return <FormContext.Provider value={contextValue}>{element}</FormContext.Provider>;
}) as {
  <FormValues extends Record<string, any> = Record<string, any>>(
    props: Form.Props<FormValues> & {
      ref?: React.Ref<HTMLFormElement> | undefined;
    },
  ): React.JSX.Element;
};

export type FormSubmitEventReason = typeof REASONS.none;
export type FormSubmitEventDetails = BaseUIGenericEventDetails<Form.SubmitEventReason>;

export type FormValidationMode = 'onSubmit' | 'onBlur' | 'onChange';

export interface FormActions {
  validate: (fieldName?: string | undefined) => void;
}

export interface FormState {}

export interface FormProps<
  FormValues extends Record<string, any> = Record<string, any>,
> extends BaseUIComponentProps<'form', FormState, React.ComponentPropsWithRef<'form'>> {
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
  validationMode?: FormValidationMode | undefined;
  /**
   * Validation errors returned externally, typically after submission by a server or a form action.
   * This should be an object where keys correspond to the `name` attribute on `<Field.Root>`,
   * and values correspond to error(s) related to that field.
   */
  errors?: FormContext['errors'] | undefined;
  /**
   * Event handler called when the form is submitted.
   * `preventDefault()` is called on the native submit event when used.
   */
  onFormSubmit?:
    | ((formValues: FormValues, eventDetails: Form.SubmitEventDetails) => void)
    | undefined;
  /**
   * A ref to imperative actions.
   * - `validate`: Validates all fields when called. Optionally pass a field name to validate a single field.
   * @example
   * ```tsx
   * // validate all fields
   * actionsRef.current?.validate();
   *
   * // validate one field
   * actionsRef.current?.validate('email');
   * ```
   */
  actionsRef?: React.RefObject<Form.Actions | null> | undefined;
}

export namespace Form {
  export type Props<FormValues extends Record<string, any> = Record<string, any>> =
    FormProps<FormValues>;
  export type State = FormState;
  export type Actions = FormActions;
  export type ValidationMode = FormValidationMode;
  export type SubmitEventReason = FormSubmitEventReason;
  export type SubmitEventDetails = FormSubmitEventDetails;

  export type Values<FormValues extends Record<string, any> = Record<string, any>> = FormValues;
}

/* eslint-disable no-bitwise */
function comesBeforeInSameTree(element: Node, reference: Node) {
  const position = element.compareDocumentPosition(reference);
  return (
    (position & Node.DOCUMENT_POSITION_DISCONNECTED) === 0 &&
    (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
  );
}
