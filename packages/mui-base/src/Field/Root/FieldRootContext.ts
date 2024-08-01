'use client';
import * as React from 'react';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';
import type { ValidityData } from './FieldRoot.types';

export interface FieldRootContextValue {
  controlId: string | undefined;
  setControlId: React.Dispatch<React.SetStateAction<string | undefined>>;
  messageIds: string[];
  setMessageIds: React.Dispatch<React.SetStateAction<string[]>>;
  validityData: ValidityData;
  setValidityData: React.Dispatch<React.SetStateAction<ValidityData>>;
  disabled: boolean | undefined;
  setDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  validate: (value: unknown) => string | null | Promise<string | null>;
  validateOnChange: boolean;
  validateDebounceMs: number;
}

export const FieldRootContext = React.createContext<FieldRootContextValue>({
  controlId: undefined,
  setControlId: () => {},
  messageIds: [],
  setMessageIds: () => {},
  validityData: {
    state: DEFAULT_VALIDITY_STATE,
    message: '',
    value: '',
  },
  setValidityData: () => {},
  disabled: undefined,
  setDisabled: () => {},
  validate: () => null,
  validateOnChange: false,
  validateDebounceMs: 0,
});

export function useFieldRootContext() {
  return React.useContext(FieldRootContext);
}
