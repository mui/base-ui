'use client';
import * as React from 'react';
import type { FullscreenStore } from '../store/FullscreenStore';

/**
 * Returns a callback ref that registers the trigger element in the store's
 * `triggerElements` map, so detached triggers can be looked up by id (used by
 * `FullscreenHandle.open(triggerId)` and the active-trigger selectors).
 *
 * Mirrors `useTriggerRegistration` from `popupStoreUtils`, but scoped to
 * `FullscreenStore` to avoid coupling with the popup-shaped state.
 */
export function useFullscreenTriggerRegistration(id: string | undefined, store: FullscreenStore) {
  // Keep track of the currently registered element so we can unregister it on
  // unmount or when the id changes.
  const registeredElementIdRef = React.useRef<string | null>(null);
  const registeredElementRef = React.useRef<Element | null>(null);

  return React.useCallback(
    (element: Element | null) => {
      if (id === undefined) {
        return;
      }

      if (registeredElementIdRef.current !== null) {
        const registeredId = registeredElementIdRef.current;
        const registeredElement = registeredElementRef.current;
        const currentElement = store.context.triggerElements.getById(registeredId);

        if (registeredElement && currentElement === registeredElement) {
          store.context.triggerElements.delete(registeredId);
        }

        registeredElementIdRef.current = null;
        registeredElementRef.current = null;
      }

      if (element !== null) {
        registeredElementIdRef.current = id;
        registeredElementRef.current = element;
        store.context.triggerElements.add(id, element);
      }
    },
    [store, id],
  );
}
