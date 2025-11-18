import * as React from 'react';
import { Store } from '@base-ui-components/utils/store';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';

/**
 * Returns a callback ref that registers/unregisters the trigger element in the store.
 *
 * @param id ID of the trigger. This must not be undefined by the time a ref is assigned.
 * @param store The Store instance where the trigger should be registered.
 */
export function useTriggerRegistration<State extends { triggers: PopupTriggerMap }>(
  id: string | undefined,
  store: Store<State>,
) {
  const registeredIdRef = React.useRef<string | null>(null);
  const [element, setElement] = React.useState<HTMLElement | null>(null);

  useIsoLayoutEffect(() => {
    if (id == null) {
      if (element != null) {
        throw new Error('Base UI: Trigger must have an `id` prop specified.');
      }
      return;
    }

    const prevId = registeredIdRef.current;
    const triggers = store.state.triggers;

    if (element) {
      const existing = triggers.get(id);

      if (existing === element && prevId === id) {
        return;
      }

      const next = new Map(triggers);

      if (prevId != null && prevId !== id) {
        next.delete(prevId);
      }

      next.set(id, element);
      registeredIdRef.current = id;
      store.set('triggers', next);
    } else {
      const keyToRemove = prevId ?? id;
      if (!triggers.has(keyToRemove)) {
        return;
      }

      const next = new Map(triggers);
      next.delete(keyToRemove);
      registeredIdRef.current = null;
      store.set('triggers', next);
    }
  }, [element, id, store]);

  useIsoLayoutEffect(() => {
    return () => {
      const prevId = registeredIdRef.current;
      if (prevId == null) {
        return;
      }

      const triggers = store.state.triggers;
      if (!triggers.has(prevId)) {
        return;
      }

      const next = new Map(triggers);
      next.delete(prevId);
      registeredIdRef.current = null;
      store.set('triggers', next);
    };
  }, [store]);

  return setElement;
}

export type PayloadChildRenderFunction<Payload> = (arg: {
  payload: Payload | undefined;
}) => React.ReactNode;

export type PopupTriggerMap = Map<string, HTMLElement>;
