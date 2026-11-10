'use client';
import * as React from 'react';
import type { TreeItemId } from '../store/types';

/** The item of the row a part renders in. */
export const TreeItemContext = React.createContext<TreeItemId | undefined>(undefined);

export function useTreeItemContext(): TreeItemId {
  const context = React.useContext(TreeItemContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TreeItemContext is missing. ' +
        'Tree item parts read their item from <Tree.Item> and cannot render outside it. ' +
        'Place Tree item parts within <Tree.Item>.',
    );
  }
  return context;
}
