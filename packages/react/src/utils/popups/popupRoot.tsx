'use client';
import * as React from 'react';
import type { ReactStore } from '@base-ui/utils/store';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useFloatingParentNodeId } from './tree/FloatingTree';
import { useUnmountAfterClose } from '../../internals/useUnmountAfterClose';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type {
  PopupStoreState,
  PopupStoreContext,
  popupStoreSelectors,
  PopupTriggerDataStore,
} from './store';

type PopupStoreWithOpen<
  State extends PopupStoreState<unknown>,
  SetOpenEventDetails extends BaseUIChangeEventDetails<string>,
> = PopupTriggerDataStore<State> &
  Pick<
    ReactStore<Readonly<State>, PopupStoreContext<never>, typeof popupStoreSelectors>,
    'useSyncedValue'
  > & {
    setOpen(open: boolean, eventDetails: SetOpenEventDetails): void;
  };

/**
 * The subset of a popup handle that a Root needs to bind its store to. Both the real handle classes
 * and any test double satisfy it.
 */
export interface PopupRootStoreHandle<Store> {
  attachStore(store: Store): () => void;
}

/**
 * Creates and owns a popup store on behalf of a Root part. The store is created exactly once, with
 * controlled props and root state synced separately after creation. Keeps the floating id and
 * whether the popup is nested current, and returns the store.
 *
 * @param createStore Factory that builds the store. Called exactly once, receiving the floating id
 * and whether the popup is nested inside another floating element, both resolved on the first render.
 */
export function usePopupRootStore<
  State extends PopupStoreState<unknown>,
  SetOpenEventDetails extends BaseUIChangeEventDetails<string>,
  Store extends PopupStoreWithOpen<State, SetOpenEventDetails>,
>(createStore: (floatingId: string | undefined, nested: boolean) => Store): Store {
  const floatingId = useId();
  const nested = useFloatingParentNodeId() != null;

  const store = useRefWithInit(() => createStore(floatingId, nested)).current;

  store.useSyncedValue('floatingId', floatingId as State['floatingId']);
  store.context.nested = nested;

  return store;
}

/**
 * Attaches a Root's store to a handle for this component's committed lifetime. Popup Roots render
 * it before their interactions and user children so its layout effect runs before descendant layout
 * effects. This lets descendants call the handle during the Root's initial commit without attaching
 * during render, which would leak suspended or abandoned stores. Store subscribers are notified by
 * `attachStore` in this ordinary layout phase, where React permits synchronous updates.
 *
 * Popup Roots must render this component only when a handle is present so handle-less Roots avoid
 * mounting an extra fiber and layout effect.
 */
export function PopupHandleAttachment<Store>({
  handle,
  store,
}: {
  handle: PopupRootStoreHandle<Store>;
  store: Store;
}) {
  useIsoLayoutEffect(() => {
    return handle.attachStore(store);
  }, [handle, store]);

  return null;
}

export type PayloadChildRenderFunction<Payload> = (arg: {
  payload: Payload | undefined;
}) => React.ReactNode;

