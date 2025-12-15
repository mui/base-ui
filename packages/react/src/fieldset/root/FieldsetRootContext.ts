'use client';
import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

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

export function useFieldsetRootContext(optional: true): FieldsetRootContext | undefined;
export function useFieldsetRootContext(optional?: false): FieldsetRootContext;
export function useFieldsetRootContext(optional = false) {
  const context = useContext(FieldsetRootContext);
  if (!context && !optional) {
    throw new Error(
      'Base UI: FieldsetRootContext is missing. Fieldset parts must be placed within <Fieldset.Root>.',
    );
  }
  return context;
}
