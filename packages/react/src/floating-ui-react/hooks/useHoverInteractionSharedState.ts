import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { Timeout } from '@base-ui/utils/useTimeout';

import type { ContextData, FloatingRootContext, SafePolygonOptions } from '../types';
import { createAttribute } from '../utils/createAttribute';
import { TYPEABLE_SELECTOR } from '../utils/constants';

export const safePolygonIdentifier = createAttribute('safe-polygon');
const interactiveSelector = `button,a,[role="button"],select,[tabindex]:not([tabindex="-1"]),${TYPEABLE_SELECTOR}`;

export function isInteractiveElement(element: Element | null) {
  return element ? Boolean(element.closest(interactiveSelector)) : false;
}

export class HoverInteraction {
  pointerTypeRef: string | undefined;
  interactedInsideRef: boolean;
  handlerRef: ((event: MouseEvent) => void) | undefined;
  blockMouseMoveRef: boolean;
  performedPointerEventsMutationRef: boolean;
  unbindMouseMoveRef: () => void;
  restTimeoutPendingRef: boolean;
  openChangeTimeout: Timeout;
  restTimeout: Timeout;
  handleCloseOptionsRef: SafePolygonOptions | undefined;

  constructor() {
    this.pointerTypeRef = undefined;
    this.interactedInsideRef = false;
    this.handlerRef = undefined;
    this.blockMouseMoveRef = true;
    this.performedPointerEventsMutationRef = false;
    this.unbindMouseMoveRef = () => {};
    this.restTimeoutPendingRef = false;
    this.openChangeTimeout = new Timeout();
    this.restTimeout = new Timeout();
    this.handleCloseOptionsRef = undefined;
  }

  static create(): HoverInteraction {
    return new HoverInteraction();
  }
}

type HoverContextData = ContextData & {
  hoverInteractionState?: HoverInteraction;
};

export function useHoverInteractionSharedState(store: FloatingRootContext): HoverInteraction {
  const instance = useRefWithInit(HoverInteraction.create).current;

  const data = store.context.dataRef.current as HoverContextData;
  if (!data.hoverInteractionState) {
    data.hoverInteractionState = instance;
  }

  return data.hoverInteractionState;
}
