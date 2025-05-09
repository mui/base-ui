'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../utils/types';
import { FormContext } from './FormContext';
import { useEventCallback } from '../utils/useEventCallback';
import { useRenderElement } from '../utils/useRenderElement';

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
    errors,
    onClearErrors: onClearErrorsProp,
    onSubmit: onSubmitProp,
    ...elementProps
  } = componentProps;

  const formRef = React.useRef<FormContext['formRef']['current']>({
    fields: new Map(),
  });
  const submittedRef = React.useRef(false);

  const onSubmit = useEventCallback(onSubmitProp);
  const onClearErrors = useEventCallback(onClearErrorsProp);

  const focusControl = useEventCallback((control: HTMLElement) => {
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

  const state = React.useMemo<Form.State>(() => ({}), []);

  const renderElement = useRenderElement('form', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        noValidate: true,
        onSubmit(event) {
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
            onSubmit(event as any);
          }
        },
      },
      elementProps,
    ],
  });

  const clearErrors = useEventCallback((name: string | undefined) => {
    if (name && errors && {}.hasOwnProperty.call(errors, name)) {
      const nextErrors = { ...errors };
      delete nextErrors[name];
      onClearErrors(nextErrors);
    }
  });

  const contextValue: FormContext = React.useMemo(
    () => ({
      formRef,
      errors: errors ?? {},
      clearErrors,
    }),
    [formRef, errors, clearErrors],
  );

  return <FormContext.Provider value={contextValue}>{renderElement()}</FormContext.Provider>;
});

export namespace Form {
  export interface Props extends BaseUIComponentProps<'form', State> {
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
  export interface State {}
}
