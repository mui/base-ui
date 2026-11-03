/**
 * The pointer sensor. It drives mouse, touch and pen drags without the native HTML5
 * drag and drop API, which is inconsistent across desktop and tablets. A press stays
 * `pending` until its activation is met. Meanwhile the sensor blocks the native drag
 * and the long-press context menu, and pairs touch and pen double-taps. Once
 * `onBeforeMoveStart` lets the press through, the `active` phase moves the preview,
 * feeds the session in `core/lifecycleManager.ts`, and ends the drag on release or cancel.
 *
 * Everything a gesture acquires goes on its `resources`, which `endGesture` releases on
 * every end path.
 */

import { NOOP } from '@base-ui/utils/empty';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { getTarget } from '@base-ui/utils/shadowDom';
import { isHTMLElement, isShadowRoot } from '@floating-ui/utils/dom';
import { WindowAnimationFrame } from '../../windowAnimationFrame';
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
  DraggableRootRecord,
} from '../../../draggable/root/DraggableRoot';
import type { DraggableInput, DraggablePointerType } from '../../../draggable/DraggableProvider';
import { getActiveSession } from '../core/dragSession';
import type { DragSessionController, DragSessionSensor } from '../core/lifecycleManager';
import {
  createPreviewAndStartSession,
  hitTestUnderPreview,
  measurePickupSource,
} from './pickupPreview';
import type { DragPreview } from './syntheticPreview';
import * as dragRootLock from './dragRootLock';
import * as dragCursor from './dragCursor';
import {
  consumeDoubleClickFollowUp,
  suppressDoubleClickFollowUp,
  CAPTURE,
  suppressNextClick,
  swallowEvent,
} from './postDragClick';
import type { DraggableConfig } from '../draggable';
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
import { trackRegisteredShadowRoots } from '../dropTarget';
import { deepElementFromPoint } from '../composedTree';
import type { DragCanceledReason, DragCleanupFn, DragMoveReason, DragStartReason } from '../types';
import { modifyDragPoint, createDragModifiersState } from '../dragModifiers';
import type { DragModifiersState } from '../dragModifiers';
import { getOverflowFlags, isRtlElement, onceCleanup, remapInput, runAllCleanups } from '../utils';
import type { DragModifierKeys } from '../utils';

// ---------------------------------------------------------------------------
// The gesture record
// ---------------------------------------------------------------------------

/**
 * `pending` until the drag starts, then `active`. Either phase can end, after which
 * a callback still holding the record sees `ended`.
 */
type GesturePhase = 'pending' | 'active' | 'ended';

interface PointerGesture {
  phase: GesturePhase;
  element: HTMLElement;
  /** The press's event target, `element` or one of its descendants. */
  target: Element;
  pointerId: number;
  pointerType: DraggablePointerType;
  /**
   * Whether a held pointer drives the gesture. A held pointer is captured, `pointerup`
   * drops, and a missed release cancels. `false` only for a mouse double-click, which
   * follows the mouse with no button down and drops on the next click.
   */
  heldPointer: boolean;
  /** The activations the pending press can still meet. */
  activation: DraggableRootActivation[];
  /** How the pickup happened, reported to `onBeforeMoveStart` as `eventDetails.reason`. */
  activationKind: DragStartReason;
  origin: { x: number; y: number };
  startedAt: number;
  pressHoldTimer: WindowTimeout;
  /**
   * The press, then each move. Activation reads its input from it, `onBeforeMoveStart`
   * receives it, and scroll-only frames report it (see `notifyExternalScroll`). A
   * double-click drag switches to the second click's press (see `startDrag`).
   */
  lastPointerEvent: PointerEvent | MouseEvent;
  /** The pending phase's listeners, removed when the drag starts (see `endPendingPhase`). */
  pendingListeners: DragCleanupFn[];
  /** Everything the gesture holds, released by `endGesture`, newest first. */
  resources: GestureResource[];
  /** The drag, once the gesture is `active`. */
  drag: ActiveDrag | null;
}

/** The started drag, from activation until the gesture ends. */
interface ActiveDrag {
  controller: DragSessionController;
  preview: DragPreview;
  /** The body anchor that holds the gesture's pointer capture, never the dragged element. */
  captureTarget: Element;
  /** Compiled `modifiers`, or `null` when the draggable declared none. */
  modifiers: DragModifiersState | null;
  lastInput: DraggableInput;
  /**
   * The native event `lastInput` was read from, reported to move handlers as
   * `eventDetails.event`. It starts as the activation event, and is a
   * `KeyboardEvent` when a modifier key drove the frame (see `syncActiveModifierKeys`).
   */
  lastNativeEvent: PointerEvent | MouseEvent | KeyboardEvent;
  /** Why `lastNativeEvent` caused the next movement frame. */
  lastMoveReason: DragMoveReason;
  /**
   * Set by a pointer event, a modifier key change or a scroll, and cleared by
   * `onActiveFrame`. Gating on events rather than coordinate changes stops a reorder
   * that slides a new element under a still pointer from re-firing `onMove` in a loop.
   */
  frameDirty: boolean;
  rafFrame: WindowAnimationFrame;
  /**
   * Whether `rafFrame` holds a deferred terminal cancel (missed release, lost
   * capture) instead of `onActiveFrame`. A held-button move replaces only the
   * cancel, so a 120 to 240 Hz pointer doesn't re-request the frame on every move.
   */
  terminalFrameQueued: boolean;
}

interface ActiveGesture extends PointerGesture {
  phase: 'active';
  drag: ActiveDrag;
}

