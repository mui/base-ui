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

export function useTreeCheckboxItemContext(): TreeCheckboxItemContext {
  const context = React.useContext(TreeCheckboxItemContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TreeCheckboxItemContext is missing. ' +
        '<Tree.CheckboxItemIndicator> reads the checked state of <Tree.CheckboxItem> and cannot ' +
        'render outside it. Place it within <Tree.CheckboxItem>, or, in a tree grid, render ' +
        '<TreeGrid.RowCheckboxIndicator> inside <TreeGrid.RowCheckbox>.',
    );
  }
  return context;
}
