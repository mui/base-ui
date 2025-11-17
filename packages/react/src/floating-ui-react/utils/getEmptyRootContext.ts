import type { FloatingRootContext } from '../types';

export function getEmptyRootContext(): FloatingRootContext {
  return {
    open: false,
    onOpenChange: () => {},
    dataRef: { current: {} },
    elements: {
      floating: null,
      reference: null,
      domReference: null,
    },
    events: {
      on: () => {},
      off: () => {},
      emit: () => {},
    },
    floatingId: '',
    refs: {
      setPositionReference: () => {},
    },
  };
}
