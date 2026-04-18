import { PopupTriggerMap } from '../../utils/popups';
import { FloatingRootStore } from '../components/FloatingRootStore';
import type { FloatingRootContext } from '../types';

let emptyRootContext: FloatingRootContext | undefined;

export function getEmptyRootContext(): FloatingRootContext {
  if (!emptyRootContext) {
    emptyRootContext = new FloatingRootStore({
      open: false,
      transitionStatus: undefined,
      floatingElement: null,
      referenceElement: null,
      triggerElements: new PopupTriggerMap(),
      floatingId: '',
      syncOnly: false,
      nested: false,
      onOpenChange: undefined,
    });
  }
  return emptyRootContext;
}
