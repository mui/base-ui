import * as React from 'react';
import { FieldRootContextValue } from './FieldRoot.types';

export const FieldRootContext = React.createContext<FieldRootContextValue>({
  controlId: undefined,
  setControlId: () => {},
  descriptionId: undefined,
  setDescriptionId: () => {},
});

export function useFieldRootContext() {
  return React.useContext(FieldRootContext);
}
