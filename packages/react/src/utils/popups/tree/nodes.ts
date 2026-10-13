import type { PopupTreeNodeType } from '../interaction-store/types';

/* eslint-disable @typescript-eslint/no-loop-func */

export function getNodeChildren(
  nodes: Array<PopupTreeNodeType>,
  id: string | undefined,
  onlyOpenChildren = true,
): Array<PopupTreeNodeType> {
  const directChildren = nodes.filter((node) => node.parentId === id);

  return directChildren.flatMap((child) => [
    ...(!onlyOpenChildren || child.context?.open ? [child] : []),
    ...getNodeChildren(nodes, child.id, onlyOpenChildren),
  ]);
}

export function getNodeAncestors(nodes: Array<PopupTreeNodeType>, id: string | undefined) {
  let allAncestors: Array<PopupTreeNodeType> = [];
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
