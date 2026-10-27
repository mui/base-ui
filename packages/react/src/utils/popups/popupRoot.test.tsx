import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { flushMicrotasks } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useImplicitActiveTrigger } from './popupRoot';
import { createPopupOpenState } from './store';
import {
  createTestPopupStore,
  TestForwardedTrigger,
  TestTrigger,
} from '../../../test/popupStoreTestUtils';
import type { TestPopupStore } from '../../../test/popupStoreTestUtils';

function ImplicitActiveTriggerTest({ store }: { store: TestPopupStore }) {
  useImplicitActiveTrigger(store);
  return null;
}

function CloseOnActiveTriggerUnmountTest({ store }: { store: TestPopupStore }) {
  useImplicitActiveTrigger(store, { closeOnActiveTriggerUnmount: true });
  return null;
}

function HideOnLayout({
  setVisible,
}: {
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  useIsoLayoutEffect(() => {
    setVisible(false);
  }, [setVisible]);
  return null;
}

function ImplicitTriggerUnmountTest({
  store,
  element,
}: {
  store: TestPopupStore;
  element: HTMLElement;
}) {
  const [triggerVisible, setTriggerVisible] = React.useState(true);
  useImplicitActiveTrigger(store, { closeOnActiveTriggerUnmount: true });

  if (!triggerVisible) {
    return null;
  }

  return (
    <React.Fragment>
      <TestTrigger id="trigger" store={store} element={element} />
      <HideOnLayout setVisible={setTriggerVisible} />
    </React.Fragment>
  );
}

describe('useImplicitActiveTrigger', () => {
  it('claims the only registered trigger when a closed popup opens', () => {
    const store = createTestPopupStore();
    const element = document.createElement('button');

    render(
      <React.Fragment>
        <ImplicitActiveTriggerTest store={store} />
        <TestTrigger id="trigger" store={store} element={element} />
      </React.Fragment>,
    );

    expect(store.context.triggerElements.getById('trigger')).toBe(element);
    expect(store.state.triggerCount).toBe(0);
    expect(store.state.activeTriggerId).toBe(null);

    act(() => {
      store.set('open', true);
    });

    expect(store.state.triggerCount).toBe(1);
    expect(store.state.activeTriggerId).toBe('trigger');
    expect(store.state.activeTriggerElement).toBe(element);
  });

  it('does not claim the only registered trigger when the popup opened without a trigger', () => {
    const store = createTestPopupStore();
    const element = document.createElement('button');

    render(
      <React.Fragment>
        <ImplicitActiveTriggerTest store={store} />
        <TestTrigger id="trigger" store={store} element={element} />
      </React.Fragment>,
    );

    act(() => {
      store.update(createPopupOpenState(store.state, true, undefined));
    });

    expect(store.state.triggerCount).toBe(1);
    expect(store.state.openedWithoutTrigger).toBe(true);
    expect(store.state.activeTriggerId).toBe(null);
    expect(store.state.activeTriggerElement).toBe(null);
  });

  it('claims the only registered trigger again after a trigger-less open is closed by a controlled prop', () => {
    const store = createTestPopupStore();
    const element = document.createElement('button');

    render(
      <React.Fragment>
        <ImplicitActiveTriggerTest store={store} />
        <TestTrigger id="trigger" store={store} element={element} />
      </React.Fragment>,
    );

    act(() => {
      store.update(createPopupOpenState(store.state, true, undefined));
    });
    expect(store.state.activeTriggerId).toBe(null);

    // A controlled close bypasses `createPopupOpenState`, so the root clears the flag itself.
    act(() => {
      store.set('open', false);
    });
    expect(store.state.openedWithoutTrigger).toBe(false);

    act(() => {
      store.set('open', true);
    });
    expect(store.state.activeTriggerId).toBe('trigger');
    expect(store.state.activeTriggerElement).toBe(element);
  });

  it('does not let a trigger registering into an open trigger-less popup claim it', () => {
    const store = createTestPopupStore();
    const element = document.createElement('button');
    store.set('payload', 'programmatic');
    store.update(createPopupOpenState(store.state, true, undefined));

    render(
      <TestForwardedTrigger id="trigger" store={store} element={element} payload="from trigger" />,
    );

    expect(store.context.triggerElements.getById('trigger')).toBe(element);
    expect(store.state.activeTriggerId).toBe(null);
    expect(store.state.activeTriggerElement).toBe(null);
    expect(store.state.payload).toBe('programmatic');
  });

  it('lets a trigger registering into a popup opened by a controlled prop claim it', () => {
    const store = createTestPopupStore();
    const element = document.createElement('button');
    store.set('open', true);

    render(
      <TestForwardedTrigger id="trigger" store={store} element={element} payload="from trigger" />,
    );

    expect(store.state.activeTriggerId).toBe('trigger');
    expect(store.state.activeTriggerElement).toBe(element);
    expect(store.state.payload).toBe('from trigger');
  });

  it('closes when an implicitly claimed trigger unmounts during the claim commit', async () => {
    const store = createTestPopupStore();
    const element = document.createElement('button');
    store.set('open', true);

    render(<ImplicitTriggerUnmountTest store={store} element={element} />);

    await waitFor(() => {
      expect(store.setOpen).toHaveBeenCalledTimes(1);
    });

    expect(store.context.triggerElements.getById('trigger')).toBeUndefined();
    expect(store.state.activeTriggerId).toBe(null);
    expect(store.state.activeTriggerElement).toBe(null);
    expect(store.setOpen).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'none' }));
    expect(store.state.open).toBe(false);
  });

  it('closes when the active trigger unregisters while open', async () => {
    const store = createTestPopupStore();
    const first = document.createElement('button');
    const second = document.createElement('button');

    store.update({
      open: true,
      activeTriggerId: 'first',
      activeTriggerElement: first,
    });

    const { rerender } = render(
      <React.Fragment>
        <TestTrigger key="first" id="first" store={store} element={first} />
        <TestTrigger key="second" id="second" store={store} element={second} />
        <CloseOnActiveTriggerUnmountTest key="root" store={store} />
      </React.Fragment>,
    );

    expect(store.state.triggerCount).toBe(2);
    expect(store.state.activeTriggerId).toBe('first');
    expect(store.state.activeTriggerElement).toBe(first);

    rerender(
      <React.Fragment>
        <TestTrigger key="second" id="second" store={store} element={second} />
        <CloseOnActiveTriggerUnmountTest key="root" store={store} />
      </React.Fragment>,
    );

    await waitFor(() => {
      expect(store.setOpen).toHaveBeenCalledTimes(1);
    });

    expect(store.state.triggerCount).toBe(0);
    expect(store.state.activeTriggerId).toBe(null);
    expect(store.state.activeTriggerElement).toBe(null);
    expect(store.setOpen).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'none' }));
    expect(store.state.open).toBe(false);
  });

  it.each([
    ['a different unresolved id', 'second'],
    ['no active trigger', null],
  ] as const)(
    'keeps the popup open when ownership returns to a pending trigger after %s',
    async (_description, pendingTriggerId) => {
      const store = createTestPopupStore();
      const first = document.createElement('button');
      const replacement = document.createElement('button');

      store.update({
        open: true,
        activeTriggerId: 'first',
        activeTriggerElement: first,
      });

      const { rerender } = render([
        <TestTrigger key="trigger" id="first" store={store} element={first} />,
        <CloseOnActiveTriggerUnmountTest key="root" store={store} />,
      ]);

      act(() => {
        store.context.triggerElements.delete('first');
        store.update({
          activeTriggerId: pendingTriggerId,
          activeTriggerElement: null,
          triggerCount: 0,
        });
      });

      rerender([<CloseOnActiveTriggerUnmountTest key="root" store={store} />]);

      act(() => {
        store.update({
          activeTriggerId: 'first',
          activeTriggerElement: null,
        });
      });

      await flushMicrotasks();

      expect(store.state.open).toBe(true);
      expect(store.setOpen).not.toHaveBeenCalled();

      rerender([
        <TestTrigger key="trigger" id="first" store={store} element={replacement} />,
        <CloseOnActiveTriggerUnmountTest key="root" store={store} />,
      ]);

      expect(store.context.triggerElements.getById('first')).toBe(replacement);
      expect(store.state.open).toBe(true);
      expect(store.setOpen).not.toHaveBeenCalled();
    },
  );

  it('closes when the active trigger unmounts after registering in a count-neutral commit', async () => {
    const store = createTestPopupStore();
    const first = document.createElement('button');
    const second = document.createElement('button');

    store.update({
      open: true,
      // The `activeTriggerElement` selector resolves to null while unmounted, so reflect the
      // real open-popup state for the element subscription to observe registration.
      mounted: true,
      activeTriggerId: 'first',
      activeTriggerElement: first,
    });

    const { rerender } = render(
      <React.Fragment>
        <TestForwardedTrigger key="first" id="first" store={store} element={first} />
        <CloseOnActiveTriggerUnmountTest key="root" store={store} />
      </React.Fragment>,
    );

    // Ownership moves to a trigger that has not registered yet: the popup stays open (pending).
    act(() => {
      store.update({ activeTriggerId: 'second', activeTriggerElement: null });
    });

    await flushMicrotasks();

    expect(store.state.open).toBe(true);
    expect(store.setOpen).not.toHaveBeenCalled();

    // Swap "first" out and "second" in within one commit, so the trigger count nets out
    // unchanged and only the forwarded active trigger element reruns the reconciliation.
    rerender(
      <React.Fragment>
        <TestForwardedTrigger key="second" id="second" store={store} element={second} />
        <CloseOnActiveTriggerUnmountTest key="root" store={store} />
      </React.Fragment>,
    );

    await flushMicrotasks();

    expect(store.context.triggerElements.getById('second')).toBe(second);
    expect(store.state.activeTriggerElement).toBe(second);
    expect(store.state.open).toBe(true);
    expect(store.setOpen).not.toHaveBeenCalled();

    // The now-registered active trigger genuinely unmounts: the popup must close.
    rerender(<CloseOnActiveTriggerUnmountTest key="root" store={store} />);

    await waitFor(() => {
      expect(store.setOpen).toHaveBeenCalledTimes(1);
    });

    expect(store.setOpen).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'none' }));
    expect(store.state.open).toBe(false);
    expect(store.state.activeTriggerId).toBe(null);
    expect(store.state.activeTriggerElement).toBe(null);
  });

  it('keeps the popup open when the active trigger is replaced with the same id', async () => {
    const store = createTestPopupStore();
    const first = document.createElement('button');
    const replacement = document.createElement('button');
    const second = document.createElement('button');

    store.update({
      open: true,
      activeTriggerId: 'first',
      activeTriggerElement: first,
    });

    const { rerender } = render(
      <React.Fragment>
        <TestForwardedTrigger key="first" id="first" store={store} element={first} />
        <TestForwardedTrigger key="second" id="second" store={store} element={second} />
        <CloseOnActiveTriggerUnmountTest store={store} />
      </React.Fragment>,
    );

    expect(store.state.triggerCount).toBe(2);
    expect(store.state.activeTriggerId).toBe('first');
    expect(store.state.activeTriggerElement).toBe(first);

    rerender(
      <React.Fragment>
        <TestForwardedTrigger key="replacement" id="first" store={store} element={replacement} />
        <TestForwardedTrigger key="second" id="second" store={store} element={second} />
        <CloseOnActiveTriggerUnmountTest store={store} />
      </React.Fragment>,
    );

    await flushMicrotasks();

    expect(store.context.triggerElements.getById('first')).toBe(replacement);
    expect(store.context.triggerElements.getById('second')).toBe(second);
    expect(store.state.triggerCount).toBe(2);
    expect(store.state.activeTriggerId).toBe('first');
    expect(store.state.activeTriggerElement).toBe(replacement);
    expect(store.state.open).toBe(true);
    expect(store.setOpen).not.toHaveBeenCalled();
  });

  it('keeps the popup open when the active trigger element is registered with another id', async () => {
    const store = createTestPopupStore();
    const element = document.createElement('button');
    element.id = 'dom-id';

    store.update({
      open: true,
      activeTriggerId: 'dom-id',
      activeTriggerElement: element,
    });

    render(
      <React.Fragment>
        <TestTrigger id="registered-id" store={store} element={element} />
        <CloseOnActiveTriggerUnmountTest store={store} />
      </React.Fragment>,
    );

    await flushMicrotasks();

    expect(store.state.triggerCount).toBe(1);
    expect(store.state.activeTriggerId).toBe('registered-id');
    expect(store.state.activeTriggerElement).toBe(element);
    expect(store.state.open).toBe(true);
    expect(store.setOpen).not.toHaveBeenCalled();
  });

  it('reassociates the active trigger when ownership moves to another rendered-id trigger while open', async () => {
    const store = createTestPopupStore();
    const first = document.createElement('button');
    const second = document.createElement('button');
    second.id = 'dom-id-2';

    store.update({
      open: true,
      activeTriggerId: 'registered-1',
      activeTriggerElement: first,
    });

    render(
      <React.Fragment>
        <TestTrigger id="registered-1" store={store} element={first} />
        <TestTrigger id="registered-2" store={store} element={second} />
        <CloseOnActiveTriggerUnmountTest store={store} />
      </React.Fragment>,
    );

    await flushMicrotasks();

    expect(store.state.activeTriggerId).toBe('registered-1');

    // A handoff to the second trigger updates the active id from its DOM id (as
    // `getPopupOpenState` does), without changing `open` or `triggerCount`.
    act(() => {
      store.update({ activeTriggerId: 'dom-id-2', activeTriggerElement: second });
    });

    await flushMicrotasks();

    expect(store.state.activeTriggerId).toBe('registered-2');
    expect(store.state.activeTriggerElement).toBe(second);
    expect(store.state.open).toBe(true);
    expect(store.setOpen).not.toHaveBeenCalled();
  });

  it('preserves active trigger ownership without closing by default', async () => {
    const store = createTestPopupStore();
    const first = document.createElement('button');
    const second = document.createElement('button');

    store.update({
      open: true,
      activeTriggerId: 'first',
      activeTriggerElement: first,
    });

    const { rerender } = render(
      <React.Fragment>
        <TestTrigger key="first" id="first" store={store} element={first} />
        <TestTrigger key="second" id="second" store={store} element={second} />
        <ImplicitActiveTriggerTest key="root" store={store} />
      </React.Fragment>,
    );

    expect(store.state.triggerCount).toBe(2);
    expect(store.state.activeTriggerId).toBe('first');
    expect(store.state.activeTriggerElement).toBe(first);

    rerender(
      <React.Fragment>
        <TestTrigger key="second" id="second" store={store} element={second} />
        <ImplicitActiveTriggerTest key="root" store={store} />
      </React.Fragment>,
    );

    // The close is queued in a microtask, so flush before asserting it never happened.
    await flushMicrotasks();

    expect(store.setOpen).not.toHaveBeenCalled();
    expect(store.state.open).toBe(true);
    expect(store.context.triggerElements.getById('first')).toBeUndefined();
    expect(store.context.triggerElements.getById('second')).toBe(second);
    expect(store.state.triggerCount).toBe(1);
    expect(store.state.activeTriggerId).toBe('first');
    expect(store.state.activeTriggerElement).toBe(first);
  });

  it('resets triggerCount when the popup closes', () => {
    const store = createTestPopupStore();
    const element = document.createElement('button');

    store.set('open', true);

    render(
      <React.Fragment>
        <ImplicitActiveTriggerTest store={store} />
        <TestTrigger id="trigger" store={store} element={element} />
      </React.Fragment>,
    );

    expect(store.state.triggerCount).toBe(1);

    act(() => {
      store.set('open', false);
    });

    expect(store.state.triggerCount).toBe(0);
  });
});
