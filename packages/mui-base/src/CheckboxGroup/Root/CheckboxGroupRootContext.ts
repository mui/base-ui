import * as React from 'react';
import { CheckboxGroupRootContextValue } from './CheckboxGroupRoot.types';

export const CheckboxGroupRootContext = React.createContext<CheckboxGroupRootContextValue | null>(
  null,
);

export function useCheckboxGroupRootContext() {
  const context = React.useContext(CheckboxGroupRootContext);
  if (context === null) {
    throw new Error('<CheckboxGroup.Label> must be used within <CheckboxGroup.Root>');
  }
  return context;
}

export function useLooseCheckboxGroupRootContext() {
  const context = React.useContext(CheckboxGroupRootContext);
  return context;
}
