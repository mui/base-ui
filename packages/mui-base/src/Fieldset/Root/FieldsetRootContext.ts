import * as React from 'react';

interface FieldsetRootContextValue {
  legendId: string | undefined;
  setLegendId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const FieldsetRootContext = React.createContext<FieldsetRootContextValue | null>(null);

export function useFieldsetRootContext() {
  const context = React.useContext(FieldsetRootContext);
  if (context === null) {
    throw new Error('Fieldset components must be used within <Fieldset.Root>');
  }
  return context;
}
