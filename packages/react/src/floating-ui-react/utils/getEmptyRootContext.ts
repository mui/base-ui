import { FloatingRootContextStore } from '../components/FloatingRootContextStore';
import type { FloatingRootContext } from '../types';

export function getEmptyRootContext(): FloatingRootContext {
  return new FloatingRootContextStore({
    open: false,
    floatingElement: null,
    referenceElement: null,
    triggerElements: [],
    floatingId: '',
    nested: false,
    noEmit: false,
    onOpenChange: undefined,
  });
}
