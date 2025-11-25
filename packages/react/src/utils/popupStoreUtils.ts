import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { TransitionStatus, useTransitionStatus } from './useTransitionStatus';
import { useOpenChangeComplete } from './useOpenChangeComplete';
import { type FloatingRootContext } from '../floating-ui-react/types';
import { HTMLProps } from './types';
import { getEmptyRootContext } from '../floating-ui-react/utils/getEmptyRootContext';
import { EMPTY_OBJECT } from './constants';

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
export function useImplicitActiveTrigger<State extends PopupStoreState<any>>(
  open: boolean,
  store: ReactStore<State, PopupStoreContext<any>, typeof popupStoreSelectors>,
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
export function useOpenStateTransitions<State extends PopupStoreState<any>>(
  open: boolean,
  store: ReactStore<State, PopupStoreContext<any>, typeof popupStoreSelectors>,
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

export type PopupStoreState<Payload> = {
  open: boolean;
  mounted: boolean;
  transitionStatus: TransitionStatus;
  floatingRootContext: FloatingRootContext;
  preventUnmountingOnClose: boolean;
  payload: Payload | undefined;

  activeTriggerId: string | null;
  activeTriggerElement: Element | null;
  popupElement: HTMLElement | null;
  positionerElement: HTMLElement | null;

  activeTriggerProps: HTMLProps;
  inactiveTriggerProps: HTMLProps;
  popupProps: HTMLProps;
};

export function createInitialPopupStoreState<Payload>(): PopupStoreState<Payload> {
  return {
    open: false,
    mounted: false,
    transitionStatus: 'idle',
    floatingRootContext: getEmptyRootContext(),
    preventUnmountingOnClose: false,
    payload: undefined,
    activeTriggerId: null,
    activeTriggerElement: null,
    popupElement: null,
    positionerElement: null,
    activeTriggerProps: EMPTY_OBJECT as HTMLProps,
    inactiveTriggerProps: EMPTY_OBJECT as HTMLProps,
    popupProps: EMPTY_OBJECT as HTMLProps,
  };
}

export type PopupStoreContext<ChangeEventDetails> = {
  readonly triggerElements: PopupTriggerMap;
  readonly popupRef: React.RefObject<HTMLElement | null>;
  onOpenChange?: (open: boolean, eventDetails: ChangeEventDetails) => void;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
};

export const popupStoreSelectors = {
  open: createSelector((state: PopupStoreState<unknown>) => state.open),
  mounted: createSelector((state: PopupStoreState<unknown>) => state.mounted),
  transitionStatus: createSelector((state: PopupStoreState<unknown>) => state.transitionStatus),
  floatingRootContext: createSelector(
    (state: PopupStoreState<unknown>) => state.floatingRootContext,
  ),
  preventUnmountingOnClose: createSelector(
    (state: PopupStoreState<unknown>) => state.preventUnmountingOnClose,
  ),
  payload: createSelector((state: PopupStoreState<unknown>) => state.payload),

  activeTriggerId: createSelector((state: PopupStoreState<unknown>) => state.activeTriggerId),
  activeTriggerElement: createSelector((state: PopupStoreState<unknown>) =>
    state.mounted ? state.activeTriggerElement : null,
  ),
  isTriggerActive: createSelector(
    (state: PopupStoreState<unknown>, triggerId: string | undefined) =>
      triggerId !== undefined && state.activeTriggerId === triggerId,
  ),
  isOpenedByTrigger: createSelector(
    (state: PopupStoreState<unknown>, triggerId: string | undefined) =>
      triggerId !== undefined && state.activeTriggerId === triggerId && state.mounted,
  ),

  triggerProps: createSelector((state: PopupStoreState<unknown>, isActive: boolean) =>
    isActive ? state.activeTriggerProps : state.inactiveTriggerProps,
  ),
  popupProps: createSelector((state: PopupStoreState<unknown>) => state.popupProps),

  popupElement: createSelector((state: PopupStoreState<unknown>) => state.popupElement),
  positionerElement: createSelector((state: PopupStoreState<unknown>) => state.positionerElement),
};
