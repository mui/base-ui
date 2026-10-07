/**
 * The pointer events sensor. It drives drags from mouse, touch and pen input
 * instead of the native HTML5 drag and drop API, which behaves inconsistently
 * across desktop and tablets. `pickupRecognizer.ts` decides when a press becomes a
 * drag and hands it to `startDrag`. From there this module moves the preview,
 * feeds the lifecycle, and ends the drag on release or cancel. The lifecycle
 * (target resolution, consumer dispatch) lives in `core/lifecycleManager.ts`.
 */

import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { getTarget } from '@base-ui/utils/shadowDom';
import { WindowAnimationFrame } from '../../windowAnimationFrame';
import { REASONS } from '../../../internals/reasons';
import type { DragSessionController } from '../core/lifecycleManager';
import { createPreviewAndStartSession, hitTestUnderPreview } from './pickupPreview';
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
import { getDropTargetShadowRootsByHost, trackDropTargetShadowRoots } from '../dropTarget';
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
 * Where the pointer stands when the active phase is torn down. This decides how
 * the drag's compatibility click is suppressed:
 *
 * - `released` means the pointer is already up, so any click is imminent.
 * - `held` means the button is still down (an Escape cancel, a blur), so the
 *   click only arrives when the user lets go.
 * - `none` means the drag produces no click, and arming would eat an unrelated one.
 */
type PointerAtTeardown = 'released' | 'held' | 'none';

/**
 * Tear down the active phase. As in `clearPending` (`pickupRecognizer.ts`), the
 * contextmenu suppression armed at `pointerdown` is only released on a clean drop.
 * A browser cancellation (`pointercancel` or blur) keeps it armed, because on
 * Android a long-press fires `pointercancel` and then the `contextmenu`. The 1.5s
 * timer disarms it afterwards.
 *
 * Pass `drop` when a release ends the drag, so the preview settles onto the source
 * instead of being removed at once.
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

  // The gesture activated, so the compatibility click after the release comes
  // from the drag, not from a click the user meant.
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
      // Release only the suppression this gesture armed (see `clearPending`
      // in `pickupRecognizer.ts`).
      session.contextMenuSuppression?.();
    }
    // Both do nothing when the lock was skipped (touch) or already released.
    dragCursor.unlock();
    dragRootLock.unlock();
  }
}

/**
 * Where the pointer stands for each cancel reason. The map has no fallback on
 * purpose. `held` arms a window-level click suppression for up to five seconds,
 * so each new {@link DragCanceledReason} must choose explicitly.
 */
const POINTER_AT_CANCEL: Record<DragCanceledReason, PointerAtTeardown> = {
  // This cancel fires because the button came up.
  [REASONS.missedRelease]: 'released',
  // A canceled pointer never produces a compatibility click.
  [REASONS.pointerCanceled]: 'none',
  // Raised by another gesture's press (see `recoverActiveSession`), or when a
  // start callback removes the source's iframe (see `startDrag`). In a dead
  // realm `ownerWindow` falls back to the top-level window, so arming would swallow
  // the next press's click on the wrong document.
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
 * through `sensor.release`: when a drop or a cancel begins its end sequence, before
 * any terminal event, or at teardown after a handler error or a test reset. It does
 * nothing before `start()` returns, while the sensor hasn't recorded the pickup.
 * `createPreviewAndStartSession` undoes that pickup instead.
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
  // A clean release frees the contextmenu suppression, and the pointer is already
  // up, so the drag's click is imminent. A double-click session holds no pointer,
  // so nothing is armed for it.
  clearActive(true, 'released', true);
}

/**
 * Cancel the active drag. The session releases the gesture through
 * {@link releaseActive} before the terminal events, and still ends the drag when
 * that teardown throws.
 */
function cancelActive(
  input: DraggableInput | undefined,
  reason: DragCanceledReason,
  event: Event,
): void {
  state.active?.controller.cancel(input, reason, event);
}

/**
 * Start the drag of a press the recognizer activated (see `pickupRecognizer.ts`). It
 * builds the preview, starts the session and binds the active phase's listeners.
 * Returns whether the drag started: `false` when the lifecycle refuses, or when
 * consumer code ends the press on the way. The recognizer then abandons the press.
 *
 * `parameters` and `dragSource` are what `onBeforeMoveStart` saw. `pointerEvent` is
 * the pointer event a frame reports until the first move.
 */
