import { PopupTriggerMap } from '../popupTriggerMap';
import { FloatingRootStore } from './FloatingRootStore';

export function getEmptyRootContext(): FloatingRootStore {
  return new FloatingRootStore({
    open: false,
    transitionStatus: undefined,
    floatingElement: null,
    referenceElement: null,
    triggerElements: new PopupTriggerMap(),
    floatingId: undefined,
    syncOnly: false,
    nested: false,
    onOpenChange: undefined,
  });
}
