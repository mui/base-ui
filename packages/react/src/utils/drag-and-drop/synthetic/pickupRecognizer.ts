/**
 * Decides whether a press becomes a pointer drag. It holds the press until its activation
 * is met, suppressing the native drag and the long-press context menu meanwhile, and pairs
 * touch and pen double-taps. Escape, a blur, a hidden page or a release abandon it. Once
 * `onBeforeMoveStart` lets it through, it goes to `startDrag` (`syntheticSensor.ts`).
 */

import { NOOP } from '@base-ui/utils/empty';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { getTarget } from '@base-ui/utils/shadowDom';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { WindowTimeout } from '../../windowTimeout';
import { createChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import { REASONS } from '../../../internals/reasons';
import {
  evaluateActivations,
  getActivationDelayMs,
  hasDoubleClickActivation,
  resolveActivation,
} from '../activation';
import type {
  DraggableRootActivation,
  DraggableRootBeforeMoveStartEventDetails,
} from '../../../draggable/root/DraggableRoot';
import { getActiveSession } from '../core/dragSession';
import { recoverActiveSession, startDrag } from './syntheticSensor';
import { consumeDoubleClickFollowUp, CAPTURE } from './postDragClick';
import { getSharedSlot } from '../sharedState';
import { createEventRootBinding } from '../documentBinding';
import { createDragSource } from '../dragSource';
import {
  canPickUp,
  getRegistration,
  resolveDragHandle,
  resolveDraggablePickup,
} from '../draggableRegistry';
import type { DraggablePickup } from '../draggableRegistry';
import { hasCapturingAncestorWithin } from '../interactiveElement';
import type { DraggablePointerType } from '../../../draggable/DraggableProvider';
import type { DragCleanupFn, DragStartReason } from '../types';
import {
  getDragEventRoot,
  getInput,
  getOverflowFlags,
  isDetachedDocument,
  isPrimaryHeld,
  isRtlElement,
  normalizePointerType,
  onceCleanup,
  preventContextMenu,
  preventNativeDragStart,
  releasePointerCaptureSafely,
  runAllCleanups,
} from '../utils';

interface PickupRecognizerState {
  /** The press waiting for its activation, if any. */
  pending: PendingSession | null;
  /** The first tap of a possible touch/pen double-tap (see `recordTap`). */
  lastTap: TapRecord | null;
  /** The last `pointerdown` anywhere (see `onDoubleClick`). */
  lastPointerDown: PointerEvent | null;
  cleanupContextMenuSuppression: DragCleanupFn | null;
}

const state = getSharedSlot<PickupRecognizerState>('syntheticDrag.pickup', () => ({
  pending: null,
  lastTap: null,
  lastPointerDown: null,
  cleanupContextMenuSuppression: null,
}));

const CONTEXT_MENU_SUPPRESSION_MS = 1500;

/**
 * Time and distance within which a second touch or pen `pointerdown` completes a
 * double-tap. Browsers fire `dblclick` for a double-tap inconsistently or not at
 * all, so the sensor pairs the taps itself.
 */
const DOUBLE_TAP_MS = 300;

const DOUBLE_TAP_TOLERANCE_PX = 25;

/**
 * The gesture-starting listeners, bound per document or shadow root and
 * ref-counted across draggables. Binding inside a shadow root sees the real
 * target, which a closed root retargets to its host for outside listeners.
 */
const eventRootBinding = createEventRootBinding({
  slot: 'syntheticDrag.eventRootBindings',
  listeners: { pointerdown: onPointerDown, dblclick: onDoubleClick },
});

/** Bind the gesture listeners at the element's document or shadow root. */
export function bindPointerListeners(element: Element): DragCleanupFn {
  return eventRootBinding.bind(getDragEventRoot(element));
}

/**
 * Block the native HTML drag that some browsers start from a touch or pen
 * long-press. The gesture runs the returned restore at teardown, so a release the
 * sensor ignores (see `onPendingPointerUp`) keeps the suppression in place.
 */
function suppressNativeDragForSyntheticPointer(element: HTMLElement): DragCleanupFn {
  const previousDraggable = element.getAttribute('draggable');
  element.setAttribute('draggable', 'false');

  return onceCleanup(() => {
    // Restore even if the element was unregistered mid-gesture, or an original
    // `draggable="true"` would be lost.
    if (previousDraggable == null) {
      element.removeAttribute('draggable');
    } else {
      element.setAttribute('draggable', previousDraggable);
    }
  });
}

/**
 * Tear down the pending (pre-activation) phase. Pass `releaseContextMenuSuppression` when
 * the gesture ended without a drag, so its long-press `contextmenu` goes through. A
 * browser cancellation (`pointercancel`, blur) keeps it armed, because an Android
 * long-press fires `pointercancel` and then the `contextmenu` to suppress.
 */
function clearPending(releaseContextMenuSuppression: boolean = false): void {
  const pending = state.pending;
  if (!pending) {
    return;
  }
  // Null the singleton first. On a dead realm (see `recoverDetachedSession`) the
  // steps below can throw, and a leftover `state.pending` would make every later
  // `pointerdown` throw here again, so no drag could start.
  state.pending = null;
  runAllCleanups([
    pending.pressHoldTimer.clear,
    ...pending.listeners,
    // Touch and pen implicitly capture the pointerdown target. A mouse target
    // only holds capture that a nested widget took, which stays with the widget.
    () => {
      if (pending.pointerType !== 'mouse') {
        releasePointerCaptureSafely(pending.target, pending.pointerId);
      }
    },
    ...pending.gestureCleanups,
    ...(releaseContextMenuSuppression && pending.contextMenuSuppression
      ? [pending.contextMenuSuppression]
      : []),
  ]);
}

/**
 * Cancel the drag in progress, firing `onMoveEnd` with a `null` target and the
 * `'imperative-action'` reason. Does nothing when no drag is active.
 */
export function cancelDrag(): void {
  // Also drop a pending press, so the next move can't still activate a drag (say,
  // after a dialog opened on `pointerdown`).
  clearPending();
  getActiveSession()?.cancel();
}

/**
 * Whether the press landed in `element`'s own scrollbar gutter. Only classic
 * scrollbars take layout space and need this. An overlay scrollbar takes no
 * space, so the checks below never match it.
 */
function isScrollbarPress(event: MouseEvent, element: Element): boolean {
  if (!isHTMLElement(element)) {
    return false;
  }
  // Without overflow, the offsets below would match a press on the border, which
  // must still pick up the draggable. Check the cheap extents before the computed
  // style, since this runs on every press and almost no draggable overflows.
  const overflowsY = element.scrollHeight > element.clientHeight;
  const overflowsX = element.scrollWidth > element.clientWidth;
  if (!overflowsX && !overflowsY) {
    return false;
  }
  const overflow = getOverflowFlags(element);
  const scrollsY = overflow.y && overflowsY;
  const scrollsX = overflow.x && overflowsX;
  if (!scrollsX && !scrollsY) {
    return false;
  }
  // Use the rect, not `event.offsetX`/`offsetY`, which are relative to
  // `event.target`, a retargeted host when `element` is in a shadow tree below the
  // bound root. Subtracting the border widths measures from the padding edge.
  const rect = element.getBoundingClientRect();
  const scaleX = element.offsetWidth > 0 ? rect.width / element.offsetWidth : 1;
  const scaleY = element.offsetHeight > 0 ? rect.height / element.offsetHeight : 1;
  const offsetX = (event.clientX - rect.left) / scaleX - element.clientLeft;
  const offsetY = (event.clientY - rect.top) / scaleY - element.clientTop;
  // Check only the scrollbar's side (right, or left in RTL), since the other side
  // is border. In horizontal writing modes the horizontal scrollbar is always at
  // the bottom.
  if (scrollsY) {
    const rtl = isRtlElement(element);
    if (rtl ? offsetX < 0 : offsetX > element.clientWidth) {
      return true;
    }
  }
  if (scrollsX && offsetY > element.clientHeight) {
    return true;
  }
  return false;
}

/**
 * The press's `pickup`, or `null` when it should stay an ordinary press. Shared by
 * the pointer and double-click paths.
 */
function acceptPressPickup(
  pickup: DraggablePickup | null,
  event: MouseEvent,
): DraggablePickup | null {
  // A control nested inside the draggable handles its own press (see `canPickUp`).
  if (!pickup || !canPickUp(pickup)) {
    return null;
  }
  // Same for a classic scrollbar, which hit-tests to its element. Otherwise
  // dragging the thumb of a list inside a card would pick up the whole card.
  if (isScrollbarPress(event, pickup.target)) {
    return null;
  }
  return pickup;
}

function onPointerDown(event: Event): void {
  const pointerEvent = event as PointerEvent;
  const pointerType = normalizePointerType(pointerEvent.pointerType);
  // Read by `onDoubleClick` for a `dblclick` that carries no `pointerType`, and
  // reported by a double-click drag until its first move (see `activatePending`).
  state.lastPointerDown = pointerEvent;

  // Ending a stranded session runs its end handlers, which can change the
  // registrations, so the press resolves after it.
  const recovered = recoverDetachedSession(event);
  // Resolve on every press, even one rejected below. The walk also refreshes the
  // static setup of the draggables around the target (see `resolveDraggablePickup`).
  const candidate = resolveDraggablePickup(getTarget(event));
  if (!recovered) {
    return;
  }

  // Accept the press if either `button` or `buttons` reports the primary button.
  // A primary touch press reports both, but browsers can misreport one.
  if (pointerEvent.button !== 0 && pointerEvent.buttons !== 1) {
    return;
  }

  const pickup = acceptPressPickup(candidate, pointerEvent);
  if (!pickup) {
    return;
  }
  const { element, target, parameters } = pickup;

  if (getActiveSession() !== null) {
    return;
  }

  let activation = resolveActivation(parameters.activation, pointerType);
  let activationKind: PendingSession['activationKind'] = REASONS.pointer;
  // A touch or pen double-tap picks up on the second press and drops on its
  // release. Mouse uses the native `dblclick` instead (see `onDoubleClick`).
  if (pointerType !== 'mouse' && hasDoubleClickActivation(parameters.activation, pointerType)) {
    if (isSecondTap(element, pointerEvent, pointerType)) {
      clearLastTap();
      activation = [{ type: 'immediate' }];
      activationKind = REASONS.doubleClick;
    } else {
      recordTap(element, pointerEvent, pointerType);
    }
  } else {
    // Any other press ends a tap sequence, so a tap elsewhere can't pair with
    // a much earlier one on this source.
    clearLastTap();
  }
  if (activation.length === 0) {
    return;
  }
  const win = ownerWindow(element);
  // Only a touch or pen long-press fires a stray `contextmenu` after the gesture.
  // For mouse this would swallow a real right-click after a plain left-click.
  const contextMenuSuppression =
    pointerType === 'mouse' ? null : startContextMenuSuppression(win, target);

  // The pending phase doesn't block scrolling. A touch or pen swipe can turn into
  // a native scroll and cancel the candidate through `pointercancel`.

  const pendingRef: PendingSession = {
    element,
    target,
    pointerId: pointerEvent.pointerId,
    pointerType,
    activation,
    activationKind,
    heldPointer: true,
    origin: { x: pointerEvent.clientX, y: pointerEvent.clientY },
    lastNativeEvent: pointerEvent,
    startedAt: pointerEvent.timeStamp,
    listeners: [],
    pressHoldTimer: new WindowTimeout(win),
    contextMenuSuppression,
    gestureCleanups: [suppressNativeDragForSyntheticPointer(element)],
  };
  if (pointerType !== 'mouse') {
    // iOS Safari only lets a `touchmove` guard cancel scroll if a
    // `{ passive: false }` listener existed before the gesture needed it. The
    // active phase adds its guard too late, so this one lives with the gesture.
    pendingRef.gestureCleanups.push(addEventListener(win, 'touchmove', NOOP, { passive: false }));
  }
  state.pending = pendingRef;

  pendingRef.listeners.push(
    addEventListener(win, 'pointermove', onPendingPointerMove, CAPTURE),
    addEventListener(win, 'pointerup', onPendingPointerUp, CAPTURE),
    addEventListener(win, 'pointercancel', onPendingPointerCancel, CAPTURE),
    // Suppress the native HTML5 drag that a natively draggable descendant
    // (`<img>`, `<a href>`) would otherwise start from the same press.
    addEventListener(win, 'dragstart', preventNativeDragStart, CAPTURE),
    addEventListener(win, 'keydown', onPendingKeyDown, CAPTURE),
    // A blurred window or hidden page abandons the press, so a drag never commits
    // in the background.
    addEventListener(win, 'blur', () => clearPending()),
    addEventListener(ownerDocument(element), 'visibilitychange', onPendingVisibilityChange),
  );
  // A touch or pen press-hold can raise the OS context menu before activation.
  // Not for mouse: a held button can stay pending indefinitely, and this would
  // block right-clicks page-wide until release.
  if (pointerType !== 'mouse') {
    // Unlike `startContextMenuSuppression`, which removes itself after one menu,
    // this guards the whole pending phase.
    pendingRef.listeners.push(addEventListener(win, 'contextmenu', preventContextMenu, CAPTURE));
  }

  evaluatePendingActivation(pendingRef.startedAt);
}

/**
 * Whether a new gesture may start. A gesture whose document lost its browsing
 * context (iframe removed, popout closed) can't end on its own, because its
 * listeners died with the realm, so the next press anywhere cancels it.
 */
function recoverDetachedSession(event: Event): boolean {
  if (state.pending && isDetachedDocument(ownerDocument(state.pending.element))) {
    clearPending();
  }
  // The active phase recovers its own session (see `recoverActiveSession`).
  return state.pending === null && recoverActiveSession(event);
}

/** A double-click pickup follows the mouse until the next primary click. */
function onDoubleClick(event: Event): void {
  const mouseEvent = event as MouseEvent;
  if (mouseEvent.button !== 0 || mouseEvent.detail !== 2) {
    return;
  }
  // The end of a double-click whose first click dropped the last pickup.
  if (consumeDoubleClickFollowUp(mouseEvent)) {
    return;
  }
  // A `dblclick` from a double-tap must not open a mouse-following session that no
  // touch could move or drop (touch and pen pair taps in `onPointerDown`).
  // Firefox's `dblclick` has no `pointerType`, so use the press's.
  const pointerType =
    'pointerType' in mouseEvent
      ? normalizePointerType((mouseEvent as PointerEvent).pointerType)
      : normalizePointerType(state.lastPointerDown?.pointerType);
  if (pointerType !== 'mouse') {
    return;
  }
  if (!recoverDetachedSession(event) || getActiveSession() !== null) {
    return;
  }
  const pickup = acceptPressPickup(resolveDraggablePickup(getTarget(event)), mouseEvent);
  if (!pickup || !hasDoubleClickActivation(pickup.parameters.activation, 'mouse')) {
    return;
  }
  // No pointer is held, so `pointerId` -1 matches none. `activation` is never
  // evaluated because the commit runs right below.
  state.pending = {
    element: pickup.element,
    target: pickup.target,
    pointerId: -1,
    pointerType: 'mouse',
    activation: [],
    activationKind: REASONS.doubleClick,
    heldPointer: false,
    origin: { x: mouseEvent.clientX, y: mouseEvent.clientY },
    lastNativeEvent: mouseEvent,
    startedAt: mouseEvent.timeStamp,
    listeners: [],
    pressHoldTimer: new WindowTimeout(ownerWindow(pickup.element)),
    contextMenuSuppression: null,
    gestureCleanups: [],
  };
  if (activatePending()) {
    mouseEvent.preventDefault();
  }
}

/**
 * Record a touch or pen press as the first half of a double-tap. A nearby release
 * confirms it. A `pointercancel` (native scroll) or a distant release discards it.
 */
function recordTap(
  element: HTMLElement,
  pointerEvent: PointerEvent,
  pointerType: DraggablePointerType,
) {
  clearLastTap();
  const win = ownerWindow(element);
  const cleanups: DragCleanupFn[] = [];
  const tap: TapRecord = {
    element,
    pointerId: pointerEvent.pointerId,
    pointerType,
    clientX: pointerEvent.clientX,
    clientY: pointerEvent.clientY,
    timeStamp: pointerEvent.timeStamp,
    released: false,
    cleanup: () => runAllCleanups(cleanups),
  };
  const onUp = (up: PointerEvent) => {
    if (up.pointerId !== tap.pointerId) {
      return;
    }
    tap.cleanup();
    if (isWithinTapTolerance(tap, up)) {
      tap.released = true;
    } else if (state.lastTap === tap) {
      state.lastTap = null;
    }
  };
  const onCancel = (event: PointerEvent) => {
    if (event.pointerId === tap.pointerId && state.lastTap === tap) {
      clearLastTap();
    }
  };
  cleanups.push(
    addEventListener(win, 'pointerup', onUp, CAPTURE),
    addEventListener(win, 'pointercancel', onCancel, CAPTURE),
  );
  state.lastTap = tap;
}

function clearLastTap(): void {
  const tap = state.lastTap;
  if (!tap) {
    return;
  }
  state.lastTap = null;
  tap.cleanup();
}

/** Whether this press completes a double-tap on `element` (see `recordTap`). */
function isSecondTap(
  element: HTMLElement,
  pointerEvent: PointerEvent,
  pointerType: DraggablePointerType,
): boolean {
  const tap = state.lastTap;
  return (
    tap !== null &&
    tap.released &&
    tap.element === element &&
    tap.pointerType === pointerType &&
    pointerEvent.timeStamp - tap.timeStamp <= DOUBLE_TAP_MS &&
    isWithinTapTolerance(tap, pointerEvent)
  );
}

function isWithinTapTolerance(tap: TapRecord, pointerEvent: PointerEvent): boolean {
  const dx = pointerEvent.clientX - tap.clientX;
  const dy = pointerEvent.clientY - tap.clientY;
  return dx * dx + dy * dy <= DOUBLE_TAP_TOLERANCE_PX * DOUBLE_TAP_TOLERANCE_PX;
}

function onPendingKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    clearPending();
  }
}

