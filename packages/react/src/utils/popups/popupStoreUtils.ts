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
import { claimOnRegister } from './triggerOwnership';
import type { TriggerOwnershipState } from './triggerOwnership';

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
 * Moves the registry version on after a trigger registered or unregistered, so the Root settles
 * ownership again. Registering triggers of a closed popup notifies nobody.
 */
function syncTriggerRegistry(store: PopupTriggerDataStore<PopupStoreState<unknown>>) {
  if (store.select('open')) {
    store.update({
      registryVersion: store.state.registryVersion + 1,
      hasLoneTrigger: store.context.triggerElements.size === 1,
    });
  }
}

/**
 * Registers the element a trigger renders with its popup. Returns a stable callback ref that
 * registers/unregisters the element in the store.
 *
 * Stable so a downstream ref merger that retains the callback it was first given still reaches the
 * trigger's current store. The registration is tracked as a `(store, id, element)` triple, so
 * unregistering targets the store the element was actually registered in.
 *
 * Since the callback never changes, a layout effect keyed on `[store, id]` re-runs it to migrate
 * the element in `elementRef`. That effect is also what registers the element in the first place
 * when `id` only resolves after the first commit (React 17's `useId` fallback), because the
 * register call made while the id is still `undefined` does nothing.
 *
 * @param id Id of the trigger.
 * @param elementRef Ref for the trigger DOM element.
 * @param store The Store instance where the trigger should be registered.
 * @param onRegister Called with the element every time the callback receives one, such as to let
 *   the trigger claim the popup.
 */
export function useTriggerRegistration<State extends PopupStoreState<unknown>>(
  id: string | undefined,
  elementRef: React.RefObject<Element | null>,
  store: PopupTriggerDataStore<State>,
  onRegister?: (element: Element) => void,
) {
  const registrationRef = React.useRef<{
    store: PopupTriggerDataStore<State>;
    id: string;
    element: Element;
  } | null>(null);

  const registerTrigger = useStableCallback((element: Element | null) => {
    const registration = registrationRef.current;

    // An element already registered where it belongs stays put, so the migration effect is free
    // on mount.
    if (
      registration === null ||
      registration.element !== element ||
      registration.store !== store ||
      registration.id !== id
    ) {
      if (registration !== null) {
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
    }

    if (element !== null) {
      onRegister?.(element);
    }
  });

  // A stable ref does not re-fire on a store or id change, so migrate here instead: unregister from
  // the previous store, then register the element the trigger still renders into the current one.
  useIsoLayoutEffect(() => {
    registerTrigger(elementRef.current);
    return () => registerTrigger(null);
  }, [registerTrigger, elementRef, store, id]);

  return registerTrigger;
}

/**
 * Registers a trigger with its popup and applies the trigger's side of the ownership rules: it
 * claims the popup when it registers (see `claimOnRegister`), and forwards `stateUpdates` (such as
 * the trigger's `payload`) while it owns the popup.
 *
 * @param triggerId Id of the trigger.
 * @param triggerElementRef Ref for the trigger DOM element.
 * @param store The Store instance managing the popup state.
 * @param stateUpdates State to apply while the trigger owns the popup.
 */
export function useTriggerOwnership<
  State extends PopupStoreState<unknown>,
  const Key extends keyof Omit<State, keyof TriggerOwnershipState>,
>(
  triggerId: string | undefined,
  triggerElementRef: React.RefObject<Element | null>,
  store: PopupTriggerDataStore<State>,
  stateUpdates: Pick<State, Key>,
) {
  const isMountedByThisTrigger = store.useState('isMountedByTrigger', triggerId);

  const registerTrigger = useTriggerRegistration(
    triggerId,
    triggerElementRef,
    store,
    (element: Element) => {
      const result = claimOnRegister(
        store.state,
        triggerId,
        element,
        store.select('open'),
        store.select('activeTriggerId'),
      );
      if (result) {
        store.update({
          ...result.changes,
          ...(result.forwardState ? stateUpdates : null),
        } as Pick<Readonly<State>, Key | 'activeTriggerId' | 'activeTriggerElement'>);
      }
    },
  );

  useIsoLayoutEffect(() => {
    if (isMountedByThisTrigger) {
      store.update({
        activeTriggerElement: triggerElementRef.current,
        ...stateUpdates,
      } as Pick<Readonly<State>, Key | 'activeTriggerElement'>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMountedByThisTrigger, store, triggerElementRef, ...Object.values(stateUpdates)]);

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
