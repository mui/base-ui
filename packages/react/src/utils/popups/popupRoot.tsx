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
  PopupStoreSelectors,
  popupStoreSelectors,
  PopupTriggerDataStore,
} from './store';
import { createTriggerOwnership, settleTriggerOwnership } from './triggerOwnership';
import type { TriggerOwnershipState } from './triggerOwnership';

/**
 * The props every popup Root shares.
 */
export interface PopupRootProps<Store extends PopupRootStore> {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: Store['context']['onOpenChange'] | undefined;
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  actionsRef?: React.RefObject<PopupRootActions | null> | undefined;
  triggerId?: string | null | undefined;
  defaultTriggerId?: string | null | undefined;
}

export interface PopupRootActions {
  unmount: () => void;
  close: () => void;
}

/**
 * The store state a popup Root derives from its props when it creates the store.
 */
export type PopupRootInitialState = Pick<
  PopupStoreState<unknown>,
  'open' | 'openProp' | 'triggerIdProp'
> &
  TriggerOwnershipState;

export interface UsePopupRootOptions {
  /**
   * Whether the popup closes when its active trigger unmounts.
   * @default false
   */
  closeOnActiveTriggerUnmount?: boolean | undefined;
  /**
   * Whether a popup that mounts already open still plays its enter transition.
   * See `useOpenStateTransitions`.
   * @default false
   */
  animateInitialOpen?: boolean | undefined;
  /**
   * Whether the popup renders as closed. Its open state in the store is left as it is.
   * @default false
   */
  disabled?: boolean | undefined;
}

/**
 * The popup store members a popup Root relies on.
 */
type PopupRootStore = ReactStore<
  PopupStoreState<unknown>,
  PopupStoreContext<never>,
  PopupStoreSelectors
> & {
  setOpen(
    open: boolean,
    eventDetails: BaseUIChangeEventDetails<typeof REASONS.imperativeAction | typeof REASONS.none>,
  ): void;
  resetOnUnmount(): void;
};

/**
 * Runs what every popup Root does for its popup, in the order it needs: it creates the store,
 * syncs the controlled props and callbacks, keeps the active trigger current, runs the open and
 * close transitions, and exposes the `actionsRef` actions.
 *
 * @param props The props every popup Root shares.
 * @param createStore Builds the store exactly once, from the state the props describe and the
 *   default popup id. The store belongs to the Root, not to its handle: the handle attaches to it,
 *   so swapping the handle re-attaches rather than recreating state. The props only seed it;
 *   controlled props are synced after creation.
 * @param options What differs between popup Roots.
 * @returns The store, and the open and mounted state, payload and transition status it renders.
 */
export function usePopupRoot<Store extends PopupRootStore>(
  props: PopupRootProps<Store>,
  createStore: (initialState: PopupRootInitialState, defaultPopupId: string | undefined) => Store,
  options: UsePopupRootOptions = {},
) {
  const defaultPopupId = useId();
  return usePopupRootWithPopupId(props, createStore, defaultPopupId, options);
}

/**
 * `usePopupRoot` for a Root that supplies its own default popup id instead of a generated one.
 *
 * @param defaultPopupId The default popup id, or `undefined` to leave the popup without one.
 */
export function usePopupRootWithPopupId<Store extends PopupRootStore>(
  props: PopupRootProps<Store>,
  createStore: (initialState: PopupRootInitialState, defaultPopupId: string | undefined) => Store,
  defaultPopupId: string | undefined,
  options: UsePopupRootOptions = {},
) {
  const {
    open: openProp,
    defaultOpen = false,
    triggerId: triggerIdProp,
    defaultTriggerId = null,
  } = props;
  const {
    closeOnActiveTriggerUnmount = false,
    animateInitialOpen = false,
    disabled = false,
  } = options;

  const store = usePopupRootStore(
    (initialPopupId) =>
      createStore(
        {
          open: defaultOpen,
          openProp,
          triggerIdProp,
          ...createTriggerOwnership(defaultTriggerId),
        },
        initialPopupId,
      ),
    defaultPopupId,
  );

  const transitionOpen = usePopupRootOpenState(store, props, disabled);
  store.useControlledProp('triggerIdProp', triggerIdProp);
  // Root logic reads the open state from the store, in step with the active trigger and the other
  // values it syncs there. Only the transitions read the controlled prop as soon as it changes.
  const openState = store.useState('open');
  const open = !disabled && openState;
  const mounted = store.useState('mounted');
  const payload = store.useState('payload') as Store['state']['payload'];

  useSettleTriggerOwnership(store, { closeOnActiveTriggerUnmount });
  const transitionStatus = usePopupRootTransitions(
    store,
    transitionOpen,
    props,
    animateInitialOpen,
  );

  return { store, open, mounted, payload, transitionStatus };
}

/**
 * `usePopupRoot` for a popup that has a single anchor and no triggers to track, such as a Select
 * or a Combobox: it leaves out the trigger props and the active trigger.
 *
 * @param popupRef The element whose closing animations are awaited before the popup unmounts.
 *   Defaults to the store's `popupRef`.
 */
