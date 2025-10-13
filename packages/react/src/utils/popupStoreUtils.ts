import * as React from 'react';
import { Store } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { PopupTriggerMap } from './types';

/**
 * Returns a callback ref that registers/unregisters the trigger element in the store.
 *
 * @param id ID of the trigger. This must not be undefined by the time a ref is assigned.
 * @param payload Payload associated with the trigger.
 * @param store The Store instance where the trigger should be registered.
 */
export function useTriggerRegistration<Payload, State extends { triggers: PopupTriggerMap }>(
  id: string | undefined,
  payload: Payload | undefined,
  store: Store<State>,
) {
  const getPayload = useEventCallback(() => {
    return payload;
  });

  const registeredId = React.useRef<string>(null);

  return React.useCallback(
    (triggerElement: HTMLElement | null) => {
      if (id == null) {
        throw new Error('Base UI: Trigger must have an `id` prop specified.');
      }

      const triggers = new Map(store.state.triggers);
      if (triggerElement != null) {
        triggers.set(id, { element: triggerElement, getPayload });
        // Keeping track of the registered id in case it changes.
        registeredId.current = id;
      } else if (registeredId.current != null) {
        triggers.delete(registeredId.current);
        registeredId.current = null;
      }
      store.set('triggers', triggers);
    },
    [getPayload, store, id],
  );
}

export type PayloadChildRenderFunction<Payload> = (arg: {
  payload: Payload | undefined;
}) => React.ReactNode;
