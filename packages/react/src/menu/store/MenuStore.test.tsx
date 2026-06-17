import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { render } from '@testing-library/react';
import { MenuStore } from './MenuStore';

// A leaked subscription is otherwise behaviorally invisible, so the regression tests below assert
// against the parent store's internal listener set directly.
function subscriberCount(store: MenuStore<unknown>) {
  return (store as unknown as { listeners: Set<unknown> }).listeners.size;
}

describe('MenuStore', () => {
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

    it('removes the internal store subscription from the parent when the menu unmounts', () => {
      const parent = new MenuStore<unknown>({ rootId: 'root-1' });
      const baseline = subscriberCount(parent);

      function Probe() {
        MenuStore.useStore(undefined, { parent: { type: 'menu', store: parent } });
        return null;
      }

      const { unmount } = render(<Probe />);
      expect(subscriberCount(parent)).toBe(baseline + 1);

      unmount();
      expect(subscriberCount(parent)).toBe(baseline);
    });

    it('does not dispose an externally-provided store on unmount', () => {
      const parent = new MenuStore<unknown>({ rootId: 'root-1' });
      const externalChild = new MenuStore<unknown>({ parent: { type: 'menu', store: parent } });
      const baseline = subscriberCount(parent);

      function Probe() {
        MenuStore.useStore(externalChild, {});
        return null;
      }

      const { unmount } = render(<Probe />);
      unmount();

      // The external store is owned by the consumer and may outlive the menu, so unmounting must
      // not tear down its parent subscription.
      expect(subscriberCount(parent)).toBe(baseline);

      parent.set('rootId', 'root-2');
      expect(externalChild.select('rootId')).toBe('root-2');
    });
  });
});
