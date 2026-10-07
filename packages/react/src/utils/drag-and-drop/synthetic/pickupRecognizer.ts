/**
 * Decides whether a press becomes a pointer drag, and when. It binds the `pointerdown`
 * and `dblclick` listeners, checks that the press may pick its draggable up, pairs
 * touch and pen double-taps, holds the press until its activation is met (distance,
 * delay, or a double-click), and suppresses the native drag and the long-press
 * context menu meanwhile. Escape, a blur, a hidden page or a release abandon it.
 *
 * Once a press activates and `onBeforeMoveStart` lets it through, it hands the
 * press to the sensor's active phase (see `startDrag` in `syntheticSensor.ts`).
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
 * The double-tap limits for touch and pen `double-click` activation. The second
 * `pointerdown` must land within this time and distance of the first. Browsers
 * fire `dblclick` for a double-tap inconsistently or not at all, so the sensor
 * pairs the taps itself.
 */
const DOUBLE_TAP_MS = 300;

const DOUBLE_TAP_TOLERANCE_PX = 25;

/**
 * The `pointerdown` and `dblclick` listeners that start a pointer gesture, bound
 * per document or shadow root and ref-counted across draggables. Binding inside
 * the shadow root keeps the internal target, which a closed root hides from
 * outside listeners by retargeting the event to its host.
 */
const eventRootBinding = createEventRootBinding({
  slot: 'syntheticDrag.eventRootBindings',
  listeners: { pointerdown: onPointerDown, dblclick: onDoubleClick },
});

/**
 * Bind the gesture listeners at the element's document or shadow root, and return
 * the function that releases them.
 */
export function bindPointerListeners(element: Element): DragCleanupFn {
  return eventRootBinding.bind(getDragEventRoot(element));
}

/**
 * Block the native HTML drag that some browsers start from a touch or pen
 * long-press while this gesture is alive. The gesture's session owns the
 * returned restore and runs it at teardown, so a release the sensor ignores
 * (see `onPendingPointerUp`) keeps the suppression in place.
 */
function suppressNativeDragForSyntheticPointer(element: HTMLElement): DragCleanupFn {
  const previousDraggable = element.getAttribute('draggable');
  element.setAttribute('draggable', 'false');

  return onceCleanup(() => {
    // Restore even if the element was unregistered mid-gesture, since it still
    // carries the forced `draggable="false"`. Skipping this would lose an
    // original `draggable="true"`.
    if (previousDraggable == null) {
      element.removeAttribute('draggable');
    } else {
      element.setAttribute('draggable', previousDraggable);
    }
  });
}

/**
 * Tear down the pending (pre-activation) phase.
 *
 * Pass `releaseContextMenuSuppression` when the gesture ended without a drag: a
 * clean `pointerup`, a chorded release, or a refused or failed commit. The
 * touch/pen suppression is released, so a quick tap doesn't swallow a deliberate
 * long-press `contextmenu` fired within the next 1.5s. A refused commit can leave
 * the finger down, and Android then still fires its long-press `contextmenu`.
 * That menu is let through, since the press is an ordinary press again.
 *
 * A browser cancellation (`pointercancel` or blur) keeps it armed, because on
 * Android a long-press fires `pointercancel` and then the `contextmenu` that
 * must be suppressed.
 */
