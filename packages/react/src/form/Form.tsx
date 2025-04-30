'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../utils/types';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { mergeProps } from '../merge-props';
import { FormContext } from './FormContext';
import { useEventCallback } from '../utils/useEventCallback';

/**
 * A native form element with consolidated error handling.
 * Renders a `<form>` element.
 *
 * Documentation: [Base UI Form](https://base-ui.com/react/components/form)
 */
export const Form = React.forwardRef(function Form(
  props: Form.Props,
  forwardedRef: React.ForwardedRef<HTMLFormElement>,
) {
  const {
    render,
    className,
    errors,
    onClearErrors: onClearErrorsProp,
    onSubmit: onSubmitProp,
    ...otherProps
  } = props;

  const formRef = React.useRef<FormContext['formRef']['current']>({
    fields: new Map(),
  });
  const submittedRef = React.useRef(false);

  const onSubmit = useEventCallback(onSubmitProp);
  const onClearErrors = useEventCallback(onClearErrorsProp);

  const getFormProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'form'>(
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
              invalidFields[0]?.controlRef.current?.focus();
            } else {
              submittedRef.current = true;
              onSubmit(event as any);
            }
          },
        },
        externalProps,
      ),
    [onSubmit],
  );

  React.useEffect(() => {
    if (!submittedRef.current) {
      return;
    }

    submittedRef.current = false;

    const invalidFields = Array.from(formRef.current.fields.values()).filter(
      (field) => field.validityData.state.valid === false,
    );

    if (invalidFields.length) {
      invalidFields[0]?.controlRef.current?.focus();
    }
  }, [errors]);

  const state = React.useMemo<Form.State>(() => ({}), []);

  const { renderElement } = useComponentRenderer({
    propGetter: getFormProps,
    render: render ?? 'form',
    ref: forwardedRef,
    state,
    className,
    extraProps: otherProps,
  });

  const contextValue: FormContext = React.useMemo(
    () => ({ formRef, errors: errors ?? {}, onClearErrors }),
    [formRef, errors, onClearErrors],
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
    onClearErrors?: FormContext['onClearErrors'];
  }
  export interface State {}
}
