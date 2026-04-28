'use client';
import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { ReactStore } from '@base-ui/utils/store';
import { isElement } from '@floating-ui/utils/dom';
import { BaseUIChangeEventDetails } from '../../types';
import { PopupStoreContext, PopupStoreSelectors, PopupStoreState } from '../../utils/popups';
import { useFloatingParentNodeId } from '../components/FloatingTree';
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
  floatingRootContext?: FloatingRootStore | undefined;
  floatingId?: string | undefined;
  nested?: boolean | undefined;
  onOpenChange(open: boolean, eventDetails: OpenChangeEventDetails): void;
}

/**
 * Initializes a FloatingRootStore that is kept in sync with the provided PopupStore.
 * The new instance is created only once and updated on every render.
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
    floatingRootContext: floatingRootContextProp,
    floatingId: floatingIdProp,
    nested: nestedProp,
    onOpenChange,
  } = options;

  const generatedFloatingId = useId();
  const floatingParentNodeId = useFloatingParentNodeId();

  const open = popupStore.useState('open');
  const referenceElement = popupStore.useState('activeTriggerElement');
  const floatingElement = popupStore.useState(
    treatPopupAsFloatingElement ? 'popupElement' : 'positionerElement',
  );
  const triggerElements = popupStore.context.triggerElements;

  const floatingId = floatingIdProp ?? generatedFloatingId;
  const nested = nestedProp ?? floatingParentNodeId != null;
  const handleOpenChange = onOpenChange as (
    open: boolean,
    eventDetails: BaseUIChangeEventDetails<string>,
  ) => void;

  const internalStore = useRefWithInit(
    () =>
      new FloatingRootStore({
        open,
        transitionStatus: undefined,
        referenceElement,
        floatingElement,
        triggerElements,
        onOpenChange: handleOpenChange,
        floatingId,
        syncOnly: true,
        nested,
      }),
  ).current;

  const store = floatingRootContextProp ?? internalStore;

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

    if (store.state.positionReference === store.state.referenceElement) {
      valuesToSync.positionReference = referenceElement;
    }

    store.update(valuesToSync);
  }, [open, floatingId, referenceElement, floatingElement, store]);

  // TODO: When `setOpen` is a part of the PopupStore API, we don't need to sync it.
  store.context.onOpenChange = handleOpenChange;
  store.context.nested = nested;

  return store;
}
