'use client';
import * as React from 'react';
import type { ReactStore } from '@base-ui/utils/store';
import { useId } from '@base-ui/utils/useId';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FOCUSABLE_ATTRIBUTE } from '../../floating-ui-react/utils/constants';
import { useFloatingParentNodeId } from '../../floating-ui-react/components/FloatingTree';
import { useSyncedFloatingRootContext } from '../../floating-ui-react/hooks/useSyncedFloatingRootContext';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import type { HTMLProps } from '../../internals/types';
import {
  popupStoreSelectors,
  type PopupStoreState,
  type PopupStoreContext,
  type PopupStoreSelectors,
} from './store';

export const FOCUSABLE_POPUP_PROPS = {
  tabIndex: -1,
  [FOCUSABLE_ATTRIBUTE]: '',
} as HTMLProps<HTMLElement> & Record<typeof FOCUSABLE_ATTRIBUTE, string>;

type PopupStoreWithOpen = ReactStore<any, PopupStoreContext<any>, PopupStoreSelectors> & {
  setOpen(open: boolean, eventDetails: any): void;
};

export function usePopupStore<Store extends PopupStoreWithOpen>(
  externalStore: Store | undefined,
  createStore: (floatingId: string | undefined, nested: boolean) => Store,
  treatPopupAsFloatingElement = false,
) {
  const floatingId = useId();
  const nested = useFloatingParentNodeId() != null;

  const internalStore = useRefWithInit(() => {
    return createStore(floatingId, nested);
  }).current;

  const store = externalStore ?? internalStore;

  useSyncedFloatingRootContext({
    popupStore: store,
    treatPopupAsFloatingElement,
    floatingRootContext: store.state.floatingRootContext,
    floatingId,
    nested,
    onOpenChange: store.setOpen,
  });

  return { store, internalStore };
}

/**
 * Returns a callback ref that registers/unregisters the trigger element in the store.
 *
 * @param store The Store instance where the trigger should be registered.
 */
export function useTriggerRegistration<State extends PopupStoreState<any>>(
  id: string | undefined,
  store: ReactStore<State, PopupStoreContext<any>, PopupStoreSelectors>,
) {
  // Keep track of the currently registered element to unregister it on unmount or id change.
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

export function usePopupId<State extends PopupStoreState<any>>(
  store: ReactStore<State, PopupStoreContext<any>, PopupStoreSelectors>,
) {
  const popupElement = store.useState('popupElement');
  const floatingRootContext = store.useState('floatingRootContext');
  const floatingId = floatingRootContext.useState('floatingId');

  return popupElement?.id ?? floatingId;
}

export function setOpenTriggerState(
  state: Partial<PopupStoreState<any>>,
  open: boolean,
  trigger: Element | undefined,
) {
  const triggerId = trigger?.id ?? null;
  if (triggerId || open) {
    state.activeTriggerId = triggerId;
    state.activeTriggerElement = trigger ?? null;
  }
}

/**
 * Sets up trigger data forwarding to the store.
 *
 * @param triggerId Id of the trigger.
 * @param triggerElement The trigger DOM element.
 * @param store The Store instance managing the popup state.
 * @param stateUpdates An object with state updates to apply when the trigger is active.
 */
export function useTriggerDataForwarding<State extends PopupStoreState<any>>(
  triggerId: string | undefined,
  triggerElementRef: React.RefObject<Element | null>,
  store: ReactStore<State, PopupStoreContext<any>, typeof popupStoreSelectors>,
  stateUpdates: Omit<Partial<State>, 'activeTriggerId' | 'activeTriggerElement'>,
) {
  const isMountedByThisTrigger = store.useState('isMountedByTrigger', triggerId);

  const baseRegisterTrigger = useTriggerRegistration(triggerId, store);

  const registerTrigger = useStableCallback((element: Element | null) => {
    baseRegisterTrigger(element);

    if (!element || !store.select('open')) {
      return;
    }

    const activeTriggerId = store.select('activeTriggerId');

    if (activeTriggerId === triggerId) {
      store.update({
        activeTriggerElement: element,
        ...stateUpdates,
      } as Partial<State>);
      return;
    }

    if (activeTriggerId == null) {
      // This runs when popup is open, but no active trigger is set.
      // It can happen when using controlled mode and the trigger is mounted after opening or if `triggerId` prop is not set explicitly.
      // In such cases the first trigger to run this code becomes the active trigger (store.select('activeTriggerId') should not return null after that).
      // This is mostly for compatibility with contained triggers where no explicit `triggerId` was required in controlled mode.
      store.update({
        activeTriggerId: triggerId,
        activeTriggerElement: element,
        ...stateUpdates,
      } as Partial<State>);
    }
  });

  useIsoLayoutEffect(() => {
    if (isMountedByThisTrigger) {
      store.update({
        activeTriggerElement: triggerElementRef.current,
        ...stateUpdates,
      } as Partial<State>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMountedByThisTrigger, store, triggerElementRef, ...Object.values(stateUpdates)]);

  return { registerTrigger, isMountedByThisTrigger };
}

export type PayloadChildRenderFunction<Payload> = (arg: {
  payload: Payload | undefined;
}) => React.ReactNode;

/**
 * Ensures that when there's only one trigger element registered, it is set as the active trigger.
 * This allows controlled popups to work correctly without an explicit triggerId, maintaining compatibility
 * with the contained triggers.
 *
 * This should be called on the Root part.
 *
 * @param open Whether the popup is open.
 * @param store The Store instance managing the popup state.
 */
export function useImplicitActiveTrigger<State extends PopupStoreState<any>>(
  store: ReactStore<State, PopupStoreContext<any>, typeof popupStoreSelectors>,
) {
  const open = store.useState('open');
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
    enabled: mounted && !open && !preventUnmountingOnClose,
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (!open) {
        forceUnmount();
      }
    },
  });

  return { forceUnmount, transitionStatus };
}

export function usePopupRootSync<
  State extends PopupStoreState<any> & {
    openMethod: unknown;
  },
>(store: ReactStore<State, PopupStoreContext<any>, typeof popupStoreSelectors>, open: boolean) {
  React.useEffect(() => {
    if (!open && store.state.openMethod !== null) {
      store.set('openMethod', null);
    }
  }, [open, store]);

  React.useEffect(
    () => () => {
      if (store.state.openMethod !== null) {
        store.set('openMethod', null);
      }
    },
    [store],
  );
}