export function useSingleAnchorPopupRoot<Store extends PopupRootStore>(
  props: Omit<PopupRootProps<Store>, 'triggerId' | 'defaultTriggerId'>,
  createStore: (initialState: PopupRootInitialState, defaultPopupId: string | undefined) => Store,
  popupRef?: React.RefObject<HTMLElement | null>,
) {
  const { open: openProp, defaultOpen = false } = props;

  const store = usePopupRootStore(
    (initialPopupId) =>
      createStore(
        {
          open: defaultOpen,
          openProp,
          triggerIdProp: undefined,
          ...createTriggerOwnership(),
        },
        initialPopupId,
      ),
    useId(),
  );

  const open = usePopupRootOpenState(store, props, false);
  const transitionStatus = usePopupRootTransitions(store, open, props, false, popupRef);

  return { store, open, transitionStatus };
}

/**
 * Syncs the controlled `open` prop and the open change callbacks, and returns whether the popup
 * renders as open.
 */
function usePopupRootOpenState<Store extends PopupRootStore>(
  store: Store,
  props: Pick<PopupRootProps<Store>, 'open' | 'onOpenChange' | 'onOpenChangeComplete'>,
  disabled: boolean,
) {
  const { open: openProp, onOpenChange, onOpenChangeComplete } = props;

  store.useControlledProp('openProp', openProp);

  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  const openState = store.useState('open');
  // The store receives a controlled `open` prop in a layout effect, a commit after the Root renders
  // with it, so the transitions read the prop itself.
  return !disabled && (openProp ?? openState);
}

/**
 * Runs the open and close transitions and exposes the `actionsRef` actions.
 */
function usePopupRootTransitions<Store extends PopupRootStore>(
  store: Store,
  open: boolean,
  props: Pick<PopupRootProps<Store>, 'open' | 'actionsRef'>,
  animateInitialOpen: boolean,
  popupRef?: React.RefObject<HTMLElement | null>,
) {
  const { forceUnmount, transitionStatus } = useOpenStateTransitions(
    open,
    store,
    props.open,
    animateInitialOpen,
    popupRef,
  );

  React.useImperativeHandle(
    props.actionsRef,
    () => ({
      unmount: forceUnmount,
      close: () => store.setOpen(false, createChangeEventDetails(REASONS.imperativeAction)),
    }),
    [forceUnmount, store],
  );

  return transitionStatus;
}

/**
 * Renders what a popup Root renders inside its context provider, in the order it needs:
 *
 * 1. The handle attachment, so its layout effect runs before its descendants' and they can call the
 *    handle during the Root's initial commit.
 * 2. The interactions.
 * 3. `children`, called with the payload when it's a function.
 *
 * It's a plain function rather than a component, so it adds no fiber.
 */
export function renderPopupRootChildren<Store, Payload>(parameters: {
  store: Store;
  handle: PopupRootStoreHandle<Store> | undefined;
  interactions?: React.ReactNode;
  children: React.ReactNode | PayloadChildRenderFunction<Payload>;
  payload: Payload | undefined;
}) {
  const { store, handle, interactions, children, payload } = parameters;

  return (
    <React.Fragment>
      {handle && <PopupHandleAttachment handle={handle} store={store} />}
      {interactions}
      {typeof children === 'function' ? children({ payload }) : children}
    </React.Fragment>
  );
}

export type PayloadChildRenderFunction<Payload> = (arg: {
  payload: Payload | undefined;
}) => React.ReactNode;

/**
 * The subset of a popup handle that a Root needs to bind its store to. Both the real handle classes
 * and any test double satisfy it.
 */
interface PopupRootStoreHandle<Store> {
  attachStore(store: Store): () => void;
}

/**
 * Creates and owns a popup store on behalf of a Root part. The store is created exactly once, with
 * controlled props and root state synced separately after creation. Keeps the default popup id and
 * whether the popup is nested current, and returns the store.
 *
 * @param createStore Factory that builds the store. Called exactly once, receiving the default
 * popup id resolved on the first render.
 * @param defaultPopupId The default popup id, or `undefined` to leave the popup without one.
 */
function usePopupRootStore<Store extends PopupRootStore>(
  createStore: (defaultPopupId: string | undefined) => Store,
  defaultPopupId: string | undefined,
): Store {
  const nested = useFloatingParentNodeId() != null;

  const store = useRefWithInit(() => createStore(defaultPopupId)).current;

  store.useSyncedValue('defaultPopupId', defaultPopupId);
  store.context.nested = nested;

  return store;
}

/**
 * Attaches a Root's store to a handle for this component's committed lifetime. Rendered before the
 * Root's interactions and user children so its layout effect runs before descendant layout
 * effects. This lets descendants call the handle during the Root's initial commit without attaching
 * during render, which would leak suspended or abandoned stores. Store subscribers are notified by
 * `attachStore` in this ordinary layout phase, where React permits synchronous updates.
 *
 * Rendered only when a handle is present so handle-less Roots avoid mounting an extra fiber and
 * layout effect.
 */
