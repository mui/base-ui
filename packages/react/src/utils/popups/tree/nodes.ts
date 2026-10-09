import { contains } from '@base-ui/utils/shadowDom';
import type { FloatingNodeType } from '../floating-root/types';

/* eslint-disable @typescript-eslint/no-loop-func */

export function getNodeChildren(
  nodes: Array<FloatingNodeType>,
  id: string | undefined,
  onlyOpenChildren = true,
): Array<FloatingNodeType> {
  const directChildren = nodes.filter((node) => node.parentId === id);

  return directChildren.flatMap((child) => [
    ...(!onlyOpenChildren || child.context?.open ? [child] : []),
    ...getNodeChildren(nodes, child.id, onlyOpenChildren),
  ]);
}

export function getNodeAncestors(nodes: Array<FloatingNodeType>, id: string | undefined) {
  let allAncestors: Array<FloatingNodeType> = [];
  let currentParentId = nodes.find((node) => node.id === id)?.parentId;

  while (currentParentId) {
    const currentNode = nodes.find((node) => node.id === currentParentId);
    currentParentId = currentNode?.parentId;

    if (currentNode) {
      allAncestors = allAncestors.concat(currentNode);
    }
  }

  return allAncestors;
}

/**
 * Returns the node with the given id.
 */
export function getNode(nodes: Array<FloatingNodeType>, id: string | null | undefined) {
  return nodes.find((node) => node.id === id);
}

/**
 * Whether any descendant of the node is open. See `getNodeChildren` for how descendants are found.
 */
export function hasOpenDescendant(nodes: Array<FloatingNodeType>, id: string | undefined) {
  return getNodeChildren(nodes, id).length > 0;
}

const BUBBLE_KEYS = {
  escapeKey: '__escapeKeyBubbles',
  outsidePress: '__outsidePressBubbles',
} as const;

/**
 * Whether an open descendant of the node keeps the given dismissal from bubbling up to it.
 */
export function hasBlockingChild(
  nodes: Array<FloatingNodeType>,
  id: string | undefined,
  dismissal: 'escapeKey' | 'outsidePress',
) {
  const bubbleKey = BUBBLE_KEYS[dismissal];
  return getNodeChildren(nodes, id).some(
    (child) => child.context?.open && !child.context.dataRef.current[bubbleKey],
  );
}

/**
 * Whether the floating element of a descendant of the node contains the target.
 *
 * @param onlyOpen Whether to consider only open descendants. See `getNodeChildren`.
 */
export function descendantContains(
  nodes: Array<FloatingNodeType>,
  id: string | undefined,
  target: Element | null | undefined,
  onlyOpen = true,
) {
  return getNodeChildren(nodes, id, onlyOpen).some((node) =>
    contains(node.context?.elements.floating, target),
  );
}

/**
 * Whether the floating element of any node in the tree contains the target.
 */
export function treeContains(nodes: Array<FloatingNodeType>, target: Element | null | undefined) {
  return nodes.some((node) => node.context && contains(node.context.elements.floating, target));
}
