'use client';
import { useId } from '@base-ui/utils/useId';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { ReactStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { isElement } from '@floating-ui/utils/dom';
import { BaseUIChangeEventDetails } from '../../types';
import { useFloatingParentNodeId } from '../components/FloatingTree';
import { PopupStoreContext, PopupStoreSelectors, PopupStoreState } from '../../utils/popups';
import { FloatingRootState, FloatingRootStore } from '../components/FloatingRootStore';

export interface UseSyncedFloatingRootContextOptions<State extends PopupStoreState<any>> {
  popupStore: ReactStore<State, PopupStoreContext<any>, PopupStoreSelectors>;
  /**
   * Whether the Popup element is passed to Floating UI as the floating element instead of the default Positioner.
   */
  treatPopupAsFloatingElement?: boolean | undefined;
  onOpenChange(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
}

/**
 * Initializes a FloatingRootStore that is kept in sync with the provided PopupStore.
 * The new instance is created only once and updated on every render.
 */
export function useSyncedFloatingRootContext<State extends PopupStoreState<any>>(
  options: UseSyncedFloatingRootContextOptions<State>,
): FloatingRootStore {
  const { popupStore, treatPopupAsFloatingElement = false, onOpenChange } = options;

  const floatingId = useId();
  const nested = useFloatingParentNodeId() != null;

  const open = popupStore.useState('open');
  const transitionStatus = popupStore.useState('transitionStatus');
  const referenceElement = popupStore.useState('activeTriggerElement');
  const floatingElement = popupStore.useState(
    treatPopupAsFloatingElement ? 'popupElement' : 'positionerElement',
  );
  const triggerElements = popupStore.context.triggerElements;

  const store = useRefWithInit(
    () =>
      new FloatingRootStore({
        open,
        transitionStatus,
        referenceElement,
        floatingElement,
        triggerElements,
        onOpenChange,
        floatingId,
        nested,
      }),
  ).current;

  useIsoLayoutEffect(() => {
    const valuesToSync: Partial<FloatingRootState> = {
      open,
      transitionStatus,
      floatingId,
      referenceElement,
      floatingElement,
    };

    if (isElement(referenceElement)) {
      valuesToSync.domReferenceElement = referenceElement;
    }

    if (store.state.positionReference === store.state.referenceElement) {
      valuesToSync.positionReference = referenceElement;
    }

    store.update(valuesToSync);
  }, [open, transitionStatus, floatingId, referenceElement, floatingElement, store]);

  // TODO: When `setOpen` is a part of the PopupStore API, we don't need to sync it.
  store.context.onOpenChange = onOpenChange;
  store.context.nested = nested;

  return store;
}
