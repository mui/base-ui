import { describe, expect, it, vi } from 'vitest';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { DialogRoot } from '../root/DialogRoot';
import { DialogStore } from './DialogStore';

function createOpenStore() {
  const trigger = document.createElement('button');
  const store = new DialogStore<unknown>(
    { open: true, mounted: true, activeTriggerId: 'trigger', activeTriggerElement: trigger },
    undefined,
    false,
  );
  const onOpenChange = vi.fn<(open: boolean, details: DialogRoot.ChangeEventDetails) => void>();
  store.context.onOpenChange = onOpenChange;
  return { store, trigger, onOpenChange };
}

describe('DialogStore', () => {
  describe('setOpen', () => {
    it('reports the active trigger for any close', () => {
      const { store, trigger, onOpenChange } = createOpenStore();

      store.setOpen(false, createChangeEventDetails(REASONS.escapeKey));

      expect(onOpenChange.mock.calls[0][1].trigger).toBe(trigger);
    });

    it('keeps the popup mounted only for an accepted close', () => {
      const { store, onOpenChange } = createOpenStore();
      onOpenChange.mockImplementationOnce((_open, details) => {
        details.preventUnmountOnClose();
        details.cancel();
      });

      store.setOpen(false, createChangeEventDetails(REASONS.escapeKey));
      expect(store.state.open).toBe(true);
      expect(store.state.preventUnmountingOnClose).toBe(false);

      onOpenChange.mockImplementationOnce((_open, details) => {
        details.preventUnmountOnClose();
      });
      store.setOpen(false, createChangeEventDetails(REASONS.escapeKey));
      expect(store.state.open).toBe(false);
      expect(store.state.preventUnmountingOnClose).toBe(true);
    });
  });
});
