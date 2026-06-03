import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { act, render } from '@testing-library/react';
import { ReactStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  createInitialPopupStoreState,
  PopupStoreContext,
  PopupStoreState,
  PopupStoreSelectors,
  PopupTriggerMap,
  popupStoreSelectors,
  useImplicitActiveTrigger,
  usePopupInteractionProps,
  useTriggerRegistration,
} from './';
import { useSyncedFloatingRootContext } from '../../floating-ui-react';
import type { BaseUIChangeEventDetails } from '../../types';

function createStore() {
  return new ReactStore<PopupStoreState<unknown>, PopupStoreContext<unknown>, PopupStoreSelectors>(
    createInitialPopupStoreState(),
    {
      triggerElements: new PopupTriggerMap(),
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

function ImplicitActiveTriggerTest({
  store,
}: {
  store: ReactStore<PopupStoreState<unknown>, PopupStoreContext<unknown>, PopupStoreSelectors>;
}) {
  useImplicitActiveTrigger(store);
  return null;
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
