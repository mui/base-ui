'use client';
import * as React from 'react';

import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import type {
  PopupPositioningContext,
  FloatingNodeSnapshot,
  PopupTreeNodeType,
  PopupTreeType,
} from '../types';
import { PopupTreeStore } from './PopupTreeStore';

const PopupTreeNodeContext = React.createContext<PopupTreeNodeType | null>(null);
const PopupTreeContext = React.createContext<PopupTreeType | null>(null);

/**
 * Returns the parent node id for nested floating elements, if available.
 * Returns `null` for top-level floating elements.
 */
export const usePopupParentNodeId = (): string | null =>
  React.useContext(PopupTreeNodeContext)?.id || null;

/**
 * Returns the nearest floating tree context, if available.
 */
export const usePopupTree = (externalTree?: PopupTreeStore): PopupTreeType | null => {
  const contextTree = React.useContext(PopupTreeContext) as PopupTreeType | null;
  return externalTree ?? contextTree;
};

/**
 * Registers a node into the `PopupTree`, returning its id.
 * @see https://floating-ui.com/docs/PopupTree
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

/**
 * Attaches a tree member's snapshot to its registered node: whether it is open, its elements and
 * its interaction data. Written in a layout effect after every render, so it's a snapshot rather
 * than live state: a node the member stops updating keeps its last one.
 *
 * The member's Positioner calls it right after positioning, which supplies the values.
 *
 * @param nodeId The id of the member's node.
 * @param floatingContext The positioning context the snapshot is taken from.
 * @param externalTree The tree the node is registered in, instead of the one from context.
 * @param detachOnUnmount Whether the snapshot is dropped when the caller unmounts, so the node
 *   counts as absent again. For members whose Root keeps the node registered after their
 *   Positioner unmounts.
 */
export function useFloatingNodeSnapshot(
  nodeId: string | undefined,
  floatingContext: Pick<PopupPositioningContext, 'open' | 'elements' | 'dataRef'>,
  externalTree?: PopupTreeStore | null,
  detachOnUnmount = false,
) {
  const tree = usePopupTree(externalTree ?? undefined);
  const { open, elements, dataRef } = floatingContext;

  const snapshot = React.useMemo<FloatingNodeSnapshot>(
    () => ({ open, elements, dataRef }),
    [open, elements, dataRef],
  );

  useIsoLayoutEffect(() => {
    const node = tree?.getNode(nodeId);
    if (node) {
      node.context = snapshot;
    }
  });

  useIsoLayoutEffect(() => {
    if (!detachOnUnmount) {
      return undefined;
    }
    return () => {
      const node = tree?.getNode(nodeId);
      if (node) {
        node.context = undefined;
      }
    };
  }, [detachOnUnmount, tree, nodeId]);
}

export interface PopupTreeNodeProps {
  children?: React.ReactNode;
  id: string | undefined;
}

/**
 * Provides parent node context for nested floating elements.
 * @see https://floating-ui.com/docs/PopupTree
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
 * @see https://floating-ui.com/docs/PopupTree
 * @internal
 */
export function PopupTree(props: PopupTreeProps): React.JSX.Element {
  const { children, externalTree } = props;

  const tree = useRefWithInit(() => externalTree ?? new PopupTreeStore()).current;
  return <PopupTreeContext.Provider value={tree}>{children}</PopupTreeContext.Provider>;
}
