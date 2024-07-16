import * as React from 'react';
import { FieldRootContextValue } from './FieldRoot.types';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';

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
});

export function useFieldRootContext() {
  return React.useContext(FieldRootContext);
}
