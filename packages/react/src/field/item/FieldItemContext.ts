import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export interface FieldItemContext {
  disabled: boolean;
}

export const FieldItemContext = React.createContext<FieldItemContext>({ disabled: false });

export function useFieldItemContext() {
  const context = useContext(FieldItemContext);

  return context;
}