function startContextMenuSuppression(win: Window, target: Element): DragCleanupFn {
  state.cleanupContextMenuSuppression?.();

  // Pointer Events fire `contextmenu` at the original press target, even after
  // `lostpointercapture`. A live reorder can detach it before Android delivers the
  // menu, cutting its path to `window`, so listen on the target too. Only a
  // listener on the target itself survives that.
  const timeout = new WindowTimeout(win);
  const cleanups: DragCleanupFn[] = [];

  const cleanup = onceCleanup(() => {
    timeout.clear();
    for (const off of cleanups) {
      off();
    }
    if (state.cleanupContextMenuSuppression === cleanup) {
      state.cleanupContextMenuSuppression = null;
    }
  });

  const onContextMenu = (event: Event) => {
    event.preventDefault();
    cleanup();
  };

  cleanups.push(
    addEventListener(win, 'contextmenu', onContextMenu, CAPTURE),
    addEventListener(target, 'contextmenu', onContextMenu, CAPTURE),
  );

  state.cleanupContextMenuSuppression = cleanup;
  timeout.start(CONTEXT_MENU_SUPPRESSION_MS, cleanup);
  return cleanup;
}

/** Evaluate the pending activation at time `now` and the pointer's latest position. */
function evaluatePendingActivation(now: number): void {
  const pending = state.pending;
  if (!pending) {
    return;
  }
  const elapsed = now - pending.startedAt;
  const current = { x: pending.lastNativeEvent.clientX, y: pending.lastNativeEvent.clientY };
  const { activate, remaining } = evaluateActivations(
    pending.activation,
    pending.origin,
    current,
    elapsed,
  );
  const pruned = remaining.length !== pending.activation.length;
  pending.activation = remaining;
  if (activate) {
    activatePending();
  } else if (remaining.length === 0) {
    clearPending();
  } else if (pruned || !pending.pressHoldTimer.isStarted()) {
    // A running timer already re-evaluates at its deadline with the latest
    // position. Re-arm only when pruning may have moved the earliest deadline, or
    // when none is armed.
    const delay = getActivationDelayMs(pending.activation);
    pending.pressHoldTimer.clear();
    if (delay !== null) {
      pending.pressHoldTimer.start(Math.max(0, delay - elapsed), () => {
        if (state.pending === pending) {
          evaluatePendingActivation(pending.startedAt + delay);
        }
      });
    }
  }
}