function clearPending(releaseContextMenuSuppression: boolean = false): void {
  const pending = state.pending;
  if (!pending) {
    return;
  }
  // Null the singleton first. `recoverDetachedSession` calls this, and every step
  // below can throw on a dead realm (`removeEventListener` on a dead `Window`
  // raises). A `state.pending` left set would make every later `pointerdown`
  // re-enter this teardown and throw again, so no drag could start.
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
 * Cancels the drag in progress. Fires `onMoveEnd` with a `null` target and the
 * `'imperative-action'` reason. Does nothing when no drag is active. The engine
 * exposes it as `cancelDrag`.
 */
export function cancelDrag(): void {
  // Also drop a pending candidate. When a consumer cancels (say, a dialog opens
  // on `pointerdown`), the next move must not activate a drag anyway.
  clearPending();
  getActiveSession()?.cancel();
}

/**
 * Whether the press landed in `element`'s own scrollbar gutter rather than on
 * its content.
 *
 * Only classic scrollbars, which take layout space, can be detected this way.
 * They are also the only ones that need it. An overlay scrollbar takes no space,
 * so the padding box covers the whole content area and the checks below never
 * match.
 */
function isScrollbarPress(event: MouseEvent, element: Element): boolean {
  if (!isHTMLElement(element)) {
    return false;
  }
  // Without scrollable overflow there is no gutter, and the offsets below would
  // measure the borders instead. A press on a draggable's border must still pick
  // it up. The extents are checked before the computed overflow because this
  // runs on every press and almost no draggable overflows, so style resolution
  // is usually skipped.
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
  // Derived from the rect, not from `event.offsetX`/`offsetY`. Those are relative
  // to `event.target`, which is the retargeted host for content in a shadow tree
  // below the bound root, while `element` is the composed node that owns the
  // gutter. `clientLeft`/`clientTop` are the left and top border widths, so the
  // offsets are measured from the padding edge.
  const rect = element.getBoundingClientRect();
  const scaleX = element.offsetWidth > 0 ? rect.width / element.offsetWidth : 1;
  const scaleY = element.offsetHeight > 0 ? rect.height / element.offsetHeight : 1;
  const offsetX = (event.clientX - rect.left) / scaleX - element.clientLeft;
  const offsetY = (event.clientY - rect.top) / scaleY - element.clientTop;
  // The vertical scrollbar sits past the padding box on the right, or before it
  // on the left in RTL. Only the scrollbar's side is checked, because the other
  // side is the element's border, and a press there must still pick up the
  // draggable. In horizontal writing modes the horizontal scrollbar is always at
  // the bottom, so the top border is never a gutter.
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
 * The `pickup` a press resolved to, or `null` when the press should stay an
 * ordinary press. The pointer and double-click paths share it so both apply the
 * same checks.
 */
function acceptPressPickup(
  pickup: DraggablePickup | null,
  event: MouseEvent,
): DraggablePickup | null {
  // A control nested inside the draggable handles its own press (see `canPickUp`).
  if (!pickup || !canPickUp(pickup)) {
    return null;
  }
  // Same rule for a classic scrollbar, which hit-tests to its element. A press on
  // the scrollbar of a list inside a draggable would otherwise arm the gesture,
  // and the default mouse activation would pick up the whole card after 5px of
  // thumb travel.
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
  // Resolve on every press, before the checks below, because the walk also
  // refreshes the static setup of every draggable around the target (see
  // `resolveDraggablePickup`).
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
  // Touch and pen double-tap. The second tap on the same source picks it up
  // while the pointer is down, and the release drops it. Mouse uses the native
  // `dblclick` instead (see `onDoubleClick`) and then follows the pointer with no
  // button held.
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
  // Only a touch or pen long-press can fire a stray `contextmenu` after the
  // gesture ends. Arming this for mouse would swallow a real right-click shortly
  // after a left-click that never became a drag.
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
    // iOS Safari only lets the active phase's `touchmove` guard cancel scroll
    // if a `{ passive: false }` listener existed before the gesture needed it.
    // The guard is added on the document at commit, which is too late, so this
    // window listener lives with the whole gesture rather than the pending
    // listeners. A mouse drag gets no guard, so it needs none.
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
    // Escape during the pending press-hold abandons the candidate before it
    // activates (the active phase has its own Escape handler).
    addEventListener(win, 'keydown', onPendingKeyDown, CAPTURE),
    // If the window blurs or the tab is hidden (app switch, soft keyboard,
    // overlay) before the press-hold timer fires, abandon the candidate so a
    // drag never commits while the page is in the background.
    addEventListener(win, 'blur', () => clearPending()),
    addEventListener(ownerDocument(element), 'visibilitychange', onPendingVisibilityChange),
  );
  // The OS answers a touch or pen press-hold with a context menu, which can
  // arrive before activation. Mouse is exempt. Its activation is distance-based,
  // so a button held on a draggable keeps the gesture pending indefinitely, and
  // suppressing then would block right-clicks page-wide until release.
  if (pointerType !== 'mouse') {
    // `startContextMenuSuppression` removes itself after one menu. This listener
    // stays until the pending phase ends, so an early `contextmenu` can't leave
    // the rest of the held gesture unguarded.
    pendingRef.listeners.push(addEventListener(win, 'contextmenu', preventContextMenu, CAPTURE));
  }

  evaluatePendingActivation(pendingRef.startedAt);
}

/**
 * Whether a new gesture may start. A gesture whose document lost its browsing
 * context (iframe removed, popout closed) can't end on its own, because its
 * ending listeners all lived in the dead realm, and it would block every later
 * drag. The next gesture anywhere detects it, cancels the dead session, and
 * proceeds. A live session still blocks.
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
  // Touch and pen use the double-tap path in `onPointerDown`. A `dblclick` the
  // browser fires for a double-tap must not open a mouse-following session,
  // since no touch could move or drop it. Firefox's `dblclick` has no
  // `pointerType`, so use the type of the press that produced it.
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
  // This session holds no pointer. `pointerId` -1 never matches a real pointer,
  // and the empty `activation` list is never evaluated because the commit runs
  // right below.
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
 * Record a touch or pen press on a double-tap source as the first half of a
 * double-tap. The release confirms it. A `pointercancel` (native scroll took
 * over) or a release far from the press counts as a swipe, not a tap.
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

  // Window capture covers the normal event path. Pointer Events target
  // `contextmenu` at the original press target, even after `lostpointercapture`,
  // so listen on that target too. A live reorder can detach it before Android
  // delivers the menu, and its event path then no longer reaches `window`. The
  // draggable and handle need no listeners. They contain `target` at
  // `pointerdown`, and after detachment only a listener on the target itself is
  // reliable.
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
    // A running hold timer already fires at the right deadline and re-evaluates
    // with the latest position. Re-arm only when the list changed, which can
    // change the earliest deadline, or when no timer is armed yet.
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
  // Missed release, as in the active phase. `buttons === 0` means the button
  // came up without a terminating event reaching the sensor, so drop the
  // candidate instead of letting it linger or activate.
  if (pointerEvent.buttons === 0) {
    clearPending();
    return;
  }
  // Chorded release. Lifting the primary button while another is held fires
  // `pointermove` (a `buttons` change), not `pointerup`, and the later
  // `pointerup` reports the last button. Without this check, the candidate stays
  // armed and blocks every later `pointerdown` until a move with `buttons === 0`
  // clears it.
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
 * hand it to the sensor's active phase (see `startDrag`). Returns whether a drag
 * started. When none did, the press is abandoned, unless a callback already ended
 * or replaced it.
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

    // Re-check the lifecycle in case another pointer started a drag during the
    // pending window. Avoid running callbacks and building a preview for a session
    // the lifecycle would refuse.
    if (getActiveSession() !== null) {
      return false;
    }

    const dragHandle = resolveDragHandle(parameters);
    if (state.pending !== pending) {
      return false;
    }
    // Re-check the pickup conditions, since each may have changed during the
    // press. `disabled` may have flipped, or the draggable may have a new handle
    // that the press isn't on or that puts an interactive control between them.
    if (
      !canPickUp({ element, target, parameters, dragHandle }) ||
      // A nested widget with no interactive role, such as a slider thumb, took
      // pointer capture during the press and owns the gesture. The drag would
      // steal that capture for the body anchor. Touch and pen implicitly capture
      // the press target itself, so only a mouse target's capture counts.
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

    // The candidate source has no session or preview yet. The same record is used
    // through pickup, so data set in `onBeforeMoveStart` reaches every handler.
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

    // Remove the pending listeners and timer now. Pointer events that arrive
    // before the active phase starts are no longer pending events.
    pending.pressHoldTimer.clear();
    for (const off of pending.listeners) {
      off();
    }

    // A double-click pickup holds no pointer, and its `dblclick` isn't a
    // `PointerEvent` in every browser. Until the first move, a frame that runs
    // for a scroll reports the press of the second click.
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
    // A refusal or a throw before the handoff leaves the pending phase to undo,
    // which `clearPending` does, including the resources the active phase would
    // have inherited and this gesture's contextmenu suppression. Every step is
    // idempotent, so running it after the pending listeners were removed is safe.
    // After the handoff, or once a callback ended or replaced this gesture,
    // `state.pending` no longer points at it.
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
   * The press's event target. Activation uses it for the handle and
   * interactive-control checks and for the active phase's `touchmove` and
   * `contextmenu` listeners. Pending teardown uses it to release touch's implicit
   * pointer capture.
   */
  target: Element;
  pointerId: number;
  pointerType: DraggablePointerType;
  activation: DraggableRootActivation[];
  /** How the pickup happened, reported to `onBeforeMoveStart` as `eventDetails.reason`. */
  activationKind: DragStartReason;
  /**
   * Whether a held pointer drives the gesture. If so, the pointer is captured,
   * `pointerup` drops, and a `buttons` release cancels. `false` only for a mouse
   * double-click, which follows the mouse with no button down and drops on the
   * next click.
   */
  heldPointer: boolean;
  origin: { x: number; y: number };
  /**
   * The gesture's latest event, first the press and then each pending move.
   * Activation reads its input from it, and `onBeforeMoveStart` receives it in
   * its details.
   */
  lastNativeEvent: PointerEvent | MouseEvent;
  startedAt: number;
  listeners: DragCleanupFn[];
  pressHoldTimer: WindowTimeout;
  /**
   * The contextmenu suppression this gesture armed (touch and pen only), or
   * `null` for mouse. The clean `pointerup` path releases it, so a gesture only
   * cancels its own suppression and never another one in the global slot.
   */
  contextMenuSuppression: DragCleanupFn | null;
  /**
   * Cleanups for what the whole gesture holds rather than one phase: the
   * source's `draggable="false"` override and the window-level
   * `{ passive: false }` `touchmove` listener that iOS needs before the active
   * phase's guard (see `onPointerDown`). Passed to the active session at commit.
   */
  gestureCleanups: DragCleanupFn[];
}
