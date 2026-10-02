import { describe, expect, it, vi } from 'vitest';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { PopoverRoot } from '../root/PopoverRoot';
import { PopoverStore } from './PopoverStore';

function createOpenStore() {
  const trigger = document.createElement('button');
  const store = new PopoverStore<unknown>(
    { open: true, mounted: true, activeTriggerId: 'trigger', activeTriggerElement: trigger },
    undefined,
    false,
  );
  store.context.triggerElements.add('trigger', trigger);
  const onOpenChange = vi.fn<(open: boolean, details: PopoverRoot.ChangeEventDetails) => void>();
  store.context.onOpenChange = onOpenChange;
  return { store, trigger, onOpenChange };
}

describe('PopoverStore', () => {
  describe('setOpen', () => {
    it('reports the active trigger only for a close button press', () => {
      const closePress = createOpenStore();
      closePress.store.setOpen(false, createChangeEventDetails(REASONS.closePress));
      expect(closePress.onOpenChange.mock.calls[0][1].trigger).toBe(closePress.trigger);

      const escape = createOpenStore();
      escape.store.setOpen(false, createChangeEventDetails(REASONS.escapeKey));
      expect(escape.onOpenChange.mock.calls[0][1].trigger).toBe(undefined);
    });

    it('maps the change reason to instantType', () => {
      const escape = createOpenStore();
      escape.store.setOpen(false, createChangeEventDetails(REASONS.escapeKey));
      expect(escape.store.state.instantType).toBe('dismiss');

      const keyboardPress = createOpenStore();
      keyboardPress.store.setOpen(
        false,
        createChangeEventDetails(REASONS.triggerPress, new MouseEvent('click', { detail: 0 })),
      );
      expect(keyboardPress.store.state.instantType).toBe('click');

      const focusOut = createOpenStore();
      focusOut.store.setOpen(false, createChangeEventDetails(REASONS.focusOut));
      expect(focusOut.store.state.instantType).toBe('focus');

      const outsidePress = createOpenStore();
      outsidePress.store.set('instantType', 'dismiss');
      outsidePress.store.setOpen(false, createChangeEventDetails(REASONS.outsidePress));
      expect(outsidePress.store.state.instantType).toBe(undefined);
    });

    it('lets a hover open stick until a patient click', () => {
      const { store } = createOpenStore();
      store.set('stickIfOpen', false);

      store.setOpen(true, createChangeEventDetails(REASONS.triggerHover));

      expect(store.state.stickIfOpen).toBe(true);
      store.context.stickIfOpenTimeout.clear();
    });
  });
});