function onPendingPointerMove(pointerEvent: PointerEvent): void {
  const pending = state.pending;
  if (!pending || pointerEvent.pointerId !== pending.pointerId) {
    return;
  }
  // Missed release: the button came up without a terminating event reaching the
  // sensor.
  if (pointerEvent.buttons === 0) {
    clearPending();
    return;
  }
  // Chorded release. Lifting the primary button while another is held fires
  // `pointermove`, not `pointerup`, and the later `pointerup` reports the last
  // button released. Without this, the press would stay armed and block later ones.
  if (!isPrimaryHeld(pointerEvent)) {
    clearPending(true);
    return;
  }
  pending.lastNativeEvent = pointerEvent;
  evaluatePendingActivation(pointerEvent.timeStamp);
}

function onPendingPointerUp(pointerEvent: PointerEvent): void {
  const pending = state.pending;
  if (!pending || pointerEvent.pointerId !== pending.pointerId) {
    return;
  }
  // Safari can misreport `button` on a quick release. Ignore a non-primary
  // release only while `buttons` confirms that the primary is still held.
  if (pointerEvent.button !== 0 && isPrimaryHeld(pointerEvent)) {
    return;
  }
  // A clean release without a drag frees the contextmenu suppression (see `clearPending`).
  clearPending(true);
}

