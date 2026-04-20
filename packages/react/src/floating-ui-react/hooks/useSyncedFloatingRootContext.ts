'use client';
import { isElement } from '@floating-ui/utils/dom';
import { ReactStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { BaseUIChangeEventDetails } from '../../types';
import { PopupStoreContext, PopupStoreSelectors, PopupStoreState } from '../../utils/popups';
import { FloatingRootState, FloatingRootStore } from '../components/FloatingRootStore';

export interface UseSyncedFloatingRootContextOptions<
  State extends PopupStoreState<unknown>,
  ContextEventDetails extends BaseUIChangeEventDetails<string>,
  OpenChangeEventDetails extends BaseUIChangeEventDetails<string>,
> {
  popupStore: ReactStore<State, PopupStoreContext<ContextEventDetails>, PopupStoreSelectors>;
  /**
   * Whether the Popup element is passed to Floating UI as the floating element instead of the default Positioner.
   */
  treatPopupAsFloatingElement?: boolean | undefined;
  floatingRootContext: FloatingRootStore;
  floatingId: string | undefined;
  nested: boolean;
  onOpenChange(open: boolean, eventDetails: OpenChangeEventDetails): void;
}

/**
 * Synchronizes popup-backed floating root state after commit.
 */
export function useSyncedFloatingRootContext<
  State extends PopupStoreState<unknown>,
  ContextEventDetails extends BaseUIChangeEventDetails<string>,
  OpenChangeEventDetails extends BaseUIChangeEventDetails<string>,
>(
  options: UseSyncedFloatingRootContextOptions<State, ContextEventDetails, OpenChangeEventDetails>,
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

  popupStore.useSyncedValue('floatingId', floatingId as State['floatingId']);

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
    floatingRootContext.context.onOpenChange = onOpenChange as (
      open: boolean,
      eventDetails: BaseUIChangeEventDetails<string>,
    ) => void;
    floatingRootContext.context.nested = nested;
  }, [
    open,
    floatingId,
    referenceElement,
    floatingElement,
    floatingRootContext,
    nested,
    onOpenChange,
  ]);

  return floatingRootContext;
}
