/**
 * The pointer events sensor. It drives mouse, touch and pen drags without the
 * native HTML5 drag and drop API, which is inconsistent across desktop and
 * tablets. `pickupRecognizer.ts` hands an activated press to `startDrag`. From
 * there this module moves the preview, feeds the lifecycle
 * (`core/lifecycleManager.ts`), and ends the drag on release or cancel.
 */

import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { getTarget } from '@base-ui/utils/shadowDom';
import { WindowAnimationFrame } from '../../windowAnimationFrame';
import { REASONS } from '../../../internals/reasons';
import type { DragSessionController } from '../core/lifecycleManager';
import {
  createPreviewAndStartSession,
  hitTestUnderPreview,
  measurePickupSource,
} from './pickupPreview';
import type { DragPreview } from './syntheticPreview';
import { completePending, isPending } from './pickupRecognizer';
import type { PendingSession } from './pickupRecognizer';
import type { DraggableConfig } from '../draggable';
import type { DraggableRootRecord } from '../../../draggable/root/DraggableRoot';
import * as dragRootLock from './dragRootLock';
import * as dragCursor from './dragCursor';
import {
  suppressDoubleClickFollowUp,
  CAPTURE,
  suppressNextClick,
  swallowEvent,
} from './postDragClick';
import { getSharedSlot } from '../sharedState';
import { getClosedShadowRootsByHost, trackRegisteredShadowRoots } from '../dropTarget';
import type { DraggableInput } from '../../../draggable/DraggableProvider';
import type { DragCanceledReason, DragCleanupFn, DragMoveReason } from '../types';
import { modifyDragPoint, createDragModifiersState } from '../dragModifiers';
import type { DragModifiersState } from '../dragModifiers';
import {
  deepElementFromPoint,
  getInput,
  getModifierKeys,
  isDetachedDocument,
  isPrimaryHeld,
  modifierKeysChanged,
  normalizePointerType,
  preventContextMenu,
  preventNativeDragStart,
  releasePointerCaptureSafely,
  remapInput,
  runAllCleanups,
  setPointerCaptureSafely,
} from '../utils';

interface SyntheticDragState {
  /** The drag in progress, from the pickup's hand-off until its teardown. */
  active: ActiveSession | null;
}

const state = getSharedSlot<SyntheticDragState>('syntheticDrag', () => ({
  active: null,
}));

/** Cursor pinned across the document during a pointer drag (see `dragCursor`). */
const DEFAULT_DRAG_CURSOR = 'grabbing';

/**
 * Where the pointer stands at teardown, which decides how the drag's click is suppressed:
 *
 * - `released`: the pointer is up, so any click is imminent.
 * - `held`: the button is still down (Escape, blur), so the click comes on release.
 * - `none`: no click is coming, and arming would eat an unrelated one.
 */
type PointerAtTeardown = 'released' | 'held' | 'none';

/**
 * Tear down the active phase. Pass `releaseContextMenuSuppression` only for a clean
 * drop (see `clearPending` in `pickupRecognizer.ts`). Pass `drop` when a release
 * ends the drag, so the preview settles onto the source instead of being removed
 * at once.
 */
function clearActive(
  releaseContextMenuSuppression: boolean = false,
  pointerAtTeardown: PointerAtTeardown = 'held',
  drop: boolean = false,
): void {
  const session = state.active;
  if (!session) {
    return;
  }
  // Null the singleton first. If teardown throws, a leftover `active` would keep
  // `dragRootLock` held and block every future drag.
  state.active = null;

  // The click after the release comes from the drag, not from the user.
  if (pointerAtTeardown !== 'none' && session.heldPointer) {
    suppressNextClick(
      session.element,
      pointerAtTeardown === 'held' ? session.pointerId : undefined,
    );
  }

  try {
    runAllCleanups([
      session.rafFrame.cancel,
      ...session.listeners,
      () => releasePointerCaptureSafely(session.captureTarget, session.pointerId),
      () => session.preview.end(drop),
      ...session.gestureCleanups,
    ]);
  } finally {
    if (releaseContextMenuSuppression) {
      // Release only the suppression this gesture armed.
      session.contextMenuSuppression?.();
    }
    // Both do nothing when the lock was skipped (touch) or already released.
    dragCursor.unlock();
    dragRootLock.unlock();
  }
}

