import * as React from 'react';

export const RadioRootContext = React.createContext<RadioRootContext.Value | null>(null);

export function useRadioRootContext() {
  const value = React.useContext(RadioRootContext);
  if (value === null) {
    throw new Error('Base UI: <Radio.Indicator> must be used within <Radio.Root>');
  }
  return value;
}

export namespace RadioRootContext {
  export interface Value {
    disabled: boolean;
    readOnly: boolean;
    checked: boolean;
    required: boolean;
  }
}
