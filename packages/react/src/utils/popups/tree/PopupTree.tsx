'use client';
import * as React from 'react';

import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { PopupTreeStore } from './PopupTreeStore';
import type { PopupNodeType } from './PopupTreeStore';

const PopupTreeNodeContext = React.createContext<PopupNodeType | null>(null);
const PopupTreeContext = React.createContext<PopupTreeStore | null>(null);

/**
 * Returns the parent node id for nested floating elements, if available.
 * Returns `null` for top-level floating elements.
 */
export const usePopupParentNodeId = (): string | null =>
  React.useContext(PopupTreeNodeContext)?.id || null;

/**
 * Returns the nearest popup tree, if available.
 */
export const usePopupTree = (externalTree?: PopupTreeStore): PopupTreeStore | null => {
  const contextTree = React.useContext(PopupTreeContext);
  return externalTree ?? contextTree;
};

/**
 * Registers a node into the `PopupTree`, returning its id.
 * @see https://floating-ui.com/docs/FloatingTree
 */
export function usePopupNodeId(externalTree?: PopupTreeStore): string | undefined {
  const id = useId();
  const tree = usePopupTree(externalTree);
  const parentId = usePopupParentNodeId();

  useIsoLayoutEffect(() => {
    if (!id) {
      return undefined;
    }

    const node = { id, parentId };
    tree?.addNode(node);
    return () => {
      tree?.removeNode(node);
    };
  }, [tree, id, parentId]);

  return id;
}

export interface PopupTreeNodeProps {
  children?: React.ReactNode;
  id: string | undefined;
}

/**
 * Provides parent node context for nested floating elements.
 * @see https://floating-ui.com/docs/FloatingTree
 * @internal
 */
export function PopupTreeNode(props: PopupTreeNodeProps): React.JSX.Element {
  const { children, id } = props;

  const parentId = usePopupParentNodeId();

  return (
    <PopupTreeNodeContext.Provider value={React.useMemo(() => ({ id, parentId }), [id, parentId])}>
      {children}
    </PopupTreeNodeContext.Provider>
  );
}

export interface PopupTreeProps {
  children?: React.ReactNode;
  externalTree?: PopupTreeStore | undefined;
}

/**
 * Provides context for nested floating elements when they are not children of
 * each other on the DOM.
 * This is not necessary in all cases, except when there must be explicit communication between parent and child floating elements. It is necessary for:
 * - The `bubbles` option in the `useDismiss()` Hook
 * - Nested virtual list navigation
 * - Nested floating elements that each open on hover
 * - Custom communication between parent and child floating elements
 * @see https://floating-ui.com/docs/FloatingTree
 * @internal
 */
export function PopupTree(props: PopupTreeProps): React.JSX.Element {
  const { children, externalTree } = props;

  const tree = useRefWithInit(() => externalTree ?? new PopupTreeStore()).current;
  return <PopupTreeContext.Provider value={tree}>{children}</PopupTreeContext.Provider>;
}
