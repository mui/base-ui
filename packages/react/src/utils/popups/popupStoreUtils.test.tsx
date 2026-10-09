import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { flushMicrotasks } from '@mui/internal-test-utils';
import { ReactStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { PopupStoreContext, PopupStoreState, PopupStoreSelectors } from './';
import {
  createFloatingRootContextValues,
  createInitialPopupStoreState,
  createPopupOpenState,
  PopupTriggerMap,
  popupStoreSelectors,
  usePopupInteractionProps,
  useTriggerOwnership,
  useTriggerRegistration,
} from './';
import { useSettleTriggerOwnership } from './popupRoot';
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
    createInitialPopupStoreState(),
    {
      triggerElements,
      popupRef: React.createRef<HTMLElement | null>(),
      onOpenChangeComplete: undefined,
      ...createFloatingRootContextValues(),
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

  // `register` is stable, so the caller owns migration by keying this effect on `[store, id]`.
  useIsoLayoutEffect(() => {
    for (let i = 0; i < repeat; i += 1) {
      register(element);
    }
    return () => {
      register(null);
    };
  }, [register, repeat, element, store, id]);

  return null;
}

function TestForwardedTrigger({
  id,
  store,
  element,
  payload,
}: {
  id: string;
  store: ReactStore<PopupStoreState<unknown>, PopupStoreContext<unknown>, PopupStoreSelectors>;
  element: HTMLElement;
  payload?: unknown;
}) {
  const elementRef = React.useRef<Element | null>(null);
  const { registerTrigger } = useTriggerOwnership(id, elementRef, store, 'first-registrant', {
    payload,
  });

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

function ImplicitActiveTriggerTest({ store }: { store: TestStore }) {
  useSettleTriggerOwnership(store);
  return null;
}

function CloseOnActiveTriggerUnmountTest({ store }: { store: TestStore }) {
  useSettleTriggerOwnership(store, { closeOnActiveTriggerUnmount: true });
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
  useSettleTriggerOwnership(store, { closeOnActiveTriggerUnmount: true });

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
    const spy = vi.fn();
    store.subscribe(spy);
    const element = document.createElement('button');

    const { unmount } = render(
      <TestTrigger id="trigger" store={store} element={element} repeat={3} />,
    );

    expect(store.context.triggerElements.getById('trigger')).toBe(element);
    expect(store.context.triggerElements.hasElement(element)).toBe(true);
    expect(store.state.triggerOwnership.registryVersion).toBe(0);
    expect(spy).not.toHaveBeenCalled();

    unmount();
    expect(store.context.triggerElements.getById('trigger')).toBeUndefined();
    expect(store.context.triggerElements.hasElement(element)).toBe(false);
    expect(store.state.triggerOwnership.registryVersion).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('re-registers closed triggers when the trigger id changes without notifying the store', () => {
    const store = createStore();
    const spy = vi.fn();
    store.subscribe(spy);
    const element = document.createElement('button');

    const { rerender, unmount } = render(
      <TestTrigger id="first" store={store} element={element} />,
    );

    expect(store.context.triggerElements.getById('first')).toBe(element);
    expect(store.state.triggerOwnership.registryVersion).toBe(0);
    expect(spy).not.toHaveBeenCalled();

    rerender(<TestTrigger id="second" store={store} element={element} />);

    expect(store.context.triggerElements.getById('first')).toBeUndefined();
    expect(store.context.triggerElements.getById('second')).toBe(element);
    expect(store.state.triggerOwnership.registryVersion).toBe(0);
    expect(spy).not.toHaveBeenCalled();

    unmount();
    expect(store.context.triggerElements.getById('second')).toBeUndefined();
    expect(store.context.triggerElements.hasElement(element)).toBe(false);
    expect(store.state.triggerOwnership.registryVersion).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns a stable callback that unregisters from the store it registered in', () => {
    const first = createStore();
    const second = createStore();
    const element = document.createElement('button');
    let registerRef: ((element: Element | null) => void) | null = null;

    function Probe({ store }: { store: ReturnType<typeof createStore> }) {
      const register = useTriggerRegistration('trigger', store);
      registerRef = register;

      useIsoLayoutEffect(() => {
        register(element);
        return () => register(null);
      }, [register, store]);

      return null;
    }

    const { rerender, unmount } = render(<Probe store={first} />);
    const initialRegister = registerRef as unknown as (element: Element | null) => void;

    expect(first.context.triggerElements.getById('trigger')).toBe(element);

    rerender(<Probe store={second} />);

    expect(registerRef).toBe(initialRegister);
    expect(first.context.triggerElements.getById('trigger')).toBeUndefined();
    expect(second.context.triggerElements.getById('trigger')).toBe(element);

    // A retained callback from before the migration must still act on the current store.
    const replacement = document.createElement('button');
    act(() => {
      initialRegister(null);
      initialRegister(replacement);
    });

    expect(first.context.triggerElements.getById('trigger')).toBeUndefined();
    expect(second.context.triggerElements.getById('trigger')).toBe(replacement);

    unmount();
    expect(second.context.triggerElements.getById('trigger')).toBeUndefined();
  });

  describe('callers that pass the callback straight into a ref', () => {
    // Mirrors `Drawer.SwipeArea`: the callback is merged into the rendered element's ref, and the
    // migration effect is what re-registers it when the id changes.
    function RefOnlyTrigger({ id, store }: { id: string | undefined; store: TestStore }) {
      const register = useTriggerRegistration(id, store);
      const elementRef = React.useRef<HTMLButtonElement | null>(null);

      useIsoLayoutEffect(() => {
        register(elementRef.current);
        return () => register(null);
      }, [register, id, store]);

      const handleRef = React.useCallback(
        (element: HTMLButtonElement | null) => {
          elementRef.current = element;
          register(element);
        },
        [register],
      );

      return <button type="button" data-testid="trigger" ref={handleRef} />;
    }

    it('registers once the id resolves after the first commit', () => {
      const store = createStore();

      const { rerender } = render(<RefOnlyTrigger id={undefined} store={store} />);
      const element = screen.getByTestId('trigger');

      expect(store.context.triggerElements.size).toBe(0);

      // React 17's `useId` fallback returns `undefined` on the first render and a real id after an
      // effect commits.
      rerender(<RefOnlyTrigger id="trigger" store={store} />);

      expect(store.context.triggerElements.getById('trigger')).toBe(element);
      expect(store.context.triggerElements.size).toBe(1);
    });

    it('follows an id change', () => {
      const store = createStore();

      const { rerender, unmount } = render(<RefOnlyTrigger id="first" store={store} />);
      const element = screen.getByTestId('trigger');

      expect(store.context.triggerElements.getById('first')).toBe(element);

      rerender(<RefOnlyTrigger id="second" store={store} />);

      expect(store.context.triggerElements.getById('first')).toBeUndefined();
      expect(store.context.triggerElements.getById('second')).toBe(element);
      expect(store.context.triggerElements.size).toBe(1);

      unmount();
      expect(store.context.triggerElements.size).toBe(0);
    });
  });

  it('keeps the lone-trigger flag reactive while the popup is open', () => {
    const store = createStore();
    const element = document.createElement('button');
    store.set('open', true);

    const { unmount } = render(<TestTrigger id="trigger" store={store} element={element} />);

    expect(store.context.triggerElements.getById('trigger')).toBe(element);
    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(true);

    unmount();
    expect(store.context.triggerElements.getById('trigger')).toBeUndefined();
    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(false);
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
    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(false);
    expect(store.state.activeTriggerId).toBe(null);

    act(() => {
      store.set('open', true);
    });

    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(true);
    expect(store.state.activeTriggerId).toBe('trigger');
    expect(store.state.activeTriggerElement).toBe(element);
  });

  it('does not claim the only registered trigger when the popup opened without a trigger', () => {
    const store = createStore();
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

    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(true);
    expect(store.state.triggerOwnership.openedWithoutTrigger).toBe(true);
    expect(store.state.activeTriggerId).toBe(null);
    expect(store.state.activeTriggerElement).toBe(null);
  });

  it('claims the only registered trigger again after a trigger-less open is closed by a controlled prop', () => {
    const store = createStore();
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
    expect(store.state.triggerOwnership.openedWithoutTrigger).toBe(false);

    act(() => {
      store.set('open', true);
    });
    expect(store.state.activeTriggerId).toBe('trigger');
    expect(store.state.activeTriggerElement).toBe(element);
  });

  it('does not let a trigger registering into an open trigger-less popup claim it', () => {
    const store = createStore();
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
    const store = createStore();
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

    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(false);
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

    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(false);
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

    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(false);
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
    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(false);
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

    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(true);
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
        <ImplicitActiveTriggerTest key="root" store={store} />
      </React.Fragment>,
    );

    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(false);
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
    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(true);
    expect(store.state.activeTriggerId).toBe('first');
    expect(store.state.activeTriggerElement).toBe(first);
  });

  it('resets the lone-trigger flag when the popup closes', () => {
    const store = createStore();
    const element = document.createElement('button');

    store.set('open', true);

    render(
      <React.Fragment>
        <ImplicitActiveTriggerTest store={store} />
        <TestTrigger id="trigger" store={store} element={element} />
      </React.Fragment>,
    );

    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(true);

    act(() => {
      store.set('open', false);
    });

    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(false);
  });
});

