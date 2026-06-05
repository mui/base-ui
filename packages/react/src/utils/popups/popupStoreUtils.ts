'use client';
import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useId } from '@base-ui/utils/useId';
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

// Reference count of currently mounted roots that share a given handle's store.
// A handle's store can briefly be claimed by more than one root during Strict
// Mode effect replays or overlapping route transitions, so we track owners
// instead of a simple mounted/unmounted boolean.
const mountedPopupRootStoreOwners = new WeakMap<object, number>();

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

  const internalStoreRef = React.useRef<Store | null>(null);
  if (externalStore === undefined && internalStoreRef.current === null) {
    internalStoreRef.current = createStore(floatingId, nested);
  }

  const store = externalStore ?? internalStoreRef.current!;

  useSyncedFloatingRootContext({
    popupStore: store,
    treatPopupAsFloatingElement,
    floatingRootContext: store.state.floatingRootContext,
    floatingId,
    nested,
    onOpenChange: store.setOpen,
  });

  return { store, internalStore: internalStoreRef.current };
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

      let shouldSyncTriggerCount = false;

      if (registeredElementIdRef.current !== null) {
        const registeredId = registeredElementIdRef.current;
        const registeredElement = registeredElementRef.current;
        const currentElement = store.context.triggerElements.getById(registeredId);

        if (registeredElement && currentElement === registeredElement) {
          store.context.triggerElements.delete(registeredId);
          shouldSyncTriggerCount = true;
        }

        registeredElementIdRef.current = null;
        registeredElementRef.current = null;
      }

      if (element !== null) {
        registeredElementIdRef.current = id;
        registeredElementRef.current = element;
        store.context.triggerElements.add(id, element);
        shouldSyncTriggerCount = true;
      }

      if (shouldSyncTriggerCount) {
        const triggerCount = store.context.triggerElements.size;
        if (store.select('open') && store.state.triggerCount !== triggerCount) {
          store.set('triggerCount', triggerCount);
        }
      }
    },
    [store, id],
  );
}

