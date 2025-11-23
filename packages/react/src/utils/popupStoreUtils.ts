import * as React from 'react';
import { ReactStore } from '@base-ui-components/utils/store';

/**
 * Returns a callback ref that registers/unregisters the trigger element in the store.
 *
 * @param store The Store instance where the trigger should be registered.
 */
export function useTriggerRegistration<Context extends { triggerElements: PopupTriggerMap }>(
  id: string | undefined,
  store: ReactStore<any, Context, any>,
) {
  const registeredElementId = React.useRef<string | null>(null);

  return React.useCallback(
    (element: Element | null) => {
      if (id === undefined) {
        return undefined;
      }

      if (registeredElementId.current !== null) {
        store.context.triggerElements.delete(registeredElementId.current);
        registeredElementId.current = null;
      }

      if (element !== null) {
        registeredElementId.current = id;
        store.context.triggerElements.add(id, element);

        return () => {
          if (registeredElementId.current !== null) {
            store.context.triggerElements.delete(registeredElementId.current);
            registeredElementId.current = null;
          }
        };
      }

      return undefined;
    },
    [store, id],
  );
}

export type PayloadChildRenderFunction<Payload> = (arg: {
  payload: Payload | undefined;
}) => React.ReactNode;

export class PopupTriggerMap {
  private elements: Set<Element>;

  private idMap: Map<string, Element>;

  constructor() {
    this.elements = new Set();
    this.idMap = new Map();
  }

  public add(id: string, element: Element) {
    const existingElement = this.idMap.get(id);
    if (existingElement === element) {
      return;
    }

    if (existingElement !== undefined) {
      // We assume that the same element won't be registered under multiple ids.
      // This is safe considering how useTriggerRegistration is implemented.
      this.elements.delete(existingElement);
    }

    this.elements.add(element);
    this.idMap.set(id, element);
  }

  public delete(id: string) {
    const element = this.idMap.get(id);
    if (element) {
      this.elements.delete(element);
      this.idMap.delete(id);
    }
  }

  public hasElement(element: Element): boolean {
    return this.elements.has(element);
  }

  public hasMatchingElement(predicate: (el: Element) => boolean): boolean {
    for (const element of this.elements) {
      if (predicate(element)) {
        return true;
      }
    }

    return false;
  }

  public getById(id: string): Element | undefined {
    return this.idMap.get(id);
  }
}
