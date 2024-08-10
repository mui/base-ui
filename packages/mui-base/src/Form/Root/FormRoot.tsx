import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { FormRootContext } from './FormRootContext';
import { useEventCallback } from '../../utils/useEventCallback';

const FormRoot = React.forwardRef(function FormRoot(
  props: FormRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLFormElement>,
) {
  const {
    render,
    className,
    errors,
    nativeValidate = false,
    onClearErrors: onClearErrorsProp,
    onSubmit: onSubmitProp,
    ...otherProps
  } = props;

  const formRef = React.useRef<FormRootContext.Value['formRef']['current']>({
    fields: new Map(),
  });

  const onSubmit = useEventCallback(onSubmitProp || (() => {}));
  const onClearErrors = useEventCallback(onClearErrorsProp || (() => {}));

  const getFormProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'form'>(externalProps, {
        noValidate: !nativeValidate,
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
            onSubmit(event as any);
          }
        },
      }),
    [onSubmit, nativeValidate],
  );

  React.useEffect(() => {
    const invalidFields = Array.from(formRef.current.fields.values()).filter(
      (field) => field.validityData.state.valid === false,
    );

    if (invalidFields.length) {
      invalidFields[0]?.controlRef.current?.focus();
    }
  }, [errors]);

  const ownerState = React.useMemo<FormRoot.OwnerState>(() => ({}), []);

  const { renderElement } = useComponentRenderer({
    propGetter: getFormProps,
    render: render ?? 'form',
    ref: forwardedRef,
    ownerState,
    className,
    extraProps: otherProps,
  });

  const contextValue: FormRootContext.Value = React.useMemo(
    () => ({ formRef, errors: errors ?? {}, onClearErrors }),
    [formRef, errors, onClearErrors],
  );

  return (
    <FormRootContext.Provider value={contextValue}>{renderElement()}</FormRootContext.Provider>
  );
});

FormRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Controlled error messages, usually from server-side validation.
   */
  errors: PropTypes.object,
  /**
   * If `true`, the form will use native HTML validation, showing browser-native popup messages.
   * @default false
   */
  nativeValidate: PropTypes.bool,
  /**
   * Callback fired when controlled messages should be cleared.
   */
  onClearErrors: PropTypes.func,
  /**
   * @ignore
   */
  onSubmit: PropTypes.func,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { FormRoot };

namespace FormRoot {
  export interface Props extends BaseUIComponentProps<'form', OwnerState> {
    /**
     * If `true`, the form will use native HTML validation, showing browser-native popup messages.
     * @default false
     */
    nativeValidate?: boolean;
    /**
     * Object of error messages with each key mapping to the `name` prop of a Field control, usually
     * from server-side validation.
     */
    errors?: FormRootContext.Value['errors'];
    /**
     * Callback fired when the external server-side `error` messages should be cleared.
     */
    onClearErrors?: FormRootContext.Value['onClearErrors'];
  }
  export interface OwnerState {}
}
