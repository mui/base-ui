import { PopupTriggerMap } from '../../utils/popups';
import { FloatingRootStore } from '../components/FloatingRootStore';
import type { FloatingRootContext } from '../types';

export function getEmptyRootContext(): FloatingRootContext {
  return new FloatingRootStore({
    open: false,
    floatingElement: null,
    referenceElement: null,
    triggerElements: new PopupTriggerMap(),
    floatingId: '',
    nested: false,
    noEmit: false,
    onOpenChange: undefined,
  });
}
