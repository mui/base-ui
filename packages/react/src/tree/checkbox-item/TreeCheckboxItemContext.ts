'use client';
import * as React from 'react';

export interface TreeCheckboxItemContext {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
}

export const TreeCheckboxItemContext = React.createContext<TreeCheckboxItemContext | undefined>(
  undefined,
);

export function useTreeCheckboxItemContext() {
  const context = React.useContext(TreeCheckboxItemContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TreeCheckboxItemContext is missing. Tree checkbox item parts must be placed within <Tree.CheckboxItem>.',
    );
  }

  return context;
}
