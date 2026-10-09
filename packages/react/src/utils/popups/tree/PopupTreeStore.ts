import type { PopupTreeNodeType, FloatingTreeEvents } from '../types';
import { createEventEmitter } from '../createEventEmitter';

/**
 * Stores and manages floating elements in a tree structure.
 * This is a backing store for the `PopupTree` component.
 */
export class PopupTreeStore {
  public readonly nodesRef: React.RefObject<Array<PopupTreeNodeType>> = { current: [] };

  public readonly events: FloatingTreeEvents = createEventEmitter();

  public addNode(node: PopupTreeNodeType) {
    this.nodesRef.current.push(node);
  }

  public removeNode(node: PopupTreeNodeType) {
    const index = this.nodesRef.current.findIndex((n) => n === node);
    if (index !== -1) {
      this.nodesRef.current.splice(index, 1);
    }
  }
}
