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

type PopupStoreWithOpen<
  State extends PopupStoreState<unknown>,
  SetOpenEventDetails extends BaseUIChangeEventDetails<string>,
> = ReactStore<State, PopupStoreContext<never>, PopupStoreSelectors> & {
  setOpen(open: boolean, eventDetails: SetOpenEventDetails): void;
};

/**
 * Resets the open-cycle state of a handle-owned (external) store when a Root adopts it.
 *
 * A handle-owned store outlives the Root that mounts it, so it can carry open-cycle state left
 * over from a previously unmounted Root (e.g. one unmounted while open on navigation), or state
 * written by trigger interactions that fired while no Root was mounted. Resetting on adoption
 * makes the popup start from the adopting Root's initial state, just like an internal store
 * (which is recreated on each mount). Resetting to `initialState` (rather than a hardcoded
 * closed state) keeps `defaultOpen` intact; the controlled `open`/`triggerId` props are
 * re-applied by the Root via `useControlledProp`. Trigger registrations are untouched;
 * active-trigger fields are reset and re-derived from the still-mounted triggers.
 * See https://github.com/mui/base-ui/issues/4951
 *
 * Only the open-cycle fields of the base `PopupStoreState` are reset by default. Fields added by
 * concrete stores are not visible here — pass them via `additionalResetState` (as Menu does for
 * `activeIndex`), unless they are benign when stale or cleaned up by the Root's own effects (as
 * `openMethod` is by `usePopupRootSync` in Dialog and Popover, or by the Root's synced values in
 * Menu).
 *
 * Adoption is detected only on the Root's first render: swapping the `handle` of a mounted Root
 * to a different store is not supported and does not re-run the reset.
 *
 * @param externalStore The handle-owned store being adopted, or `undefined` when the Root uses an
 * internal store (in which case the hook does nothing).
 * @param initialState The adopting Root's initial state; the open-cycle fields are reset to the
 * values it carries (`defaultOpen`, controlled props, default trigger) rather than a hardcoded
 * closed state.
 * @param additionalResetState Extra reset values for open-cycle fields that concrete stores add on
 * top of the base `PopupStoreState`, applied after (and overriding) the base reset fields. The
 * values must be render-stable: the reset re-runs on every render until the adoption commits.
 */
export function useAdoptedStoreReset<State extends PopupStoreState<unknown>>(
  externalStore: ReactStore<State, any, any> | undefined,
  initialState: Partial<State> | undefined,
  additionalResetState?: Partial<State>,
) {
  const pendingAdoptionRef = React.useRef(externalStore !== undefined);

  // The state object is replaced directly during render (not via `update`) so the adopting Root
  // and its children read the reset values in their very first render: the popup never mounts
  // with the stale open state, and no subscribers are notified mid-render. Resetting in a layout
  // effect instead does not work — by then the first commit has already mounted the stale-open
  // popup, and effects registered after the reset (such as `useOpenStateTransitions`'s synced
  // `mounted`) write their stale render-computed values back, producing a visible close
  // transition of a popup the user never opened.
  //
  // The replacement is idempotent and re-runs on every render until the adoption commits, so a
  // render that React discards (StrictMode's double render, an interrupted or suspended render)
  // neither loses the reset nor consumes it prematurely: the retry render re-applies it, and only
  // the committed render flushes subscribers (e.g. detached triggers) after commit. Until then,
  // each re-run also clobbers render-phase writes to these fields made after this hook, so such
  // writes must agree with `initialState` (as the Root's `useOnFirstRender` defaultOpen logic
  // does). An
  // unmount-cleanup reset is not an option either: it would run in StrictMode's simulated
  // unmount and wipe state the Root applied during its first render and never re-applies.
  if (pendingAdoptionRef.current && externalStore !== undefined) {
    externalStore.state = {
      ...externalStore.state,
      open: initialState?.open ?? false,
      openProp: initialState?.openProp,
      mounted: false,
      transitionStatus: undefined,
      activeTriggerId: initialState?.activeTriggerId ?? null,
      activeTriggerElement: null,
      triggerIdProp: initialState?.triggerIdProp,
      payload: initialState?.payload,
      preventUnmountingOnClose: false,
      ...additionalResetState,
    };
  }

  useIsoLayoutEffect(() => {
    if (pendingAdoptionRef.current) {
      pendingAdoptionRef.current = false;
      externalStore?.notifyAll();
    }
  }, [externalStore]);
}

export function usePopupStore<
  State extends PopupStoreState<unknown>,
  SetOpenEventDetails extends BaseUIChangeEventDetails<string>,
  Store extends PopupStoreWithOpen<State, SetOpenEventDetails>,
>(
  externalStore: Store | undefined,
  createStore: (floatingId: string | undefined, nested: boolean) => Store,
  initialState?: Partial<State>,
  treatPopupAsFloatingElement = false,
) {
  const floatingId = useId();
  const nested = useFloatingParentNodeId() != null;

  const internalStoreRef = React.useRef<Store | null>(null);
  if (externalStore === undefined && internalStoreRef.current === null) {
    internalStoreRef.current = createStore(floatingId, nested);
  }

  const store = externalStore ?? internalStoreRef.current!;

  useAdoptedStoreReset(externalStore, initialState);

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
