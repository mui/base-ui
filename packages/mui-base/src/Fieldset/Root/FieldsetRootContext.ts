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

export function useFieldsetRootContext() {
  return React.useContext(FieldsetRootContext);
}
