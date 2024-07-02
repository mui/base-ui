'use client';
import * as React from 'react';
import { SelectOption } from '../useOption';
import { CompoundParentContextValue } from '../../useCompound';
import type { SelectAction, SelectInternalState } from './useSelect.types';

export interface SelectContext<Value> {
  state: SelectInternalState<Value>;
  dispatch: React.Dispatch<SelectAction<Value>>;
  compoundParentContext: CompoundParentContextValue<Value, SelectOption<Value>>;
  keyExtractor: (option: SelectOption<Value>) => any;
}

export const SelectContext = React.createContext<SelectContext<any> | undefined>(undefined);

export function useSelectContext<Value>(): SelectContext<Value> {
  return React.useContext(SelectContext) as SelectContext<Value>;
}
