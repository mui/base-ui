import * as React from 'react';

export interface TreeGroupTransitionContextValue {
  parentId: string;
  animation: 'expanding' | 'collapsing';
}

export const TreeGroupTransitionContext =
  React.createContext<TreeGroupTransitionContextValue | null>(null);
