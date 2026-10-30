'use client';
import * as React from 'react';

import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { PopupTreeRegistry } from './PopupTreeRegistry';

const PopupTreeNodeContext = React.createContext<string | undefined>(undefined);
const PopupTreeContext = React.createContext<PopupTreeRegistry | null>(null);

/**
 * Returns the parent node id for nested floating elements, if available.
 * Returns `null` for top-level floating elements.
 */
export const usePopupParentNodeId = (): string | null =>
  React.useContext(PopupTreeNodeContext) || null;

/**
 * Returns the nearest popup tree, if available.
 */
export const usePopupTree = (): PopupTreeRegistry | null => React.useContext(PopupTreeContext);

/**
 * Registers a node into the `PopupTree`, returning its id.
 * @see https://floating-ui.com/docs/FloatingTree
 */
export function usePopupNodeId(): string | undefined {
  const id = useId();
  useRegisterPopupNode(id);
  return id;
}

/**
 * Registers a node with the given id into the `PopupTree`, under the node this hook renders in.
 */
export function useRegisterPopupNode(id: string | undefined): void {
  const tree = usePopupTree();
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
  return <PopupTreeNodeContext.Provider value={id}>{children}</PopupTreeNodeContext.Provider>;
}

export interface PopupTreeProps {
  children?: React.ReactNode;
  externalTree?: PopupTreeRegistry | undefined;
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

  const ownTree = useRefWithInit(() => new PopupTreeRegistry()).current;
  const tree = externalTree ?? ownTree;
  return <PopupTreeContext.Provider value={tree}>{children}</PopupTreeContext.Provider>;
}
