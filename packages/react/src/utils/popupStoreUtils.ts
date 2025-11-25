import * as React from 'react';
import { ReactStore } from '@base-ui-components/utils/store';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { TransitionStatus, useTransitionStatus } from './useTransitionStatus';
import { useOpenChangeComplete } from './useOpenChangeComplete';

/**
 * Returns a callback ref that registers/unregisters the trigger element in the store.
 *
 * @param store The Store instance where the trigger should be registered.
 */
export function useTriggerRegistration<
  State extends object,
  Context extends { triggerElements: PopupTriggerMap },
  Selectors extends Record<string, (state: State, ...args: any[]) => any>,
>(id: string | undefined, store: ReactStore<State, Context, Selectors>) {
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

  public entries(): IterableIterator<[string, Element]> {
    return this.idMap.entries();
  }

  public get size(): number {
    return this.idMap.size;
  }
}

/**
 * Ensures that when there's only one trigger element registered, it is set as the active trigger.
 * This allows controlled popups to work correctly without an explicit triggerId, maintaining compatibility
 * with the contained triggers.
 *
 * @param open Whether the popup is open.
 * @param store The Store instance managing the popup state.
 */
export function useImplicitActiveTrigger<
  State extends { activeTriggerId: string | null; activeTriggerElement: Element | null },
>(
  open: boolean,
  store: ReactStore<
    State,
    { triggerElements: PopupTriggerMap },
    { activeTriggerId: (state: State) => string | null }
  >,
) {
  useIsoLayoutEffect(() => {
    if (open && !store.select('activeTriggerId') && store.context.triggerElements.size === 1) {
      const iteratorResult = store.context.triggerElements.entries().next();
      if (!iteratorResult.done) {
        const [implicitTriggerId, implicitTriggerElement] = iteratorResult.value;
        store.update({
          activeTriggerId: implicitTriggerId,
          activeTriggerElement: implicitTriggerElement,
        } as Partial<State>);
      }
    }
  }, [open, store]);
}

/**
 * Mangages the mounted state of the popup.
 * Sets up the transition status listeners and handles unmounting when needed.
 * Updates the `mounted` and `transitionStatus` states in the store.
 *
 * @param open Whether the popup is open.
 * @param store The Store instance managing the popup state.
 * @param onUnmount Optional callback to be called when the popup is unmounted.
 *
 * @returns A function to forcibly unmount the popup.
 */
export function useOpenStateTransitions<
  State extends {
    mounted: boolean;
    transitionStatus: TransitionStatus;
    activeTriggerId: string | null;
    activeTriggerElement: Element | null;
  },
>(
  open: boolean,
  store: ReactStore<
    State,
    {
      onOpenChangeComplete: ((open: boolean) => void) | undefined;
      popupRef: React.RefObject<HTMLElement | null>;
    },
    { preventUnmountingOnClose: (state: State) => boolean }
  >,
  onUnmount?: () => void,
) {
  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  store.useSyncedValues({ mounted, transitionStatus } as Partial<State>);

  const forceUnmount = useStableCallback(() => {
    setMounted(false);
    store.update({
      activeTriggerId: null,
      activeTriggerElement: null,
      mounted: false,
    } as Partial<State>);
    onUnmount?.();
    store.context.onOpenChangeComplete?.(false);
  });

  const preventUnmountingOnClose = store.useState('preventUnmountingOnClose');

  useOpenChangeComplete({
    enabled: !preventUnmountingOnClose,
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (!open) {
        forceUnmount();
      }
    },
  });

  return forceUnmount;
}
