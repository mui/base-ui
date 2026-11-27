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
        'This part reads its item from the item or row it renders in, and cannot render ' +
        'outside one. Place it within <Tree.Item> or <TreeGrid.Row>.',
    );
  }
  return context;
}