function onPendingPointerCancel(pointerEvent: PointerEvent): void {
  const pending = state.pending;
  if (!pending || pointerEvent.pointerId !== pending.pointerId) {
    return;
  }
  clearPending();
}

function onPendingVisibilityChange(): void {
  const pending = state.pending;
  if (pending && ownerDocument(pending.element).visibilityState === 'hidden') {
    clearPending();
  }
}

/**
 * Re-check a press that met its activation, let `onBeforeMoveStart` veto it, and
 * hand it to `startDrag`. Returns whether a drag started. Otherwise the press is
 * abandoned, unless a callback already ended or replaced it.
 */
function activatePending(): boolean {
  const pending = state.pending;
  if (!pending) {
    return false;
  }
  const { element, target, pointerId, pointerType } = pending;
  const lastInput = getInput(pending.lastNativeEvent);
  let started = false;
  try {
    const getParameters = getRegistration(element);
    if (!getParameters) {
      return false;
    }
    const parameters = getParameters();
    if (state.pending !== pending) {
      return false;
    }

    // Another pointer may have started a drag meanwhile. Don't run callbacks or
    // build a preview for a session the lifecycle would refuse.
    if (getActiveSession() !== null) {
      return false;
    }

    const dragHandle = resolveDragHandle(parameters);
    if (state.pending !== pending) {
      return false;
    }
    // The pickup conditions may have changed during the press, such as `disabled`
    // flipping or a new handle.
    if (
      !canPickUp({ element, target, parameters, dragHandle }) ||
      // A nested widget without an interactive role (a slider thumb) that took
      // pointer capture owns the gesture. Touch and pen implicitly capture the
      // press target, so only a mouse target's own capture counts.
      (pending.heldPointer &&
        hasCapturingAncestorWithin(
          target,
          dragHandle ?? element,
          pointerId,
          pointerType === 'mouse',
        ))
    ) {
      return false;
    }

    // The same record lives through pickup, so data set in `onBeforeMoveStart`
    // reaches every handler.
    const dragSource = createDragSource(
      element,
      parameters.kind.id,
      parameters.payload,
      dragHandle,
    );

    // Let the consumer veto the drag. This runs before anything is allocated, so
    // canceling only has to undo the pending phase.
    if (parameters.onBeforeMoveStart) {
      const eventDetails: DraggableRootBeforeMoveStartEventDetails = createChangeEventDetails(
        pending.activationKind,
        pending.lastNativeEvent,
        target,
        { input: lastInput, source: dragSource },
      );
      parameters.onBeforeMoveStart(eventDetails);
      // Imperative cancellation or blur can clear the candidate inside the callback.
      if (state.pending !== pending) {
        return false;
      }
      if (eventDetails.isCanceled) {
        return false;
      }
    }

    // Events from here on are no longer pending events.
    pending.pressHoldTimer.clear();
    for (const off of pending.listeners) {
      off();
    }

    // A double-click pickup holds no pointer, and `dblclick` isn't a `PointerEvent`
    // in every browser, so frames report the second click's press until the first move.
    started = startDrag(
      pending,
      parameters,
      dragSource,
      pending.heldPointer
        ? pending.lastNativeEvent
        : (state.lastPointerDown ?? pending.lastNativeEvent),
    );
    return started;
  } finally {
    // A refusal or throw before the handoff leaves the pending phase to undo,
    // including the gesture cleanups and contextmenu suppression. Its steps are
    // idempotent, so running them after the listeners were removed is safe. The
    // identity check skips a gesture that was handed off, ended or replaced.
    if (!started && state.pending === pending) {
      clearPending(true);
    }
  }
}

