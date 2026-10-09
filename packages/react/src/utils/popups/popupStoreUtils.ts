'use client';
import * as React from 'react';
import type { ReactStore } from '@base-ui/utils/store';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FOCUSABLE_ATTRIBUTE } from './constants';
import type { HTMLProps } from '../../internals/types';
import type {
  PopupStoreState,
  PopupStoreContext,
  popupStoreSelectors,
  PopupTriggerDataStore,
} from './store';
import {
  changeTriggerRegistry,
  claimOnRegister,
  claimSubmenuOnRegister,
  setOwnerElement,
} from './triggerOwnership';
import type { TriggerOwnershipChanges, TriggerOwnershipState } from './triggerOwnership';

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

/**
 * Commits ownership changes returned by the `triggerOwnership` module.
 */
export function updateTriggerOwnership(
  store: Pick<ReactStore<PopupStoreState<unknown>, any, any>, 'update'>,
  changes: TriggerOwnershipChanges,
  stateUpdates?: object | null,
) {
  // The module only returns the fields that change, so none of them is `undefined`.
  store.update({ ...changes, ...stateUpdates } as Pick<
    PopupStoreState<unknown>,
    keyof TriggerOwnershipState
  >);
}

function syncTriggerRegistry(store: PopupTriggerDataStore<PopupStoreState<unknown>>) {
  const changes = changeTriggerRegistry(
    store.state,
    store.context.triggerElements,
    store.select('open'),
  );
  if (changes) {
    updateTriggerOwnership(store, changes);
  }
}

/**
 * Returns a stable callback ref that registers/unregisters the trigger element in the store.
 *
 * Stable so a downstream ref merger that retains the callback it was first given still reaches the
 * trigger's current store. The registration is tracked as a `(store, id, element)` triple, so
 * unregistering targets the store the element was actually registered in.
 *
 * Since the callback never changes, the caller must re-run it from a layout effect keyed on
 * `[store, id]` to migrate an already-registered element. That effect is also what registers the
 * element in the first place when `id` only resolves after the first commit (React 17's `useId`
 * fallback), because the register call made while the id is still `undefined` does nothing.
 *
 * @param id Id of the trigger.
 * @param store The Store instance where the trigger should be registered.
 */
export function useTriggerRegistration<State extends PopupStoreState<unknown>>(
  id: string | undefined,
  store: PopupTriggerDataStore<State>,
) {
  const registrationRef = React.useRef<{
    store: PopupTriggerDataStore<State>;
    id: string;
    element: Element;
  } | null>(null);

  return useStableCallback((element: Element | null) => {
    const registration = registrationRef.current;

    if (registration !== null) {
      if (
        registration.element === element &&
        registration.store === store &&
        registration.id === id
      ) {
        // Already registered where it belongs, so the caller's migration effect is free on mount.
        return;
      }

      registrationRef.current = null;
      const registeredStore = registration.store;
      if (
        registeredStore.context.triggerElements.getById(registration.id) === registration.element
      ) {
        registeredStore.context.triggerElements.delete(registration.id);
        syncTriggerRegistry(registeredStore);
      }
    }

    if (element !== null && id !== undefined) {
      registrationRef.current = { store, id, element };
      store.context.triggerElements.add(id, element);
      syncTriggerRegistry(store);
    }
  });
}

export function attachPreventUnmountOnClose(eventDetails: { preventUnmountOnClose(): void }) {
  let preventUnmountOnClose = false;

  eventDetails.preventUnmountOnClose = () => {
    preventUnmountOnClose = true;
  };

  return () => preventUnmountOnClose;
}

/**
 * The claim rule a trigger applies when it registers.
 *
 * - `'first-registrant'`: the owner refreshes its element, and a trigger that registers into an
 *   open, unowned popup claims it. Used by regular triggers.
 * - `'submenu'`: a submenu trigger claims its open submenu when it owns it or it has no owner.
 * - `'none'`: the part only counts as a trigger, such as a drawer swipe area.
 */
export type TriggerClaimRule = 'first-registrant' | 'submenu' | 'none';

