'use client';
import * as React from 'react';
import type { TreeStore } from '../store/TreeStore';

export const TreeRootContext = React.createContext<TreeStore<any, any> | undefined>(undefined);

export function useTreeRootContext(): TreeStore<any, any> {
  const context = React.useContext(TreeRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TreeRootContext is missing. Tree parts must be placed within <Tree.Root>.',
    );
  }
  return context;
}
