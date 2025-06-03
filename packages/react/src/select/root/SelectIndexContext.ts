import * as React from 'react';
import { throwMissingContextError } from '../../utils/errorHelper';

export interface SelectIndexContext {
  activeIndex: number | null;
  setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
  selectedIndex: number | null;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

export const SelectIndexContext = React.createContext<SelectIndexContext | undefined>(undefined);

export function useSelectIndexContext() {
  const context = React.useContext(SelectIndexContext);
  if (context === undefined) {
    return throwMissingContextError('SelectIndexContext', 'Select', 'Select.Root');
  }
  return context;
}
