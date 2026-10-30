import * as React from 'react';
import { vi } from 'vitest';
import { ReactStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  createInitialPopupStoreState,
  createPopupStoreContext,
  popupStoreSelectors,
} from '../src/utils/popups/store';
import type {
  PopupStoreContext,
  PopupStoreSelectors,
  PopupStoreState,
} from '../src/utils/popups/store';
import { useTriggerOwnership, useTriggerRegistration } from '../src/utils/popups/popupStoreUtils';
import type { BaseUIChangeEventDetails } from '../src/types';

export type TestPopupStore = ReactStore<
  PopupStoreState<unknown>,
  PopupStoreContext<unknown>,
  PopupStoreSelectors
> & {
  setOpen: (open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void;
};

/**
 * Creates a bare popup store whose `setOpen` only writes `open`.
 */
export function createTestPopupStore() {
  const store = new ReactStore<
    PopupStoreState<unknown>,
    PopupStoreContext<unknown>,
    PopupStoreSelectors
  >(
    createInitialPopupStoreState(),
    createPopupStoreContext(),
    popupStoreSelectors,
  ) as TestPopupStore;

  store.setOpen = vi.fn((open) => {
    store.set('open', open);
  });

  return store;
}

/**
 * Registers `element` as a trigger of `store`.
 */
export function TestTrigger({
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
  const elementRef = React.useRef<Element | null>(null);
  const register = useTriggerRegistration(id, elementRef, store);

  // The hook migrates the element in `elementRef` when the store or id changes.
  useIsoLayoutEffect(() => {
    elementRef.current = element;
    for (let i = 0; i < repeat; i += 1) {
      register(element);
    }
    return () => {
      register(null);
      elementRef.current = null;
    };
  }, [register, repeat, element]);

  return null;
}

/**
 * Registers `element` as a trigger of `store` and forwards `payload` while it is active.
 */
export function TestForwardedTrigger({
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
  const { registerTrigger } = useTriggerOwnership(id, elementRef, store, {
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
