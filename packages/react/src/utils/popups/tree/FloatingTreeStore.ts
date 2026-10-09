import type { FloatingNodeType, FloatingTreeEvents } from '../floating-root/types';
import { createEventEmitter } from '../floating-root/createEventEmitter';
import {
  descendantContains,
  getNode,
  getNodeAncestors,
  getNodeChildren,
  hasBlockingChild,
  hasOpenDescendant,
  treeContains,
} from './nodes';

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
    return getNode(this.nodesRef.current, id);
  }

  /**
   * Returns the descendants of a node, in tree order. With `onlyOpen`, closed descendants are left
   * out, but their own descendants are still searched.
   */
  public descendants(id: string | undefined, onlyOpen = true) {
    return getNodeChildren(this.nodesRef.current, id, onlyOpen);
  }

  /**
   * Returns the ancestors of a node, nearest first.
   */
  public ancestors(id: string | undefined) {
    return getNodeAncestors(this.nodesRef.current, id);
  }

  /**
   * Whether any descendant of a node is open.
   */
  public hasOpenDescendant(id: string | undefined) {
    return hasOpenDescendant(this.nodesRef.current, id);
  }

  /**
   * Whether an open descendant of a node keeps the given dismissal from bubbling up to it.
   */
  public hasBlockingChild(id: string | undefined, dismissal: 'escapeKey' | 'outsidePress') {
    return hasBlockingChild(this.nodesRef.current, id, dismissal);
  }

  /**
   * Whether the floating element of a descendant of a node contains the target.
   */
  public descendantContains(
    id: string | undefined,
    target: Element | null | undefined,
    onlyOpen = true,
  ) {
    return descendantContains(this.nodesRef.current, id, target, onlyOpen);
  }

  /**
   * Whether the floating element of any node in the tree contains the target.
   */
  public contains(target: Element | null | undefined) {
    return treeContains(this.nodesRef.current, target);
  }
}
