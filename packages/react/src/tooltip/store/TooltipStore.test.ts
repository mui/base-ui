import { describe, expect, it, vi } from 'vitest';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { TooltipStore } from './TooltipStore';

describe('TooltipStore', () => {
  describe('setOpen', () => {
    it('ends the exit without reporting another close when a sibling tooltip opens', () => {
      const store = new TooltipStore<unknown>(
        { open: false, mounted: true, openChangeReason: REASONS.triggerHover },
        undefined,
        false,
      );
      const onOpenChange = vi.fn();
      store.context.onOpenChange = onOpenChange;

      store.setOpen(false, createChangeEventDetails(REASONS.none));

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(store.state.openChangeReason).toBe(REASONS.none);
    });
  });

  describe('cancelPendingOpen', () => {
    it('clears a pending hover open without closing anything', () => {
      const store = new TooltipStore<unknown>({}, undefined, false);
      const onOpenChange = vi.fn();
      const handleInternalOpenChange = vi.fn();
      store.context.onOpenChange = onOpenChange;
      const floatingRootContext = store.state.floatingRootContext;
      floatingRootContext.context.events.on('openchange', handleInternalOpenChange);

      store.cancelPendingOpen(new MouseEvent('click'));

      expect(handleInternalOpenChange.mock.calls.length).toBe(1);
      expect(handleInternalOpenChange.mock.calls[0][0].open).toBe(false);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(floatingRootContext.closeRequest).toBe(undefined);
    });
  });
});
