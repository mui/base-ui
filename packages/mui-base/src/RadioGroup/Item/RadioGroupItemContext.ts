import * as React from 'react';

export interface RadioGroupItemContextValue {
  disabled: boolean;
  checked: boolean;
}

export const RadioGroupItemContext = React.createContext<RadioGroupItemContextValue | null>(null);

export function useRadioGroupItemContext() {
  const value = React.useContext(RadioGroupItemContext);
  if (value === null) {
    throw new Error('RadioGroupIndicator component must be used within <RadioGroup.Item>');
  }
  return value;
}
