'use client';
import * as React from 'react';

export interface FieldsetRootContext {
  legendId: string | undefined;
  setLegendId: React.Dispatch<React.SetStateAction<string | undefined>>;
  disabled: boolean | undefined;
}

export const FieldsetRootContext = React.createContext<FieldsetRootContext>({
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
