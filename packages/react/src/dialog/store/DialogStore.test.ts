import { describe, expect, it, vi } from 'vitest';
import { DialogStore } from './DialogStore';

describe('DialogStore', () => {
  it('preserves root configuration when resetting a detached handle store', () => {
    const store = new DialogStore({
      modal: 'trap-focus',
      disablePointerDismissal: true,
      nested: true,
      role: 'alertdialog',
      open: true,
      mounted: true,
    });
    const floatingRootContext = store.state.floatingRootContext;
    const onOpenChange = vi.fn();

    store.context.onOpenChange = onOpenChange;
    store.update({
      activeTriggerId: 'trigger',
      activeTriggerElement: document.createElement('button'),
      popupElement: document.createElement('div'),
      payload: 'payload',
    });

    store.reset();

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(store.state.open).toBe(false);
    expect(store.state.mounted).toBe(false);
    expect(store.state.modal).toBe('trap-focus');
    expect(store.state.disablePointerDismissal).toBe(true);
    expect(store.state.nested).toBe(true);
    expect(store.state.role).toBe('alertdialog');
    expect(store.state.floatingRootContext).toBe(floatingRootContext);
    expect(store.state.activeTriggerId).toBe(null);
    expect(store.state.activeTriggerElement).toBe(null);
    expect(store.state.popupElement).toBe(null);
    expect(store.state.payload).toBe(undefined);
  });
});
