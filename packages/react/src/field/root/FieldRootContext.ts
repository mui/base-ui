'use client';
import * as React from 'react';
import { NOOP } from '../../utils/noop';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';
import type { FieldRoot, FieldValidityData } from './FieldRoot';

export interface FieldRootContext {
  invalid: boolean | undefined;
  /**
   * The `id` of the labelable element that corresponds to the `for` attribute of a `Field.Label`.
   * When `null` the association is implicit.
   */
  controlId: string | null | undefined;
  setControlId: React.Dispatch<React.SetStateAction<string | null | undefined>>;
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  messageIds: string[];
  setMessageIds: React.Dispatch<React.SetStateAction<string[]>>;
  name: string | undefined;
  validityData: FieldValidityData;
  setValidityData: React.Dispatch<React.SetStateAction<FieldValidityData>>;
  disabled: boolean | undefined;
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  dirty: boolean;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  filled: boolean;
  setFilled: React.Dispatch<React.SetStateAction<boolean>>;
  focused: boolean;
  setFocused: React.Dispatch<React.SetStateAction<boolean>>;
  validate: (
    value: unknown,
    formValues: Record<string, unknown>,
  ) => string | string[] | null | Promise<string | string[] | null>;
  validationMode: 'onBlur' | 'onChange';
  validationDebounceTime: number;
  state: FieldRoot.State;
  markedDirtyRef: React.MutableRefObject<boolean>;
}

export const FieldRootContext = React.createContext<FieldRootContext>({
  invalid: undefined,
  controlId: undefined,
  setControlId: NOOP,
  labelId: undefined,
  setLabelId: NOOP,
  messageIds: [],
  setMessageIds: NOOP,
  name: undefined,
  validityData: {
    state: DEFAULT_VALIDITY_STATE,
    errors: [],
    error: '',
    value: '',
    initialValue: null,
  },
  setValidityData: NOOP,
  disabled: undefined,
  touched: false,
  setTouched: NOOP,
  dirty: false,
  setDirty: NOOP,
  filled: false,
  setFilled: NOOP,
  focused: false,
  setFocused: NOOP,
  validate: () => null,
  validationMode: 'onBlur',
  validationDebounceTime: 0,
  state: {
    disabled: false,
    valid: null,
    touched: false,
    dirty: false,
    filled: false,
    focused: false,
  },
  markedDirtyRef: { current: false },
});

export function useFieldRootContext(optional = true) {
  const context = React.useContext(FieldRootContext);

  if (context.setControlId === NOOP && !optional) {
    throw new Error(
      'Base UI: FieldRootContext is missing. Field parts must be placed within <Field.Root>.',
    );
  }

  return context;
}
