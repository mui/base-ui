'use client';
import * as React from 'react';

export interface FieldsetRootContextValue {
  legendId: string | undefined;
  setLegendId: React.Dispatch<React.SetStateAction<string | undefined>>;
  disabled: boolean | undefined;
}

export const FieldsetRootContext = React.createContext<FieldsetRootContextValue>({
  legendId: undefined,
  setLegendId: () => {},
  disabled: undefined,
});

if (process.env.NODE_ENV !== 'production') {
  FieldsetRootContext.displayName = 'FieldsetRootContext';
}

export function useFieldsetRootContext() {
  return React.useContext(FieldsetRootContext);
}
