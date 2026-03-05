'use client';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { Timeout } from '@base-ui/utils/useTimeout';

import type { ContextData, FloatingRootContext, SafePolygonOptions } from '../types';
import { createAttribute } from '../utils/createAttribute';
import { TYPEABLE_SELECTOR } from '../utils/constants';

export const safePolygonIdentifier = createAttribute('safe-polygon');
const interactiveSelector = `button,a,[role="button"],select,[tabindex]:not([tabindex="-1"]),${TYPEABLE_SELECTOR}`;
export const HOVER_CLOSE_UNSET = -1;
export const HOVER_SWITCH_GRACE_MS = 400;

export function isInteractiveElement(element: Element | null) {
  return element ? Boolean(element.closest(interactiveSelector)) : false;
}

export class HoverInteraction {
  pointerType: string | undefined;
  interactedInside: boolean;
  handler: ((event: MouseEvent) => void) | undefined;
  blockMouseMove: boolean;
  performedPointerEventsMutation: boolean;
  restTimeoutPending: boolean;
  lastHoverCloseTime: number;
  openChangeTimeout: Timeout;
  restTimeout: Timeout;
  handleCloseOptions: SafePolygonOptions | undefined;

  constructor() {
    this.pointerType = undefined;
    this.interactedInside = false;
    this.handler = undefined;
    this.blockMouseMove = true;
    this.performedPointerEventsMutation = false;
    this.restTimeoutPending = false;
    // `HOVER_CLOSE_UNSET` means no hover-close has occurred yet.
    this.lastHoverCloseTime = HOVER_CLOSE_UNSET;
    this.openChangeTimeout = new Timeout();
    this.restTimeout = new Timeout();
    this.handleCloseOptions = undefined;
  }

  static create(): HoverInteraction {
    return new HoverInteraction();
  }

  dispose = () => {
    this.openChangeTimeout.clear();
    this.restTimeout.clear();
  };

  disposeEffect = () => {
    return this.dispose;
  };
}

type HoverContextData = ContextData & {
  hoverInteractionState?: HoverInteraction | undefined;
};

export function useHoverInteractionSharedState(store: FloatingRootContext): HoverInteraction {
  const instance = useRefWithInit(HoverInteraction.create).current;

  const data = store.context.dataRef.current as HoverContextData;
  if (!data.hoverInteractionState) {
    data.hoverInteractionState = instance;
  }

  useOnMount(data.hoverInteractionState.disposeEffect);

  return data.hoverInteractionState;
}

export function recordHoverClose(instance: HoverInteraction, now = performance.now()): void {
  instance.lastHoverCloseTime = now;
}

export function wasHoverClosedRecently(
  instance: HoverInteraction,
  now = performance.now(),
  thresholdMs = HOVER_SWITCH_GRACE_MS,
): boolean {
  // Used by hover-open flows to suppress delay during quick handoffs
  // (trigger-to-trigger or popup-to-trigger).
  if (instance.lastHoverCloseTime === HOVER_CLOSE_UNSET) {
    return false;
  }

  return now - instance.lastHoverCloseTime <= thresholdMs;
}
