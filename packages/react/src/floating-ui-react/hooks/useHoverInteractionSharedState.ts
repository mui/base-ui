import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { Timeout } from '@base-ui-components/utils/useTimeout';

import type { ContextData, FloatingRootContext, SafePolygonOptions } from '../types';
import { createAttribute } from '../utils/createAttribute';
import { TYPEABLE_SELECTOR } from '../utils/constants';

export const safePolygonIdentifier = createAttribute('safe-polygon');
const interactiveSelector = `button,a,[role="button"],select,[tabindex]:not([tabindex="-1"]),${TYPEABLE_SELECTOR}`;

export function isInteractiveElement(element: Element | null) {
  return element ? Boolean(element.closest(interactiveSelector)) : false;
}

type HoverContextData = ContextData & {
  hoverInteractionState?: HoverInteraction;
};

class HoverInteraction {
  pointerType: string | undefined;
  interactedInside: boolean;
  handler: ((event: MouseEvent) => void) | undefined;
  blockMouseMove: boolean;
  performedPointerEventsMutation: boolean;
  unbindMouseMove: () => void;
  restTimeoutPending: boolean;
  openChangeTimeout: Timeout;
  restTimeout: Timeout;
  handleCloseOptions: SafePolygonOptions | undefined;

  constructor() {
    this.pointerType = undefined;
    this.interactedInside = false;
    this.handler = undefined;
    this.blockMouseMove = true;
    this.performedPointerEventsMutation = false;
    this.unbindMouseMove = () => {};
    this.restTimeoutPending = false;
    this.openChangeTimeout = new Timeout();
    this.restTimeout = new Timeout();
    this.handleCloseOptions = undefined;
  }

  // XXX: timeout cleanup

  static create(): HoverInteraction {
    return new HoverInteraction();
  }
}

export function useHoverInteractionSharedState(store: FloatingRootContext): HoverInteraction {
  const instance = useRefWithInit(HoverInteraction.create).current;

  const data = store.context.dataRef.current as HoverContextData;
  if (!data.hoverInteractionState) {
    data.hoverInteractionState = instance;
  }

  return instance;
}
