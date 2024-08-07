import * as React from 'react';

export interface RadioGroupRootContextValue {
  disabled: boolean | undefined;
  checkedItem: string | null;
  setCheckedItem: React.Dispatch<React.SetStateAction<string | null>>;
}

export const RadioGroupRootContext = React.createContext<RadioGroupRootContextValue | null>(null);

export function useRadioGroupRootContext() {
  const value = React.useContext(RadioGroupRootContext);
  if (value === null) {
    throw new Error('RadioGroup components must be used within <RadioGroup.Root>');
  }
  return value;
}
