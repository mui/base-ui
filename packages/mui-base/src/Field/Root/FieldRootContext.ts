'use client';

import * as React from 'react';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';
import type { FieldRootOwnerState, FieldValidityData } from './FieldRoot.types';

export interface FieldRootContextValue {
  invalid: boolean | undefined;
  controlId: string | undefined;
  setControlId: React.Dispatch<React.SetStateAction<string | undefined>>;
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  messageIds: string[];
  setMessageIds: React.Dispatch<React.SetStateAction<string[]>>;
  validityData: FieldValidityData;
  setValidityData: React.Dispatch<React.SetStateAction<FieldValidityData>>;
  disabled: boolean | undefined;
  setDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  dirty: boolean;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  validate: (value: unknown) => string | string[] | null | Promise<string | string[] | null>;
  validateOnChange: boolean;
  validateDebounceTime: number;
  ownerState: FieldRootOwnerState;
  markedDirty: boolean;
}

export const FieldRootContext = React.createContext<FieldRootContextValue>({
  invalid: undefined,
  controlId: undefined,
  setControlId: () => {},
  labelId: undefined,
  setLabelId: () => {},
  messageIds: [],
  setMessageIds: () => {},
  validityData: {
    state: DEFAULT_VALIDITY_STATE,
    errors: [],
    error: '',
    value: '',
    initialValue: null,
  },
  setValidityData: () => {},
  disabled: undefined,
  touched: false,
  setTouched: () => {},
  dirty: false,
  setDirty: () => {},
  setDisabled: () => {},
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
});

if (process.env.NODE_ENV !== 'production') {
  FieldRootContext.displayName = 'FieldRootContext';
}

export function useFieldRootContext(optional = true) {
  const context = React.useContext(FieldRootContext);

  if (context === null && !optional) {
    throw new Error('Base UI: FieldRootContext is not defined.');
  }

  return context;
}
