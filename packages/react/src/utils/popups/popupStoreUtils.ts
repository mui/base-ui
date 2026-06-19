'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useId } from '@base-ui/utils/useId';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useOnFirstRender } from '@base-ui/utils/useOnFirstRender';
import { FOCUSABLE_ATTRIBUTE } from '../../floating-ui-react/utils/constants';
import { useFloatingParentNodeId } from '../../floating-ui-react/components/FloatingTree';
import { useSyncedFloatingRootContext } from '../../floating-ui-react/hooks/useSyncedFloatingRootContext';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import type { HTMLProps } from '../../internals/types';
import {
  createChangeEventDetails,
  type BaseUIChangeEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
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

/**
 * Returns the default `initialFocus` resolver for a popup. When opened by touch it focuses the
 * popup element itself to prevent the virtual keyboard from opening (required for Android
 * specifically; iOS handles this automatically). Otherwise it falls back to the default behavior.
 */
export function createDefaultInitialFocus(popupRef: React.RefObject<HTMLElement | null>) {
  return (interactionType: InteractionType) =>
    interactionType === 'touch' ? popupRef.current : true;
}

type PopupStoreWithOpen<
  State extends PopupStoreState<unknown>,
  SetOpenEventDetails extends BaseUIChangeEventDetails<string>,
> = ReactStore<State, PopupStoreContext<never>, PopupStoreSelectors> & {
  setOpen(open: boolean, eventDetails: SetOpenEventDetails): void;
};

// Counts mounted owners that currently claim a handle store. A store with an owner may still be
// visible on screen, so an adopting render must not mutate it until that render commits.
const storeOwnerCount = new WeakMap<ReactStore<any, any, any>, number>();
const warnedAboutMultipleStoreOwners = new WeakSet<ReactStore<any, any, any>>();

// Imperative handle opens made while no owner claims the store are intentional requests for the
// next owner. Other ownerless writes, such as delayed hover timers firing after unmount, are still
// reset.
const storesWithPendingOwnerlessOpen = new WeakSet<ReactStore<any, any, any>>();
// Some imperative APIs intentionally open without a trigger association (for example
// `DialogHandle.openWithPayload`). These opens remain ownerless even if triggers are mounted.
const storesWithUnassociatedOpen = new WeakSet<ReactStore<any, any, any>>();

type AdoptionState<
  State extends PopupStoreState<unknown>,
  Store extends ReactStore<State, any, any>,
> = {
  target: Store;
  proxy: Store;
  state: State;
  context: Store['context'];
  committed: boolean;
};

function hasStoreOwner(store: ReactStore<any, any, any>) {
  return (storeOwnerCount.get(store) ?? 0) > 0;
}

function registerStoreOwner(store: ReactStore<any, any, any>) {
  const ownerCount = storeOwnerCount.get(store) ?? 0;
  if (
    process.env.NODE_ENV !== 'production' &&
    ownerCount > 0 &&
    !warnedAboutMultipleStoreOwners.has(store)
  ) {
    warnedAboutMultipleStoreOwners.add(store);
    console.warn(
      'Base UI: A popup handle was attached to more than one mounted popup at the same time. ' +
        'A handle store can only have one mounted owner because shared popup state, ' +
        'Floating UI context, and callbacks are overwritten by the most recently mounted owner. ' +
        'Render only one popup for each handle.',
    );
  }

  storeOwnerCount.set(store, ownerCount + 1);

  return () => {
    const count = storeOwnerCount.get(store) ?? 0;
    if (count <= 1) {
      storeOwnerCount.delete(store);
    } else {
      storeOwnerCount.set(store, count - 1);
    }
  };
}

export function markStoreOwnerlessOpen(store: ReactStore<any, any, any>) {
  if (!hasStoreOwner(store)) {
    storesWithPendingOwnerlessOpen.add(store);
  }
}

export function clearStoreOwnerlessOpen(store: ReactStore<any, any, any>) {
  storesWithPendingOwnerlessOpen.delete(store);
}

export function markStoreUnassociatedOpen(store: ReactStore<any, any, any>) {
  storesWithUnassociatedOpen.add(store);
}

export function clearStoreUnassociatedOpen(store: ReactStore<any, any, any>) {
  storesWithUnassociatedOpen.delete(store);
}

function hasPendingOwnerlessOpen(store: ReactStore<any, any, any>) {
  return storesWithPendingOwnerlessOpen.has(store);
}

function hasUnassociatedOpen(store: ReactStore<any, any, any>) {
  return storesWithUnassociatedOpen.has(store);
}

function resetFloatingRootContext<State extends PopupStoreState<unknown>>(state: State) {
  state.floatingRootContext.context.dataRef.current = {};
}

// Builds the state a newly adopting owner should see on its first render. This is usually the
// owner's initial state, but an ownerless imperative open is preserved so lazy-mounted popups can
// honor `handle.open()` calls made in the same event that mounts them.
function createAdoptionResetState<State extends PopupStoreState<unknown>>(
  externalStore: ReactStore<State, any, any>,
  initialState: Partial<State> | undefined,
  additionalResetState: Partial<State> | undefined,
): State {
  const preserveOwnerlessOpen =
    initialState?.openProp === undefined && hasPendingOwnerlessOpen(externalStore);

  return {
    ...externalStore.state,
    open: preserveOwnerlessOpen ? externalStore.state.open : (initialState?.open ?? false),
    openProp: initialState?.openProp,
    mounted: false,
    transitionStatus: undefined,
    activeTriggerId: preserveOwnerlessOpen
      ? externalStore.state.activeTriggerId
      : (initialState?.activeTriggerId ?? null),
    activeTriggerElement: preserveOwnerlessOpen ? externalStore.state.activeTriggerElement : null,
    triggerIdProp: initialState?.triggerIdProp,
    payload: preserveOwnerlessOpen ? externalStore.state.payload : initialState?.payload,
    preventUnmountingOnClose: false,
    ...additionalResetState,
  };
}

function updateAdoptionState<State extends PopupStoreState<unknown>>(
  adoption: AdoptionState<State, ReactStore<State, any, any>>,
  changes: Partial<State>,
) {
  for (const key in changes) {
    if (!Object.is(adoption.state[key], changes[key])) {
      adoption.state = { ...adoption.state, ...changes };
      return;
    }
  }
}

function createAdoptionProxy<
  State extends PopupStoreState<unknown>,
  Store extends ReactStore<State, any, any>,
>(externalStore: Store, state: State): AdoptionState<State, Store> {
  const adoption: AdoptionState<State, Store> = {
    target: externalStore,
    proxy: null as any,
    state,
    context: { ...externalStore.context },
    committed: false,
  };

  // During an adoption render, the owner needs to read and write the reset state immediately.
  // If React abandons that render, those writes must be abandoned too. The proxy gives the
  // adopting tree a local view until `commitAdoption` copies the final state to the real store.
  adoption.proxy = new Proxy(externalStore, {
    get(target, prop, receiver) {
      if (prop === 'state') {
        return adoption.committed ? target.state : adoption.state;
      }

      if (prop === 'context') {
        return adoption.committed ? target.context : adoption.context;
      }

      if (prop === 'getSnapshot') {
        return () => (adoption.committed ? target.getSnapshot() : adoption.state);
      }

      if (prop === 'setState') {
        return (nextState: State) => {
          if (adoption.committed) {
            target.setState(nextState);
          } else if (adoption.state !== nextState) {
            adoption.state = nextState;
          }
        };
      }

      if (prop === 'update') {
        return (changes: Partial<State>) => {
          if (adoption.committed) {
            target.update(changes);
          } else {
            updateAdoptionState(adoption, changes);
          }
        };
      }

      if (prop === 'set') {
        return <Key extends keyof State>(key: Key, value: State[Key]) => {
          if (adoption.committed) {
            target.set(key, value);
          } else if (!Object.is(adoption.state[key], value)) {
            adoption.state = { ...adoption.state, [key]: value };
          }
        };
      }

      if (prop === 'notifyAll') {
        return () => {
          if (adoption.committed) {
            target.notifyAll();
          }
        };
      }

      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      if (prop === 'state' && !adoption.committed) {
        adoption.state = value;
        return true;
      }

      return Reflect.set(target, prop, value, receiver);
    },
  }) as Store;

  if (hasUnassociatedOpen(externalStore)) {
    markStoreUnassociatedOpen(adoption.proxy);
  }

  return adoption;
}

function commitAdoption<
  State extends PopupStoreState<unknown>,
  Store extends ReactStore<State, any, any>,
>(adoption: AdoptionState<State, Store>, onAdoptCommit: ((store: Store) => void) | undefined) {
  const { target } = adoption;

  // From this point the adopting owner is committed, so the handle store can become observable to
  // detached triggers, imperative reads, and future owners.
  resetFloatingRootContext(adoption.state);
  Object.assign(target.context, adoption.context);
  onAdoptCommit?.(target);
  if (!hasPendingOwnerlessOpen(target)) {
    clearStoreUnassociatedOpen(target);
  }
  clearStoreOwnerlessOpen(target);
  adoption.committed = true;
  if (target.state === adoption.state) {
    target.notifyAll();
  } else {
    target.setState(adoption.state);
  }
}

/**
 * Resets the open-cycle state of a handle-owned (external) store when an owner adopts it.
 *
 * A handle-owned store outlives the component that owns the popup, so it can carry open-cycle
 * state left over from a previously unmounted owner (e.g. one unmounted while open on navigation),
 * or state written by trigger interactions that fired while no owner was mounted. Resetting on
 * adoption makes the popup start from the adopting owner's initial state, just like an internal store
 * (which is recreated on each mount). Resetting to `initialState` (rather than a hardcoded
 * closed state) keeps `defaultOpen` intact; the controlled `open`/`triggerId` props are
 * re-applied by the owner via `useControlledProp`. Trigger registrations are untouched;
 * active-trigger fields are reset and re-derived from the still-mounted triggers.
 * See https://github.com/mui/base-ui/issues/4951
 *
 * Only the open-cycle fields of the base `PopupStoreState` are reset by default. Fields added by
 * concrete stores are not visible here — pass them via `additionalResetState`. Each store forwards
 * its own open-cycle fields (those written while opening/closing, e.g. `openMethod`,
 * `openChangeReason`, `instantType`, `stickIfOpen`) so that an initially open adoption (`defaultOpen`
 * or controlled `open`), which becomes open from `initialState` without a fresh `setOpen()` call,
 * does not inherit stale focus/modal/scroll-lock/transition metadata from the previous owner's open
 * cycle. A field whose stale value is read during the adopting owner's first render (before the
 * owner's layout-effect syncs run) must be reset here, not relied on to be re-synced afterwards.
 * Config fields the owner re-applies from its props (e.g. `modal`, `disabled`) and trigger
 * registration are left untouched.
 *
 * Explicit ownerless handle opens are replayed by the adopting owner so lazy-mounting a popup after
 * calling `handle.open()`/`openWithPayload()` keeps working. Trigger/timer writes that fire after a
 * previous owner unmounts are still discarded.
 *
 * @param externalStore The handle-owned store being adopted, or `undefined` when the owner uses an
 * internal store (in which case the hook does nothing).
 * @param initialState The adopting owner's initial state; the open-cycle fields are reset to the
 * values it carries (`defaultOpen`, controlled props, default trigger) rather than a hardcoded
 * closed state.
 * @param additionalResetState Extra reset values for open-cycle fields that concrete stores add on
 * top of the base `PopupStoreState`, applied after (and overriding) the base reset fields.
 */
export function useAdoptedStoreReset<
  State extends PopupStoreState<unknown>,
  Store extends ReactStore<State, any, any>,
>(
  externalStore: Store | undefined,
  initialState: Partial<State> | undefined,
  additionalResetState?: Partial<State>,
  onAdoptCommit?: ((store: Store) => void) | undefined,
) {
  const committedExternalStoreRef = React.useRef<Store | undefined>(undefined);
  const adoptionRef = React.useRef<AdoptionState<State, Store> | null>(null);

  let store = externalStore;
  const shouldAdopt =
    externalStore !== undefined && committedExternalStoreRef.current !== externalStore;

  if (shouldAdopt && externalStore !== undefined) {
    const resetState = createAdoptionResetState(externalStore, initialState, additionalResetState);
    // When no owner claims the handle, there is no committed popup tree for this store to corrupt.
    // Updating the target preserves first-render reads through `handle.store`; owned stores use
    // only the proxy until the adopting render commits.
    if (!hasStoreOwner(externalStore)) {
      externalStore.state = resetState;
    }

    let adoption = adoptionRef.current;
    if (adoption?.target !== externalStore || adoption.committed) {
      adoption = createAdoptionProxy(externalStore, resetState);
      adoptionRef.current = adoption;
    } else {
      adoption.state = resetState;
      adoption.context = { ...externalStore.context };
    }

    store = adoption.proxy;
  }

  useIsoLayoutEffect(() => {
    if (externalStore === undefined) {
      committedExternalStoreRef.current = undefined;
      adoptionRef.current = null;
      return undefined;
    }

    const adoption = adoptionRef.current;
    if (adoption?.target === externalStore && !adoption.committed) {
      commitAdoption(adoption, onAdoptCommit);
    }

    committedExternalStoreRef.current = externalStore;
    const unregisterOwner = registerStoreOwner(externalStore);

    return unregisterOwner;
  }, [externalStore, onAdoptCommit]);

  return store;
}

export function usePopupStore<
  State extends PopupStoreState<unknown>,
  SetOpenEventDetails extends BaseUIChangeEventDetails<string>,
  Store extends PopupStoreWithOpen<State, SetOpenEventDetails>,
>(
  externalStore: Store | undefined,
  createStore: (floatingId: string | undefined, nested: boolean) => Store,
  initialState?: Partial<State>,
  additionalResetState?: Partial<State>,
  treatPopupAsFloatingElement = false,
  onAdoptCommit?: ((store: Store) => void) | undefined,
) {
  const floatingId = useId();
  const nested = useFloatingParentNodeId() != null;

  const internalStoreRef = React.useRef<Store | null>(null);
  if (externalStore === undefined && internalStoreRef.current === null) {
    internalStoreRef.current = createStore(floatingId, nested);
  }

  const adoptedExternalStore = useAdoptedStoreReset(
    externalStore,
    initialState,
    additionalResetState,
    onAdoptCommit,
  );
  const store = adoptedExternalStore ?? internalStoreRef.current!;

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
  preventUnmountOnClose = false,
) {
  if (open) {
    // Opening starts a new close cycle, so clear any previous request to keep the popup mounted.
    state.preventUnmountingOnClose = false;
  } else if (preventUnmountOnClose) {
    state.preventUnmountingOnClose = true;
  }

  const triggerId = trigger?.id ?? null;

  // If a popup is closing, the `trigger` may be undefined.
  // We want to keep the previous value so that exit animations are played and focus is returned correctly.
  if (triggerId || open) {
    state.activeTriggerId = triggerId;
    state.activeTriggerElement = trigger ?? null;
  }
}

const DOCUMENT_POSITION_DISCONNECTED = 1;
const DOCUMENT_POSITION_FOLLOWING = 4;

function getFirstTriggerEntry(
  triggerElements: PopupStoreContext<never>['triggerElements'],
): [string, Element] | null {
  let firstEntry: [string, Element] | null = null;

  for (const entry of triggerElements.entries()) {
    const [, element] = entry;

    if (firstEntry === null) {
      firstEntry = entry;
      continue;
    }

    const currentFirstElement = firstEntry[1];
    const position = element.compareDocumentPosition(currentFirstElement);
    // compareDocumentPosition returns a bitmask.
    // eslint-disable-next-line no-bitwise
    const isDisconnected = (position & DOCUMENT_POSITION_DISCONNECTED) !== 0;
    // eslint-disable-next-line no-bitwise
    const isFollowing = (position & DOCUMENT_POSITION_FOLLOWING) !== 0;
    const isBeforeCurrentFirst = !isDisconnected && isFollowing;

    if (isBeforeCurrentFirst) {
      firstEntry = entry;
    }
  }

  return firstEntry;
}

export function attachPreventUnmountOnClose(eventDetails: { preventUnmountOnClose(): void }) {
  let preventUnmountOnClose = false;

  eventDetails.preventUnmountOnClose = () => {
    preventUnmountOnClose = true;
  };

  return () => preventUnmountOnClose;
}

/**
 * Runs the shared open-change sequence for a popup store: notifies `onOpenChange`,
 * honors cancellation, dispatches the floating root change, maps the reason to an
 * `instantType`, and commits the state update (synchronously for hover so
 * `getAnimations()` observes it). Stores supply their own differences via
 * `extraState` (e.g. the last change reason) and `onBeforeDispatch` (e.g. updating
 * inline-rect coordinates).
 */
export function applyPopupOpenChange<
  State extends PopupStoreState<unknown> & {
    instantType?: 'delay' | 'dismiss' | 'focus' | undefined;
  },
  EventDetails extends BaseUIChangeEventDetails<string>,
>(
  store: {
    readonly context: Pick<PopupStoreContext<EventDetails>, 'onOpenChange'>;
    readonly state: Pick<PopupStoreState<unknown>, 'floatingRootContext'>;
    update(state: Partial<State>): void;
  },
  nextOpen: boolean,
  eventDetails: EventDetails & { preventUnmountOnClose(): void },
  options: {
    onBeforeDispatch?: (() => void) | undefined;
    extraState?: Partial<State> | undefined;
  } = {},
): void {
  const reason = eventDetails.reason;
  const isHover = reason === REASONS.triggerHover;
  const isFocusOpen = nextOpen && reason === REASONS.triggerFocus;
  const isDismissClose =
    !nextOpen && (reason === REASONS.triggerPress || reason === REASONS.escapeKey);

  const shouldPreventUnmountOnClose = attachPreventUnmountOnClose(eventDetails);

  store.context.onOpenChange?.(nextOpen, eventDetails);

  if (eventDetails.isCanceled) {
    return;
  }

  options.onBeforeDispatch?.();

  store.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);

  const changeState = () => {
    // Spread `extraState` first so `open` always reflects `nextOpen`, keeping it in
    // sync with the value already passed to `dispatchOpenChange`/`setPopupOpenState`.
    const updatedState: Partial<PopupStoreState<unknown>> & {
      instantType?: 'delay' | 'dismiss' | 'focus' | undefined;
    } = { ...options.extraState, open: nextOpen };

    if (isFocusOpen) {
      updatedState.instantType = 'focus';
    } else if (isDismissClose) {
      updatedState.instantType = 'dismiss';
    } else if (isHover) {
      updatedState.instantType = undefined;
    }

    setPopupOpenState(updatedState, nextOpen, eventDetails.trigger, shouldPreventUnmountOnClose());
    store.update(updatedState as Partial<State>);
  };

  if (isHover) {
    // Flush synchronously for hover so `node.getAnimations()` sees the new state.
    ReactDOM.flushSync(changeState);
  } else {
    changeState();
  }
}

