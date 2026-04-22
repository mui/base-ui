'use client';
import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
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
  PopupStoreState,
  PopupStoreContext,
  popupStoreSelectors,
  PopupStoreSelectors,
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

  // If a popup is closing, the `trigger` may be null.
  // We want to keep the previous value so that exit animations are played and focus is returned correctly.
  if (triggerId || open) {
    state.activeTriggerId = triggerId;
    state.activeTriggerElement = trigger ?? null;
  }
}

export function shouldCurrentTriggerOwnOpenPopup(
  open: boolean,
  isOpenedByThisTrigger: boolean,
  activeTriggerId: string | null,
  triggerCount: number,
) {
  return open && (isOpenedByThisTrigger || activeTriggerId == null || triggerCount === 1);
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
      // If a popup is already open (or will immediately open via defaultOpen), a detached
      // trigger can mount before any active trigger has been established. Claim the first
      // registered trigger so trigger-owned focus management and ARIA relationships work.
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

export function useFloatingRootContextSync<State extends PopupStoreState<any>>(
  store: ReactStore<State, PopupStoreContext<any>, typeof popupStoreSelectors>,
  floatingRootContext: State['floatingRootContext'],
  {
    notifyOnChange,
  }: {
    notifyOnChange: boolean;
  },
) {
  const previousFloatingRootContextRef = React.useRef(store.state.floatingRootContext);

  if (store.state.floatingRootContext !== floatingRootContext) {
    // Keep the current render path in sync so detached triggers using a recreated handle
    // can read the new floating context before effects run.
    (store.state as State).floatingRootContext = floatingRootContext;
  }

  useIsoLayoutEffect(() => {
    if (notifyOnChange && previousFloatingRootContextRef.current !== floatingRootContext) {
      previousFloatingRootContextRef.current = floatingRootContext;
      store.notifyAll();
      return;
    }

    previousFloatingRootContextRef.current = floatingRootContext;
  }, [floatingRootContext, notifyOnChange, store]);
}
