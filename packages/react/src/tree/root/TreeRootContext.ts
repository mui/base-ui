'use client';
import * as React from 'react';
import type { TreeStore } from '../store/TreeStore';

export const TreeRootContext = React.createContext<TreeStore<any, any> | undefined>(undefined);

export function useTreeRootContext(): TreeStore<any, any> {
  const context = React.useContext(TreeRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TreeRootContext is missing. ' +
        'The parts of a tree or tree grid read their state from its root and cannot render ' +
        'outside it. Place them within <Tree.Root> or <TreeGrid.Root>.',
    );
  }
  return context;
}
