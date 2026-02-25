'use client';
import { NOOP } from '@base-ui/utils/empty';
import * as React from 'react';

export interface FieldsetRootContext {
  legendId: string | undefined;
  setLegendId: React.Dispatch<React.SetStateAction<string | undefined>>;
  disabled: boolean | undefined;
}

export const FieldsetRootContext = React.createContext<FieldsetRootContext>({
  legendId: undefined,
  setLegendId: NOOP,
  disabled: undefined,
});

export function useFieldsetRootContext(optional: true): FieldsetRootContext | undefined;
export function useFieldsetRootContext(optional?: false): FieldsetRootContext;
export function useFieldsetRootContext(optional = false) {
  const context = React.useContext(FieldsetRootContext);
  if (!context && !optional) {
    throw new Error(
      'Base UI: FieldsetRootContext is missing. Fieldset parts must be placed within <Fieldset.Root>.',
    );
  }
  return context;
}
