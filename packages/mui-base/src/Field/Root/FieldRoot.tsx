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

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping: STYLE_HOOK_MAPPING,
  });

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
    }),
    [name, controlId, messageIds, validityData, disabled, validate],
  );

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
   * The field's name, used to identify the field in the form.
   */
  name: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Function to custom-validate the field's value.
   */
  validate: PropTypes.func,
} as any;

export { FieldRoot };
