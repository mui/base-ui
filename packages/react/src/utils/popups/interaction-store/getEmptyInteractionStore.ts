import { PopupTriggerMap } from '../popupTriggerMap';
import { StandaloneInteractionStore } from './StandaloneInteractionStore';

export function getEmptyInteractionStore(): StandaloneInteractionStore {
  return new StandaloneInteractionStore({
    open: false,
    transitionStatus: undefined,
    outerPopupElement: null,
    baseAnchor: null,
    triggerElements: new PopupTriggerMap(),
    defaultPopupId: undefined,
    nested: false,
    onOpenChange: undefined,
  });
}
