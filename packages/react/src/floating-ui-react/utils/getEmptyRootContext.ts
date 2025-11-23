import { FloatingRootStore } from '../components/FloatingRootStore';
import type { FloatingRootContext } from '../types';

export function getEmptyRootContext(): FloatingRootContext {
  return new FloatingRootStore({
    open: false,
    floatingElement: null,
    referenceElement: null,
    triggersGetter: () => new Set(),
    floatingId: '',
    nested: false,
    noEmit: false,
    onOpenChange: undefined,
  });
}
