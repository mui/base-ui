import { PopupTriggerMap } from '../popupTriggerMap';
import { FloatingRootStore } from './FloatingRootStore';

/**
 * Creates a closed `FloatingRootStore` with no anchor or elements, for parts that need a store
 * before the real one exists, such as a Navigation Menu positioner whose item hasn't opened yet.
 */
export function getEmptyRootStore(): FloatingRootStore {
  return new FloatingRootStore({
    open: false,
    transitionStatus: undefined,
    popupPositionerElement: null,
    baseAnchor: null,
    triggerElements: new PopupTriggerMap(),
    defaultPopupId: undefined,
    nested: false,
    onOpenChange: undefined,
  });
}