/**
 * Registers a trigger with its popup and applies the trigger's side of the ownership rules.
 *
 * It registers the element the trigger renders, migrating it when the store or id changes, claims
 * the popup according to `claim`, and forwards `stateUpdates` (such as the trigger's `payload`)
 * while the trigger owns the popup.
 *
 * @param triggerId Id of the trigger.
 * @param triggerElementRef Ref for the trigger DOM element.
 * @param store The Store instance managing the popup state.
 * @param claim The claim rule the trigger applies when it registers.
 * @param stateUpdates State to apply while the trigger owns the popup. With the `'submenu'` rule,
 *   it is applied only when the trigger claims the popup.
 */
export function useTriggerOwnership<
  State extends PopupStoreState<unknown>,
  const Key extends keyof Omit<
    State,
    'activeTriggerId' | 'activeTriggerElement' | 'triggerOwnership'
  > = never,
>(
  triggerId: string | undefined,
  triggerElementRef: React.RefObject<Element | null>,
  store: PopupTriggerDataStore<State>,
  claim: TriggerClaimRule,
  stateUpdates: Pick<State, Key> = EMPTY_OBJECT as Pick<State, Key>,
) {
  // Only regular triggers react to owning the mounted popup, so other parts don't subscribe.
  const isMountedByThisTrigger = store.useState(
    'isMountedByTrigger',
    claim === 'first-registrant' ? triggerId : undefined,
  );

  const baseRegisterTrigger = useTriggerRegistration(triggerId, store);

  // Applies the claim rule when the trigger registers. Stable so payload/`stateUpdates` changes do
  // not change the ref identity (which would needlessly churn registration); it reads the latest
  // closure values when invoked.
  const applyClaim = useStableCallback((element: Element) => {
    const open = store.select('open');
    const ownerId = store.select('activeTriggerId');

    if (claim === 'first-registrant') {
      const result = claimOnRegister(store.state, triggerId, element, open, ownerId);
      if (result) {
        updateTriggerOwnership(store, result.changes, result.forwardState ? stateUpdates : null);
      }
    } else if (claim === 'submenu') {
      const changes = claimSubmenuOnRegister(
        triggerId,
        element,
        open,
        ownerId,
        store.select('activeTriggerElement'),
      );
      if (changes) {
        updateTriggerOwnership(store, changes, stateUpdates);
      }
    }
  });

  // Stable, so the merged ref on the rendered element keeps its identity for the trigger's whole
  // lifetime.
  const registerTrigger = useStableCallback((element: Element | null) => {
    baseRegisterTrigger(element);
    if (element) {
      applyClaim(element);
    }
  });

  // A stable ref does not re-fire on a store or id change, so migrate here instead: unregister from
  // the previous store, then register the element the trigger still renders into the current one.
  // On React 17 the id also starts out `undefined`, so this is what registers the trigger at all.
  useIsoLayoutEffect(() => {
    registerTrigger(triggerElementRef.current);
    return () => registerTrigger(null);
  }, [registerTrigger, triggerElementRef, store, triggerId]);

  // Only regular triggers keep forwarding their state while they own the popup.
  const forwardsWhileOwner = claim === 'first-registrant' && isMountedByThisTrigger;
  useIsoLayoutEffect(() => {
    if (forwardsWhileOwner) {
      updateTriggerOwnership(store, setOwnerElement(triggerElementRef.current), stateUpdates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forwardsWhileOwner, store, triggerElementRef, ...Object.values(stateUpdates)]);

  return { registerTrigger, isMountedByThisTrigger };
}

type PopupInteractionPropKey = 'activeTriggerProps' | 'inactiveTriggerProps' | 'popupProps';

export function usePopupInteractionProps<
  State extends PopupStoreState<unknown>,
  const Key extends keyof State,
>(
  store: ReactStore<State, PopupStoreContext<never>, typeof popupStoreSelectors>,
  statePart: Pick<State, Key | PopupInteractionPropKey>,
) {
  store.useSyncedValues(statePart);

  useIsoLayoutEffect(
    () => () => {
      store.update({
        activeTriggerProps: EMPTY_OBJECT,
        inactiveTriggerProps: EMPTY_OBJECT,
        popupProps: EMPTY_OBJECT,
      });
    },
    [store],
  );
}