/**
 * Keeps trigger registration state synchronized while the popup is open.
 *
 * When a popup opens without an explicit trigger id and exactly one trigger is registered, that
 * trigger is claimed as the active trigger, unless the open request deliberately carried no trigger
 * (`openedWithoutTrigger`). When the active trigger id is still registered but its
 * element changed, the active element is refreshed. When the active trigger id is missing from the
 * registry but the same element is still registered under a different id (e.g. the rendered trigger
 * carries its own DOM `id` that differs from Base UI's internal trigger id), the active id is
 * reassociated to the registered id instead of being treated as lost. When the active trigger
 * unregisters, the default path preserves existing ownership so non-closing popup families do not
 * silently claim a different trigger while staying open.
 *
 * If `closeOnActiveTriggerUnmount` is enabled, unregistering a previously resolved active trigger
 * requests a close after a microtask so a same-tick replacement trigger with the same id can
 * register first. An active trigger id that has not matched a registered trigger yet is treated as
 * pending and does not request a close.
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
  // Distinguishes a trigger that unmounted from a new active trigger that has not hydrated yet.
  const resolvedActiveTriggerIdRef = React.useRef<string | null>(null);
  const open = store.useState('open');
  const reactiveTriggerCount = store.useState('triggerCount');
  // Subscribe to the active trigger id so the reconciliation below reruns when ownership moves to
  // another trigger while the popup stays open (e.g. a focus/hover handoff between triggers).
  const activeTriggerId = store.useState('activeTriggerId');
  // Subscribe to the active trigger element so the reconciliation reruns when a pending active
  // trigger registers in a commit where the trigger count nets out unchanged (registration
  // forwards the element to the store when the registering trigger matches the active id).
  // Without this, the id would never be marked resolved and a later genuine unmount would be
  // misclassified as pending, disabling `closeOnActiveTriggerUnmount`.
  const reactiveActiveTriggerElement = store.useState('activeTriggerElement');

  useIsoLayoutEffect(() => {
    if (!open) {
      resolvedActiveTriggerIdRef.current = null;
      if (store.state.triggerCount !== 0) {
        store.set('triggerCount', 0);
      }
      // The flag is cleared only here, once the popup is effectively closed: a controlled root may
      // decline a close request and stay open, and a controlled close never reaches
      // `createPopupOpenState` at all.
      if (store.state.openedWithoutTrigger) {
        store.set('openedWithoutTrigger', false);
      }
      return;
    }

    const triggerCount = store.context.triggerElements.size;
    const stateUpdates = {} as Pick<
      State,
      'triggerCount' | 'activeTriggerId' | 'activeTriggerElement'
    >;

    if (store.state.triggerCount !== triggerCount) {
      stateUpdates.triggerCount = triggerCount;
    }

    const currentActiveTriggerId = store.select('activeTriggerId');
    let lostActiveTriggerId: string | null = null;

    if (currentActiveTriggerId) {
      const activeTriggerElement = store.context.triggerElements.getById(currentActiveTriggerId);
      if (!activeTriggerElement) {
        for (const [triggerId, triggerElement] of store.context.triggerElements.entries()) {
          if (triggerElement === store.state.activeTriggerElement) {
            stateUpdates.activeTriggerId = triggerId;
            stateUpdates.activeTriggerElement = triggerElement;
            resolvedActiveTriggerIdRef.current = triggerId;
            break;
          }
        }

        if (stateUpdates.activeTriggerId === undefined) {
          if (resolvedActiveTriggerIdRef.current === currentActiveTriggerId) {
            lostActiveTriggerId = currentActiveTriggerId;
          } else {
            resolvedActiveTriggerIdRef.current = null;
          }
        }
      } else {
        resolvedActiveTriggerIdRef.current = currentActiveTriggerId;
        if (activeTriggerElement !== store.state.activeTriggerElement) {
          stateUpdates.activeTriggerElement = activeTriggerElement;
        }
      }
    } else {
      resolvedActiveTriggerIdRef.current = null;
    }

    if (
      !lostActiveTriggerId &&
      !currentActiveTriggerId &&
      !store.state.openedWithoutTrigger &&
      triggerCount === 1
    ) {
      const iteratorResult = store.context.triggerElements.entries().next();
      if (!iteratorResult.done) {
        const [implicitTriggerId, implicitTriggerElement] = iteratorResult.value;
        stateUpdates.activeTriggerId = implicitTriggerId;
        stateUpdates.activeTriggerElement = implicitTriggerElement;
        resolvedActiveTriggerIdRef.current = implicitTriggerId;
      }
    }

    if (
      stateUpdates.triggerCount !== undefined ||
      stateUpdates.activeTriggerId !== undefined ||
      stateUpdates.activeTriggerElement !== undefined
    ) {
      store.update(stateUpdates);
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
              });
            }
          }
        });
      }
    }
  }, [
    open,
    store,
    reactiveTriggerCount,
    activeTriggerId,
    reactiveActiveTriggerElement,
    closeOnActiveTriggerUnmount,
  ]);
}

/**
 * Manages the mounted state of the popup.
 * Sets up the transition status listeners and handles unmounting when needed.
 * Updates the `mounted`, `transitionStatus`, and `preventUnmountingOnClose` states in the store.
 *
 * @param open Whether the popup is open.
 * @param store The Store instance managing the popup state. It resets its open session through
 *   `resetOnUnmount` once the popup unmounts.
 * @param animateInitialOpen Whether a popup that mounts already open should still play its enter
 *   transition. Defaults to `false`, so content that was open on the first render (a `defaultOpen`
 *   popup on page load, SSR'd markup) appears without animating. Opt in for popups whose subtree
 *   only mounts in response to something the user did, such as a submenu inside a menu popup.
 *
 * @returns A function to forcibly unmount the popup. It is a no-op once the popup is already
 *   unmounted, so calling it after the automatic unmount doesn't repeat the completion callback.
 */
export function useOpenStateTransitions<State extends PopupStoreState<unknown>>(
  open: boolean,
  store: ReactStore<State, PopupStoreContext<never>, typeof popupStoreSelectors> & {
    resetOnUnmount(): void;
  },
  animateInitialOpen?: boolean,
) {
  const { mounted, transitionStatus, forceUnmount } = useUnmountAfterClose({
    open,
    ref: store.context.popupRef,
    preventUnmountOnClose: store.useState('preventUnmountingOnClose'),
    setPreventUnmountOnClose: (preventUnmountOnClose) =>
      store.set('preventUnmountingOnClose', preventUnmountOnClose),
    animateInitialOpen,
    onUnmount() {
      store.resetOnUnmount();
      store.context.onOpenChangeComplete?.(false);
    },
  });

  // Seed the Root-owned store before parts subscribe, matching the hook's initial mounted state.
  // Otherwise, an initially open Root looks like a reopen until the layout effect syncs the store.
  useRefWithInit(() => {
    store.set('mounted', mounted);
    return null;
  });

  store.useSyncedValues({ mounted, transitionStatus });

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