/**
 * Where the pointer stands for each cancel reason. There is no fallback on
 * purpose: `held` arms a click suppression for up to five seconds, so each new
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
 * Tear down the active phase for the way the drag ended. The session calls it once
 * through `sensor.release`, before any terminal event, or at teardown after a
 * handler error or a test reset. Before `start()` returns there is nothing to
 * release, and `createPreviewAndStartSession` undoes the pickup instead.
 */
function releaseActive(cancelReason?: DragCanceledReason): void {
  const active = state.active;
  if (!active) {
    return;
  }
  if (cancelReason !== undefined) {
    clearActive(false, POINTER_AT_CANCEL[cancelReason]);
    return;
  }
  // A clean drop frees the contextmenu suppression, and the drag's click is
  // imminent. A double-click session holds no pointer, so no click is armed.
  clearActive(true, 'released', true);
}

/**
 * Cancel the active drag. The session tears down through {@link releaseActive} and
 * still ends the drag if that throws.
 */
function cancelActive(
  input: DraggableInput | undefined,
  reason: DragCanceledReason,
  event: Event,
): void {
  state.active?.controller.cancel(input, reason, event);
}

/**
 * Start the drag of an activated press: build the preview, start the session and bind
 * the active listeners. Returns `false` when the lifecycle refuses or consumer code ends
 * the press on the way, so the recognizer abandons it. `parameters` and `dragSource` are
 * what `onBeforeMoveStart` saw; `pointerEvent` is what a frame reports until the first move.
 */
