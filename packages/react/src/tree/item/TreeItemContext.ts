'use client';
import * as React from 'react';
import type { TreeItemId } from '../store/types';

export interface TreeItemContextValue {
  itemId: TreeItemId;
}

export const TreeItemContext = React.createContext<TreeItemContextValue | undefined>(undefined);

export function useTreeItemContext(): TreeItemContextValue {
  const context = React.useContext(TreeItemContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TreeItemContext is missing. Tree item parts must be placed within <Tree.Item>.',
    );
  }
  return context;
}

export function useTreeItemContextOptional(): TreeItemContextValue | undefined {
  return React.useContext(TreeItemContext);
}
