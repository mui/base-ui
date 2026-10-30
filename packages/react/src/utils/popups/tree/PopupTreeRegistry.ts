import { contains } from '@base-ui/utils/shadowDom';
import type { BaseUIEventReason, REASONS } from '../../../internals/reasons';
import type { ExtendedElements, PopupInteractionContext } from '../types';
import { createEventEmitter } from '../createEventEmitter';
import type { EventEmitter } from '../createEventEmitter';

export interface PopupNodeOpenChangeDetails {
  /**
   * Identifies the component that opened or closed, so listeners can ignore the components they
   * don't coordinate with.
   */
  component: string;
  open: boolean;
  reason: BaseUIEventReason | null;
  nodeId: string | undefined;
  parentNodeId: string | null;
}

/**
 * The events shared by the popups of one popup tree.
 */
export interface PopupTreeEventMap {
  /**
   * A hover-opened popup closed after the pointer left it.
   */
  nodeHoverClose: MouseEvent;
  /**
   * A tree member opened or closed.
   */
  nodeOpenChange: PopupNodeOpenChangeDetails;
  /**
   * A menu item was hovered, so sibling submenus of other items can close.
   */
  nodeItemHover: { nodeId: string | undefined; target: Element | null };
  /**
   * A menu item was pressed, or a press that opened a menu was cancelled, so the open menus close.
   */
  treeClose: {
    domEvent: Event | undefined;
    reason: typeof REASONS.itemPress | typeof REASONS.cancelOpen;
  };
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
  public readonly nodesRef: React.RefObject<Array<PopupNodeType>> = { current: [] };

  public readonly events: PopupTreeEvents = createEventEmitter();

  public addNode(node: PopupNodeType) {
    this.nodesRef.current.push(node);
  }

  public removeNode(node: PopupNodeType) {
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
  public descendants(id: string | undefined, onlyOpen = true): Array<PopupNodeType> {
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
}
