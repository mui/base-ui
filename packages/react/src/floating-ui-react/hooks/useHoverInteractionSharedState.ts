'use client';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { Timeout } from '@base-ui/utils/useTimeout';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';

import type { ContextData, FloatingRootContext, SafePolygonOptions } from '../types';
import { TYPEABLE_SELECTOR } from '../utils/constants';

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
  pointerEventsScopeElement: HTMLElement | SVGSVGElement | null;
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
    this.pointerEventsScopeElement = null;
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

export function clearSafePolygonPointerEventsMutation(
  instance: Pick<HoverInteraction, 'performedPointerEventsMutation' | 'pointerEventsScopeElement'>,
  fallbackScopeElement: HTMLElement,
) {
  if (!instance.performedPointerEventsMutation) {
    return;
  }

  const scopeElement = instance.pointerEventsScopeElement ?? fallbackScopeElement;
  scopeElement.style.pointerEvents = '';
  instance.performedPointerEventsMutation = false;
  instance.pointerEventsScopeElement = null;
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

export function closeHoverPopup(
  store: FloatingRootContext,
  instance: HoverInteraction,
  event: MouseEvent,
  isHoverOpen: boolean,
): boolean {
  if (!store.select('open')) {
    return false;
  }

  const eventDetails = createChangeEventDetails(REASONS.triggerHover, event);
  store.setOpen(false, eventDetails);

  // Canceled requests or non-hover closes should not seed handoff grace.
  if (eventDetails.isCanceled || !isHoverOpen) {
    return false;
  }

  recordHoverClose(instance);
  return true;
}

export function clearRecentHoverClose(instance: HoverInteraction): void {
  instance.lastHoverCloseTime = HOVER_CLOSE_UNSET;
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
