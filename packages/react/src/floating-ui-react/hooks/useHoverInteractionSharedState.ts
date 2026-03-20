'use client';
import * as ReactDOM from 'react-dom';
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
import { isInteractiveElement } from '../utils';

/**
 * Sentinel value for `lastHoverCloseTime` indicating that no hover-close has
 * been committed yet. Using a named constant avoids confusion with a real
 * `performance.now()` timestamp.
 */
export const HOVER_CLOSE_UNSET = -1;

/**
 * Default grace period (ms) after a committed hover-close during which a
 * subsequent hover-open bypasses the configured delay. This enables smooth
 * trigger-to-trigger and popup-to-trigger handoffs.
 *
 * Note: the grace window intentionally applies to same-trigger re-entry as
 * well, not only cross-trigger handoffs. Consumers who need a strict reopen
 * delay should not rely on the hover close delay alone during this window.
 */
export const HOVER_CLOSE_GRACE_PERIOD = 400;

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
export { isInteractiveElement };

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

  // --- Commit verification phase ---
  // Force React to process any batched state updates that the consumer's
  // `onOpenChange` callback may have enqueued. This lets us detect whether
  // the consumer actually committed the close by checking the popup store's
  // effective `open` state (which accounts for the controlled `openProp`).
  ReactDOM.flushSync(() => {});

  // Check the popup store's effective open state. After the flushSync above,
  // regular `setState` calls from `onOpenChange` are committed, so:
  //  - Consumer accepted → effective open is `false`
  //  - Consumer ignored (no cancel, no setState) → effective open is `true`
  //  - Consumer deferred via `startTransition` → effective open is `true`
  //    (transitions are not flushed by flushSync)
  //
  // When the consumer ignored the request, we must NOT record a pending
  // hover-close — otherwise a later unrelated close would inherit the hover
  // grace window.
  //
  // Tradeoff: the same early return also drops deferred controlled closes
  // (`startTransition`, timers, etc.). Those consumers won't get the hover
  // grace window or the `floating.closed` tree coordination signal, but this
  // avoids misattributing a later unrelated `open=false` update to the earlier
  // hover-close request.
  const isEffectivelyOpen = store.context.isPopupEffectivelyOpen?.() ?? store.select('open');

  if (isEffectivelyOpen) {
    // Consumer silently ignored the close (or used startTransition).
    // Do not record a pending hover-close.
    return;
  }

  // --- Pending phase: record intent to close. ---
  // The pending close will be finalized by `emitCommittedHoverClose` either
  // synchronously below (if the floating root store already reflects the
  // closed state) or in the `open` watcher effect when the floating root
  // store syncs the popup store's closed state.
  instance.pendingHoverClose = {
    event,
    shouldRecordGrace: isHoverOpen && hoverCloseGracePeriod != null && hoverCloseGracePeriod > 0,
  };

  // If the floating root store already reflects the closed state (e.g.
  // Popover uses `flushSync` internally), finalize immediately so tree
  // coordination doesn't wait for the next render.
  if (!store.select('open')) {
    emitCommittedHoverClose(instance, tree);
  }
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
  // (trigger-to-trigger, popup-to-trigger, and same-trigger re-entry).
  if (
    thresholdMs == null ||
    thresholdMs <= 0 ||
    instance.lastHoverCloseTime === HOVER_CLOSE_UNSET
  ) {
    return false;
  }

  return now - instance.lastHoverCloseTime <= thresholdMs;
}

/**
 * Closes the hover popup, applying an optional delay. This is the shared
 * close-with-delay helper used by both the reference and floating hover hooks.
 *
 * @param runElseBranch When `true` (default), closes immediately if no delay
 *   is configured. When `false`, only the delayed path runs.
 */
export function closeWithOptionalDelay(
  store: FloatingRootContext,
  instance: HoverInteraction,
  handleHoverClose: (event: MouseEvent) => void,
  event: MouseEvent,
  closeDelay: number | undefined,
  runElseBranch = true,
): void {
  // Bail out if the popup is already closed (e.g. mouseleave fired on an
  // already-closed kept-mounted popup). Avoids a spurious `setOpen(false)`.
  if (!store.select('open')) {
    instance.openChangeTimeout.clear();
    return;
  }

  if (closeDelay) {
    instance.openChangeTimeout.start(closeDelay, () => handleHoverClose(event));
  } else if (runElseBranch) {
    instance.openChangeTimeout.clear();
    handleHoverClose(event);
  }
}
