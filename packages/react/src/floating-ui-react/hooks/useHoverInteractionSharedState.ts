import { Timeout } from '@base-ui-components/utils/useTimeout';
import { Hook } from '@base-ui-components/utils/Hook';

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

export class HoverInteraction extends Hook {
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
    super();
    this.pointerType = undefined;
    this.interactedInside = false;
    this.handler = undefined;
    this.blockMouseMove = true;
    this.performedPointerEventsMutation = false;
    this.unbindMouseMove = () => {};
    this.restTimeoutPending = false;
    this.openChangeTimeout = this.hook(new Timeout());
    this.restTimeout = this.hook(new Timeout());
    this.handleCloseOptions = undefined;
  }

  // XXX: timeout cleanup
}

export function useHoverInteractionSharedState(store: FloatingRootContext): HoverInteraction {
  const instance = Hook.use(HoverInteraction) as unknown as HoverInteraction;

  const data = store.context.dataRef.current as HoverContextData;
  if (!data.hoverInteractionState) {
    data.hoverInteractionState = instance;
  }

  return instance;
}
