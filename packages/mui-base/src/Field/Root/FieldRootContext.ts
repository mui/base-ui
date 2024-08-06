'use client';
import * as React from 'react';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';
import type { ValidityData } from './FieldRoot.types';

export interface FieldRootContextValue {
  invalid: boolean;
  controlId: string | undefined;
  setControlId: React.Dispatch<React.SetStateAction<string | undefined>>;
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  messageIds: string[];
  setMessageIds: React.Dispatch<React.SetStateAction<string[]>>;
  validityData: ValidityData;
  setValidityData: React.Dispatch<React.SetStateAction<ValidityData>>;
  disabled: boolean | undefined;
  setDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  touched: boolean;
  setTouched: React.Dispatch<React.SetStateAction<boolean>>;
  dirty: boolean;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  validate: (value: unknown) => string | string[] | null | Promise<string | string[] | null>;
  validateOnChange: boolean;
  validateOnMount: boolean;
  validateDebounceTime: number;
}

export const FieldRootContext = React.createContext<FieldRootContextValue>({
  invalid: false,
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
  validateOnMount: false,
  validateDebounceTime: 0,
});

if (process.env.NODE_ENV !== 'production') {
  FieldRootContext.displayName = 'FieldRootContext';
}

export function useFieldRootContext() {
  return React.useContext(FieldRootContext);
}