export function setPopupOpenState(
  state: Partial<PopupStoreState<unknown>>,
  open: boolean,
  trigger: Element | undefined,
) {
  if (open) {
    // Opening starts a new close cycle, so clear any previous request to keep the popup mounted.
    state.preventUnmountingOnClose = false;
  }

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
 * @param triggerElementRef Ref for the trigger DOM element.
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
 * This keeps triggerCount reactive while open and allows controlled popups to work correctly without
 * an explicit triggerId, maintaining compatibility with contained triggers.
 *
 * This should be called on the Root part.
 *
 * @param store The Store instance managing the popup state.
 */
export function useImplicitActiveTrigger<State extends PopupStoreState<unknown>>(
  store: ReactStore<State, PopupStoreContext<never>, typeof popupStoreSelectors>,
) {
  const open = store.useState('open');
  const reactiveTriggerCount = store.useState('triggerCount');

  useIsoLayoutEffect(() => {
    if (!open) {
      if (store.state.triggerCount !== 0) {
        store.set('triggerCount', 0);
      }
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

    if (stateUpdates.triggerCount !== undefined || stateUpdates.activeTriggerId !== undefined) {
      store.update(stateUpdates as Partial<State>);
    }
  }, [open, store, reactiveTriggerCount]);
}

/**
 * Manages the mounted state of the popup.
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
  const preventUnmountingOnClose = store.useState('preventUnmountingOnClose');

  store.useSyncedValues({
    mounted,
    transitionStatus,
    preventUnmountingOnClose: open ? false : preventUnmountingOnClose,
  } as Partial<State>);

  const forceUnmount = useStableCallback(() => {
    setMounted(false);
    store.update({
      activeTriggerId: null,
      activeTriggerElement: null,
      mounted: false,
      preventUnmountingOnClose: false,
    } as Partial<State>);
    onUnmount?.();
    store.context.onOpenChangeComplete?.(false);
  });

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

export function usePopupInteractionProps<State extends PopupStoreState<unknown>>(
  store: ReactStore<State, PopupStoreContext<never>, typeof popupStoreSelectors>,
  statePart: Partial<State> &
    Pick<State, 'activeTriggerProps' | 'inactiveTriggerProps' | 'popupProps'>,
) {
  store.useSyncedValues(statePart);

  useIsoLayoutEffect(
    () => () => {
      store.update({
        activeTriggerProps: EMPTY_OBJECT,
        inactiveTriggerProps: EMPTY_OBJECT,
        popupProps: EMPTY_OBJECT,
      } as Partial<State>);
    },
    [store],
  );
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

/**
 * Something that can be reset after the root using it unmounts.
 */
interface Resettable {
  reset(): void;
}

/**
 * Resets a popup root's store after its root component unmounts while the
 * external handle (and any detached triggers) lives on.
 *
 * Shared by every popup store's `reset()` method to keep the cleanup steps and
 * their ordering in one place. It closes the popup, cancels pending hover-open
 * timers, and drops stale Floating UI references, while leaving the handle
 * reusable by a future root. Callers supply the per-store `nextState` (initial
 * state plus any fields that must survive the reset) and an optional callback to
 * clear store-specific timers or refs.
 *
 * @param store The popup store to reset.
 * @param closeEventDetails Event details used to close the popup if it is currently open.
 * @param nextState The state to reset the store to (initial state plus any preserved fields).
 * @param clearRootOwnedContext Optional callback to clear store-specific context (timers, refs).
 */
export function resetPopupRootStore<
  State extends PopupStoreState<unknown>,
  SetOpenEventDetails extends BaseUIChangeEventDetails<string>,
>(
  store: PopupStoreWithOpen<State, SetOpenEventDetails>,
  // Defensive: keep these arguments from participating in inference of
  // `State`/`SetOpenEventDetails`, which should be inferred from `store` alone.
  closeEventDetails: NoInfer<SetOpenEventDetails>,
  nextState: NoInfer<Partial<State>>,
  clearRootOwnedContext?: () => void,
): void {
  // Keep the external handle reusable, but clear state owned by the unmounted
  // root so route changes don't preserve an open popup or stale trigger data.
  if (store.select('open')) {
    // Notify controlled owners even though the Root that owned this store has unmounted.
    store.setOpen(false, closeEventDetails);
  }

  // Detached hover triggers can stay mounted after the root unmounts. Cancel
  // their pending hover-open timers so they cannot reopen a rootless handle.
  // No-op unless a hover trigger registered shared state on dataRef.
  store.state.floatingRootContext.resetHoverInteraction();

  clearRootOwnedContext?.();

  store.update(nextState);

  // Floating UI keeps synchronized references and transient interaction data.
  // Clear them with the popup state so they don't point at disconnected nodes.
  store.state.floatingRootContext.reset();
}

/**
 * Resets a popup handle's store once the last root using it unmounts.
 *
 * A handle (e.g. for detached triggers) can outlive the root component that
 * renders the popup. When that root unmounts we must clear the now-orphaned
 * state so a later route change or remount doesn't reuse stale, open, or
 * disconnected data. Ownership is reference counted and the reset is deferred
 * to a microtask so Strict Mode effect replays or overlapping roots can claim
 * the store again before cleanup resets it.
 *
 * @param store The handle's store to reset, or `undefined` when no handle is attached.
 */
export function usePopupRootUnmountCleanup(store: Resettable | undefined) {
  useIsoLayoutEffect(() => {
    if (!store) {
      return undefined;
    }

    mountedPopupRootStoreOwners.set(store, (mountedPopupRootStoreOwners.get(store) ?? 0) + 1);

    return () => {
      const ownerCount = (mountedPopupRootStoreOwners.get(store) ?? 1) - 1;
      if (ownerCount > 0) {
        mountedPopupRootStoreOwners.set(store, ownerCount);
        return;
      }

      mountedPopupRootStoreOwners.delete(store);

      // React Strict Mode and overlapping roots can leave the store claimed again
      // before this microtask runs. Only reset if no root still owns the handle's store.
      queueMicrotask(() => {
        if (mountedPopupRootStoreOwners.has(store)) {
          return;
        }

        store.reset();
      });
    };
  }, [store]);
}
