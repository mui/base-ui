import { createEventEmitter } from '../../utils/popups/createEventEmitter';
import type { EventEmitter } from '../../utils/popups/createEventEmitter';
import type { PopupTreeRegistry } from '../../utils/popups/tree/PopupTreeRegistry';
import type { REASONS } from '../../internals/reasons';
import type { MenuRoot } from '../root/MenuRoot';

export interface MenuNodeOpenChangeDetails {
  open: boolean;
  reason: MenuRoot.ChangeEventReason | null;
  nodeId: string | undefined;
  parentNodeId: string | null;
}

/**
 * The events the menus of one popup tree share.
 */
export interface MenuTreeEventMap {
  /**
   * A menu opened or closed.
   */
  nodeOpenChange: MenuNodeOpenChangeDetails;
  /**
   * An item inside the menu `nodeId` was hovered, so submenus of its other items can close.
   * `target` is the hovered item.
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

export type MenuTreeEvents = EventEmitter<MenuTreeEventMap>;

const menuTreeEvents = new WeakMap<PopupTreeRegistry, MenuTreeEvents>();

/**
 * Returns the events the menus in the given popup tree share.
 */
export function getMenuTreeEvents(tree: PopupTreeRegistry): MenuTreeEvents {
  let events = menuTreeEvents.get(tree);
  if (!events) {
    events = createEventEmitter<MenuTreeEventMap>();
    menuTreeEvents.set(tree, events);
  }
  return events;
}
