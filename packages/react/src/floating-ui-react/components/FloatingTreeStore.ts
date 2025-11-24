import type { ReferenceType, FloatingNodeType, FloatingEvents } from '../types';
import { createEventEmitter } from '../utils/createEventEmitter';

/**
 * Stores and manages floating elements in a tree structure.
 * This is a backing store for the `FloatingTree` component.
 */
export class FloatingTreeStore<RT extends ReferenceType = ReferenceType> {
  public readonly nodesRef: React.RefObject<Array<FloatingNodeType<RT>>> = { current: [] };

  public readonly events: FloatingEvents = createEventEmitter();

  public addNode(node: FloatingNodeType<RT>) {
    this.nodesRef.current.push(node);
  }

  public removeNode(node: FloatingNodeType<RT>) {
    const index = this.nodesRef.current.findIndex((n) => n === node);
    if (index !== -1) {
      this.nodesRef.current.splice(index, 1);
    }
  }
}
