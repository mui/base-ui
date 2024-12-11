'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { FieldRootContext } from './FieldRootContext';
import { DEFAULT_VALIDITY_STATE, STYLE_HOOK_MAPPING } from '../utils/constants';
import { useFieldsetRootContext } from '../../fieldset/root/FieldsetRootContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { useFormContext } from '../../form/FormContext';
import { BaseUIComponentProps } from '../../utils/types';

/**
 * Groups all parts of the field.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
const FieldRoot = React.forwardRef(function FieldRoot(
  props: FieldRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    validate: validateProp,
    validationDebounceTime = 0,
    validationMode = 'onBlur',
    name,
    disabled: disabledProp = false,
    invalid: invalidProp,
    ...otherProps
  } = props;

  const { disabled: disabledFieldset } = useFieldsetRootContext();

  const { errors } = useFormContext();

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

  const state: FieldRoot.State = React.useMemo(
    () => ({
      disabled,
      touched,
      dirty,
      valid,
    }),
    [disabled, touched, dirty, valid],
  );

  const contextValue: FieldRootContext = React.useMemo(
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
      validationMode,
      validationDebounceTime,
      state,
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
      validationMode,
      validationDebounceTime,
      state,
    ],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    state,
    extraProps: otherProps,
    customStyleHookMapping: STYLE_HOOK_MAPPING,
  });

  return (
    <FieldRootContext.Provider value={contextValue}>{renderElement()}</FieldRootContext.Provider>
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

namespace FieldRoot {
  export interface State {
    disabled: boolean;
    touched: boolean;
    dirty: boolean;
    valid: boolean | null;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the field is disabled. Takes precedence over the `disabled` prop of the `Field.Control`
     * component.
     * @default false
     */
    disabled?: boolean;
    /**
     * The field's name. Takes precedence over the `name` prop of the `Field.Control` component.
     */
    name?: string;
    /**
     * Function to custom-validate the field's value. Return a string or array of strings with error
     * messages if the value is invalid, or `null` if the value is valid. The function can also return
     * a promise that resolves to a string, array of strings, or `null`.
     */
    validate?: (value: unknown) => string | string[] | null | Promise<string | string[] | null>;
    /**
     * Determines when validation should be triggered.
     * @default 'onBlur'
     */
    validationMode?: 'onBlur' | 'onChange';
    /**
     * The debounce time in milliseconds for the `validate` function in `onChange` phase.
     * @default 0
     */
    validationDebounceTime?: number;
    /**
     * Determines if the field is forcefully marked as invalid.
     */
    invalid?: boolean;
  }
}

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
   * The debounce time in milliseconds for the `validate` function in `onChange` phase.
   * @default 0
   */
  validationDebounceTime: PropTypes.number,
  /**
   * Determines when validation should be triggered.
   * @default 'onBlur'
   */
  validationMode: PropTypes.oneOf(['onBlur', 'onChange']),
} as any;

export { FieldRoot };
