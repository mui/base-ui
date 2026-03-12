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
  pointerEventsReferenceElement: HTMLElement | SVGSVGElement | null;
  pointerEventsFloatingElement: HTMLElement | null;
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
    this.pointerEventsReferenceElement = null;
    this.pointerEventsFloatingElement = null;
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

type PointerEventsMutationState = Pick<
  HoverInteraction,
  | 'performedPointerEventsMutation'
  | 'pointerEventsScopeElement'
  | 'pointerEventsReferenceElement'
  | 'pointerEventsFloatingElement'
>;

export function clearSafePolygonPointerEventsMutation(instance: PointerEventsMutationState) {
  if (!instance.performedPointerEventsMutation) {
    return;
  }

  instance.pointerEventsScopeElement?.style.removeProperty('pointer-events');
  instance.pointerEventsReferenceElement?.style.removeProperty('pointer-events');
  instance.pointerEventsFloatingElement?.style.removeProperty('pointer-events');
  instance.performedPointerEventsMutation = false;
  instance.pointerEventsScopeElement = null;
  instance.pointerEventsReferenceElement = null;
  instance.pointerEventsFloatingElement = null;
}

export function applySafePolygonPointerEventsMutation(
  instance: PointerEventsMutationState,
  options: {
    scopeElement: HTMLElement | SVGSVGElement;
    referenceElement: HTMLElement | SVGSVGElement;
    floatingElement: HTMLElement;
  },
) {
  const { scopeElement, referenceElement, floatingElement } = options;

  clearSafePolygonPointerEventsMutation(instance);
  instance.performedPointerEventsMutation = true;
  instance.pointerEventsScopeElement = scopeElement;
  instance.pointerEventsReferenceElement = referenceElement;
  instance.pointerEventsFloatingElement = floatingElement;

  scopeElement.style.pointerEvents = 'none';
  referenceElement.style.pointerEvents = 'auto';
  floatingElement.style.pointerEvents = 'auto';
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

/**
 * Attempts to close a popup from a hover interaction.
 *
 * A committed close is reported whenever `setOpen(false, ...)` succeeds without
 * cancellation, regardless of how the popup was originally opened. Tree-based
 * hover coordination relies on that signal to continue deferred parent closes.
 *
 * Reopen grace is narrower: it is recorded only when the popup was both
 * hover-opened and successfully closed, so click/keyboard/programmatic closes
 * do not seed hover handoff behavior.
 */
export function closeHoverPopup(
  store: FloatingRootContext,
  instance: HoverInteraction,
  event: MouseEvent,
  isHoverOpen: boolean,
  hoverCloseGracePeriod?: number,
): { closed: boolean } {
  if (!store.select('open')) {
    return { closed: false };
  }

  const eventDetails = createChangeEventDetails(REASONS.triggerHover, event);
  store.setOpen(false, eventDetails);

  if (eventDetails.isCanceled) {
    return { closed: false };
  }

  // Only hover-opened popups participate in the reopen grace window.
  if (isHoverOpen && hoverCloseGracePeriod != null && hoverCloseGracePeriod > 0) {
    recordHoverClose(instance);
  }

  return { closed: true };
}

export function clearRecentHoverClose(instance: HoverInteraction): void {
  instance.lastHoverCloseTime = HOVER_CLOSE_UNSET;
}

export function wasHoverClosedRecently(
  instance: HoverInteraction,
  now = performance.now(),
  thresholdMs?: number,
): boolean {
  // Used by hover-open flows to suppress delay during quick handoffs
  // (trigger-to-trigger or popup-to-trigger).
  if (
    thresholdMs == null ||
    thresholdMs <= 0 ||
    instance.lastHoverCloseTime === HOVER_CLOSE_UNSET
  ) {
    return false;
  }

  return now - instance.lastHoverCloseTime <= thresholdMs;
}
