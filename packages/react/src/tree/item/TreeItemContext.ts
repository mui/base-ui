'use client';
import * as React from 'react';
import type { TreeItemId } from '../store/types';

export const TreeItemContext = React.createContext<TreeItemId | undefined>(undefined);

export function useTreeItemContext(): TreeItemId {
  const context = React.useContext(TreeItemContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TreeItemContext is missing. Tree item parts must be placed within <Tree.Item>.',
    );
  }
  return context;
}
