import { describe, expect, it } from 'vitest';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
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
});
