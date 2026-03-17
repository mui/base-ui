'use client';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { Timeout } from '@base-ui/utils/useTimeout';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';

import type {
  ContextData,
  FloatingRootContext,
  FloatingTreeType,
  SafePolygonOptions,
} from '../types';
import { TYPEABLE_SELECTOR } from '../utils/constants';

const interactiveSelector = `button,a,[role="button"],select,[tabindex]:not([tabindex="-1"]),${TYPEABLE_SELECTOR}`;
/**
 * Sentinel value for `lastHoverCloseTime` indicating that no hover-close has
 * been committed yet. Using a named constant avoids confusion with a real
 * `performance.now()` timestamp.
 */
export const HOVER_CLOSE_UNSET = -1;

/**
 * Captures the context of a hover-close that has been accepted by the store
 * (not canceled) but has not yet been confirmed as committed — the effective
 * `open` state may still be `true` in controlled components that update
 * asynchronously. Once `open` actually becomes `false`, the pending close is
 * "committed": grace time is optionally recorded and a `floating.closed` tree
 * event is emitted.
 */
type PendingHoverClose = {
  event: MouseEvent;
  /** Whether to record `lastHoverCloseTime` when this close is committed. */
  shouldRecordGrace: boolean;
};

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
  pendingHoverClose: PendingHoverClose | null;
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
    this.pendingHoverClose = null;
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

export function clearPendingHoverClose(instance: HoverInteraction): void {
  instance.pendingHoverClose = null;
}

/**
 * If a pending hover-close exists, finalizes it as committed: records the
 * grace timestamp (when applicable) and emits a `floating.closed` tree event
 * so parent popups can continue deferred close coordination.
 *
 * This is called from two sites:
 *  1. Synchronously inside `closeHoverPopup` when the store confirms the
 *     popup closed immediately.
 *  2. Inside an effect that watches `open` → when a controlled component
 *     updates its state asynchronously after `onOpenChange`, the effect
 *     picks up the transition and finalizes the pending close.
 *
 * The function is idempotent: calling it when `pendingHoverClose` is already
 * `null` (consumed by site 1) is a no-op.
 */
export function emitCommittedHoverClose(
  instance: HoverInteraction,
  tree: FloatingTreeType | null,
): boolean {
  const pendingHoverClose = instance.pendingHoverClose;
  if (!pendingHoverClose) {
    return false;
  }

  instance.pendingHoverClose = null;

  if (pendingHoverClose.shouldRecordGrace) {
    recordHoverClose(instance);
  }

  tree?.events.emit('floating.closed', pendingHoverClose.event);
  return true;
}

/**
 * Attempts to close a popup from a hover interaction and, if the close is
 * committed, emits the tree coordination signal.
 *
 * A committed close is reported only once the effective `open` state actually
 * becomes `false`. Controlled consumers can ignore a close request without
 * canceling it, so hover bookkeeping must not treat every accepted request as
 * a real close.
 *
 * Tree-based hover coordination relies on that committed-close signal to
 * continue deferred parent closes.
 *
 * Reopen grace is narrower: it is recorded only when the popup was both
 * hover-opened and successfully closed, so click/keyboard/programmatic closes
 * do not seed hover handoff behavior.
 */
export function closeHoverPopup(
  store: FloatingRootContext,
  instance: HoverInteraction,
  tree: FloatingTreeType | null,
  event: MouseEvent,
  isHoverOpen: boolean,
  hoverCloseGracePeriod?: number,
): void {
  // Discard any stale pending close from a previous attempt that was never
  // committed (e.g. a controlled consumer ignored a prior close request).
  clearPendingHoverClose(instance);

  if (!store.select('open')) {
    return;
  }

  // --- Request phase: ask the store to close. ---
  const eventDetails = createChangeEventDetails(REASONS.triggerHover, event);
  store.setOpen(false, eventDetails);

  // The consumer explicitly vetoed the close via `cancel()`.
  if (eventDetails.isCanceled) {
    return;
  }

  // --- Verification phase: did the popup actually close? ---
  // Re-read the effective `open` selector (`openProp ?? state.open`).
  // Controlled consumers may silently ignore the close by not updating their
  // state and not calling `cancel()`. If `open` is still `true`, no
  // committed close occurred — skip grace recording and tree signaling.
  if (store.select('open')) {
    return;
  }

  // --- Commit phase: the popup closed synchronously. ---
  instance.pendingHoverClose = {
    event,
    shouldRecordGrace: isHoverOpen && hoverCloseGracePeriod != null && hoverCloseGracePeriod > 0,
  };

  // Finalize immediately. For controlled consumers that update state
  // asynchronously, the pending close will instead be finalized by the
  // `emitCommittedHoverClose` call inside the `open` watcher effect.
  emitCommittedHoverClose(instance, tree);
}

export function clearRecentHoverClose(instance: HoverInteraction): void {
  instance.lastHoverCloseTime = HOVER_CLOSE_UNSET;
  clearPendingHoverClose(instance);
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