function isActive(gesture: PointerGesture): gesture is ActiveGesture {
  return gesture.phase === 'active';
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

interface SyntheticSensorState {
  /** The gesture in progress, from its press until it ends. */
  gesture: PointerGesture | null;
  /** The first tap of a possible touch/pen double-tap (see `recordTap`). */
  lastTap: TapRecord | null;
  /** The last `pointerdown` anywhere (see `onDoubleClick`). */
  lastPointerDown: PointerEvent | null;
  /** Disarms the long-press `contextmenu` suppression, which can outlive its gesture. */
  cleanupContextMenuSuppression: DragCleanupFn | null;
}

const state = getSharedSlot<SyntheticSensorState>('syntheticDrag', () => ({
  gesture: null,
  lastTap: null,
  lastPointerDown: null,
  cleanupContextMenuSuppression: null,
}));

function getActiveGesture(): ActiveGesture | null {
  const gesture = state.gesture;
  return gesture !== null && isActive(gesture) ? gesture : null;
}

// ---------------------------------------------------------------------------
// Ending a gesture
// ---------------------------------------------------------------------------

/**
 * Where the pointer stands at teardown, which decides how a started drag's click is
 * suppressed:
 *
 * - `released`: the pointer is up, so any click is imminent.
 * - `held`: the button is still down (Escape, blur), so the click comes on release.
 * - `none`: no drag click is coming, and arming would eat an unrelated one.
 */
type PointerAtTeardown = 'released' | 'held' | 'none';

/** How a gesture ended, which decides the releases that depend on it. */
interface GestureEnd {
  pointer: PointerAtTeardown;
  /**
   * Whether the long-press `contextmenu` suppression goes too. A browser cancellation
   * (`pointercancel`, blur) keeps it armed, because an Android long-press fires
   * `pointercancel` and then the `contextmenu` to suppress.
   */
  releaseContextMenu: boolean;
  /** Whether a release dropped the drag, so the preview settles instead of being removed at once. */
  drop: boolean;
}

/** Releases something a gesture holds. Most releases ignore how it ended. */
type GestureResource = (end: GestureEnd) => void;

/** A release that dropped the drag. */
const DROPPED: GestureEnd = { pointer: 'released', releaseContextMenu: true, drop: true };

/** A press released, or refused, before its drag started. */
const RELEASED: GestureEnd = { pointer: 'none', releaseContextMenu: true, drop: false };

/** A press interrupted before its drag started, or a test reset. */
const INTERRUPTED: GestureEnd = { pointer: 'none', releaseContextMenu: false, drop: false };

/**
 * Where the pointer stands for each cancel reason. No fallback on purpose. `held`
 * arms a click suppression for up to five seconds, so each new
 * {@link DragCanceledReason} must choose explicitly.
 */
const POINTER_AT_CANCEL: Record<DragCanceledReason, PointerAtTeardown> = {
  // This cancel fires because the button came up.
  [REASONS.missedRelease]: 'released',
  // A canceled pointer never produces a compatibility click.
  [REASONS.pointerCanceled]: 'none',
  // In a dead realm `ownerWindow` falls back to the top-level window, so arming
  // would swallow the next click on the wrong document.
  [REASONS.documentDetached]: 'none',
  // The rest interrupt a gesture whose button is still down.
  [REASONS.escapeKey]: 'held',
  [REASONS.tabKey]: 'held',
  [REASONS.imperativeAction]: 'held',
  [REASONS.windowBlur]: 'held',
  [REASONS.pageHidden]: 'held',
  [REASONS.captureLost]: 'held',
  [REASONS.handlerError]: 'held',
};

/**
 * End the gesture in any phase and release everything it holds, even if a release
 * throws. Every end path goes through here.
 */
function endGesture(gesture: PointerGesture, end: GestureEnd): void {
  if (gesture.phase === 'ended') {
    return;
  }
  gesture.phase = 'ended';
  // Clear the slot first. On a dead realm (see `recoverDetachedGesture`) a release
  // can throw, and a leftover gesture would block every later press.
  if (state.gesture === gesture) {
    state.gesture = null;
  }
  runAllCleanups(gesture.resources.map((release) => () => release(end)).reverse());
}

/**
 * Remove the pending phase's listeners and timer. Runs when the drag starts and again
 * when the gesture ends, where `splice` leaves it nothing to do.
 */
function endPendingPhase(gesture: PointerGesture): void {
  gesture.pressHoldTimer.clear();
  runAllCleanups(gesture.pendingListeners.splice(0));
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

/**
 * The gesture-starting listeners, bound per document or shadow root and
 * ref-counted across draggables. Binding inside a shadow root sees the real
 * target, which a closed root retargets to its host for outside listeners.
 */
const eventRootBinding = createEventRootBinding({
  slot: 'syntheticDrag.eventRootBindings',
  listeners: { pointerdown: onPointerDown, dblclick: onDoubleClick },
});

export function bindPointerListeners(element: Element): DragCleanupFn {
  return eventRootBinding.bind(getDragEventRoot(element));
}

/**
 * Cancel the drag in progress, firing `onMoveEnd` with a `null` target and the
 * `'imperative-action'` reason. Does nothing when no drag is active.
 */
export function cancelDrag(): void {
  // Also end a pending press, so the next move can't activate a drag, for example
  // after a dialog opened on `pointerdown`.
  const gesture = state.gesture;
  if (gesture?.phase === 'pending') {
    endGesture(gesture, INTERRUPTED);
  }
  getActiveSession()?.cancel();
}

export function resetForTests(): void {
  runAllCleanups([
    () => {
      // Arm no click suppression, so no `click` listener leaks into the next test.
      if (state.gesture) {
        endGesture(state.gesture, INTERRUPTED);
      }
    },
    clearLastTap,
    () => {
      state.lastPointerDown = null;
      state.cleanupContextMenuSuppression?.();
    },
  ]);
}

// ---------------------------------------------------------------------------
// Pending phase
// ---------------------------------------------------------------------------

const CONTEXT_MENU_SUPPRESSION_MS = 1500;

/**
 * Time and distance within which a second touch or pen `pointerdown` completes a
 * double-tap. Browsers fire `dblclick` for a double-tap inconsistently or not at
 * all, so the sensor pairs the taps itself.
 */
const DOUBLE_TAP_MS = 300;

const DOUBLE_TAP_TOLERANCE_PX = 25;

/** Make the press the gesture in progress. */
function startGesture(
  pickup: DraggablePickup,
  event: PointerEvent | MouseEvent,
  press: Pick<
    PointerGesture,
    'pointerId' | 'pointerType' | 'heldPointer' | 'activation' | 'activationKind'
  >,
): PointerGesture {
  const gesture: PointerGesture = {
    phase: 'pending',
    element: pickup.element,
    target: pickup.target,
    pointerId: press.pointerId,
    pointerType: press.pointerType,
    heldPointer: press.heldPointer,
    activation: press.activation,
    activationKind: press.activationKind,
    origin: { x: event.clientX, y: event.clientY },
    startedAt: event.timeStamp,
    pressHoldTimer: new WindowTimeout(ownerWindow(pickup.element)),
    lastPointerEvent: event,
    pendingListeners: [],
    resources: [],
    drag: null,
  };
  state.gesture = gesture;
  return gesture;
}

/**
 * Block the native HTML drag that some browsers start from a touch or pen
 * long-press. The gesture runs the returned restore when it ends, so a release
 * the sensor ignores (see `onPendingPointerUp`) keeps the suppression in place.
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
  // bound root. The scale undoes transforms, which the rect includes and the client
  // sizes don't. Subtracting the border widths measures from the padding edge.
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
  // reported by a double-click drag until its first move (see `startDrag`).
  state.lastPointerDown = pointerEvent;

  // Ending a stranded gesture runs its end handlers, which can change the
  // registrations, so the press resolves after it.
  const recovered = recoverDetachedGesture(event);
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
  let activationKind: DragStartReason = REASONS.pointer;
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
  const pointerId = pointerEvent.pointerId;

  // The pending phase leaves scrolling alone, so a touch or pen swipe can become a
  // native scroll and cancel the press through `pointercancel`.
  const gesture = startGesture(pickup, pointerEvent, {
    pointerId,
    pointerType,
    heldPointer: true,
    activation,
    activationKind,
  });
  gesture.resources.push(suppressNativeDragForSyntheticPointer(element));
  if (pointerType !== 'mouse') {
    // Only a touch or pen long-press fires a stray `contextmenu` after the gesture.
    // For mouse this would swallow a real right-click after a plain left-click.
    const contextMenuSuppression = startContextMenuSuppression(win, target);
    gesture.resources.push(
      (end) => {
        // Only this gesture's suppression, never another one in the global slot.
        if (end.releaseContextMenu) {
          contextMenuSuppression();
        }
      },
      // iOS Safari only lets a `touchmove` guard cancel scroll if a
      // `{ passive: false }` listener existed before the gesture needed it. The
      // active phase adds its guard too late, so this one lives with the gesture.
      addEventListener(win, 'touchmove', NOOP, { passive: false }),
      // Touch and pen implicitly capture the press target. A drag moves the capture
      // to the body anchor, after which this finds none. A mouse target only holds
      // capture that a nested widget took, which stays with the widget.
      () => releasePointerCaptureSafely(target, pointerId),
    );
  }
  gesture.resources.push(() => endPendingPhase(gesture));

  gesture.pendingListeners.push(
    addEventListener(win, 'pointermove', onPendingPointerMove, CAPTURE),
    addEventListener(win, 'pointerup', onPendingPointerUp, CAPTURE),
    addEventListener(win, 'pointercancel', onPendingPointerCancel, CAPTURE),
    // `draggable="false"` on the source doesn't cover a natively draggable
    // descendant, such as an `<img>` or `<a href>`, which would start a native drag.
    addEventListener(win, 'dragstart', preventDefault, CAPTURE),
    addEventListener(win, 'keydown', onPendingKeyDown, CAPTURE),
    // A blurred window or hidden page abandons the press, so a drag never commits
    // in the background.
    addEventListener(win, 'blur', onPendingBlur),
    addEventListener(ownerDocument(element), 'visibilitychange', onPendingVisibilityChange),
  );
  // A touch or pen press-hold can raise the OS context menu before activation. This
  // guards the whole pending phase, unlike `startContextMenuSuppression`, which stops
  // after one menu. Not for mouse, where a held button can stay pending indefinitely
  // and this would block right-clicks page-wide until release.
  if (pointerType !== 'mouse') {
    gesture.pendingListeners.push(addEventListener(win, 'contextmenu', preventDefault, CAPTURE));
  }

  evaluatePendingActivation(gesture, gesture.startedAt);
}

/**
 * Whether a new gesture may start. A gesture whose document lost its browsing
 * context (iframe removed, popout closed) can't end on its own, because its
 * listeners died with the realm, so the next press anywhere ends it.
 */
function recoverDetachedGesture(event: Event): boolean {
  const gesture = state.gesture;
  if (gesture && isDetachedDocument(ownerDocument(gesture.element))) {
    if (isActive(gesture)) {
      // Through the session, so the drag reports the cancel.
      gesture.drag.controller.cancel(undefined, REASONS.documentDetached, event);
    } else {
      endGesture(gesture, INTERRUPTED);
    }
  }
  return state.gesture === null;
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
  // touch could move or drop. Touch and pen pair their taps in `onPointerDown`.
  // Firefox's `dblclick` has no `pointerType`, so use the press's.
  const pointerType =
    'pointerType' in mouseEvent
      ? normalizePointerType((mouseEvent as PointerEvent).pointerType)
      : normalizePointerType(state.lastPointerDown?.pointerType);
  if (pointerType !== 'mouse') {
    return;
  }
  if (!recoverDetachedGesture(event) || getActiveSession() !== null) {
    return;
  }
  const pickup = acceptPressPickup(resolveDraggablePickup(getTarget(event)), mouseEvent);
  if (!pickup || !hasDoubleClickActivation(pickup.parameters.activation, 'mouse')) {
    return;
  }
  // No pointer is held, so `pointerId` -1 matches none. `activation` is never
  // evaluated because the commit runs right below.
  const gesture = startGesture(pickup, mouseEvent, {
    pointerId: -1,
    pointerType: 'mouse',
    heldPointer: false,
    activation: [],
    activationKind: REASONS.doubleClick,
  });
  if (activatePending(gesture)) {
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

/**
 * Cancel the next `contextmenu` within `CONTEXT_MENU_SUPPRESSION_MS`. Replaces an
 * earlier suppression still armed.
 */
function startContextMenuSuppression(win: Window, target: Element): DragCleanupFn {
  state.cleanupContextMenuSuppression?.();

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

  // Pointer Events fire `contextmenu` at the press target, even after
  // `lostpointercapture`. A live reorder can detach the target before Android
  // delivers the menu, cutting its path to `window`, so listen on the target too.
  cleanups.push(
    addEventListener(win, 'contextmenu', onContextMenu, CAPTURE),
    addEventListener(target, 'contextmenu', onContextMenu, CAPTURE),
  );

  state.cleanupContextMenuSuppression = cleanup;
  timeout.start(CONTEXT_MENU_SUPPRESSION_MS, cleanup);
  return cleanup;
}

/** Evaluate the pending activation at time `now` and the pointer's latest position. */
function evaluatePendingActivation(gesture: PointerGesture, now: number): void {
  const elapsed = now - gesture.startedAt;
  const current = { x: gesture.lastPointerEvent.clientX, y: gesture.lastPointerEvent.clientY };
  const { activate, remaining } = evaluateActivations(
    gesture.activation,
    gesture.origin,
    current,
    elapsed,
  );
  const pruned = remaining.length !== gesture.activation.length;
  gesture.activation = remaining;
  if (activate) {
    activatePending(gesture);
  } else if (remaining.length === 0) {
    endGesture(gesture, INTERRUPTED);
  } else if (pruned || !gesture.pressHoldTimer.isStarted()) {
    // A running timer already re-evaluates at its deadline with the latest
    // position. Re-arm only when pruning may have moved the earliest deadline, or
    // when none is armed.
    const delay = getActivationDelayMs(gesture.activation);
    gesture.pressHoldTimer.clear();
    if (delay !== null) {
      gesture.pressHoldTimer.start(Math.max(0, delay - elapsed), () => {
        if (gesture.phase === 'pending') {
          // A timer has no event timestamp, so evaluate at the deadline it was armed for.
          evaluatePendingActivation(gesture, gesture.startedAt + delay);
        }
      });
    }
  }
}

/** The pending gesture of `pointerId`, or `null`. */
function getPendingGesture(pointerId: number): PointerGesture | null {
  const gesture = state.gesture;
  return gesture?.phase === 'pending' && gesture.pointerId === pointerId ? gesture : null;
}

function onPendingPointerMove(pointerEvent: PointerEvent): void {
  const gesture = getPendingGesture(pointerEvent.pointerId);
  if (!gesture) {
    return;
  }
  // Missed release. The button came up without a terminating event reaching the
  // sensor.
  if (pointerEvent.buttons === 0) {
    endGesture(gesture, INTERRUPTED);
    return;
  }
  // Chorded release. Lifting the primary button while another is held fires
  // `pointermove`, not `pointerup`, and the later `pointerup` reports the last
  // button released. Without this, the press would stay armed and block later ones.
  if (!isPrimaryHeld(pointerEvent)) {
    endGesture(gesture, RELEASED);
    return;
  }
  gesture.lastPointerEvent = pointerEvent;
  evaluatePendingActivation(gesture, pointerEvent.timeStamp);
}

function onPendingPointerUp(pointerEvent: PointerEvent): void {
  const gesture = getPendingGesture(pointerEvent.pointerId);
  if (!gesture) {
    return;
  }
  // Safari can misreport `button` on a quick release. Ignore a non-primary
  // release only while `buttons` confirms that the primary is still held.
  if (pointerEvent.button !== 0 && isPrimaryHeld(pointerEvent)) {
    return;
  }
  endGesture(gesture, RELEASED);
}

function onPendingPointerCancel(pointerEvent: PointerEvent): void {
  const gesture = getPendingGesture(pointerEvent.pointerId);
  if (gesture) {
    endGesture(gesture, INTERRUPTED);
  }
}

function onPendingKeyDown(event: KeyboardEvent): void {
  const gesture = state.gesture;
  if (event.key === 'Escape' && gesture?.phase === 'pending') {
    endGesture(gesture, INTERRUPTED);
  }
}

function onPendingBlur(): void {
  const gesture = state.gesture;
  if (gesture?.phase === 'pending') {
    endGesture(gesture, INTERRUPTED);
  }
}

function onPendingVisibilityChange(): void {
  const gesture = state.gesture;
  if (gesture?.phase === 'pending' && ownerDocument(gesture.element).visibilityState === 'hidden') {
    endGesture(gesture, INTERRUPTED);
  }
}

/**
 * Re-check a press that met its activation, let `onBeforeMoveStart` veto it, and
 * start its drag. Returns whether a drag started. Otherwise the gesture ends as
 * released, unless a callback already ended it.
 *
 * The parameters getter, a function `handle` and `modifiers` are consumer code that
 * can end the gesture, hence the phase checks after each.
 */
function activatePending(gesture: PointerGesture): boolean {
  const { element, target, pointerId, pointerType } = gesture;
  const lastInput = getInput(gesture.lastPointerEvent);
  let started = false;
  try {
    const getParameters = getRegistration(element);
    if (!getParameters) {
      return false;
    }
    const parameters = getParameters();
    if (gesture.phase !== 'pending') {
      return false;
    }

    // Another pointer may have started a drag meanwhile. Don't run callbacks or
    // build a preview for a session the lifecycle would refuse.
    if (getActiveSession() !== null) {
      return false;
    }

    const dragHandle = resolveDragHandle(parameters);
    if (gesture.phase !== 'pending') {
      return false;
    }
    // The pickup conditions may have changed during the press, such as `disabled`
    // flipping or a new handle.
    if (
      !canPickUp({ element, target, parameters, dragHandle }) ||
      // A nested widget without an interactive role (a slider thumb) that took
      // pointer capture owns the gesture. Touch and pen implicitly capture the
      // press target, so only a mouse target's own capture counts.
      (gesture.heldPointer &&
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

    // This runs before anything is allocated, so a veto only has to undo the pending
    // phase.
    if (parameters.onBeforeMoveStart) {
      const eventDetails: DraggableRootBeforeMoveStartEventDetails = createChangeEventDetails(
        gesture.activationKind,
        gesture.lastPointerEvent,
        target,
        { input: lastInput, source: dragSource },
      );
      parameters.onBeforeMoveStart(eventDetails);
      // Imperative cancellation or blur can end the gesture inside the callback.
      if (gesture.phase !== 'pending') {
        return false;
      }
      if (eventDetails.isCanceled) {
        return false;
      }
    }

    // The phase stays `pending` until `startDrag` finishes, so stop the pending
    // listeners now, or they could act on an event a start callback dispatches.
    endPendingPhase(gesture);
    started = startDrag(gesture, parameters, dragSource);
    return started;
  } finally {
    // A refusal or throw before the drag started ends the gesture like a release,
    // which also frees the contextmenu suppression.
    if (!started && gesture.phase === 'pending') {
      endGesture(gesture, RELEASED);
    }
  }
}

// ---------------------------------------------------------------------------
// Active phase
// ---------------------------------------------------------------------------

/** Cursor pinned across the document during a pointer drag (see `dragCursor`). */
const DEFAULT_DRAG_CURSOR = 'grabbing';

/** What the gesture lends its drag session (see `DragSessionSensor`). */
const SENSOR: DragSessionSensor = {
  getRawInput: getRawActivePointerInput,
  notifyScroll: notifyExternalScroll,
  release: releaseActive,
};

/**
 * Start the drag of an activated press. Returns `false` when the lifecycle refuses or
 * consumer code ends the press on the way. `parameters` and `dragSource` are what
 * `onBeforeMoveStart` saw.
 */
function startDrag(
  gesture: PointerGesture,
  parameters: DraggableConfig<any, any>,
  dragSource: DraggableRootRecord,
): boolean {
  const { element, target, pointerId, pointerType, resources } = gesture;
  // The `pointermove` that crossed the activation threshold, or the `dblclick`.
  const activationEvent = gesture.lastPointerEvent;
  const lastInput = getInput(activationEvent);
  // Measured once, before the session starts, so `[data-dragging]` styles can't
  // restyle what the grab offset and custom modifiers read.
  const sourceRect = measurePickupSource(element);
  const modifiers = createDragModifiersState(
    parameters.modifiers,
    dragSource,
    { x: lastInput.clientX, y: lastInput.clientY },
    lastInput,
    sourceRect,
  );
  if (gesture.phase !== 'pending') {
    return false;
  }
  // Start at the constrained point, so the initial target, the session's first
  // input, and the preview seed all agree with what the first frame resolves.
  const startInput = modifiers ? remapInput(lastInput, modifiers.initialPoint) : lastInput;

  // Hit-test rather than reuse the press target, which may be a child of the
  // draggable that isn't a drop target.
  const doc = ownerDocument(element);
  const initialTarget = deepElementFromPoint(doc, startInput.clientX, startInput.clientY);

  // Freeze scrolling and selection for the drag. The gesture holds the lock, so a
  // pickup that fails below releases it like any other end.
  dragRootLock.lock(element);
  resources.push(dragRootLock.unlock);

  // Ends the preview on a throw or refusal. The gesture's end releases the rest.
  const result = createPreviewAndStartSession({
    draggableParameters: parameters,
    dragSource,
    initialInput: startInput,
    initialEvent: activationEvent,
    startReason: gesture.activationKind,
    pressPoint: gesture.origin,
    sourceRect,
    initialTarget,
    sensor: SENSOR,
    isPickupCurrent: () => gesture.phase === 'pending',
  });

  if (!result) {
    return false;
  }
  const { session, preview } = result;
  if (gesture.phase !== 'pending') {
    // A start callback ended the gesture but left its drag running, as when it
    // dispatches a press that recovers a detached document. End the drag too.
    preview.end(false);
    session.cancel(undefined, REASONS.documentDetached, activationEvent);
    return false;
  }

  // Anchor pointer capture on a node that never unmounts (see the listener block below).
  const captureTarget: Element = doc.body ?? doc.documentElement;
  const win = ownerWindow(element);
  const drag: ActiveDrag = {
    controller: session,
    preview,
    captureTarget,
    modifiers,
    lastInput,
    lastNativeEvent: activationEvent,
    lastMoveReason: REASONS.pointer,
    // The first frame confirms the entered target and fires the first `onMove`. A
    // double-click pickup waits for the first `pointermove`, so `onMove` never
    // reports the `dblclick`, which isn't a `PointerEvent` in every browser.
    frameDirty: gesture.heldPointer,
    rafFrame: new WindowAnimationFrame(win),
    terminalFrameQueued: false,
  };
  gesture.drag = drag;
  gesture.phase = 'active';
  if (!gesture.heldPointer) {
    // Frames report the second click's press until the first move.
    gesture.lastPointerEvent = state.lastPointerDown ?? activationEvent;
  }
  resources.push((end) => preview.end(end.drop), drag.rafFrame.cancel);
  if (gesture.heldPointer) {
    // The click after the release comes from the drag, not from the user.
    resources.push((end) => {
      if (end.pointer !== 'none') {
        suppressNextClick(element, end.pointer === 'held' ? pointerId : undefined);
      }
    });
  }

  // A start callback can remove the source iframe between the pending and active
  // listeners. End now rather than wait for a later press to find the dead document.
  if (isDetachedDocument(doc)) {
    cancelActive(undefined, REASONS.documentDetached, activationEvent);
    return false;
  }

  // Move touch and pen's implicit capture to the body anchor and give the mouse
  // explicit capture, so pointer events arrive here wherever the pointer is.
  if (gesture.heldPointer) {
    setPointerCaptureSafely(captureTarget, pointerId);
    resources.push(() => releasePointerCaptureSafely(captureTarget, pointerId));
  }

  // Touch has no cursor. `dragCursor: false` lets the consumer manage it.
  const cursor = parameters.dragCursor ?? DEFAULT_DRAG_CURSOR;
  if (cursor && pointerType !== 'touch') {
    // The lock's `<html>` class enables a universal-selector rule that restyles the
    // whole document, so wait until the lift has painted. One frame isn't enough.
    // It runs in the lift's rendering update, where the sensor's `elementFromPoint`
    // would force the recalc.
    const cursorFrame = new WindowAnimationFrame(win);
    resources.push(dragCursor.unlock, cursorFrame.cancel);
    cursorFrame.request(() => {
      cursorFrame.request(() => {
        // The gesture's end cancels the frame. The check also keeps a stale callback
        // from locking the cursor for a newer gesture.
        if (state.gesture === gesture) {
          dragCursor.lock(element, cursor, {
            nonce: parameters.styleNonce,
            disableStyleElements: parameters.disableStyleElements,
          });
        }
      });
    });
  }

  // The body-anchor capture routes every event for this `pointerId` to `body`, so
  // a document listener sees the whole gesture, even after a virtualizer or live
  // reorder unmounts the dragged element. Capture phase, so a third-party
  // `stopPropagation()` can't freeze the preview.
  resources.push(addEventListener(doc, 'pointermove', onActivePointerMove, CAPTURE));
  if (pointerType !== 'mouse') {
    resources.push(
      // Touch events ignore pointer capture. Cancel the scroll the `touch-action`
      // lock misses on the document, and on the press target, which still gets
      // touch events after a detach cuts its path to the document.
      addEventListener(target, 'touchmove', preventActiveTouchScroll, {
        passive: false,
        capture: true,
      }),
      addEventListener(doc, 'touchmove', preventActiveTouchScroll, {
        passive: false,
        capture: true,
      }),
      // A detached press target still gets the touch `contextmenu` (see
      // `startContextMenuSuppression`). A mouse menu reaches the window listener.
      addEventListener(target, 'contextmenu', preventDefault, CAPTURE),
    );
  }
  resources.push(
    addEventListener(win, 'keydown', onActiveKeyDown, CAPTURE),
    // Only tracks modifier key releases. The drag has no keyup gesture.
    addEventListener(win, 'keyup', syncActiveModifierKeys, CAPTURE),
    addEventListener(win, 'blur', onActiveBlur),
    addEventListener(doc, 'visibilitychange', onActiveVisibilityChange),
    addEventListener(win, 'contextmenu', preventDefault, CAPTURE),
    // `scroll` doesn't bubble, but document capture sees any descendant container
    // scroll, including auto-scroll's.
    addEventListener(doc, 'scroll', notifyExternalScroll, { capture: true, passive: true }),
  );

  // `scroll` isn't composed, so the document misses containers in a shadow root
  // and the target would go stale under a still pointer. Listen on each shadow
  // root that holds a registered target or draggable, tracking mounts during the drag.
  resources.push(
    trackRegisteredShadowRoots((shadowRoot) =>
      addEventListener(shadowRoot, 'scroll', notifyExternalScroll, {
        capture: true,
        passive: true,
      }),
    ),
  );

  // Window capture is the earliest any listener sees an event, so a third-party
  // `stopPropagation()` can't leave the drag stuck.
  resources.push(
    addEventListener(win, 'pointerup', onActivePointerUp, CAPTURE),
    addEventListener(win, 'pointercancel', onActivePointerCancel, CAPTURE),
    addEventListener(win, 'lostpointercapture', onActiveLostPointerCapture, CAPTURE),
    // Keep blocking native drags, as in the pending phase.
    addEventListener(win, 'dragstart', preventDefault, CAPTURE),
  );

  if (!gesture.heldPointer) {
    resources.push(
      // The drop click's press must not also focus or press the destination, such
      // as a menu that opens on `pointerdown`. Canceling `pointerdown` suppresses
      // the compatibility `mousedown`, and the drop's `click` still fires.
      addEventListener(win, 'pointerdown', onDoubleClickPress, CAPTURE),
      addEventListener(win, 'mousedown', onDoubleClickPress, CAPTURE),
      addEventListener(win, 'click', onDoubleClickDrop, CAPTURE),
    );
  }
  scheduleActiveFrame(drag);
  return true;
}

/**
 * The sensor's `release` (see `DragSessionSensor.release`). Before `startDrag` makes
 * the gesture active there is nothing to release, since `createPreviewAndStartSession`
 * ends the preview and `activatePending` ends the gesture.
 */
function releaseActive(cancelReason?: DragCanceledReason): void {
  const gesture = getActiveGesture();
  if (!gesture) {
    return;
  }
  endGesture(
    gesture,
    cancelReason === undefined
      ? DROPPED
      : { pointer: POINTER_AT_CANCEL[cancelReason], releaseContextMenu: false, drop: false },
  );
}

/**
 * Cancel the active drag. The session ends the gesture through {@link releaseActive}
 * and still ends the drag if that throws.
 */
function cancelActive(
  input: DraggableInput | undefined,
  reason: DragCanceledReason,
  event: Event,
): void {
  getActiveGesture()?.drag.controller.cancel(input, reason, event);
}

// `mousedown`, and a `click` that isn't a `PointerEvent`, carry no `pointerType`,
// which normalizes to `mouse`.
function onDoubleClickPress(event: MouseEvent): void {
  if (event.button !== 0 || normalizePointerType((event as PointerEvent).pointerType) !== 'mouse') {
    return;
  }
  swallowEvent(event);
}

function onDoubleClickDrop(event: MouseEvent): void {
  const gesture = getActiveGesture();
  if (
    !gesture ||
    event.button !== 0 ||
    event.detail === 0 ||
    normalizePointerType((event as PointerEvent).pointerType) !== 'mouse'
  ) {
    return;
  }
  // This click completes the move, so it must not also open or edit the destination.
  swallowEvent(event);
  // The user may have double-clicked to drop (see `suppressDoubleClickFollowUp`).
  suppressDoubleClickFollowUp(gesture.element);
  dropActiveAtPointer(event);
}

function scheduleActiveFrame(drag: ActiveDrag): void {
  if (drag.rafFrame.currentId === null) {
    drag.rafFrame.request(onActiveFrame);
  }
}

/**
 * Apply the draggable's `modifiers` to a pointer input. The result drives both the
 * hit-test and the preview, so modifiers affect target resolution too.
 */
function modifyActiveInput(drag: ActiveDrag, input: DraggableInput): DraggableInput {
  if (!drag.modifiers) {
    return input;
  }
  return remapInput(
    input,
    modifyDragPoint(drag.modifiers, { x: input.clientX, y: input.clientY }, drag.preview, input),
  );
}

function onActiveFrame(): void {
  const gesture = getActiveGesture();
  if (!gesture) {
    return;
  }
  const drag = gesture.drag;

  // The loop stops here unless something changed (see `frameDirty`). The
  // listeners restart it, so an idle drag costs no frames.
  if (!drag.frameDirty) {
    return;
  }

  // Clear before `controller.update`, because a consumer `onMove` may call
  // `scrollBy` and set the flag again for the next frame.
  drag.frameDirty = false;

  // Hit-test before moving the preview, which the hit-test ignores anyway.
  // `elementFromPoint` right after the transform write would force a synchronous
  // style pass every frame.
  const input = modifyActiveInput(
    drag,
    withCurrentPageOffset(drag.lastInput, ownerWindow(gesture.element)),
  );
  // Modifiers and `onMove` are consumer code that can end the gesture.
  if (state.gesture !== gesture) {
    return;
  }
  const target = hitTestUnderPreview(gesture.element, drag.preview, input.clientX, input.clientY);
  drag.controller.update(input, target, drag.lastNativeEvent, drag.lastMoveReason);
  if (state.gesture !== gesture) {
    return;
  }
  // `update` reattaches a host that a synchronous re-render removed. The
  // preview's own observer handles a commit deferred past this frame.
  drag.preview.update(input.clientX, input.clientY, input);
}

/**
 * `input` with page coordinates from the current scroll position. A scroll under a
 * still pointer re-runs the frame with the last sample, whose `pageX`/`pageY` are stale.
 */
function withCurrentPageOffset(input: DraggableInput, win: Window): DraggableInput {
  const pageX = input.clientX + win.scrollX;
  const pageY = input.clientY + win.scrollY;
  if (pageX === input.pageX && pageY === input.pageY) {
    return input;
  }
  return { ...input, pageX, pageY };
}

// Chrome logs an intervention for `preventDefault` on a non-cancelable `touchmove`,
// which it sends once a scroll is underway.
function preventActiveTouchScroll(event: Event): void {
  if (event.cancelable) {
    event.preventDefault();
  }
}

function onActivePointerMove(pointerEvent: PointerEvent): void {
  const gesture = getActiveGesture();
  if (
    !gesture ||
    (gesture.heldPointer
      ? pointerEvent.pointerId !== gesture.pointerId
      : // A mouse double-click session holds no pointer. It follows any mouse
        // pointer and ignores touch and pen.
        normalizePointerType(pointerEvent.pointerType) !== 'mouse')
  ) {
    return;
  }
  const drag = gesture.drag;
  // Wait one frame before treating `buttons === 0` as a missed release. A
  // terminal event in the same frame must take precedence.
  if (gesture.heldPointer && pointerEvent.buttons === 0) {
    // Apply modifiers like every reported input, so `onMoveEnd` doesn't report a
    // raw coordinate the drag never reported while live.
    const input = modifyActiveInput(drag, getInput(pointerEvent));
    queueTerminalCancel(gesture, input, REASONS.missedRelease, pointerEvent);
    return;
  }
  // Chorded release (see `onPendingPointerMove`). The user lifted the primary
  // button on purpose, so drop rather than cancel.
  if (gesture.heldPointer && !isPrimaryHeld(pointerEvent)) {
    dropActiveAtPointer(pointerEvent);
    return;
  }
  drag.lastInput = getInput(pointerEvent);
  drag.lastNativeEvent = pointerEvent;
  gesture.lastPointerEvent = pointerEvent;
  drag.lastMoveReason = REASONS.pointer;
  drag.frameDirty = true;
  // This held-button sample shows a queued terminal cancel was transient, so
  // replace it. A queued `onActiveFrame` only needs `frameDirty`.
  if (drag.terminalFrameQueued || drag.rafFrame.currentId === null) {
    drag.terminalFrameQueued = false;
    drag.rafFrame.request(onActiveFrame);
  }
}

function onActivePointerUp(pointerEvent: PointerEvent): void {
  const gesture = getActiveGesture();
  if (!gesture || pointerEvent.pointerId !== gesture.pointerId) {
    return;
  }
  // See `onPendingPointerUp` for the `buttons` fallback.
  if (pointerEvent.button !== 0 && isPrimaryHeld(pointerEvent)) {
    return;
  }
  dropActiveAtPointer(pointerEvent);
}

/** End the active drag with a drop resolved at the pointer's current position. */
function dropActiveAtPointer(pointerEvent: PointerEvent | MouseEvent): void {
  const gesture = getActiveGesture();
  if (!gesture) {
    return;
  }
  const drag = gesture.drag;
  const input = modifyActiveInput(drag, getInput(pointerEvent));
  const target = hitTestUnderPreview(gesture.element, drag.preview, input.clientX, input.clientY);
  drag.controller.drop(input, target, pointerEvent);
}

function onActivePointerCancel(pointerEvent: PointerEvent): void {
  const gesture = getActiveGesture();
  if (!gesture || pointerEvent.pointerId !== gesture.pointerId) {
    return;
  }
  // `pointercancel` often reports (0,0). Pass `undefined` so the lifecycle uses
  // the last good input instead of snapping to the origin.
  cancelActive(undefined, REASONS.pointerCanceled, pointerEvent);
}

function onActiveLostPointerCapture(pointerEvent: PointerEvent): void {
  const gesture = getActiveGesture();
  if (!gesture || pointerEvent.pointerId !== gesture.pointerId) {
    return;
  }
  const captureTarget = gesture.drag.captureTarget;
  // Moving touch and pen's implicit capture to the body anchor fires
  // `lostpointercapture` on the press target, which must not cancel. Only cancel
  // once the anchor itself lost capture (tab switch, soft keyboard, a sibling
  // frame taking the pointer).
  if (
    getTarget(pointerEvent) !== captureTarget ||
    captureTarget.hasPointerCapture?.(pointerEvent.pointerId)
  ) {
    return;
  }
  // Let a terminal event in the same frame win. `lostpointercapture` often
  // reports (0,0), so a real hand-off uses the last good input.
  queueTerminalCancel(gesture, undefined, REASONS.captureLost, pointerEvent);
}

/**
 * Cancel the drag on the next frame, in place of the queued `onActiveFrame`
 * (see `ActiveDrag.terminalFrameQueued`), unless a terminal event ends it first.
 */
function queueTerminalCancel(
  gesture: ActiveGesture,
  input: DraggableInput | undefined,
  reason: DragCanceledReason,
  event: PointerEvent,
): void {
  gesture.drag.terminalFrameQueued = true;
  gesture.drag.rafFrame.request(() => {
    if (state.gesture === gesture) {
      cancelActive(input, reason, event);
    }
  });
}

/**
 * Keep the session's modifier keys current, and re-run the frame when they change,
 * so a key-gated modifier (a 45° snap on Shift) doesn't wait for a pointer move.
 */
function syncActiveModifierKeys(event: KeyboardEvent): void {
  const drag = getActiveGesture()?.drag;
  if (!drag) {
    return;
  }
  const keys = getModifierKeys(event);
  if (!modifierKeysChanged(drag.lastInput, keys)) {
    return;
  }
  drag.lastInput = { ...drag.lastInput, ...keys };
  // Report the key event, or `eventDetails.event.shiftKey` and
  // `location.current.input.shiftKey` would disagree in the same `onMove`.
  drag.lastNativeEvent = event;
  drag.lastMoveReason = REASONS.modifierKey;
  drag.frameDirty = true;
  scheduleActiveFrame(drag);
}

function onActiveKeyDown(keyEvent: KeyboardEvent): void {
  if (!getActiveGesture()) {
    return;
  }
  syncActiveModifierKeys(keyEvent);
  if (keyEvent.key === 'Tab') {
    cancelActive(undefined, REASONS.tabKey, keyEvent);
    return;
  }
  if (keyEvent.key !== 'Escape') {
    return;
  }
  // Consume Escape so it doesn't also close an enclosing dialog or popover.
  swallowEvent(keyEvent);
  cancelActive(undefined, REASONS.escapeKey, keyEvent);
}

function onActiveBlur(event: Event): void {
  cancelActive(undefined, REASONS.windowBlur, event);
}

function onActiveVisibilityChange(event: Event): void {
  const gesture = getActiveGesture();
  if (!gesture || ownerDocument(gesture.element).visibilityState !== 'hidden') {
    return;
  }
  cancelActive(undefined, REASONS.pageHidden, event);
}

/**
 * The pointer's latest position before `modifiers`, or `null` when no pointer drag
 * runs. Auto-scroll reads it, so a modifier can't keep the drag point out of a
 * container the user is pushing against.
 */
function getRawActivePointerInput(): DraggableInput | null {
  const gesture = getActiveGesture();
  return gesture
    ? withCurrentPageOffset(gesture.drag.lastInput, ownerWindow(gesture.element))
    : null;
}

/**
 * Flag that something scrolled under the active drag, so the next frame
 * re-resolves the target. Auto-scroll also calls it, which covers a container in
 * a shadow root without a drop target.
 */
function notifyExternalScroll(): void {
  const gesture = getActiveGesture();
  if (!gesture) {
    return;
  }
  const drag = gesture.drag;
  // A scroll-only frame reports the pointer, not a modifier key pressed long
  // before. A frame already pending for a move or a key keeps its own event.
  if (!drag.frameDirty) {
    drag.lastNativeEvent = gesture.lastPointerEvent;
    drag.lastMoveReason = REASONS.pointer;
  }
  drag.frameDirty = true;
  scheduleActiveFrame(drag);
}

// ---------------------------------------------------------------------------
// Pointer event helpers
// ---------------------------------------------------------------------------

/** The event root that can observe a node before closed-shadow retargeting. */
function getDragEventRoot(node: Element): Document | ShadowRoot {
  const root = node.getRootNode();
  return isShadowRoot(root) ? root : ownerDocument(node);
}

/**
 * Whether a document lost its browsing context, as when its iframe is removed or its
 * popout closed (see `recoverDetachedGesture`). Connection isn't checked, since a
 * virtualizer can detach the dragged node while its document lives.
 */
function isDetachedDocument(doc: Document): boolean {
  const win = doc.defaultView;
  return win === null || win.closed === true;
}

function normalizePointerType(raw: string | undefined): DraggablePointerType {
  if (raw === 'touch' || raw === 'pen') {
    return raw;
  }
  return 'mouse';
}

function getInput(event: MouseEvent & { pointerType?: string | undefined }): DraggableInput {
  return {
    button: event.button,
    buttons: event.buttons,
    clientX: event.clientX,
    clientY: event.clientY,
    pageX: event.pageX,
    pageY: event.pageY,
    pointerType: normalizePointerType(event.pointerType),
    ...getModifierKeys(event),
  };
}

function getModifierKeys(event: KeyboardEvent | MouseEvent): DragModifierKeys {
  return {
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
  };
}

function modifierKeysChanged(a: DragModifierKeys, b: DragModifierKeys): boolean {
  return (
    a.ctrlKey !== b.ctrlKey ||
    a.shiftKey !== b.shiftKey ||
    a.altKey !== b.altKey ||
    a.metaKey !== b.metaKey
  );
}

/** `buttons` is a bitmask, and bit 0 is the primary button. */
function isPrimaryHeld(event: PointerEvent): boolean {
  return event.buttons % 2 !== 0;
}

function preventDefault(event: Event): void {
  event.preventDefault();
}

/**
 * Run a pointer capture operation, swallowing the `DOMException` it throws when the
 * pointer is no longer active or capture was already released. Checked against the
 * element's realm, since an iframe or popout has its own `DOMException`.
 */
function swallowPointerCaptureError(element: Element, operation: () => void): void {
  try {
    operation();
  } catch (err) {
    if (!(err instanceof ownerWindow(element).DOMException)) {
      throw err;
    }
  }
}

function releasePointerCaptureSafely(element: Element, pointerId: number): void {
  swallowPointerCaptureError(element, () => {
    if (element.hasPointerCapture?.(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  });
}

function setPointerCaptureSafely(element: Element, pointerId: number): void {
  // Optional-chained so jsdom (no pointer capture) no-ops instead of throwing.
  swallowPointerCaptureError(element, () => element.setPointerCapture?.(pointerId));
}
