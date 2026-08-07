import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { flushMicrotasks } from '@mui/internal-test-utils';
import { ReactStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  applyPopupOpenChange,
  createInitialPopupStoreState,
  PopupStoreContext,
  PopupStoreState,
  PopupStoreSelectors,
  PopupTriggerMap,
  popupStoreSelectors,
  useImplicitActiveTrigger,
  usePopupInteractionProps,
  useTriggerDataForwarding,
  useTriggerRegistration,
} from './';
import { useSyncedFloatingRootContext } from '../../floating-ui-react';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { BaseUIChangeEventDetails } from '../../types';

type TestStore = ReactStore<
  PopupStoreState<unknown>,
  PopupStoreContext<unknown>,
  PopupStoreSelectors
> & {
  setOpen: (open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void;
};

function createStore() {
  const triggerElements = new PopupTriggerMap();
  const store = new ReactStore<
    PopupStoreState<unknown>,
    PopupStoreContext<unknown>,
    PopupStoreSelectors
  >(
    createInitialPopupStoreState(triggerElements),
    {
      triggerElements,
      popupRef: React.createRef<HTMLElement | null>(),
      onOpenChangeComplete: undefined,
    },
    popupStoreSelectors,
  ) as TestStore;

  store.setOpen = vi.fn((open) => {
    store.set('open', open);
  });

  return store;
}

function TestTrigger({
  id,
  store,
  element,
  repeat = 1,
}: {
  id: string;
  store: ReactStore<PopupStoreState<unknown>, PopupStoreContext<unknown>, PopupStoreSelectors>;
  element: HTMLElement;
  repeat?: number;
}) {
  const register = useTriggerRegistration(id, store);

  useIsoLayoutEffect(() => {
    for (let i = 0; i < repeat; i += 1) {
      register(element);
    }
    return () => {
      register(null);
    };
  }, [register, repeat, element]);

  return null;
}

function TestForwardedTrigger({
  id,
  store,
  element,
}: {
  id: string;
  store: ReactStore<PopupStoreState<unknown>, PopupStoreContext<unknown>, PopupStoreSelectors>;
  element: HTMLElement;
}) {
  const elementRef = React.useRef<Element | null>(null);
  const { registerTrigger } = useTriggerDataForwarding(id, elementRef, store, {});

  useIsoLayoutEffect(() => {
    elementRef.current = element;
    registerTrigger(element);
    return () => {
      registerTrigger(null);
      elementRef.current = null;
    };
  }, [registerTrigger, element]);

  return null;
}

function PopupIdTest({
  store,
  floatingId,
  onOpenChange,
}: {
  store: ReactStore<PopupStoreState<unknown>, PopupStoreContext<unknown>, PopupStoreSelectors>;
  floatingId: string | undefined;
  onOpenChange(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
}) {
  useSyncedFloatingRootContext({
    popupStore: store,
    floatingRootContext: store.state.floatingRootContext,
    floatingId,
    nested: false,
    onOpenChange,
  });

  store.useState('popupId');
  return null;
}

function ImplicitActiveTriggerTest({ store }: { store: TestStore }) {
  useImplicitActiveTrigger(store);
  return null;
}

function CloseOnActiveTriggerUnmountTest({ store }: { store: TestStore }) {
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
  store: TestStore;
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

function PopupInteractionPropsTest({
  store,
  activeTriggerProps,
  inactiveTriggerProps,
  popupProps,
}: {
  store: ReactStore<PopupStoreState<unknown>, PopupStoreContext<unknown>, PopupStoreSelectors>;
  activeTriggerProps: PopupStoreState<unknown>['activeTriggerProps'];
  inactiveTriggerProps: PopupStoreState<unknown>['inactiveTriggerProps'];
  popupProps: PopupStoreState<unknown>['popupProps'];
}) {
  usePopupInteractionProps(store, {
    activeTriggerProps,
    inactiveTriggerProps,
    popupProps,
  });

  return null;
}

describe('PopupTriggerMap', () => {
  it('stores and retrieves elements by id', () => {
    const map = new PopupTriggerMap();
    const button = document.createElement('button');

    map.add('trigger', button);

    expect(map.getById('trigger')).toBe(button);
    expect(map.hasElement(button)).toBe(true);
    expect(map.hasMatchingElement((element) => element === button)).toBe(true);
  });

  it('replaces a registered element when the id is reused', () => {
    const map = new PopupTriggerMap();
    const first = document.createElement('button');
    const second = document.createElement('button');

    map.add('trigger', first);
    map.add('trigger', second);

    expect(map.getById('trigger')).toBe(second);
    expect(map.hasElement(first)).toBe(false);
    expect(map.hasElement(second)).toBe(true);
  });

  it('deletes an element and no longer matches it', () => {
    const map = new PopupTriggerMap();
    const button = document.createElement('button');

    map.add('trigger', button);
    map.delete('trigger');

    expect(map.getById('trigger')).toBeUndefined();
    expect(map.hasElement(button)).toBe(false);
    expect(map.hasMatchingElement((element) => element === button)).toBe(false);
  });
});

describe('useTriggerRegistration', () => {
  it('registers and unregisters closed triggers through the context map without notifying the store', () => {
    const store = createStore();
    const spy = vi.spyOn(store, 'set');
    const element = document.createElement('button');

    const { unmount } = render(
      <TestTrigger id="trigger" store={store} element={element} repeat={3} />,
    );

    expect(store.context.triggerElements.getById('trigger')).toBe(element);
    expect(store.context.triggerElements.hasElement(element)).toBe(true);
    expect(store.state.triggerCount).toBe(0);
    expect(spy).not.toHaveBeenCalled();

    unmount();
    expect(store.context.triggerElements.getById('trigger')).toBeUndefined();
    expect(store.context.triggerElements.hasElement(element)).toBe(false);
    expect(store.state.triggerCount).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('re-registers closed triggers when the trigger id changes without notifying the store', () => {
    const store = createStore();
    const spy = vi.spyOn(store, 'set');
    const element = document.createElement('button');

    const { rerender, unmount } = render(
      <TestTrigger id="first" store={store} element={element} />,
    );

    expect(store.context.triggerElements.getById('first')).toBe(element);
    expect(store.state.triggerCount).toBe(0);
    expect(spy).not.toHaveBeenCalled();

    rerender(<TestTrigger id="second" store={store} element={element} />);

    expect(store.context.triggerElements.getById('first')).toBeUndefined();
    expect(store.context.triggerElements.getById('second')).toBe(element);
    expect(store.state.triggerCount).toBe(0);
    expect(spy).not.toHaveBeenCalled();

    unmount();
    expect(store.context.triggerElements.getById('second')).toBeUndefined();
    expect(store.context.triggerElements.hasElement(element)).toBe(false);
    expect(store.state.triggerCount).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('keeps triggerCount reactive while the popup is open', () => {
    const store = createStore();
    const element = document.createElement('button');
    store.set('open', true);

    const { unmount } = render(<TestTrigger id="trigger" store={store} element={element} />);

    expect(store.context.triggerElements.getById('trigger')).toBe(element);
    expect(store.state.triggerCount).toBe(1);

    unmount();
    expect(store.context.triggerElements.getById('trigger')).toBeUndefined();
    expect(store.state.triggerCount).toBe(0);
  });

  it('claims the only registered trigger when a closed popup opens', () => {
    const store = createStore();
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

  it('closes when an implicitly claimed trigger unmounts during the claim commit', async () => {
    const store = createStore();
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
    const store = createStore();
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
      const store = createStore();
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
    const store = createStore();
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
    const store = createStore();
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
    const store = createStore();
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
    const store = createStore();
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

    // A handoff to the second trigger updates the active id from its DOM id (as `setPopupOpenState`
    // does), without changing `open` or `triggerCount`.
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
    const store = createStore();
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
        <ImplicitActiveTriggerTest store={store} />
      </React.Fragment>,
    );

    expect(store.state.triggerCount).toBe(2);
    expect(store.state.activeTriggerId).toBe('first');
    expect(store.state.activeTriggerElement).toBe(first);

    rerender(
      <React.Fragment>
        <TestTrigger key="second" id="second" store={store} element={second} />
        <ImplicitActiveTriggerTest store={store} />
      </React.Fragment>,
    );

    await waitFor(() => {
      expect(store.context.triggerElements.getById('first')).toBeUndefined();
      expect(store.context.triggerElements.getById('second')).toBe(second);
      expect(store.state.triggerCount).toBe(1);
      expect(store.state.activeTriggerId).toBe('first');
      expect(store.state.activeTriggerElement).toBe(first);
      expect(store.state.open).toBe(true);
      expect(store.setOpen).not.toHaveBeenCalled();
    });
  });

  it('resets triggerCount when the popup closes', () => {
    const store = createStore();
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

describe('popupId selector', () => {
  it('syncs the floating id into the popup store for trigger ownership selectors', () => {
    const store = createStore();

    render(<PopupIdTest store={store} floatingId="popup-id" onOpenChange={vi.fn()} />);

    expect(store.state.floatingId).toBe('popup-id');
    expect(store.select('popupId')).toBe('popup-id');
  });

  it('omits popup id when the floating id is empty', () => {
    const store = createStore();

    render(<PopupIdTest store={store} floatingId="" onOpenChange={vi.fn()} />);

    expect(store.state.floatingId).toBe('');
    expect(store.select('popupId')).toBeUndefined();
  });

  it('prefers an explicit popup element id over the generated floating id', () => {
    const store = createStore();
    const popupElement = document.createElement('div');
    popupElement.id = 'explicit-popup-id';

    store.update({
      open: true,
      activeTriggerId: 'trigger',
      floatingId: 'generated-popup-id',
      popupElement,
    });

    expect(store.select('popupId')).toBe('explicit-popup-id');
  });
});

describe('usePopupInteractionProps', () => {
  it('clears stored interaction props when unmounting', () => {
    const store = createStore();
    const activeTriggerProps = { onClick: vi.fn() };
    const inactiveTriggerProps = { onKeyDown: vi.fn() };
    const popupProps = { onPointerDown: vi.fn() };

    const { unmount } = render(
      <PopupInteractionPropsTest
        store={store}
        activeTriggerProps={activeTriggerProps}
        inactiveTriggerProps={inactiveTriggerProps}
        popupProps={popupProps}
      />,
    );

    expect(store.state.activeTriggerProps).toBe(activeTriggerProps);
    expect(store.state.inactiveTriggerProps).toBe(inactiveTriggerProps);
    expect(store.state.popupProps).toBe(popupProps);

    unmount();

    expect(store.state.activeTriggerProps).not.toBe(activeTriggerProps);
    expect(store.state.activeTriggerProps).toEqual({});
    expect(store.state.inactiveTriggerProps).not.toBe(inactiveTriggerProps);
    expect(store.state.inactiveTriggerProps).toEqual({});
    expect(store.state.popupProps).not.toBe(popupProps);
    expect(store.state.popupProps).toEqual({});
  });
});

describe('applyPopupOpenChange', () => {
  type OpenChangeState = PopupStoreState<unknown> & {
    instantType?: 'delay' | 'dismiss' | 'focus' | undefined;
    openChangeReason?: string;
  };
  type OpenChangeDetails = BaseUIChangeEventDetails<string> & { preventUnmountOnClose(): void };

  function createOpenChangeStore() {
    const order: string[] = [];
    const { floatingRootContext } = createInitialPopupStoreState(new PopupTriggerMap());

    const dispatchOpenChange = vi
      .spyOn(floatingRootContext, 'dispatchOpenChange')
      .mockImplementation(() => {
        order.push('dispatchOpenChange');
      });
    const onOpenChange = vi.fn((_open: boolean, _details: BaseUIChangeEventDetails<string>) => {
      order.push('onOpenChange');
    });
    const update = vi.fn((_state: Partial<OpenChangeState>) => {
      order.push('update');
    });

    const store = {
      context: { onOpenChange },
      state: { floatingRootContext },
      update,
    };

    return { store, order, onOpenChange, dispatchOpenChange, update };
  }

  function createDetails(reason: string) {
    return createChangeEventDetails(reason) as OpenChangeDetails;
  }

  it('runs the full sequence in order when the change is not canceled', () => {
    const { store, order, onOpenChange, dispatchOpenChange, update } = createOpenChangeStore();
    const details = createDetails(REASONS.triggerFocus);
    const onBeforeDispatch = vi.fn(() => {
      order.push('onBeforeDispatch');
    });

    applyPopupOpenChange<OpenChangeState, BaseUIChangeEventDetails<string>>(store, true, details, {
      onBeforeDispatch,
    });

    expect(onOpenChange).toHaveBeenCalledWith(true, details);
    expect(dispatchOpenChange).toHaveBeenCalledWith(true, details);
    expect(update).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['onOpenChange', 'onBeforeDispatch', 'dispatchOpenChange', 'update']);
  });

  it('notifies onOpenChange but short-circuits before dispatch when canceled', () => {
    const { store, onOpenChange, dispatchOpenChange, update } = createOpenChangeStore();
    onOpenChange.mockImplementation((_open, details) => {
      details.cancel();
    });
    const onBeforeDispatch = vi.fn();

    applyPopupOpenChange<OpenChangeState, BaseUIChangeEventDetails<string>>(
      store,
      true,
      createDetails(REASONS.triggerPress),
      { onBeforeDispatch },
    );

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onBeforeDispatch).not.toHaveBeenCalled();
    expect(dispatchOpenChange).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('merges extraState into the update with `open` always reflecting nextOpen', () => {
    const { store, update } = createOpenChangeStore();

    applyPopupOpenChange<OpenChangeState, BaseUIChangeEventDetails<string>>(
      store,
      true,
      createDetails(REASONS.triggerFocus),
      {
        // `open: false` here must be overridden by `nextOpen` (true).
        extraState: { open: false, openChangeReason: REASONS.triggerFocus },
      },
    );

    const updatedState = update.mock.calls[0][0];
    expect(updatedState.open).toBe(true);
    expect(updatedState.openChangeReason).toBe(REASONS.triggerFocus);
  });

  it('maps the change reason to instantType', () => {
    const focusStore = createOpenChangeStore();
    applyPopupOpenChange<OpenChangeState, BaseUIChangeEventDetails<string>>(
      focusStore.store,
      true,
      createDetails(REASONS.triggerFocus),
    );
    expect(focusStore.update.mock.calls[0][0].instantType).toBe('focus');

    const pressStore = createOpenChangeStore();
    applyPopupOpenChange<OpenChangeState, BaseUIChangeEventDetails<string>>(
      pressStore.store,
      false,
      createDetails(REASONS.triggerPress),
    );
    expect(pressStore.update.mock.calls[0][0].instantType).toBe('dismiss');

    const escapeStore = createOpenChangeStore();
    applyPopupOpenChange<OpenChangeState, BaseUIChangeEventDetails<string>>(
      escapeStore.store,
      false,
      createDetails(REASONS.escapeKey),
    );
    expect(escapeStore.update.mock.calls[0][0].instantType).toBe('dismiss');

    const hoverStore = createOpenChangeStore();
    applyPopupOpenChange<OpenChangeState, BaseUIChangeEventDetails<string>>(
      hoverStore.store,
      true,
      createDetails(REASONS.triggerHover),
    );
    const hoverState = hoverStore.update.mock.calls[0][0];
    expect('instantType' in hoverState).toBe(true);
    expect(hoverState.instantType).toBeUndefined();

    const noneStore = createOpenChangeStore();
    applyPopupOpenChange<OpenChangeState, BaseUIChangeEventDetails<string>>(
      noneStore.store,
      true,
      createDetails(REASONS.none),
    );
    expect('instantType' in noneStore.update.mock.calls[0][0]).toBe(false);
  });
});
