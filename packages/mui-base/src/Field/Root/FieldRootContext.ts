import * as React from 'react';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';
import { ValidityData } from './FieldRoot.types';

export interface FieldRootContextValue {
  controlId: string | undefined;
  setControlId: React.Dispatch<React.SetStateAction<string | undefined>>;
  messageIds: string[];
  setMessageIds: React.Dispatch<React.SetStateAction<string[]>>;
  validityData: ValidityData;
  setValidityData: React.Dispatch<React.SetStateAction<ValidityData>>;
  disabled: boolean;
}

export const FieldRootContext = React.createContext<FieldRootContextValue>({
  controlId: undefined,
  setControlId: () => {},
  messageIds: [],
  setMessageIds: () => {},
  validityData: {
    validityState: DEFAULT_VALIDITY_STATE,
    validityMessage: '',
    value: '',
  },
  setValidityData: () => {},
  disabled: false,
});

export function useFieldRootContext() {
  return React.useContext(FieldRootContext);
}
