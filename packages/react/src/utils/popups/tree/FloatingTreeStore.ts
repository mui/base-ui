import { contains } from '@base-ui/utils/shadowDom';
import type { FloatingNodeType, FloatingTreeEvents } from '../types';
import { createEventEmitter } from '../createEventEmitter';

/**
 * Stores and manages floating elements in a tree structure.
 * This is a backing store for the `FloatingTree` component.
 */
export class FloatingTreeStore {
  public readonly nodesRef: React.RefObject<Array<FloatingNodeType>> = { current: [] };

  public readonly events: FloatingTreeEvents = createEventEmitter();

  public addNode(node: FloatingNodeType) {
    this.nodesRef.current.push(node);
  }

  public removeNode(node: FloatingNodeType) {
    const index = this.nodesRef.current.findIndex((n) => n === node);
    if (index !== -1) {
      this.nodesRef.current.splice(index, 1);
    }
  }

  /**
   * Returns the node with the given id.
   */
  public getNode(id: string | null | undefined) {
    return this.nodesRef.current.find((node) => node.id === id);
  }

  /**
   * Returns the descendants of a node, in tree order. With `onlyOpen`, closed descendants are left
   * out, but their own descendants are still searched.
   */
  public descendants(id: string | undefined, onlyOpen = true): Array<FloatingNodeType> {
    return this.nodesRef.current
      .filter((node) => node.parentId === id)
      .flatMap((child) => [
        ...(!onlyOpen || child.context?.open ? [child] : []),
        ...this.descendants(child.id, onlyOpen),
      ]);
  }

  /**
   * Returns the ancestors of a node, nearest first.
   */
  public ancestors(id: string | undefined) {
    const allAncestors: Array<FloatingNodeType> = [];
    let currentParentId = this.getNode(id)?.parentId;

    while (currentParentId) {
      const currentNode = this.getNode(currentParentId);
      currentParentId = currentNode?.parentId;

      if (currentNode) {
        allAncestors.push(currentNode);
      }
    }

    return allAncestors;
  }

  /**
   * Whether an open descendant of a node keeps the dismissal its `bubbleKey` names from bubbling up
   * to it.
   */
  public hasBlockingChild(
    id: string | undefined,
    bubbleKey: 'escapeKeyBubbles' | 'outsidePressBubbles',
  ) {
    return this.descendants(id).some((child) => !child.context!.rootStore.context[bubbleKey]);
  }

  /**
   * Whether the floating element of a descendant of a node contains the target.
   */
  public descendantContains(
    id: string | undefined,
    target: Element | null | undefined,
    onlyOpen = true,
  ) {
    return this.descendants(id, onlyOpen).some((node) =>
      contains(node.context?.elements.floating, target),
    );
  }

  /**
   * Whether the floating element of any node in the tree contains the target.
   */
  public contains(target: Element | null | undefined) {
    return this.nodesRef.current.some(
      (node) => node.context && contains(node.context.elements.floating, target),
    );
  }
}
