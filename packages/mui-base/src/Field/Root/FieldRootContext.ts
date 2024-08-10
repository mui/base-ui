'use client';
import * as React from 'react';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';
import type { FieldRootOwnerState, FieldValidityData } from './FieldRoot.types';

const NOOP = () => {};

export interface FieldRootContextValue {
  invalid: boolean | undefined;
  controlId: string | undefined;
  setControlId: React.Dispatch<React.SetStateAction<string | undefined>>;
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
  validate: (value: unknown) => string | string[] | null | Promise<string | string[] | null>;
  validateOnChange: boolean;
  validateDebounceTime: number;
  ownerState: FieldRootOwnerState;
  markedDirty: boolean;
  setMarkedDirty: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FieldRootContext = React.createContext<FieldRootContextValue>({
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
  validate: () => null,
  validateOnChange: false,
  validateDebounceTime: 0,
  ownerState: {
    disabled: false,
    valid: null,
    touched: false,
    dirty: false,
  },
  markedDirty: false,
  setMarkedDirty: NOOP,
});

if (process.env.NODE_ENV !== 'production') {
  FieldRootContext.displayName = 'FieldRootContext';
}

export function useFieldRootContext(optional = true) {
  const context = React.useContext(FieldRootContext);

  if (context.setControlId === NOOP && !optional) {
    throw new Error('Base UI: Field components must be placed within <Field.Root>.');
  }

  return context;
}
