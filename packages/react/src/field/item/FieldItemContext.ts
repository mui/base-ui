'use client';
import * as React from 'react';

export interface FieldItemContext {
  disabled: boolean;
}

export const DEFAULT_FIELD_ITEM_CONTEXT: FieldItemContext = { disabled: false };

export const FieldItemContext = React.createContext<FieldItemContext>(DEFAULT_FIELD_ITEM_CONTEXT);

export function useFieldItemContext() {
  const context = React.useContext(FieldItemContext);

  return context;
}
