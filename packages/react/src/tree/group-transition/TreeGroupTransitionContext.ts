'use client';
import * as React from 'react';
import type { TreeItemId } from '../store/types';

export interface TreeGroupTransitionAnimation {
  parentId: TreeItemId;
  animation: 'expanding' | 'collapsing';
  /**
   * The tree items currently animating in or out, rendered by the list.
   * `Tree.GroupTransition` renders them inside its own element.
   */
  children: React.ReactNode;
}

/**
 * Provided by the list around each row: the row's item ID while its group
 * is not animating (a primitive, so idle rows never see a new context value), or
 * the animating group.
 */
export type TreeGroupTransitionContextValue = TreeItemId | TreeGroupTransitionAnimation;

export const TreeGroupTransitionContext =
  React.createContext<TreeGroupTransitionContextValue | null>(null);
