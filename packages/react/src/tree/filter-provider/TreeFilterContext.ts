'use client';
import * as React from 'react';
import { useTreeRootContext } from '../root/TreeRootContext';
import type { TreeFilterProvider } from './TreeFilterProvider';

export interface TreeFilterContext {
  value: string;
  onValueChange: (value: string, eventDetails: TreeFilterProvider.ChangeEventDetails) => void;
}

// The query reaches the input through React context rather than the store:
// the store syncs a commit later, which would move the caret of the controlled
// input on every keystroke.
export const TreeFilterContext = React.createContext<TreeFilterContext | null>(null);

/**
 * Returns the query and the filtering plugin of the tree a filter part renders
 * in, throwing when the tree is not wrapped in `Tree.FilterProvider`.
 */
export function useTreeFilterPart(part: string) {
  const store = useTreeRootContext();
  const context = React.useContext(TreeFilterContext);
  const filtering = store.filtering;
  if (context === null || filtering === undefined) {
    throw new Error(
      `Base UI: <Tree.${part}> must be placed in a tree wrapped in <Tree.FilterProvider>. ` +
        'It reads the filter query from the provider, which a plain tree does not have. ' +
        'Wrap the <Tree.Root> it belongs to in <Tree.FilterProvider>. ' +
        'See https://base-ui.com/react/components/tree#filtering',
    );
  }
  return { store, filtering, value: context.value, onValueChange: context.onValueChange };
}
