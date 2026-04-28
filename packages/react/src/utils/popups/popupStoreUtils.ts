'use client';
import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
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
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import {
  PopupStoreState,
  PopupStoreContext,
  popupStoreSelectors,
  PopupStoreSelectors,
} from './store';

export const FOCUSABLE_POPUP_PROPS = {
  tabIndex: -1,
  [FOCUSABLE_ATTRIBUTE]: '',
} satisfies HTMLProps<HTMLElement> & Record<typeof FOCUSABLE_ATTRIBUTE, string>;

type PopupStoreWithOpen<
  State extends PopupStoreState<unknown>,
  SetOpenEventDetails extends BaseUIChangeEventDetails<string>,
> = ReactStore<State, PopupStoreContext<never>, PopupStoreSelectors> & {
  setOpen(open: boolean, eventDetails: SetOpenEventDetails): void;
};

export function usePopupStore<
  State extends PopupStoreState<unknown>,
  SetOpenEventDetails extends BaseUIChangeEventDetails<string>,
  Store extends PopupStoreWithOpen<State, SetOpenEventDetails>,
>(
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

function syncTriggerCount<State extends PopupStoreState<unknown>>(
  store: ReactStore<State, PopupStoreContext<never>, PopupStoreSelectors>,
) {
  const triggerCount = store.context.triggerElements.size;
  if (store.state.triggerCount !== triggerCount) {
    store.set('triggerCount', triggerCount);
  }
}

function syncTriggerCountIfOpen<State extends PopupStoreState<unknown>>(
  store: ReactStore<State, PopupStoreContext<never>, PopupStoreSelectors>,
) {
  if (store.select('open')) {
    syncTriggerCount(store);
  }
}

/**
 * Returns a callback ref that registers/unregisters the trigger element in the store.
 *
 * @param store The Store instance where the trigger should be registered.
 */
export function useTriggerRegistration<State extends PopupStoreState<unknown>>(
  id: string | undefined,
  store: ReactStore<State, PopupStoreContext<never>, PopupStoreSelectors>,
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
          syncTriggerCountIfOpen(store);
        }

        registeredElementIdRef.current = null;
        registeredElementRef.current = null;
      }

      if (element !== null) {
        registeredElementIdRef.current = id;
        registeredElementRef.current = element;
        store.context.triggerElements.add(id, element);
        syncTriggerCountIfOpen(store);
      }
    },
    [store, id],
  );
}

export function setOpenTriggerState(
  state: Partial<PopupStoreState<unknown>>,
  open: boolean,
  trigger: Element | undefined,
) {
  const triggerId = trigger?.id ?? null;

  // If a popup is closing, the `trigger` may be undefined.
  // We want to keep the previous value so that exit animations are played and focus is returned correctly.
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
export function useTriggerDataForwarding<State extends PopupStoreState<unknown>>(
  triggerId: string | undefined,
  triggerElementRef: React.RefObject<Element | null>,
  store: ReactStore<State, PopupStoreContext<never>, typeof popupStoreSelectors>,
  stateUpdates: Omit<Partial<State>, 'activeTriggerId' | 'activeTriggerElement'>,
) {
  const isMountedByThisTrigger = store.useState('isMountedByTrigger', triggerId);

  const baseRegisterTrigger = useTriggerRegistration(triggerId, store);

  const registerTrigger = useStableCallback((element: Element | null) => {
    baseRegisterTrigger(element);

    if (!element) {
      return;
    }

    const open = store.select('open');
    const activeTriggerId = store.select('activeTriggerId');

    if (activeTriggerId === triggerId) {
      store.update({
        activeTriggerElement: element,
        ...(open ? stateUpdates : null),
      } as Partial<State>);
      return;
    }

    if (activeTriggerId == null && open) {
      // If a popup is already open, a detached trigger can mount before any active trigger
      // has been established. Claim the first registered trigger so trigger-owned focus
      // management and ARIA relationships work.
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
export function useImplicitActiveTrigger<State extends PopupStoreState<unknown>>(
  store: ReactStore<State, PopupStoreContext<never>, typeof popupStoreSelectors>,
) {
  const open = store.useState('open');
  const reactiveTriggerCount = store.useState('triggerCount');

  useIsoLayoutEffect(() => {
    if (!open) {
      return;
    }

    const triggerCount = store.context.triggerElements.size;
    const stateUpdates: Partial<PopupStoreState<unknown>> = {};

    if (store.state.triggerCount !== triggerCount) {
      stateUpdates.triggerCount = triggerCount;
    }

    if (!store.select('activeTriggerId') && triggerCount === 1) {
      const iteratorResult = store.context.triggerElements.entries().next();
      if (!iteratorResult.done) {
        const [implicitTriggerId, implicitTriggerElement] = iteratorResult.value;
        stateUpdates.activeTriggerId = implicitTriggerId;
        stateUpdates.activeTriggerElement = implicitTriggerElement;
      }
    }

    store.update(stateUpdates as Partial<State>);
  }, [open, store, reactiveTriggerCount]);
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
export function useOpenStateTransitions<State extends PopupStoreState<unknown>>(
  open: boolean,
  store: ReactStore<State, PopupStoreContext<never>, typeof popupStoreSelectors>,
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
  State extends PopupStoreState<unknown> & {
    openMethod: InteractionType | null;
  },
>(store: ReactStore<State, PopupStoreContext<never>, typeof popupStoreSelectors>, open: boolean) {
  useIsoLayoutEffect(() => {
    if (!open && store.state.openMethod !== null) {
      store.set('openMethod', null);
    }
  }, [open, store]);

  useIsoLayoutEffect(
    () => () => {
      if (store.state.openMethod !== null) {
        store.set('openMethod', null);
      }
    },
    [store],
  );
}

export function useFloatingRootContextSync<State extends PopupStoreState<unknown>>(
  store: ReactStore<State, PopupStoreContext<never>, typeof popupStoreSelectors>,
  floatingRootContext: State['floatingRootContext'],
) {
  useIsoLayoutEffect(() => {
    store.set('floatingRootContext', floatingRootContext);
  }, [floatingRootContext, store]);
}