export function startDrag(
  pending: PendingSession,
  parameters: DraggableConfig<any, any>,
  dragSource: DraggableRootRecord,
  pointerEvent: PointerEvent | MouseEvent,
): boolean {
  const { element, target, pointerId, pointerType, contextMenuSuppression } = pending;
  const lastInput = getInput(pending.lastNativeEvent);
  // Compiled before the session starts, so the source rect is measured before
  // `[data-dragging]` styles can restyle what custom modifiers read.
  const modifiers = createDragModifiersState(
    parameters.modifiers,
    dragSource,
    { x: lastInput.clientX, y: lastInput.clientY },
    lastInput,
  );
  if (!isPending(pending)) {
    return false;
  }
  // Start at the constrained point, so the initial target, the session's first
  // input, and the preview seed all agree with what the first frame resolves.
  const startInput = modifiers ? remapInput(lastInput, modifiers.initialPoint) : lastInput;

  // Resolve the initial drop target from the point. The `pointerdown` target
  // may be a child of the draggable that isn't a drop target.
  const doc = ownerDocument(element);
  const initialTarget = deepElementFromPoint(
    doc,
    startInput.clientX,
    startInput.clientY,
    getDropTargetShadowRootsByHost(),
  );

  // `createPreviewAndStartSession` allocates the preview, the lock and the
  // lifecycle, and undoes them on a throw or a lifecycle refusal. Only the
  // pending press is left, which the recognizer abandons when this returns `false`.
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
    // A double-click pickup holds no pointer, and its `dblclick` isn't a
    // `PointerEvent` in every browser. Until the first move, a frame that runs
    // for a scroll reports the press of the second click.
    lastPointerEvent: pointerEvent,
    lastMoveReason: REASONS.pointer,
    modifiers,
    // Resolve on the first active frame to confirm the entered target and fire
    // the first `onMove`. That frame clears it, so later stationary frames skip
    // the work. A double-click pickup waits for the first `pointermove`
    // instead. Its `onMove` would otherwise report the `dblclick`, which isn't
    // a `PointerEvent` in every browser.
    frameDirty: pending.heldPointer,
    rafFrame: new WindowAnimationFrame(win),
    terminalFrameQueued: false,
    listeners: [],
    contextMenuSuppression,
    gestureCleanups: pending.gestureCleanups,
  };
  state.active = activeRef;

  // A start callback can remove the source iframe after the pending blur
  // listener is gone but before the active listeners below exist. End the
  // lifecycle now instead of waiting for a later `pointerdown` to find the dead
  // document.
  if (isDetachedDocument(doc)) {
    cancelActive(undefined, REASONS.documentDetached, pending.lastNativeEvent);
    return false;
  }

  // Move touch's implicit capture to the body anchor and give pen and mouse
  // explicit capture, so pointer events arrive here wherever the pointer is.
  if (activeRef.heldPointer) {
    setPointerCaptureSafely(captureTarget, pointerId);
  }

  // Pin the cursor for the duration of the drag. Skipped for touch, which has
  // no cursor. `false` opts out so a consumer can manage the cursor itself.
  const cursor = parameters.dragCursor ?? DEFAULT_DRAG_CURSOR;
  if (cursor && pointerType !== 'touch') {
    // The lock toggles a class on `<html>` that enables a universal-selector
    // rule, which invalidates style for the whole document. Wait for the frame
    // after the lift, so the lift paints before that cost. A single frame isn't
    // enough. Its callback runs in the same rendering update that paints the
    // lift, and the sensor's own frame forces the style recalc there through
    // `elementFromPoint`.
    const cursorFrame = new WindowAnimationFrame(win);
    activeRef.listeners.push(cursorFrame.cancel);
    cursorFrame.request(() => {
      cursorFrame.request(() => {
        // The session's teardown cancels the frame. The identity check also
        // stops a stale callback from locking the cursor for a newer session.
        if (state.active === activeRef) {
          dragCursor.lock(element, cursor, {
            nonce: parameters.styleNonce,
            disableStyleElements: parameters.disableStyleElements,
          });
        }
      });
    });
  }

  // The active `pointermove` listener is on the document. The body-anchor
  // capture sends every event for this `pointerId` to `body`, so the listener
  // sees the whole gesture, even after a virtualizer or live reorder unmounts
  // the dragged element. Touch ignores pointer capture, so it also needs a
  // `{ passive: false }` `touchmove` listener on the document to cancel the
  // scroll that the `touch-action` lock doesn't cover. The window capture
  // listeners further down handle `pointerup` and `pointercancel`, since they
  // run before any document listener.
  activeRef.listeners.push(
    // Capture phase, like the pending phase and the window listeners below. A
    // third-party bubble listener that calls `stopPropagation()` on
    // `pointermove` (analytics shims, other gesture libraries) must not freeze
    // the preview and target resolution.
    addEventListener(doc, 'pointermove', onActivePointerMove, CAPTURE),
  );
  if (pointerType !== 'mouse') {
    activeRef.listeners.push(
      // A detached press target keeps receiving touch events without a document
      // propagation path. Keep both listeners until this gesture ends.
      addEventListener(target, 'touchmove', preventActiveTouchScroll, {
        passive: false,
        capture: true,
      }),
      addEventListener(doc, 'touchmove', preventActiveTouchScroll, {
        passive: false,
        capture: true,
      }),
      // Guard the press target for the whole touch or pen drag, for the same
      // detached-target case as `startContextMenuSuppression` (`pickupRecognizer.ts`). The source element
      // is an ancestor at pickup, so a listener there adds nothing. A mouse
      // context menu comes from a separate button while capture is on `body`, so
      // the window listener below sees it.
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
    // `scroll` doesn't bubble, but a capture listener on the document sees
    // scrolling in any descendant container, including auto-scroll's
    // `scrollBy`. The next frame then re-resolves the target under a stationary
    // pointer.
    addEventListener(doc, 'scroll', notifyExternalScroll, { capture: true, passive: true }),
  );

  // `scroll` isn't composed either, so the document listener misses containers
  // inside a shadow root. Wheel-scrolling a drop area in a shadow root under a
  // stationary pointer would leave the target and its indicator stale until the
  // pointer moved. Listen on each shadow root that holds a drop target, and
  // update the set as targets mount or unmount during the drag.
  activeRef.listeners.push(
    trackDropTargetShadowRoots((shadowRoot) =>
      addEventListener(shadowRoot, 'scroll', notifyExternalScroll, {
        capture: true,
        passive: true,
      }),
    ),
  );

  // Release and hand-off listeners go on the window in the capture phase, the
  // earliest point any listener sees the event, so a third-party
  // `stopPropagation()` can't leave the drag stuck. The body-anchor capture
  // routes `pointerup` here wherever the pointer is released. If the OS takes
  // the pointer instead (Android soft keyboard, tab switch, a sibling frame
  // stealing capture), `pointercancel` ends the drag. `lostpointercapture` has
  // its own handler, because the capture redirect above makes touch and pen
  // fire a spurious one on the original element.
  activeRef.listeners.push(
    addEventListener(win, 'pointerup', onActivePointerUp, CAPTURE),
    addEventListener(win, 'pointercancel', onActivePointerCancel, CAPTURE),
    addEventListener(win, 'lostpointercapture', onActiveLostPointerCapture, CAPTURE),
    // Keep blocking native HTML5 drags from natively draggable descendants, as
    // in the pending phase.
    addEventListener(win, 'dragstart', preventNativeDragStart, CAPTURE),
  );

  if (!activeRef.heldPointer) {
    activeRef.listeners.push(
      // The press before the drop click must not also focus or press the
      // destination, such as a button taking focus or a menu that opens on
      // `pointerdown`.
      // Canceling `pointerdown` also suppresses the compatibility `mousedown`,
      // and the `click` that completes the drop still fires.
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
  // The user may have double-clicked to drop. The rest of that double-click must
  // not pick up the item under the pointer again, often the one just dropped.
  suppressDoubleClickFollowUp(active.element);
  dropActiveAtPointer(event);
}

function scheduleActiveFrame(active: ActiveSession): void {
  if (active.rafFrame.currentId === null) {
    active.rafFrame.request(onActiveFrame);
  }
}

/**
 * Apply the draggable's `modifiers` to a pointer input. The result drives both
 * the drop hit-test and the preview, so a modifier affects target resolution,
 * not only the visual.
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

  // Only re-resolve when the pointer moved or content scrolled under it (see
  // `frameDirty`). Otherwise the loop stops here. The move and scroll listeners
  // restart it, so an idle drag costs no frames.
  if (!active.frameDirty) {
    return;
  }

  // Clear before `controller.update`, because a consumer `onMove` may call
  // `scrollBy` and set the flag again for the next frame.
  active.frameDirty = false;

  // Hit-test before moving the preview. The hit-test skips the preview through
  // its `ignore` argument, not its position, and calling `elementFromPoint` right
  // after the transform write would force a synchronous style pass every frame.
  // Both still happen before the next paint.
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
  // A consumer callback that re-rendered synchronously may have removed the
  // preview's host. `update` reattaches it (`ensureConnected`) before writing
  // the position. The preview's own observer handles a React commit deferred
  // past this frame.
  active.preview.update(input.clientX, input.clientY, input);
}

/**
 * `input` with its page coordinates read from the current scroll position. The
 * page can scroll under a still pointer, from auto-scroll or the wheel, and the
 * frame then re-runs with the last sample, whose own `pageX`/`pageY` are stale.
 */
function withCurrentPageOffset(input: DraggableInput, win: Window): DraggableInput {
  const pageX = input.clientX + win.scrollX;
  const pageY = input.clientY + win.scrollY;
  if (pageX === input.pageX && pageY === input.pageY) {
    return input;
  }
  return { ...input, pageX, pageY };
}

// Block native scroll during a touch drag. The pointer handlers
// (`onActivePointer*`) own the coordinates and the end of the drag.
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
  // Chorded release. Lifting the primary button while another is held fires
  // `pointermove` (a `buttons` change), not `pointerup`, and the later
  // `pointerup` reports the last button, which `onActivePointerUp` ignores. The
  // user lifted the primary button on purpose, so this drops at the current
  // position instead of canceling.
  if (active.heldPointer && !isPrimaryHeld(pointerEvent)) {
    dropActiveAtPointer(pointerEvent);
    return;
  }
  active.lastInput = getInput(pointerEvent);
  active.lastNativeEvent = pointerEvent;
  active.lastPointerEvent = pointerEvent;
  active.lastMoveReason = REASONS.pointer;
  active.frameDirty = true;
  // Replace the queued frame only when it holds a terminal fallback. An earlier
  // `buttons === 0` sample or a lost capture may have queued one, and this
  // held-button sample shows that signal was transient. If `onActiveFrame` is
  // already queued, setting `frameDirty` is enough.
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
  // The session releases the gesture through `releaseActive` before the terminal
  // events.
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
  // `startDrag` moves capture to the body anchor with `setPointerCapture`.
  // Touch and pen implicitly capture to the `pointerdown` element, so the
  // original element fires `lostpointercapture` right before the first move.
  // The engine caused that, not the OS, and canceling on it would end every
  // touch or pen drag as soon as the finger moved. Only cancel once the anchor
  // itself has lost capture (tab switch, soft keyboard, a sibling frame taking
  // the pointer). This listener is on `window`, so check both the event target
  // and the current capture state.
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
 * Keep the session's modifier keys current, and re-run the frame when they change.
 *
 * Modifiers are applied per frame from `lastInput`, and a frame only runs when
 * something moved. Without this, a key-gated modifier (a 45° snap on Shift)
 * would wait for the next pointer move. Only a real change schedules a frame, so
 * typing during a drag costs nothing.
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
  // Report the key event, since the new key flags came from it. Otherwise
  // `eventDetails.event.shiftKey` and `location.current.input.shiftKey` would
  // disagree in the same `onMove`.
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
  // The cancel consumes Escape. Otherwise the same keydown would also close an
  // enclosing dialog or popover.
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
 * The active pointer drag's physical pointer position, before `modifiers` are
 * applied, or `null` when no pointer drag is running. The session snapshot only
 * updates when the drop-target stack changes, while this tracks every pointer
 * sample, so a consumer that engages mid-drag can use it right away. Auto-scroll
 * reads it so a modifier can't hold the drag point outside a scroll container
 * the user is pushing against.
 */
function getRawActivePointerInput(): DraggableInput | null {
  return state.active?.lastInput ?? null;
}

/**
 * Flag that something scrolled under the active drag, so the next frame
 * re-resolves the target under a stationary pointer. Bound to the document's
 * capture-phase `scroll` and to each shadow root that holds a drop target.
 * Auto-scroll also calls it on each frame it scrolls, which covers a container
 * in a shadow root without a drop target. Does nothing when no pointer drag is
 * active.
 */
function notifyExternalScroll(): void {
  const active = state.active;
  if (!active) {
    return;
  }
  // A frame that runs only for the scroll reports the pointer. The event and
  // reason of the last frame could be a modifier key pressed long before. A
  // frame already pending for a move or a key keeps its own.
  if (!active.frameDirty) {
    active.lastNativeEvent = active.lastPointerEvent;
    active.lastMoveReason = REASONS.pointer;
  }
  active.frameDirty = true;
  scheduleActiveFrame(active);
}

/**
 * Whether a new gesture may start as far as the active phase is concerned. A drag
 * whose document lost its browsing context (iframe removed, popout closed) can't
 * end on its own, because its ending listeners all lived in the dead realm, and it
 * would block every later drag. The next press anywhere cancels it and proceeds. A
 * live drag still blocks.
 */
export function recoverActiveSession(event: Event): boolean {
  const active = state.active;
  if (active && isDetachedDocument(ownerDocument(active.element))) {
    cancelActive(undefined, REASONS.documentDetached, event);
  }
  return state.active === null;
}

export function resetForTests(): void {
  // Skip click suppression so the reset leaves no `click` listener armed for the
  // next test.
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
   * The native event `lastInput` was read from. It is passed to
   * `controller.update` so move handlers get a real `eventDetails.event` with
   * modifier keys and `pointerType`. It starts as the activation move, so it is
   * real from the first frame.
   *
   * It is a `KeyboardEvent` when a modifier key drove the frame (see
   * `syncActiveModifierKeys`), because `lastInput`'s key flags came from that
   * press and the older `pointermove` would contradict them.
   */
  lastNativeEvent: PointerEvent | MouseEvent | KeyboardEvent;
  /**
   * The last pointer event, first the activation event, or the second press of a
   * double-click, and then each `pointermove`. A frame driven only by a scroll
   * reports it (see `notifyExternalScroll`).
   */
  lastPointerEvent: PointerEvent | MouseEvent;
  /** Why `lastNativeEvent` caused the next movement frame. */
  lastMoveReason: DragMoveReason;
  /** Compiled `modifiers`, or `null` when the draggable declared none. */
  modifiers: DragModifiersState | null;
  /**
   * Set when the pointer reports activity, a modifier key changes, or something
   * scrolls. Cleared each time `onActiveFrame` re-resolves.
   *
   * Gating on pointer events rather than coordinate changes means a stationary
   * pointer re-resolves nothing, so a reorder that slides a new element under it
   * can't re-fire `onMove` in a loop. Any real move re-resolves, even one with
   * the same coordinates as the last. A scroll, from auto-scroll's `scrollBy` or
   * the user, forces one re-resolution, so content moving under a stationary
   * pointer is still tracked.
   */
  frameDirty: boolean;
  rafFrame: WindowAnimationFrame;
  /**
   * Whether `rafFrame` holds a deferred terminal callback (a missed release or a
   * lost capture) instead of `onActiveFrame`. A held-button move must replace
   * that callback, but not a queued `onActiveFrame`. A 120 to 240 Hz pointer
   * sends several moves between two paints, and canceling and re-requesting the
   * frame for each is wasted work.
   */
  terminalFrameQueued: boolean;
  listeners: DragCleanupFn[];
  /** See {@link PendingSession.gestureCleanups}; released when the drag ends. */
  gestureCleanups: DragCleanupFn[];
  /**
   * The contextmenu suppression this gesture armed (touch and pen only), carried
   * over from the pending phase. Only a clean drop releases it. A cancel leaves
   * it armed for the `contextmenu` Android fires after `pointercancel` (see
   * `clearActive`).
   */
  contextMenuSuppression: DragCleanupFn | null;
}