function PopupHandleAttachment<Store>({
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

/**
 * Settles trigger ownership after every commit that changed the open state, the owner or the
 * trigger registry. See `settleTriggerOwnership` for the rules.
 *
 * If `closeOnActiveTriggerUnmount` is enabled, losing a resolved owner requests a close after a
 * microtask, so a same-tick replacement trigger with the same id can register first. If the close
 * is cancelled, the popup keeps its owner instead of claiming another trigger.
 *
 * Exported for tests; popup Roots run it through `usePopupRoot`.
 *
 * @param store The Store instance managing the popup state.
 * @param options Options for active trigger unmount behavior.
 */
export function useSettleTriggerOwnership<State extends PopupStoreState<unknown>>(
  store: PopupTriggerDataStore<State> & {
    setOpen(open: boolean, eventDetails: BaseUIChangeEventDetails<typeof REASONS.none>): void;
  },
  options: {
    closeOnActiveTriggerUnmount?: boolean | undefined;
  } = {},
) {
  const { closeOnActiveTriggerUnmount = false } = options;
  const open = store.useState('open');
  // Every registration change while open moves the registry version on, including a commit where
  // one trigger replaces another, so settling reruns after each of them.
  const registryVersion = store.useState('registryVersion');
  // Settle again when ownership moves to another trigger while the popup stays open (e.g. a
  // focus/hover handoff between triggers).
  const activeTriggerId = store.useState('activeTriggerId');

  useIsoLayoutEffect(() => {
    const registry = store.context.triggerElements;
    const { changes, lostTriggerId } = settleTriggerOwnership(
      store.state,
      registry,
      open,
      store.select('activeTriggerId'),
    );

    // Only the fields the rules set are present, so none of them is `undefined`.
    store.update(changes as Pick<Readonly<State>, keyof TriggerOwnershipState>);

    if (lostTriggerId && closeOnActiveTriggerUnmount) {
      // Defer so a same-tick replacement trigger with the same id can register first.
      queueMicrotask(() => {
        if (
          store.select('open') &&
          store.select('activeTriggerId') === lostTriggerId &&
          !registry.getById(lostTriggerId)
        ) {
          const eventDetails = createChangeEventDetails(REASONS.none);
          store.setOpen(false, eventDetails);
          // If closing is canceled, keep the previous active trigger ownership for the
          // still-open popup instead of claiming another trigger implicitly.
          if (!eventDetails.isCanceled) {
            store.update({ activeTriggerId: null, activeTriggerElement: null });
          }
        }
      });
    }
  }, [open, store, registryVersion, activeTriggerId, closeOnActiveTriggerUnmount]);
}

/**
 * Manages the mounted state of the popup.
 * Sets up the transition status listeners and handles unmounting when needed.
 * Updates the `mounted`, `transitionStatus`, and `preventUnmountingOnClose` states in the store.
 *
 * @param open Whether the popup is open.
 * @param store The Store instance managing the popup state. It resets its open session through
 *   `resetOnUnmount` once the popup unmounts.
 * @param openProp The Root's `open` prop. Pass the prop itself, not the store's `openProp`: the
 *   store only receives it in a layout effect, which is a commit too late for the reset below.
 * @param animateInitialOpen Whether a popup that mounts already open should still play its enter
 *   transition. Defaults to `false`, so content that was open on the first render (a `defaultOpen`
 *   popup on page load, SSR'd markup) appears without animating. Opt in for popups whose subtree
 *   only mounts in response to something the user did, such as a submenu inside a menu popup.
 * @param popupRef The element whose closing animations are awaited before unmounting.
 *
 * @returns The transition status, and a function to forcibly unmount the popup. That function is a
 *   no-op once the popup is already unmounted, so calling it after the automatic unmount doesn't
 *   repeat the completion callback.
 */
function useOpenStateTransitions<State extends PopupStoreState<unknown>>(
  open: boolean,
  store: ReactStore<State, PopupStoreContext<never>, typeof popupStoreSelectors> & {
    resetOnUnmount(): void;
  },
  openProp: boolean | undefined,
  animateInitialOpen?: boolean,
  popupRef: React.RefObject<HTMLElement | null> = store.context.popupRef,
) {
  // In controlled mode, `state.open` holds the last open-change request instead of the open state,
  // and a close through the prop doesn't reset it. Clear it in the commit that receives a closing
  // prop, so `true` on unmount means a request made since then. Parts read `open` through the store,
  // where the prop is synced in a layout effect, so none of them sees the popup as closed before
  // this runs.
  useIsoLayoutEffect(() => {
    if (openProp === false) {
      store.set('open', false);
    }
  }, [openProp, store]);

  const { mounted, transitionStatus, forceUnmount } = useUnmountAfterClose({
    open,
    ref: popupRef,
    // The popup part writes its element to the store as it attaches.
    subscribeToAttach: store.subscribe,
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
