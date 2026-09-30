import type { FloatingNodeType } from '../types';
import { contains } from './element';

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
 * Determine whether element belongs to a currently open popup
 */
export function isElementInFloatingTree(element: Element, nodes: Array<FloatingNodeType>): boolean {
  return nodes.some((node) => {
    const context = node.context;
    if (!context?.open) {
      return false; // Ignore closed popups
    }

    const { domReference, floating } = context.elements;
    if (domReference && (domReference === element || contains(domReference, element))) {
      return true; // The popup's reference/trigger element
    }
    if (floating && (floating === element || contains(floating, element))) {
      return true; // The popup's content
    }

    // Other elements registered as opening this popup (e.g. detached/multiple triggers)
    return context.rootStore.context.triggerElements.hasMatchingElement(
      (trigger) => trigger === element || contains(trigger, element),
    );
  });
}
