'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { FieldRootContext } from './FieldRootContext';
import { DEFAULT_VALIDITY_STATE, fieldValidityMapping } from '../utils/constants';
import { useFieldsetRootContext } from '../../fieldset/root/FieldsetRootContext';
import { useFormContext } from '../../form/FormContext';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Groups all parts of the field.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export const FieldRoot = React.forwardRef(function FieldRoot(
  componentProps: FieldRoot.Props,
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
    ...elementProps
  } = componentProps;

  const { disabled: disabledFieldset } = useFieldsetRootContext();

  const { errors } = useFormContext();

  const validate = useEventCallback(validateProp || (() => null));

  const disabled = disabledFieldset || disabledProp;

  const [controlId, setControlId] = React.useState<string | null | undefined>(undefined);
  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);
  const [messageIds, setMessageIds] = React.useState<string[]>([]);

  const [touched, setTouched] = React.useState(false);
  const [dirty, setDirtyUnwrapped] = React.useState(false);
  const [filled, setFilled] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const markedDirtyRef = React.useRef(false);

  const setDirty: typeof setDirtyUnwrapped = React.useCallback((value) => {
    if (value) {
      markedDirtyRef.current = true;
    }
    setDirtyUnwrapped(value);
  }, []);

  const invalid = Boolean(
    invalidProp || (name && {}.hasOwnProperty.call(errors, name) && errors[name] !== undefined),
  );

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
      filled,
      focused,
    }),
    [disabled, touched, dirty, valid, filled, focused],
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
      filled,
      setFilled,
      focused,
      setFocused,
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
      filled,
      setFilled,
      focused,
      setFocused,
      validate,
      validationMode,
      validationDebounceTime,
      state,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping: fieldValidityMapping,
  });

  return <FieldRootContext.Provider value={contextValue}>{element}</FieldRootContext.Provider>;
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

export interface FieldRootState {
  /** Whether the component should ignore user interaction. */
  disabled: boolean;
  touched: boolean;
  dirty: boolean;
  valid: boolean | null;
  filled: boolean;
  focused: boolean;
}
export interface FieldRootProps extends BaseUIComponentProps<'div', FieldRoot.State> {
  disabled?: boolean;
  name?: string;
  validate?: (
    value: unknown,
    formValues: Record<string, unknown>,
  ) => string | string[] | null | Promise<string | string[] | null>;
  validationMode?: 'onBlur' | 'onChange';
  validationDebounceTime?: number;
  invalid?: boolean;
}

export namespace FieldRoot {
  export type State = FieldRootState;
  export type Props = FieldRootProps;
}
