import * as React from 'react';
import { throwMissingContextError } from '../../utils/errorHelper';

export interface SelectItemContext {
  selected: boolean;
  indexRef: React.RefObject<number>;
  textRef: React.RefObject<HTMLElement | null>;
}

export const SelectItemContext = React.createContext<SelectItemContext | undefined>(undefined);

export function useSelectItemContext() {
  const context = React.useContext(SelectItemContext);
  if (!context) {
    return throwMissingContextError('SelectItemContext', 'SelectItem', 'Select.Item');
  }
  return context;
}