/** Whether `pending` is still the press waiting to activate, since consumer code may end it. */
export function isPending(pending: PendingSession): boolean {
  return state.pending === pending;
}

/** The drag of `pending` started, so the active phase owns the gesture from here. */
export function completePending(pending: PendingSession): void {
  if (state.pending === pending) {
    state.pending = null;
  }
}

export function resetForTests(): void {
  clearPending();
  clearLastTap();
  state.lastPointerDown = null;
  state.cleanupContextMenuSuppression?.();
}

interface TapRecord {
  element: HTMLElement;
  pointerId: number;
  pointerType: DraggablePointerType;
  clientX: number;
  clientY: number;
  timeStamp: number;
  /** Set once the press ended as a tap rather than a swipe or a native scroll. */
  released: boolean;
  /** Removes the release listeners; idempotent. */
  cleanup: DragCleanupFn;
}

export interface PendingSession {
  element: HTMLElement;
  /**
   * The press's event target. Used by the pickup checks, the active phase's
   * `touchmove` and `contextmenu` listeners, and to release implicit capture.
   */
  target: Element;
  pointerId: number;
  pointerType: DraggablePointerType;
  activation: DraggableRootActivation[];
  /** How the pickup happened, reported to `onBeforeMoveStart` as `eventDetails.reason`. */
  activationKind: DragStartReason;
  /**
   * Whether a held pointer drives the gesture: it is captured, `pointerup` drops,
   * and a missed release cancels. `false` only for a mouse double-click, which
   * follows the mouse with no button down and drops on the next click.
   */
  heldPointer: boolean;
  origin: { x: number; y: number };
  /**
   * The press, then each pending move. Activation reads its input from it, and
   * `onBeforeMoveStart` receives it.
   */
  lastNativeEvent: PointerEvent | MouseEvent;
  startedAt: number;
  listeners: DragCleanupFn[];
  pressHoldTimer: WindowTimeout;
  /**
   * The contextmenu suppression this gesture armed (touch and pen), or `null`.
   * Kept so a release only cancels its own, never another one in the global slot.
   */
  contextMenuSuppression: DragCleanupFn | null;
  /**
   * Cleanups owned by the whole gesture rather than one phase: the
   * `draggable="false"` override and the iOS `touchmove` listener (see
   * `onPointerDown`). Passed to the active session at commit.
   */
  gestureCleanups: DragCleanupFn[];
}
