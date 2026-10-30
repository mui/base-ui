import { describe, expect, it } from 'vitest';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { PopupTreeRegistry } from '../../utils/popups/tree/PopupTreeRegistry';
import { MenuStore } from './MenuStore';

function createMountedMenuStore() {
  const store = new MenuStore();
  store.context.getCommittedOpenState = () => ({
    open: store.select('open'),
    activeTriggerElement: store.select('activeTriggerElement'),
    openChangeReason: store.state.openChangeReason,
  });
  return store;
}

describe('MenuStore', () => {
  describe('openEvent', () => {
    it('keeps the event of a click open when a hover open follows', () => {
      const store = createMountedMenuStore();
      const mousedown = new MouseEvent('mousedown');

      store.setOpen(true, createChangeEventDetails(REASONS.triggerPress, mousedown));
      expect(store.context.openEvent).toBe(mousedown);

      store.setOpen(
        true,
        createChangeEventDetails(REASONS.triggerHover, new MouseEvent('mouseenter')),
      );

      expect(store.context.openEvent).toBe(mousedown);
    });

    it('clears the event when the menu closes', () => {
      const store = createMountedMenuStore();

      store.setOpen(
        true,
        createChangeEventDetails(REASONS.triggerPress, new MouseEvent('mousedown')),
      );
      store.setOpen(
        false,
        createChangeEventDetails(REASONS.escapeKey, new KeyboardEvent('keydown')),
      );

      expect(store.context.openEvent).toBe(undefined);
    });
  });

  describe('lastOpenChangeEvent', () => {
    it('records the event of the latest open change', () => {
      const store = createMountedMenuStore();
      const mouseenter = new MouseEvent('mouseenter');

      store.setOpen(
        true,
        createChangeEventDetails(REASONS.triggerPress, new MouseEvent('mousedown')),
      );
      store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, mouseenter));

      expect(store.context.lastOpenChangeEvent).toBe(mouseenter);
    });
  });

  describe('registerTreeNode', () => {
    it("registers one node in the menu's own tree, under the node the Root renders in", () => {
      const store = new MenuStore({ popupParentNodeId: 'outer' });

      store.registerTreeNode('menu');

      expect(store.state.ownTree.getNode('menu')?.parentId).toBe('outer');
    });

    it("moves the same node to the active trigger's location and back when the trigger is gone", () => {
      const store = new MenuStore({ popupParentNodeId: null });
      const popoverTree = new PopupTreeRegistry();
      store.registerTreeNode('menu');
      const node = store.state.ownTree.getNode('menu');
      expect(node).not.toBe(undefined);

      store.update({
        triggerTreeLocation: { tree: popoverTree, parentNodeId: 'popover' },
        activeTriggerElement: document.createElement('button'),
      });

      expect(popoverTree.getNode('menu')).toBe(node);
      expect(node?.parentId).toBe('popover');
      expect(store.state.ownTree.getNode('menu')).toBe(undefined);

      store.set('activeTriggerElement', null);

      expect(store.state.ownTree.getNode('menu')).toBe(node);
      expect(node?.parentId).toBe(null);
      expect(popoverTree.getNode('menu')).toBe(undefined);
    });

    it("keeps the trigger's missing parent instead of the Root's", () => {
      const store = new MenuStore({ popupParentNodeId: 'outer' });
      const triggerTree = new PopupTreeRegistry();
      store.update({
        triggerTreeLocation: { tree: triggerTree, parentNodeId: null },
        activeTriggerElement: document.createElement('button'),
      });

      store.registerTreeNode('menu');

      expect(triggerTree.getNode('menu')?.parentId).toBe(null);
    });

    it('updates the parent in place when the active trigger moves within the same tree', () => {
      const store = new MenuStore();
      const popoverTree = new PopupTreeRegistry();
      store.update({
        triggerTreeLocation: { tree: popoverTree, parentNodeId: 'popover-1' },
        activeTriggerElement: document.createElement('button'),
      });
      store.registerTreeNode('menu');
      const node = popoverTree.getNode('menu');
      expect(node?.parentId).toBe('popover-1');

      store.set('triggerTreeLocation', { tree: popoverTree, parentNodeId: 'popover-2' });

      expect(popoverTree.getNode('menu')).toBe(node);
      expect(node?.parentId).toBe('popover-2');
      expect(popoverTree.descendants('popover-1', false)).toEqual([]);
    });

    it("places a submenu in its parent menu's tree and follows that tree", () => {
      const parentStore = new MenuStore();
      const store = new MenuStore({
        parent: { type: 'menu', store: parentStore },
        popupParentNodeId: 'parent-menu',
      });
      store.subscribeToParentMenu();
      store.registerTreeNode('submenu');
      expect(parentStore.state.ownTree.getNode('submenu')?.parentId).toBe('parent-menu');

      const popoverTree = new PopupTreeRegistry();
      parentStore.update({
        triggerTreeLocation: { tree: popoverTree, parentNodeId: 'popover' },
        activeTriggerElement: document.createElement('button'),
      });

      expect(popoverTree.getNode('submenu')?.parentId).toBe('parent-menu');
      expect(parentStore.state.ownTree.getNode('submenu')).toBe(undefined);
    });

    it('removes the node and stops following the location once unregistered', () => {
      const store = new MenuStore();
      const popoverTree = new PopupTreeRegistry();
      const unregister = store.registerTreeNode('menu');
      expect(store.state.ownTree.getNode('menu')).not.toBe(undefined);

      unregister();
      store.update({
        triggerTreeLocation: { tree: popoverTree, parentNodeId: 'popover' },
        activeTriggerElement: document.createElement('button'),
      });

      expect(store.state.ownTree.getNode('menu')).toBe(undefined);
      expect(popoverTree.getNode('menu')).toBe(undefined);
    });
  });
});
