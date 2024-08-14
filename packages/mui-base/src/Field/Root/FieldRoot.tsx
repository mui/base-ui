'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { FieldRootOwnerState, FieldValidityData, FieldRootProps } from './FieldRoot.types';
import { FieldRootContext, type FieldRootContextValue } from './FieldRootContext';
import { DEFAULT_VALIDITY_STATE, STYLE_HOOK_MAPPING } from '../utils/constants';
import { useFieldsetRootContext } from '../../Fieldset/Root/FieldsetRootContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { useFormRootContext } from '../../Form/Root/FormRootContext';

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
    validate: validateProp,
    validateDebounceTime = 0,
    validateOnChange = false,
    name,
    disabled: disabledProp = false,
    invalid: invalidProp,
    ...otherProps
  } = props;

  const { disabled: disabledFieldset } = useFieldsetRootContext();

  const { errors } = useFormRootContext();

  const validate = useEventCallback(validateProp || (() => null));

  const disabled = disabledFieldset || disabledProp;

  const [controlId, setControlId] = React.useState<string | undefined>(undefined);
  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);
  const [messageIds, setMessageIds] = React.useState<string[]>([]);

  const [touched, setTouched] = React.useState(false);
  const [dirty, setDirtyUnwrapped] = React.useState(false);

  const markedDirtyRef = React.useRef(false);

  const setDirty: typeof setDirtyUnwrapped = React.useCallback((value) => {
    if (value) {
      markedDirtyRef.current = true;
    }
    setDirtyUnwrapped(value);
  }, []);

  const invalid = Boolean(invalidProp || (name && {}.hasOwnProperty.call(errors, name)));

  const [validityData, setValidityData] = React.useState<FieldValidityData>({
    state: DEFAULT_VALIDITY_STATE,
    error: '',
    errors: [],
    value: null,
    initialValue: null,
  });

  const valid = !invalid && validityData.state.valid;

  const ownerState: FieldRootOwnerState = React.useMemo(
    () => ({
      disabled,
      touched,
      dirty,
      valid,
    }),
    [disabled, touched, dirty, valid],
  );

  const contextValue: FieldRootContextValue = React.useMemo(
    () => ({
      invalid,
      controlId,
      setControlId,
      labelId,
      setLabelId,
      messageIds,
      setMessageIds,
      name,
      validityData,
      setValidityData,
      disabled,
      touched,
      setTouched,
      dirty,
      setDirty,
      validate,
      validateOnChange,
      validateDebounceTime,
      ownerState,
      markedDirtyRef,
    }),
    [
      invalid,
      controlId,
      labelId,
      messageIds,
      name,
      validityData,
      disabled,
      touched,
      dirty,
      setDirty,
      validate,
      validateOnChange,
      validateDebounceTime,
      ownerState,
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
   * Whether the field is disabled. Takes precedence over the `disabled` prop of the `Field.Control`
   * component.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Determines if the field is forcefully marked as invalid.
   */
  invalid: PropTypes.bool,
  /**
   * The field's name. Takes precedence over the `name` prop of the `Field.Control` component.
   */
  name: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Function to custom-validate the field's value. Return a string or array of strings with error
   * messages if the value is invalid, or `null` if the value is valid. The function can also return
   * a promise that resolves to a string, array of strings, or `null`.
   */
  validate: PropTypes.func,
  /**
   * The debounce time in milliseconds for the `validate` function in the `change` phase.
   * @default 0
   */
  validateDebounceTime: PropTypes.number,
  /**
   * Determines if validation should be triggered on the `change` event, rather than only on commit
   * (blur).
   * @default false
   */
  validateOnChange: PropTypes.bool,
} as any;

export { FieldRoot };