describe('popupId selector', () => {
  it('uses the floating id as the popup id', () => {
    const store = createStore();

    store.set('floatingId', 'popup-id');

    expect(store.select('popupId')).toBe('popup-id');
  });

  it('omits popup id when the floating id is empty', () => {
    const store = createStore();

    store.set('floatingId', '');

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

  it('associates a lone trigger with the popup id unless the popup opened without a trigger', () => {
    const store = createStore();

    store.update({
      open: true,
      floatingId: 'popup-id',
      triggerOwnership: { ...store.state.triggerOwnership, hasLoneTrigger: true },
    });
    expect(store.select('triggerPopupId', 'trigger')).toBe('popup-id');

    store.set('triggerOwnership', {
      ...store.state.triggerOwnership,
      openedWithoutTrigger: true,
    });
    expect(store.select('triggerPopupId', 'trigger')).toBeUndefined();
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

describe('getPopupOpenState', () => {
  it('clears a previous unmount-prevention request when opening', () => {
    const state = createInitialPopupStoreState();
    state.preventUnmountingOnClose = true;

    const nextState = createPopupOpenState(state, true, undefined);

    expect(nextState.preventUnmountingOnClose).toBe(false);
    expect(state.preventUnmountingOnClose).toBe(true);
  });

  it('sets the unmount-prevention request when closing', () => {
    const state = createInitialPopupStoreState();

    const nextState = createPopupOpenState(state, false, undefined, true);

    expect(nextState.preventUnmountingOnClose).toBe(true);
  });

  it('preserves the active trigger when closing without a trigger', () => {
    const state = createInitialPopupStoreState();
    const trigger = document.createElement('button');
    state.activeTriggerId = 'trigger-id';
    state.activeTriggerElement = trigger;

    const nextState = createPopupOpenState(state, false, undefined);

    expect(nextState.activeTriggerId).toBe('trigger-id');
    expect(nextState.activeTriggerElement).toBe(trigger);
  });

  it('records whether an open request carried a trigger', () => {
    const state = createInitialPopupStoreState();
    const trigger = document.createElement('button');
    trigger.id = 'trigger-id';

    expect(createPopupOpenState(state, true, undefined).triggerOwnership.openedWithoutTrigger).toBe(
      true,
    );
    expect(createPopupOpenState(state, true, trigger).triggerOwnership.openedWithoutTrigger).toBe(
      false,
    );
  });

  it('keeps the trigger-less open flag through a close request', () => {
    // A controlled root may decline the close and stay open; the Root resets the flag itself once
    // the popup is effectively closed.
    const state = createInitialPopupStoreState();
    state.triggerOwnership = { ...state.triggerOwnership, openedWithoutTrigger: true };

    expect(
      createPopupOpenState(state, false, undefined).triggerOwnership.openedWithoutTrigger,
    ).toBe(true);
  });
});
