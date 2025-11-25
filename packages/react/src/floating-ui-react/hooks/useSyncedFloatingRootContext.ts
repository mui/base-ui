import { useId } from '@base-ui-components/utils/useId';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { ReactStore } from '@base-ui-components/utils/store';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { isElement } from '@floating-ui/utils/dom';
import { BaseUIChangeEventDetails } from '../../types';
import { useFloatingParentNodeId } from '../components/FloatingTree';
import {
  PopupStoreContext,
  PopupStoreSelectors,
  PopupStoreState,
} from '../../utils/popupStoreUtils';
import { FloatingRootState, FloatingRootStore } from '../components/FloatingRootStore';

export interface UseSyncedFloatingRootContextOptions<State extends PopupStoreState<any>> {
  popupStore: ReactStore<State, PopupStoreContext<any>, PopupStoreSelectors>;
  /**
   * Whether to prevent the auto-emitted `openchange` event.
   */
  noEmit?: boolean;
  /**
   * Whether the Popup element is passed to Floating UI as the floating element instead of the default Positioner.
   */
  treatPopupAsFloatingElement?: boolean;
  onOpenChange(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
}

export function useSyncedFloatingRootContext<State extends PopupStoreState<any>>(
  options: UseSyncedFloatingRootContextOptions<State>,
): FloatingRootStore {
  const { popupStore, noEmit = false, treatPopupAsFloatingElement = false, onOpenChange } = options;

  const floatingId = useId();
  const nested = useFloatingParentNodeId() != null;

  const open = popupStore.useState('open');
  const referenceElement = popupStore.useState('activeTriggerElement');
  const floatingElement = popupStore.useState(
    treatPopupAsFloatingElement ? 'popupElement' : 'positionerElement',
  );
  const triggerElements = popupStore.context.triggerElements;

  const store = useRefWithInit(
    () =>
      new FloatingRootStore({
        open: popupStore.select('open'),
        onOpenChange,
        referenceElement,
        floatingElement,
        triggerElements,
        floatingId,
        nested,
        noEmit,
      }),
  ).current;

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

    store.update(valuesToSync);
  }, [open, floatingId, referenceElement, floatingElement, store]);

  store.context.onOpenChange = onOpenChange;
  store.context.nested = nested;
  store.context.noEmit = options.noEmit || false;

  return store;
}
