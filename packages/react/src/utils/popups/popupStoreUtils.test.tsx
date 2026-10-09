import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import type { ReactStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { PopupStoreContext, PopupStoreState, PopupStoreSelectors } from './store';
import { usePopupInteractionProps, useTriggerRegistration } from './popupStoreUtils';
import { PopupTriggerMap } from './popupTriggerMap';
import { createTestPopupStore, TestTrigger } from '../../../test/popupStoreTestUtils';
import type { TestPopupStore } from '../../../test/popupStoreTestUtils';

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
    const store = createTestPopupStore();
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
    const store = createTestPopupStore();
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
    const first = createTestPopupStore();
    const second = createTestPopupStore();
    const element = document.createElement('button');
    let registerRef: ((element: Element | null) => void) | null = null;

    function Probe({ store }: { store: TestPopupStore }) {
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
    function RefOnlyTrigger({ id, store }: { id: string | undefined; store: TestPopupStore }) {
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
      const store = createTestPopupStore();

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
      const store = createTestPopupStore();

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
    const store = createTestPopupStore();
    const element = document.createElement('button');
    store.set('open', true);

    const { unmount } = render(<TestTrigger id="trigger" store={store} element={element} />);

    expect(store.context.triggerElements.getById('trigger')).toBe(element);
    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(true);

    unmount();
    expect(store.context.triggerElements.getById('trigger')).toBeUndefined();
    expect(store.state.triggerOwnership.hasLoneTrigger).toBe(false);
  });
});

describe('popupId selector', () => {
  it('uses the default popup id as the popup id', () => {
    const store = createTestPopupStore();

    store.set('defaultPopupId', 'popup-id');

    expect(store.select('popupId')).toBe('popup-id');
  });

  it('omits the popup id when the default popup id is empty', () => {
    const store = createTestPopupStore();

    store.set('defaultPopupId', '');

    expect(store.select('popupId')).toBeUndefined();
  });

  it('prefers an explicit popup element id over the default popup id', () => {
    const store = createTestPopupStore();
    const popupElement = document.createElement('div');
    popupElement.id = 'explicit-popup-id';

    store.update({
      open: true,
      activeTriggerId: 'trigger',
      defaultPopupId: 'generated-popup-id',
      popupElement,
    });

    expect(store.select('popupId')).toBe('explicit-popup-id');
  });

  it('associates a lone trigger with the popup id unless the popup opened without a trigger', () => {
    const store = createTestPopupStore();

    store.update({
      open: true,
      defaultPopupId: 'popup-id',
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
    const store = createTestPopupStore();
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
