'use client';
import * as React from 'react';
import type { SwipeDirection } from '../../utils/useSwipeDismiss';

export type DrawerSwipeDirection = SwipeDirection;

export interface DrawerRootContext {
  swipeDirection: DrawerSwipeDirection;
  /**
   * The measured height of the frontmost open drawer within the current nested drawer stack.
   */
  frontmostHeight: number;
  /**
   * Called by the drawer popup to report its own measured height.
   */
  onPopupHeightChange: (height: number) => void;
  /**
   * Called by a nested drawer to report the frontmost height of its own stack.
   */
  onNestedFrontmostHeightChange: (height: number) => void;
  /**
   * Provided to nested drawers so they can report their frontmost height to the parent drawer.
   */
  notifyParentFrontmostHeight?: (height: number) => void;
}

export const DrawerRootContext = React.createContext<DrawerRootContext | undefined>(undefined);

export function useDrawerRootContext(optional?: false): DrawerRootContext;
export function useDrawerRootContext(optional: true): DrawerRootContext | undefined;
export function useDrawerRootContext(optional?: boolean) {
  const drawerRootContext = React.useContext(DrawerRootContext);

  if (optional === false && drawerRootContext === undefined) {
    throw new Error(
      'Base UI: DrawerRootContext is missing. Drawer parts must be placed within <Drawer.Root>.',
    );
  }

  return drawerRootContext;
}
