import { PopupTriggerMap } from '../popupTriggerMap';
import { FloatingRootStore } from './FloatingRootStore';

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
