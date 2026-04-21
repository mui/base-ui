import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import { ReactStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  createInitialPopupStoreState,
  createPopupFloatingRootContext,
  PopupStoreContext,
  PopupStoreState,
  PopupStoreSelectors,
  PopupTriggerMap,
  popupStoreSelectors,
  shouldCurrentTriggerOwnOpenPopup,
  useTriggerRegistration,
} from './';
import { useSyncedFloatingRootContext } from '../../floating-ui-react';
import type { BaseUIChangeEventDetails } from '../../types';
import { usePopupRootSync } from './popupStoreUtils';

function createStore() {
  const triggerElements = new PopupTriggerMap();
  return new ReactStore<PopupStoreState<unknown>, PopupStoreContext<unknown>, PopupStoreSelectors>(
    {
      ...createInitialPopupStoreState(),
      floatingRootContext: createPopupFloatingRootContext(triggerElements),
    },
    {
      triggerElements,
      popupRef: React.createRef<HTMLElement | null>(),
      onOpenChangeComplete: undefined,
    },
  );
}

type SyncState = PopupStoreState<unknown> & { openMethod: string | null };

function createSyncStore(initialState: Partial<SyncState> = {}) {
  const triggerElements = new PopupTriggerMap();
  return new ReactStore<SyncState, PopupStoreContext<unknown>, PopupStoreSelectors>(
    {
      ...createInitialPopupStoreState(),
      floatingRootContext: createPopupFloatingRootContext(triggerElements),
      openMethod: null,
      ...initialState,
    },
    {
      triggerElements,
      popupRef: React.createRef<HTMLElement | null>(),
      onOpenChangeComplete: undefined,
    },
    popupStoreSelectors,
  );
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

function PopupRootSyncTest({
  store,
  open,
}: {
  store: ReactStore<SyncState, PopupStoreContext<unknown>, PopupStoreSelectors>;
  open: boolean;
}) {
  usePopupRootSync(store, { open });
  return null;
}

let syncedFloatingRootCallbackDuringRender:
  | ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void)
  | undefined;

function SyncedFloatingRootContextTest({
  store,
  onOpenChange,
}: {
  store: ReactStore<SyncState, PopupStoreContext<unknown>, PopupStoreSelectors>;
  onOpenChange(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
}) {
  const floatingRootContext = useSyncedFloatingRootContext({
    popupStore: store,
    floatingRootContext: store.state.floatingRootContext,
    floatingId: 'floating-id',
    nested: false,
    onOpenChange,
  });

  syncedFloatingRootCallbackDuringRender = floatingRootContext.context.onOpenChange;
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
  it('registers and unregisters triggers through the context map', () => {
    const store = createStore();
    const spy = vi.spyOn(store, 'set');
    const element = document.createElement('button');

    const { unmount } = render(
      <TestTrigger id="trigger" store={store} element={element} repeat={3} />,
    );

    expect(store.context.triggerElements.getById('trigger')).toBe(element);
    expect(store.context.triggerElements.hasElement(element)).toBe(true);
    expect(spy).not.toHaveBeenCalled();

    unmount();
    expect(store.context.triggerElements.getById('trigger')).toBeUndefined();
    expect(store.context.triggerElements.hasElement(element)).toBe(false);
  });

  it('re-registers when the trigger id changes without notifying the store', () => {
    const store = createStore();
    const spy = vi.spyOn(store, 'set');
    const element = document.createElement('button');

    const { rerender, unmount } = render(
      <TestTrigger id="first" store={store} element={element} />,
    );

    expect(store.context.triggerElements.getById('first')).toBe(element);
    expect(spy).not.toHaveBeenCalled();

    rerender(<TestTrigger id="second" store={store} element={element} />);

    expect(store.context.triggerElements.getById('first')).toBeUndefined();
    expect(store.context.triggerElements.getById('second')).toBe(element);
    expect(spy).not.toHaveBeenCalled();

    unmount();
    expect(store.context.triggerElements.getById('second')).toBeUndefined();
    expect(store.context.triggerElements.hasElement(element)).toBe(false);
  });
});

describe('shouldCurrentTriggerOwnOpenPopup', () => {
  it('returns true for the trigger that opened the popup', () => {
    expect(
      shouldCurrentTriggerOwnOpenPopup({
        open: true,
        isOpenedByThisTrigger: true,
        activeTriggerId: 'trigger-1',
        triggerCount: 2,
      }),
    ).toBe(true);
  });

  it('returns true for an open single-trigger popup without an active trigger id', () => {
    expect(
      shouldCurrentTriggerOwnOpenPopup({
        open: true,
        isOpenedByThisTrigger: false,
        activeTriggerId: null,
        triggerCount: 1,
      }),
    ).toBe(true);
  });

  it('returns false for an open multi-trigger popup without an active trigger id', () => {
    expect(
      shouldCurrentTriggerOwnOpenPopup({
        open: true,
        isOpenedByThisTrigger: false,
        activeTriggerId: null,
        triggerCount: 2,
      }),
    ).toBe(false);
  });
});

describe('usePopupRootSync', () => {
  it('clears openMethod after the popup closes', async () => {
    const store = createSyncStore({ openMethod: 'touch' });

    const { rerender } = render(<PopupRootSyncTest store={store} open />);

    expect(store.state.openMethod).toBe('touch');

    rerender(<PopupRootSyncTest store={store} open={false} />);

    await waitFor(() => {
      expect(store.state.openMethod).toBe(null);
    });
  });

  it('clears openMethod when the popup root unmounts', async () => {
    const store = createSyncStore({ openMethod: 'touch' });

    const { unmount } = render(<PopupRootSyncTest store={store} open />);

    expect(store.state.openMethod).toBe('touch');

    unmount();

    await waitFor(() => {
      expect(store.state.openMethod).toBe(null);
    });
  });
});

describe('useSyncedFloatingRootContext', () => {
  it('wires sync-only open changes before layout effects run', () => {
    const store = createSyncStore();
    const onOpenChange = vi.fn();

    syncedFloatingRootCallbackDuringRender = undefined;

    render(<SyncedFloatingRootContextTest store={store} onOpenChange={onOpenChange} />);

    expect(syncedFloatingRootCallbackDuringRender).toBe(onOpenChange);
  });
});
