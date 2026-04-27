'use client';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import type { ReactStore } from '@base-ui/utils/store';
import { isElement } from '@floating-ui/utils/dom';
import type { BaseUIChangeEventDetails } from '../../types';
import type { PopupStoreContext, PopupStoreSelectors, PopupStoreState } from '../../utils/popups';
import { type FloatingRootState, FloatingRootStore } from '../components/FloatingRootStore';

export interface UseSyncedFloatingRootContextOptions<State extends PopupStoreState<any>> {
  popupStore: ReactStore<State, PopupStoreContext<any>, PopupStoreSelectors>;
  /**
   * Whether the Popup element is passed to Floating UI as the floating element instead of the default Positioner.
   */
  treatPopupAsFloatingElement?: boolean | undefined;
  floatingRootContext?: FloatingRootStore | undefined;
  floatingId: string | undefined;
  nested: boolean;
  onOpenChange(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
}

/**
 * Initializes a FloatingRootStore that is kept in sync with the provided PopupStore.
 * The new instance is created only once and updated on every render.
 */
export function useSyncedFloatingRootContext<State extends PopupStoreState<any>>(
  options: UseSyncedFloatingRootContextOptions<State>,
): FloatingRootStore {
  const {
    popupStore,
    treatPopupAsFloatingElement = false,
    floatingRootContext,
    floatingId,
    nested,
    onOpenChange,
  } = options;

  const open = popupStore.useState('open');
  const referenceElement = popupStore.useState('activeTriggerElement');
  const floatingElement = popupStore.useState(
    treatPopupAsFloatingElement ? 'popupElement' : 'positionerElement',
  );
  const triggerElements = popupStore.context.triggerElements;

  const store = useRefWithInit(
    () =>
      new FloatingRootStore({
        open,
        transitionStatus: undefined,
        referenceElement,
        floatingElement,
        triggerElements,
        onOpenChange,
        floatingId,
        syncOnly: true,
        nested,
      }),
  ).current;

  const syncedStore = floatingRootContext ?? store;

  useIsoLayoutEffect(() => {
    const valuesToSync: Partial<FloatingRootState> = {
      open,
      floatingId,
      referenceElement,
      floatingElement,
    };

    if (isElement(referenceElement)) {
      valuesToSync.domReferenceElement = referenceElement;
    }

    if (syncedStore.state.positionReference === syncedStore.state.referenceElement) {
      valuesToSync.positionReference = referenceElement;
    }

    syncedStore.update(valuesToSync);
  }, [open, floatingId, referenceElement, floatingElement, syncedStore]);

  // TODO: When `setOpen` is a part of the PopupStore API, we don't need to sync it.
  syncedStore.context.onOpenChange = onOpenChange;
  syncedStore.context.nested = nested;

  return syncedStore;
}
