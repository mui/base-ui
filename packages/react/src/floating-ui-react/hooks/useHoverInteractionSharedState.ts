'use client';
import * as ReactDOM from 'react-dom';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { Timeout } from '@base-ui/utils/useTimeout';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

import type {
  ContextData,
  FloatingRootContext,
  FloatingTreeType,
  SafePolygonOptions,
} from '../types';
import { isInteractiveElement } from '../utils/element';

/**
 * Grace window (ms) after a committed hover-close in which a subsequent
 * hover-open bypasses the configured open delay. Applies to all re-entry,
 * including the same trigger.
 */
export const HOVER_CLOSE_GRACE_PERIOD = 400;

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
  pendingHoverClose: MouseEvent | null;
  pendingHoverCloseGrace: boolean;
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
    // `0` means no hover-close has occurred yet.
    this.lastHoverCloseTime = 0;
    this.pendingHoverClose = null;
    this.pendingHoverCloseGrace = false;
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

const pointerEventsMutationOwnerByScopeElement = new WeakMap<
  HTMLElement | SVGSVGElement,
  PointerEventsMutationState
>();

export function clearSafePolygonPointerEventsMutation(instance: PointerEventsMutationState) {
  if (!instance.performedPointerEventsMutation) {
    return;
  }

  const scopeElement = instance.pointerEventsScopeElement;

  if (scopeElement && pointerEventsMutationOwnerByScopeElement.get(scopeElement) === instance) {
    instance.pointerEventsScopeElement?.style.removeProperty('pointer-events');
    instance.pointerEventsReferenceElement?.style.removeProperty('pointer-events');
    instance.pointerEventsFloatingElement?.style.removeProperty('pointer-events');
    pointerEventsMutationOwnerByScopeElement.delete(scopeElement);
  }

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

  const existingOwner = pointerEventsMutationOwnerByScopeElement.get(scopeElement);
  if (existingOwner && existingOwner !== instance) {
    clearSafePolygonPointerEventsMutation(existingOwner);
  }

  clearSafePolygonPointerEventsMutation(instance);
  instance.performedPointerEventsMutation = true;
  instance.pointerEventsScopeElement = scopeElement;
  instance.pointerEventsReferenceElement = referenceElement;
  instance.pointerEventsFloatingElement = floatingElement;
  pointerEventsMutationOwnerByScopeElement.set(scopeElement, instance);

  scopeElement.style.pointerEvents = 'none';
  referenceElement.style.pointerEvents = 'auto';
  floatingElement.style.pointerEvents = 'auto';
}

type HoverContextData = ContextData & {
  hoverInteractionState?: HoverInteraction | undefined;
};

export function useHoverInteractionSharedState(store: FloatingRootContext): HoverInteraction {
  const data = store.context.dataRef.current as HoverContextData;
  const instance = useRefWithInit(
    () => data.hoverInteractionState ?? HoverInteraction.create(),
  ).current;

  if (!data.hoverInteractionState) {
    data.hoverInteractionState = instance;
  }

  useOnMount(data.hoverInteractionState.disposeEffect);

  return data.hoverInteractionState;
}

/**
 * Finalizes a pending hover-close once `open` has actually become `false`:
 * records the grace timestamp and emits the tree-coordination signal.
 * Idempotent — safe to call whether the synchronous or deferred commit path
 * consumed the pending event first.
 */
export function emitCommittedHoverClose(
  instance: HoverInteraction,
  tree: FloatingTreeType | null,
): boolean {
  const pendingHoverCloseEvent = instance.pendingHoverClose;
  if (!pendingHoverCloseEvent) {
    return false;
  }

  instance.pendingHoverClose = null;

  if (instance.pendingHoverCloseGrace) {
    // Global `performance.now()` is used intentionally as a realm-agnostic
    // monotonic clock; only the delta against the next hover-open matters.
    instance.lastHoverCloseTime = performance.now();
  }

  tree?.events.emit('floating.closed', pendingHoverCloseEvent);
  return true;
}

/**
 * Requests a hover-driven close, and only records the close as committed once
 * the popup's effective `open` is actually `false`. Controlled consumers can
 * silently ignore the request (no cancel, no state update), so treating every
 * accepted request as a real close would seed hover-handoff state for closes
 * the user never saw.
 *
 * Must not be invoked from a render or effect commit phase — uses `flushSync`.
 */
export function closeHoverPopup(
  store: FloatingRootContext,
  instance: HoverInteraction,
  tree: FloatingTreeType | null,
  event: MouseEvent,
  isHoverOpen: boolean,
  hoverCloseGracePeriod?: number,
): void {
  // Discard any stale pending close left by a previously-ignored request.
  instance.pendingHoverClose = null;

  if (!store.select('open')) {
    return;
  }

  const eventDetails = createChangeEventDetails(REASONS.triggerHover, event);
  store.setOpen(false, eventDetails);

  if (eventDetails.isCanceled) {
    return;
  }

  instance.pendingHoverClose = event;
  instance.pendingHoverCloseGrace = isHoverOpen && (hoverCloseGracePeriod ?? 0) > 0;

  // Empty `flushSync` drains pending non-transition `setState` calls scheduled
  // by the consumer's `onOpenChange`, so the next read of the popup store
  // reflects whether the close was actually committed.
  ReactDOM.flushSync(() => {});

  // Tradeoff: a consumer that defers via `startTransition` (not flushed by
  // `flushSync`) won't get the grace window or tree-coordination signal, but
  // this avoids misattributing an unrelated later `open=false` to this request.
  const isEffectivelyOpen = store.context.isPopupEffectivelyOpen?.() ?? store.select('open');

  if (isEffectivelyOpen) {
    // Give a controlled `onOpenChange` one microtask to commit the update
    // before dropping the pending close.
    queueMicrotask(() => {
      if (
        instance.pendingHoverClose === event &&
        (store.context.isPopupEffectivelyOpen?.() ?? store.select('open'))
      ) {
        instance.pendingHoverClose = null;
      }
    });

    return;
  }

  // Popover's internal `flushSync` may have already synced the floating root
  // store; finalize now so tree coordination doesn't wait for the next render.
  if (!store.select('open')) {
    emitCommittedHoverClose(instance, tree);
  }
}

export function clearRecentHoverClose(instance: HoverInteraction): void {
  instance.lastHoverCloseTime = 0;
  instance.pendingHoverClose = null;
  instance.pendingHoverCloseGrace = false;
}

export function closeWithOptionalDelay(
  store: FloatingRootContext,
  instance: HoverInteraction,
  handleHoverClose: (event: MouseEvent) => void,
  event: MouseEvent,
  closeDelay: number | undefined,
): void {
  // Avoid a spurious `setOpen(false)` when mouseleave fires on an
  // already-closed kept-mounted popup.
  if (!store.select('open')) {
    instance.openChangeTimeout.clear();
    return;
  }

  if (closeDelay) {
    instance.openChangeTimeout.start(closeDelay, () => handleHoverClose(event));
  } else {
    instance.openChangeTimeout.clear();
    handleHoverClose(event);
  }
}
