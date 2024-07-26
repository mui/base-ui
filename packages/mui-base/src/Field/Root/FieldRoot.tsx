'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldRootOwnerState, ValidityData, FieldRootProps } from './FieldRoot.types';
import { FieldRootContext, type FieldRootContextValue } from './FieldRootContext';
import { DEFAULT_VALIDITY_STATE, STYLE_HOOK_MAPPING } from '../utils/constants';
import { useFieldsetRootContext } from '../../Fieldset/Root/FieldsetRootContext';
import { useEventCallback } from '../../utils/useEventCallback';

/**
 * The foundation for building custom-styled fields.
 *
 * Demos:
 *
 * - [Field](https://mui.com/base-ui/react-field/)
 *
 * API:
 *
 * - [FieldRoot API](https://mui.com/base-ui/react-field/components-api/#field-root)
 */
const FieldRoot = React.forwardRef(function FieldRoot(
  props: FieldRootProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    name,
    disabled: disabledProp = false,
    validate: validateProp,
    validationDebounceMs = 500,
    validateOnChange = false,
    ...otherProps
  } = props;

  const { disabled: disabledFieldset } = useFieldsetRootContext();

  const disabled = disabledFieldset ?? disabledProp;

  const validate = useEventCallback(validateProp || (() => null));

  const [controlId, setControlId] = React.useState<string | undefined>(undefined);
  const [messageIds, setMessageIds] = React.useState<string[]>([]);
  const [validityData, setValidityData] = React.useState<ValidityData>({
    state: DEFAULT_VALIDITY_STATE,
    message: '',
    value: '',
  });

  const ownerState: FieldRootOwnerState = React.useMemo(
    () => ({
      disabled,
      valid: validityData.state.valid,
    }),
    [disabled, validityData.state.valid],
  );

  const contextValue: FieldRootContextValue = React.useMemo(
    () => ({
      name,
      controlId,
      setControlId,
      messageIds,
      setMessageIds,
      validityData,
      setValidityData,
      disabled,
      validate,
      validateOnChange,
      validationDebounceMs,
    }),
    [
      name,
      controlId,
      messageIds,
      validityData,
      disabled,
      validate,
      validateOnChange,
      validationDebounceMs,
    ],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping: STYLE_HOOK_MAPPING,
  });

  return (
    <FieldRootContext.Provider value={contextValue}>{renderElement()}</FieldRootContext.Provider>
  );
});

FieldRoot.propTypes /* remove-proptypes */ = {
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
   * Whether the field is disabled, adding a disabled style hook to all subcomponents as well as
   * disabling the interactive control inside.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * The field's name, used to identify the field's control in the form.
   */
  name: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Function to custom-validate the field's value. Return a string with an error message if the
   * value is invalid, or `null` if the value is valid. The function can also return a promise that
   * resolves to a string or `null`.
   */
  validate: PropTypes.func,
  /**
   * Determines if the validation should be triggered on the `change` event, rather than only on
   * commit (blur).
   * @default false
   */
  validateOnChange: PropTypes.bool,
  /**
   * The debounce time in milliseconds for the validation function for the `change` phase.
   * @default 500
   */
  validationDebounceMs: PropTypes.number,
} as any;

export { FieldRoot };
