import { contains } from '@base-ui/utils/shadowDom';
import type { ExtendedElements, PopupInteractionContext } from '../types';
import { createEventEmitter } from '../createEventEmitter';
import type { EventEmitter } from '../createEventEmitter';

/**
 * The events shared by the popups of one popup tree.
 */
export interface PopupTreeEventMap {
  /**
   * A node opened on hover closed after the pointer left it, so its ancestors can close too.
   */
  nodeHoverClose: MouseEvent;
}

export type PopupTreeEvents = EventEmitter<PopupTreeEventMap>;

/**
 * What a popup tree member shares with the other members about its interactions.
 */
type PopupNodeInteraction = Pick<
  PopupInteractionContext,
  'orientation' | 'escapeKeyBubbles' | 'outsidePressBubbles'
>;

/**
 * What a popup tree member publishes about itself for the other members: whether it is open, its
 * elements, and the interaction fields the other members read. The node holds the member's
 * positioning context, written in a layout effect after the member renders, so a node the member
 * no longer updates keeps the last `open` and `elements`. The interaction fields are read from the
 * member's interaction store, which its interaction hooks update in place.
 */
export interface PopupNodeSnapshot {
  open: boolean;
  elements: Pick<ExtendedElements, 'floating' | 'domReference'>;
  rootStore: { context: PopupNodeInteraction };
}

export interface PopupNodeType {
  id: string | undefined;
  parentId: string | null;
  context?: PopupNodeSnapshot | undefined;
}

/**
 * Keeps the nodes of one popup tree, answers queries about them, and carries the tree's events.
 * `PopupTree` provides it to the popups rendered inside it.
 */
export class PopupTreeRegistry {
  /**
   * Every node registered in the tree, including members whose parent is in another family's tree.
   * Only `addNode` and `removeNode` change it.
   */
  public readonly nodes: Array<PopupNodeType> = [];

  public readonly events: PopupTreeEvents = createEventEmitter();

  public addNode(node: PopupNodeType) {
    this.nodes.push(node);
  }

  public removeNode(node: PopupNodeType) {
    const index = this.nodes.findIndex((n) => n === node);
    if (index !== -1) {
      this.nodes.splice(index, 1);
    }
  }

  /**
   * Returns the node with the given id.
   */
  public getNode(id: string | null | undefined) {
    return this.nodes.find((node) => node.id === id);
  }

  /**
   * Returns the descendants of a node, in tree order. With `onlyOpen`, closed descendants are left
   * out, but their own descendants are still searched.
   */
  public descendants(id: string | undefined, onlyOpen = true): Array<PopupNodeType> {
    return this.nodes
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
    const allAncestors: Array<PopupNodeType> = [];
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
   * Whether the popup of a descendant of a node contains the target.
   * @param includeClosed Whether closed descendants count too. Only open ones do by default.
   * @param includeTriggers Whether a descendant's trigger counts as well as its popup.
   */
  public descendantContains(
    id: string | undefined,
    target: Element | null | undefined,
    includeClosed = false,
    includeTriggers = false,
  ) {
    return this.descendants(id, !includeClosed).some(
      (node) =>
        contains(node.context?.elements.floating, target) ||
        (includeTriggers && contains(node.context?.elements.domReference, target)),
    );
  }
}
