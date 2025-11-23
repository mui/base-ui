import * as React from 'react';
import { ReactStore } from '@base-ui-components/utils/store';

/**
 * Returns a callback ref that registers/unregisters the trigger element in the store.
 *
 * @param store The Store instance where the trigger should be registered.
 */
export function useTriggerRegistration<Context extends { triggerElements: Set<Element> }>(
  store: ReactStore<any, Context, any>,
) {
  const registeredElementRef = React.useRef<Element | null>(null);

  return React.useCallback(
    (element: Element | null) => {
      if (registeredElementRef.current !== null) {
        store.context.triggerElements.delete(registeredElementRef.current);
        registeredElementRef.current = null;
      }

      if (element !== null) {
        registeredElementRef.current = element;
        store.context.triggerElements.add(element);

        return () => {
          if (registeredElementRef.current !== null) {
            store.context.triggerElements.delete(registeredElementRef.current);
            registeredElementRef.current = null;
          }
        };
      }

      return undefined;
    },
    [store],
  );
}

export type PayloadChildRenderFunction<Payload> = (arg: {
  payload: Payload | undefined;
}) => React.ReactNode;

export type PopupTriggerMap = Map<string, HTMLElement>;
