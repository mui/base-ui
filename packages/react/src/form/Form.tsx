'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../utils/types';
import { useComponentRenderer } from '../utils/useComponentRenderer';
import { mergeReactProps } from '../utils/mergeReactProps';
import { FormContext } from './FormContext';
import { useEventCallback } from '../utils/useEventCallback';

/**
 * A native form element with consolidated error handling.
 * Renders a `<form>` element.
 *
 * Documentation: [Base UI Form](https://base-ui.com/react/components/form)
 */
const Form = React.forwardRef(function Form(
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
      mergeReactProps<'form'>(externalProps, {
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
      }),
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

namespace Form {
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

Form.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * An object where the keys correspond to the `name` attribute of the form fields,
   * and the values correspond to the error(s) related to that field.
   */
  errors: PropTypes.object,
  /**
   * Event handler called when the `errors` object is cleared.
   */
  onClearErrors: PropTypes.func,
  /**
   * @ignore
   */
  onSubmit: PropTypes.func,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { Form };