export function useInitialOpenSync<State extends PopupStoreState<unknown>>(
  store: ReactStore<State, PopupStoreContext<never>, PopupStoreSelectors>,
  openProp: boolean | undefined,
  defaultOpen: boolean,
  defaultTriggerId: string | null,
) {
  useOnFirstRender(() => {
    if (openProp === undefined && store.state.open === false && defaultOpen) {
      // Avoid notifying detached trigger subscribers while the Root is rendering.
      store.state = {
        ...store.state,
        open: true,
        activeTriggerId: defaultTriggerId,
        preventUnmountingOnClose: false,
      };
    }
  });
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
 * Keeps trigger registration state synchronized while the popup is open.
 *
 * When a popup opens without an explicit trigger id and exactly one trigger is registered, that
 * trigger is claimed as the active trigger. When the active trigger id is still registered but its
 * element changed, the active element is refreshed. When the active trigger unregisters, the
 * default path preserves existing ownership so non-closing popup families do not silently claim a
 * different trigger while staying open.
 *
 * If `closeOnActiveTriggerUnmount` is enabled, unregistering the active trigger requests a close
 * after a microtask so a same-tick replacement trigger with the same id can register first.
 *
 * This should be called on the Root part.
 *
 * @param store The Store instance managing the popup state.
 * @param options Options for active trigger unmount behavior.
 */
export function useImplicitActiveTrigger<State extends PopupStoreState<unknown>>(
  store: PopupStoreWithOpen<State, BaseUIChangeEventDetails<typeof REASONS.none>>,
  options: {
    closeOnActiveTriggerUnmount?: boolean | undefined;
  } = {},
) {
  const { closeOnActiveTriggerUnmount = false } = options;
  const open = store.useState('open');
  const reactiveTriggerCount = store.useState('triggerCount');

  useIsoLayoutEffect(() => {
    if (!open) {
      clearStoreUnassociatedOpen(store);

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

    const activeTriggerId = store.select('activeTriggerId');
    let lostActiveTriggerId: string | null = null;

    if (activeTriggerId) {
      const activeTriggerElement = store.context.triggerElements.getById(activeTriggerId);
      if (!activeTriggerElement) {
        lostActiveTriggerId = activeTriggerId;
      } else if (activeTriggerElement !== store.state.activeTriggerElement) {
        stateUpdates.activeTriggerElement = activeTriggerElement;
      }
    }

    if (
      !lostActiveTriggerId &&
      !activeTriggerId &&
      triggerCount > 0 &&
      !hasUnassociatedOpen(store)
    ) {
      // Ownerless opens such as `defaultOpen` do not have an event target to identify the trigger.
      // Choose the first registered trigger in document order after registration has settled for this
      // commit, rather than depending on callback ref ordering.
      const firstTriggerEntry = getFirstTriggerEntry(store.context.triggerElements);
      if (firstTriggerEntry) {
        const [implicitTriggerId, implicitTriggerElement] = firstTriggerEntry;
        stateUpdates.activeTriggerId = implicitTriggerId;
        stateUpdates.activeTriggerElement = implicitTriggerElement;
      }
    }

    if (
      stateUpdates.triggerCount !== undefined ||
      stateUpdates.activeTriggerId !== undefined ||
      stateUpdates.activeTriggerElement !== undefined
    ) {
      store.update(stateUpdates as Partial<State>);
    }

    if (lostActiveTriggerId) {
      if (closeOnActiveTriggerUnmount) {
        // Defer so a same-tick replacement trigger with the same id can register first.
        queueMicrotask(() => {
          if (
            store.select('open') &&
            store.select('activeTriggerId') === lostActiveTriggerId &&
            !store.context.triggerElements.getById(lostActiveTriggerId)
          ) {
            const eventDetails = createChangeEventDetails(REASONS.none);
            store.setOpen(false, eventDetails);
            // If closing is canceled, keep the previous active trigger ownership for the
            // still-open popup instead of claiming another trigger implicitly.
            if (!eventDetails.isCanceled) {
              store.update({
                activeTriggerId: null,
                activeTriggerElement: null,
              } as Partial<State>);
            }
          }
        });
      }
    }
  }, [open, store, reactiveTriggerCount, closeOnActiveTriggerUnmount]);
}

/**
 * Manages the mounted state of the popup.
 * Sets up the transition status listeners and handles unmounting when needed.
 * Updates the `mounted`, `transitionStatus`, and `preventUnmountingOnClose` states in the store.
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
  // Opening starts a new close cycle. Clear during render so the close-completion hook below
  // reads the synchronized value on the same pass.
  const syncedPreventUnmountingOnClose = open ? false : preventUnmountingOnClose;

  store.useSyncedValues({
    mounted,
    transitionStatus,
    preventUnmountingOnClose: syncedPreventUnmountingOnClose,
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
    enabled: mounted && !open && !syncedPreventUnmountingOnClose,
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
