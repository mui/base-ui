import * as React from 'react';
import { Store } from '@base-ui-components/utils/store';

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
  const registeredId = React.useRef<string>(null);

  return React.useCallback(
    (triggerElement: HTMLElement | null) => {
      if (id == null) {
        throw new Error('Base UI: Trigger must have an `id` prop specified.');
      }

      const triggers = new Map(store.state.triggers);
      if (triggerElement != null) {
        triggers.set(id, triggerElement);
        // Keeping track of the registered id in case it changes.
        registeredId.current = id;
      } else if (registeredId.current != null) {
        triggers.delete(registeredId.current);
        registeredId.current = null;
      }
      store.set('triggers', triggers);
    },
    [store, id],
  );
}

export type PayloadChildRenderFunction<Payload> = (arg: {
  payload: Payload | undefined;
}) => React.ReactNode;

export type PopupTriggerMap = Map<string, HTMLElement>;
