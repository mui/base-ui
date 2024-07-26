import * as React from 'react';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';
import type { ValidityData } from './FieldRoot.types';

export interface FieldRootContextValue {
  name: string | undefined;
  controlId: string | undefined;
  setControlId: React.Dispatch<React.SetStateAction<string | undefined>>;
  messageIds: string[];
  setMessageIds: React.Dispatch<React.SetStateAction<string[]>>;
  validityData: ValidityData;
  setValidityData: React.Dispatch<React.SetStateAction<ValidityData>>;
  disabled: boolean | undefined;
  validate: (value: unknown) => string | null | Promise<string | null>;
}

export const FieldRootContext = React.createContext<FieldRootContextValue>({
  name: undefined,
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
  validate: () => null,
});

export function useFieldRootContext() {
  return React.useContext(FieldRootContext);
}