export function startDrag(
  pending: PendingSession,
  parameters: DraggableConfig<any, any>,
  dragSource: DraggableRootRecord,
  pointerEvent: PointerEvent | MouseEvent,
): boolean {
  const { element, target, pointerId, pointerType, contextMenuSuppression } = pending;
  const lastInput = getInput(pending.lastNativeEvent);
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
  if (!isPending(pending)) {
    return false;
  }
  // Start at the constrained point, so the initial target, the session's first
  // input, and the preview seed all agree with what the first frame resolves.
  const startInput = modifiers ? remapInput(lastInput, modifiers.initialPoint) : lastInput;

  // Hit-test the point. The `pointerdown` target may be a child of the draggable
  // that isn't a drop target.
  const doc = ownerDocument(element);
  const initialTarget = deepElementFromPoint(
    doc,
    startInput.clientX,
    startInput.clientY,
    getClosedShadowRootsByHost(),
  );

  // Undoes the preview, lock and lifecycle on a throw or refusal, leaving only the
  // pending press, which the recognizer abandons when this returns `false`.
  const result = createPreviewAndStartSession({
    draggableParameters: parameters,
    dragSource,
    initialInput: startInput,
    // The `pointermove` that crossed the activation threshold.
    initialEvent: pending.lastNativeEvent,
    startReason: pending.activationKind,
    // The press point, not the committed input. The grab offset must match
    // where the user took hold, and the activation distance separates the two.
    pressPoint: pending.origin,
    sourceRect,
    initialTarget,
    sensor: {
      getRawInput: getRawActivePointerInput,
      notifyScroll: notifyExternalScroll,
      release: releaseActive,
    },
    isPickupCurrent: () => isPending(pending),
  });

  if (!result) {
    // The lifecycle refused (a drag is already running), or consumer code ended
    // the pickup while its preview was built.
    return false;
  }

  completePending(pending);

  const { session, preview } = result;

  // Anchor pointer capture on a node that never unmounts (see the listener block below).
  const captureTarget: Element = doc.body ?? doc.documentElement;
  const win = ownerWindow(element);

  const activeRef: ActiveSession = {
    element,
    captureTarget,
    pointerId,
    heldPointer: pending.heldPointer,
    controller: session,
    preview,
    lastInput,
    lastNativeEvent: pending.lastNativeEvent,
    lastPointerEvent: pointerEvent,
    lastMoveReason: REASONS.pointer,
    modifiers,
    // The first frame confirms the entered target and fires the first `onMove`. A
    // double-click pickup waits for the first `pointermove`, so `onMove` never
    // reports the `dblclick`, which isn't a `PointerEvent` in every browser.
    frameDirty: pending.heldPointer,
    rafFrame: new WindowAnimationFrame(win),
    terminalFrameQueued: false,
    listeners: [],
    contextMenuSuppression,
    gestureCleanups: pending.gestureCleanups,
  };
  state.active = activeRef;

  // A start callback can remove the source iframe between the pending and active
  // listeners. End now rather than wait for a later press to find the dead document.
  if (isDetachedDocument(doc)) {
    cancelActive(undefined, REASONS.documentDetached, pending.lastNativeEvent);
    return false;
  }

  // Move touch's implicit capture to the body anchor and give pen and mouse
  // explicit capture, so pointer events arrive here wherever the pointer is.
  if (activeRef.heldPointer) {
    setPointerCaptureSafely(captureTarget, pointerId);
  }

  // Touch has no cursor. `dragCursor: false` lets the consumer manage it.
  const cursor = parameters.dragCursor ?? DEFAULT_DRAG_CURSOR;
  if (cursor && pointerType !== 'touch') {
    // The lock's `<html>` class enables a universal-selector rule that restyles the
    // whole document, so wait until the lift has painted. One frame isn't enough:
    // it runs in the lift's rendering update, where the sensor's `elementFromPoint`
    // would force the recalc.
    const cursorFrame = new WindowAnimationFrame(win);
    activeRef.listeners.push(cursorFrame.cancel);
    cursorFrame.request(() => {
      cursorFrame.request(() => {
        // Teardown cancels the frame. The check also keeps a stale callback from
        // locking the cursor for a newer session.
        if (state.active === activeRef) {
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
  activeRef.listeners.push(addEventListener(doc, 'pointermove', onActivePointerMove, CAPTURE));
  if (pointerType !== 'mouse') {
    activeRef.listeners.push(
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
      addEventListener(target, 'contextmenu', preventContextMenu, CAPTURE),
    );
  }
  activeRef.listeners.push(
    addEventListener(win, 'keydown', onActiveKeyDown, CAPTURE),
    // Only tracks modifier key releases. The drag has no keyup gesture.
    addEventListener(win, 'keyup', syncActiveModifierKeys, CAPTURE),
    addEventListener(win, 'blur', onActiveBlur),
    addEventListener(doc, 'visibilitychange', onActiveVisibilityChange),
    addEventListener(win, 'contextmenu', preventContextMenu, CAPTURE),
    // `scroll` doesn't bubble, but document capture sees any descendant container
    // scroll, including auto-scroll's.
    addEventListener(doc, 'scroll', notifyExternalScroll, { capture: true, passive: true }),
  );

  // `scroll` isn't composed, so the document misses containers in a shadow root
  // and the target would go stale under a still pointer. Listen on each shadow
  // root that holds a registered target or draggable, tracking mounts during the drag.
  activeRef.listeners.push(
    trackRegisteredShadowRoots((shadowRoot) =>
      addEventListener(shadowRoot, 'scroll', notifyExternalScroll, {
        capture: true,
        passive: true,
      }),
    ),
  );

  // Window capture is the earliest any listener sees an event, so a third-party
  // `stopPropagation()` can't leave the drag stuck.
  activeRef.listeners.push(
    addEventListener(win, 'pointerup', onActivePointerUp, CAPTURE),
    addEventListener(win, 'pointercancel', onActivePointerCancel, CAPTURE),
    addEventListener(win, 'lostpointercapture', onActiveLostPointerCapture, CAPTURE),
    // Keep blocking native drags, as in the pending phase.
    addEventListener(win, 'dragstart', preventNativeDragStart, CAPTURE),
  );

  if (!activeRef.heldPointer) {
    activeRef.listeners.push(
      // The drop click's press must not also focus or press the destination (a
      // menu opening on `pointerdown`). Canceling `pointerdown` suppresses the
      // compatibility `mousedown`, and the drop's `click` still fires.
      addEventListener(win, 'pointerdown', onDoubleClickPress, CAPTURE),
      addEventListener(win, 'mousedown', onDoubleClickPress, CAPTURE),
      addEventListener(win, 'click', onDoubleClickDrop, CAPTURE),
    );
  }
  scheduleActiveFrame(activeRef);
  return true;
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
  const active = state.active;
  if (
    !active ||
    event.button !== 0 ||
    event.detail === 0 ||
    normalizePointerType((event as PointerEvent).pointerType) !== 'mouse'
  ) {
    return;
  }
  // This click completes the move, so it must not also open or edit the destination.
  swallowEvent(event);
  // The user may have double-clicked to drop (see `suppressDoubleClickFollowUp`).
  suppressDoubleClickFollowUp(active.element);
  dropActiveAtPointer(event);
}

function scheduleActiveFrame(active: ActiveSession): void {
  if (active.rafFrame.currentId === null) {
    active.rafFrame.request(onActiveFrame);
  }
}

/**
 * Apply the draggable's `modifiers` to a pointer input. The result drives both the
 * hit-test and the preview, so modifiers affect target resolution too.
 */
function modifyActiveInput(active: ActiveSession, input: DraggableInput): DraggableInput {
  if (!active.modifiers) {
    return input;
  }
  return remapInput(
    input,
    modifyDragPoint(
      active.modifiers,
      { x: input.clientX, y: input.clientY },
      active.preview,
      input,
    ),
  );
}

function onActiveFrame(): void {
  const active = state.active;
  if (!active) {
    return;
  }

  // The loop stops here unless something changed (see `frameDirty`). The
  // listeners restart it, so an idle drag costs no frames.
  if (!active.frameDirty) {
    return;
  }

  // Clear before `controller.update`, because a consumer `onMove` may call
  // `scrollBy` and set the flag again for the next frame.
  active.frameDirty = false;

  // Hit-test before moving the preview, which the hit-test ignores anyway.
  // `elementFromPoint` right after the transform write would force a synchronous
  // style pass every frame.
  const input = modifyActiveInput(
    active,
    withCurrentPageOffset(active.lastInput, ownerWindow(active.element)),
  );
  if (state.active !== active) {
    return;
  }
  const target = hitTestUnderPreview(active.element, active.preview, input.clientX, input.clientY);
  active.controller.update(input, target, active.lastNativeEvent, active.lastMoveReason);
  if (state.active !== active) {
    return;
  }
  // `update` reattaches a host that a synchronous re-render removed. The
  // preview's own observer handles a commit deferred past this frame.
  active.preview.update(input.clientX, input.clientY, input);
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

// Block native scroll during a touch drag. The pointer handlers drive the drag.
function preventActiveTouchScroll(event: Event): void {
  if (event.cancelable) {
    event.preventDefault();
  }
}

function onActivePointerMove(pointerEvent: PointerEvent): void {
  const active = state.active;
  if (
    !active ||
    (active.heldPointer
      ? pointerEvent.pointerId !== active.pointerId
      : // A mouse double-click session holds no pointer. It follows any mouse
        // pointer and ignores touch and pen.
        normalizePointerType(pointerEvent.pointerType) !== 'mouse')
  ) {
    return;
  }
  // Wait one frame before treating `buttons === 0` as a missed release. A
  // terminal event in the same frame must take precedence.
  if (active.heldPointer && pointerEvent.buttons === 0) {
    // Apply modifiers like every reported input, so `onMoveEnd` doesn't report a
    // raw coordinate the drag never reported while live.
    const input = modifyActiveInput(active, getInput(pointerEvent));
    queueTerminalCancel(active, input, REASONS.missedRelease, pointerEvent);
    return;
  }
  // Chorded release (see `onPendingPointerMove`). The user lifted the primary
  // button on purpose, so drop rather than cancel.
  if (active.heldPointer && !isPrimaryHeld(pointerEvent)) {
    dropActiveAtPointer(pointerEvent);
    return;
  }
  active.lastInput = getInput(pointerEvent);
  active.lastNativeEvent = pointerEvent;
  active.lastPointerEvent = pointerEvent;
  active.lastMoveReason = REASONS.pointer;
  active.frameDirty = true;
  // This held-button sample shows a queued terminal cancel was transient, so
  // replace it. A queued `onActiveFrame` only needs `frameDirty`.
  if (active.terminalFrameQueued || active.rafFrame.currentId === null) {
    active.terminalFrameQueued = false;
    active.rafFrame.request(onActiveFrame);
  }
}

function onActivePointerUp(pointerEvent: PointerEvent): void {
  const active = state.active;
  if (!active || pointerEvent.pointerId !== active.pointerId) {
    return;
  }
  // See `onPendingPointerUp` (`pickupRecognizer.ts`) for the `buttons` fallback.
  if (pointerEvent.button !== 0 && isPrimaryHeld(pointerEvent)) {
    return;
  }
  dropActiveAtPointer(pointerEvent);
}

/** End the active drag with a drop resolved at the pointer's current position. */
function dropActiveAtPointer(pointerEvent: PointerEvent | MouseEvent): void {
  const active = state.active;
  if (!active) {
    return;
  }
  const input = modifyActiveInput(active, getInput(pointerEvent));
  const target = hitTestUnderPreview(active.element, active.preview, input.clientX, input.clientY);
  active.controller.drop(input, target, pointerEvent);
}

function onActivePointerCancel(pointerEvent: PointerEvent): void {
  const active = state.active;
  if (!active || pointerEvent.pointerId !== active.pointerId) {
    return;
  }
  // `pointercancel` often reports (0,0). Pass `undefined` so the lifecycle uses
  // the last good input instead of snapping to the origin.
  cancelActive(undefined, REASONS.pointerCanceled, pointerEvent);
}

function onActiveLostPointerCapture(pointerEvent: PointerEvent): void {
  const active = state.active;
  if (!active || pointerEvent.pointerId !== active.pointerId) {
    return;
  }
  // Moving touch and pen's implicit capture to the body anchor fires
  // `lostpointercapture` on the press target, which must not cancel. Only cancel
  // once the anchor itself lost capture (tab switch, soft keyboard, a sibling
  // frame taking the pointer).
  if (
    getTarget(pointerEvent) !== active.captureTarget ||
    active.captureTarget.hasPointerCapture?.(pointerEvent.pointerId)
  ) {
    return;
  }
  // Let a terminal event in the same frame win. `lostpointercapture` often
  // reports (0,0), so a real hand-off uses the last good input.
  queueTerminalCancel(active, undefined, REASONS.captureLost, pointerEvent);
}

/**
 * Cancel the drag on the next frame, in place of the queued `onActiveFrame`
 * (see `ActiveSession.terminalFrameQueued`), unless a terminal event ends it first.
 */
function queueTerminalCancel(
  active: ActiveSession,
  input: DraggableInput | undefined,
  reason: DragCanceledReason,
  event: PointerEvent,
): void {
  active.terminalFrameQueued = true;
  active.rafFrame.request(() => {
    if (state.active === active) {
      cancelActive(input, reason, event);
    }
  });
}

/**
 * Keep the session's modifier keys current, and re-run the frame when they change,
 * so a key-gated modifier (a 45° snap on Shift) doesn't wait for a pointer move.
 */
function syncActiveModifierKeys(event: KeyboardEvent): void {
  const active = state.active;
  if (!active) {
    return;
  }
  const keys = getModifierKeys(event);
  if (!modifierKeysChanged(active.lastInput, keys)) {
    return;
  }
  active.lastInput = { ...active.lastInput, ...keys };
  // Report the key event, or `eventDetails.event.shiftKey` and
  // `location.current.input.shiftKey` would disagree in the same `onMove`.
  active.lastNativeEvent = event;
  active.lastMoveReason = REASONS.modifierKey;
  active.frameDirty = true;
  scheduleActiveFrame(active);
}

function onActiveKeyDown(keyEvent: KeyboardEvent): void {
  if (!state.active) {
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
  const active = state.active;
  if (!active || ownerDocument(active.element).visibilityState !== 'hidden') {
    return;
  }
  cancelActive(undefined, REASONS.pageHidden, event);
}

/**
 * The pointer's raw position before `modifiers`, or `null` when no pointer drag is
 * running. Unlike the session snapshot, which only updates when the drop-target
 * stack changes, it tracks every sample. Auto-scroll reads it so a modifier can't
 * keep the drag point out of a container the user is pushing against.
 */
/** The last pointer sample, with the current page offset after a scroll under a still pointer. */
function getRawActivePointerInput(): DraggableInput | null {
  const active = state.active;
  return active ? withCurrentPageOffset(active.lastInput, ownerWindow(active.element)) : null;
}

/**
 * Flag that something scrolled under the active drag, so the next frame
 * re-resolves the target. Auto-scroll also calls it, which covers a container in
 * a shadow root without a drop target.
 */
function notifyExternalScroll(): void {
  const active = state.active;
  if (!active) {
    return;
  }
  // A scroll-only frame reports the pointer, not a modifier key pressed long
  // before. A frame already pending for a move or a key keeps its own event.
  if (!active.frameDirty) {
    active.lastNativeEvent = active.lastPointerEvent;
    active.lastMoveReason = REASONS.pointer;
  }
  active.frameDirty = true;
  scheduleActiveFrame(active);
}

/** The active phase's half of `recoverDetachedSession` (`pickupRecognizer.ts`). */
export function recoverActiveSession(event: Event): boolean {
  const active = state.active;
  if (active && isDetachedDocument(ownerDocument(active.element))) {
    cancelActive(undefined, REASONS.documentDetached, event);
  }
  return state.active === null;
}

export function resetForTests(): void {
  // Arm no click suppression, so no `click` listener leaks into the next test.
  clearActive(false, 'none');
}

interface ActiveSession {
  element: HTMLElement;
  /** The body anchor that holds the gesture's pointer capture, never the dragged element. */
  captureTarget: Element;
  pointerId: number;
  /** See `PendingSession.heldPointer`. */
  heldPointer: boolean;
  controller: DragSessionController;
  preview: DragPreview;
  lastInput: DraggableInput;
  /**
   * The native event `lastInput` was read from, reported to move handlers as
   * `eventDetails.event`. It starts as the activation move, and is a
   * `KeyboardEvent` when a modifier key drove the frame (see `syncActiveModifierKeys`).
   */
  lastNativeEvent: PointerEvent | MouseEvent | KeyboardEvent;
  /**
   * The activation event (for a double-click, its second press), then each
   * `pointermove`. Scroll-only frames report it (see `notifyExternalScroll`).
   */
  lastPointerEvent: PointerEvent | MouseEvent;
  /** Why `lastNativeEvent` caused the next movement frame. */
  lastMoveReason: DragMoveReason;
  /** Compiled `modifiers`, or `null` when the draggable declared none. */
  modifiers: DragModifiersState | null;
  /**
   * Set by a pointer event, a modifier key change or a scroll, and cleared when
   * `onActiveFrame` re-resolves. Gating on events rather than coordinate changes
   * keeps a reorder that slides a new element under a still pointer from
   * re-firing `onMove` in a loop, while a scroll still forces one re-resolution.
   */
  frameDirty: boolean;
  rafFrame: WindowAnimationFrame;
  /**
   * Whether `rafFrame` holds a deferred terminal cancel (missed release, lost
   * capture) instead of `onActiveFrame`. A held-button move replaces only the
   * cancel, so a 120 to 240 Hz pointer doesn't re-request the frame on every move.
   */
  terminalFrameQueued: boolean;
  listeners: DragCleanupFn[];
  /** See {@link PendingSession.gestureCleanups}; released when the drag ends. */
  gestureCleanups: DragCleanupFn[];
  /**
   * See {@link PendingSession.contextMenuSuppression}. Only a clean drop releases
   * it (see `clearPending`).
   */
  contextMenuSuppression: DragCleanupFn | null;
}
