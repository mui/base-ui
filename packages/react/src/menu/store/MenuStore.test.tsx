import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { createRenderer } from '#test-utils';
import { MenuStore } from './MenuStore';

// A leaked subscription is otherwise behaviorally invisible, so the regression tests below assert
// against the parent store's internal listener set directly.
function subscriberCount(store: MenuStore<unknown>) {
  return (store as unknown as { listeners: Set<unknown> }).listeners.size;
}

describe('MenuStore', () => {
  // `createRenderer` renders under StrictMode (the repo default), which mounts → unmounts →
  // remounts effects. The parent-subscription lifecycle must survive that remount.
  const { render } = createRenderer();

  describe('parent store subscription', () => {
    it('tears down the previous parent subscription when the parent changes', () => {
      const parent = new MenuStore<unknown>({ rootId: 'root-1' });
      const child = new MenuStore<unknown>({});

      const baseline = subscriberCount(parent);

      const childListener = vi.fn();
      child.subscribe(childListener);

      child.set('parent', { type: 'menu', store: parent });
      expect(subscriberCount(parent)).toBe(baseline + 1);

      // Parent updates propagate to the child while attached.
      childListener.mockClear();
      parent.set('rootId', 'root-2');
      expect(childListener).toHaveBeenCalledTimes(1);

      // Detaching the parent removes the subscription instead of clobbering or leaking it.
      child.set('parent', { type: undefined });
      expect(subscriberCount(parent)).toBe(baseline);

      // Later parent updates no longer reach the detached child.
      childListener.mockClear();
      parent.set('rootId', 'root-3');
      expect(childListener).not.toHaveBeenCalled();
    });

    it('stays subscribed to its parent under StrictMode and removes it on unmount', async () => {
      const parent = new MenuStore<unknown>({ rootId: 'root-1' });
      const baseline = subscriberCount(parent);

      function Probe() {
        MenuStore.useStore(undefined, { parent: { type: 'menu', store: parent } });
        return null;
      }

      const { unmount } = await render(<Probe />);
      // StrictMode mounts, unmounts, then remounts the effect. The subscription must be re-armed on
      // the remount rather than left severed by the simulated unmount's cleanup.
      expect(subscriberCount(parent)).toBe(baseline + 1);

      unmount();
      expect(subscriberCount(parent)).toBe(baseline);
    });

    it('re-arms the internal store subscription when the handle prop toggles', async () => {
      const parent = new MenuStore<unknown>({ rootId: 'root-1' });
      const externalStore = new MenuStore<unknown>({});
      const baseline = subscriberCount(parent);

      function Probe({ handle }: { handle: MenuStore<unknown> | undefined }) {
        MenuStore.useStore(handle, { parent: { type: 'menu', store: parent } });
        return null;
      }

      const { rerender } = await render(<Probe handle={undefined} />);
      expect(subscriberCount(parent)).toBe(baseline + 1);

      // Switching to an external handle disconnects the now-unused internal store.
      await rerender(<Probe handle={externalStore} />);
      expect(subscriberCount(parent)).toBe(baseline);

      // Switching back must re-establish the subscription, not leave it permanently severed.
      await rerender(<Probe handle={undefined} />);
      expect(subscriberCount(parent)).toBe(baseline + 1);
    });

    it('does not dispose an externally-provided store on unmount', async () => {
      const parent = new MenuStore<unknown>({ rootId: 'root-1' });
      const externalChild = new MenuStore<unknown>({ parent: { type: 'menu', store: parent } });
      const baseline = subscriberCount(parent);

      function Probe() {
        MenuStore.useStore(externalChild, {});
        return null;
      }

      const { unmount } = await render(<Probe />);
      unmount();

      // The external store is owned by the consumer and may outlive the menu, so unmounting must
      // not tear down its parent subscription.
      expect(subscriberCount(parent)).toBe(baseline);

      parent.set('rootId', 'root-2');
      expect(externalChild.select('rootId')).toBe('root-2');
    });
  });

  describe('allowMouseUpTriggerRef', () => {
    it('borrows the parent ref while attached and restores its own ref at the root', () => {
      const parent = new MenuStore<unknown>({});
      const child = new MenuStore<unknown>({});

      const ownRef = child.context.allowMouseUpTriggerRef;
      expect(ownRef).not.toBe(parent.context.allowMouseUpTriggerRef);

      child.set('parent', { type: 'menu', store: parent });
      expect(child.context.allowMouseUpTriggerRef).toBe(parent.context.allowMouseUpTriggerRef);

      // Back at the root, the menu stops borrowing the parent's ref and uses its own again.
      child.set('parent', { type: undefined });
      expect(child.context.allowMouseUpTriggerRef).toBe(ownRef);
    });
  });
});
