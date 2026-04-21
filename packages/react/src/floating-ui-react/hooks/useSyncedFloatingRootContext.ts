'use client';
import { isElement } from '@floating-ui/utils/dom';
import { ReactStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { BaseUIChangeEventDetails } from '../../types';
import { PopupStoreContext, PopupStoreSelectors, PopupStoreState } from '../../utils/popups';
import { FloatingRootState, FloatingRootStore } from '../components/FloatingRootStore';

export interface UseSyncedFloatingRootContextOptions<State extends PopupStoreState<any>> {
  popupStore: ReactStore<State, PopupStoreContext<any>, PopupStoreSelectors>;
  /**
   * Whether the Popup element is passed to Floating UI as the floating element instead of the default Positioner.
   */
  treatPopupAsFloatingElement?: boolean | undefined;
  floatingRootContext: FloatingRootStore;
  floatingId: string | undefined;
  nested: boolean;
  onOpenChange(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
}

/**
 * Synchronizes popup-backed floating root state after commit without mutating store state during render.
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

    if (
      floatingRootContext.state.positionReference === floatingRootContext.state.referenceElement
    ) {
      valuesToSync.positionReference = referenceElement;
    }

    floatingRootContext.update(valuesToSync);
  }, [open, floatingId, referenceElement, floatingElement, floatingRootContext]);

  // Keep sync-only open changes live before descendants can fire layout/autoFocus events.
  floatingRootContext.context.onOpenChange = onOpenChange;
  floatingRootContext.context.nested = nested;

  return floatingRootContext;
}
