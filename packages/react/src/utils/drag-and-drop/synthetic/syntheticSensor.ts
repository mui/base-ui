/**
 * The pointer events sensor. It starts drags from mouse, touch and pen input
 * instead of the native HTML5 drag and drop API, which behaves inconsistently
 * across desktop and tablets. The lifecycle (target resolution, consumer
 * dispatch) lives in `core/lifecycleManager.ts`.
 */

import { NOOP } from '@base-ui/utils/empty';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { getTarget } from '@base-ui/utils/shadowDom';
import { isHTMLElement } from '@floating-ui/utils/dom';
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
} from '../../../draggable/root/DraggableRoot';
import { getActiveSession } from '../core/dragSession';
import type { DragSessionController } from '../core/lifecycleManager';
import { createPreviewAndStartSession, hitTestUnderPreview } from '../core/sensorSession';
import type { SyntheticPreviewHandle } from './syntheticPreview';
import * as dragRootLock from './dragRootLock';
import * as dragCursor from './dragCursor';
import {
  consumeDoubleClickFollowUp,
  suppressDoubleClickFollowUp,
  CAPTURE,
  suppressNextClick,
  swallowEvent,
} from './postDragClick';
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
import { getDropTargetShadowRootsByHost, trackDropTargetShadowRoots } from '../dropTarget';
import type { DraggableInput, DraggablePointerType } from '../../../draggable/DraggableProvider';
import type { DragCanceledReason, DragCleanupFn, DragMoveReason, DragStartReason } from '../types';
import { modifyDragPoint, createDragModifiersState } from '../dragModifiers';
import type { DragModifiersState } from '../dragModifiers';
import {
  deepElementFromPoint,
  getDragEventRoot,
  getInput,
  getModifierKeys,
  getOverflowFlags,
  isRtlElement,
  isDetachedDocument,
  modifierKeysChanged,
  normalizePointerType,
  onceCleanup,
  remapInput,
  runAllCleanups,
} from '../utils';

interface SyntheticDragState {
  /** At most one of `pending` and `active` is non-null. */
  pending: PendingSession | null;
  active: ActiveSession | null;
  /** The first tap of a possible touch/pen double-tap (see `recordTap`). */
  lastTap: TapRecord | null;
  /** The last `pointerdown` anywhere (see `onDoubleClick`). */
  lastPointerDown: PointerEvent | null;
  cleanupContextMenuSuppression: DragCleanupFn | null;
}

const state = getSharedSlot<SyntheticDragState>('syntheticDrag', () => ({
  pending: null,
  active: null,
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

/** Cursor pinned across the document during a pointer drag (see `dragCursor`). */
const DEFAULT_DRAG_CURSOR = 'grabbing';

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
 * Tear down the active phase. As in {@link clearPending}, the contextmenu
 * suppression armed at `pointerdown` is only released on a clean drop. A browser
 * cancellation (`pointercancel` or blur) keeps it armed, because on Android a
 * long-press fires `pointercancel` and then the `contextmenu`. The 1.5s timer
 * disarms it afterwards.
 *
 * Pass `destroyPreview: false` to leave the preview to the caller, which then
 * destroys it itself (see `dropActiveAtPointer`).
 */
function clearActive(
  releaseContextMenuSuppression: boolean = false,
  pointerAtTeardown: PointerAtTeardown = 'held',
  destroyPreview: boolean = true,
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
      () => {
        if (destroyPreview) {
          session.preview.destroy();
        }
      },
      ...session.gestureCleanups,
    ]);
  } finally {
    if (releaseContextMenuSuppression) {
      // Release only the suppression this gesture armed (see `clearPending`).
      session.contextMenuSuppression?.();
    }
    // Both do nothing when the lock was skipped (touch) or already released.
    dragCursor.unlock();
    dragRootLock.unlock();
  }
}

/**
 * Run a pointer capture operation and swallow the `DOMException`
 * (`InvalidStateError` or `NotFoundError`) it throws when the pointer is no
 * longer active, or when the OS or another listener already released capture.
 * The check uses the element's own realm, since an iframe or popout has its own
 * `DOMException`. Any other error is rethrown.
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
  // Raised by another gesture's press (see `recoverDetachedSession`), or when a
  // start callback removes the source's iframe (see `commitActivation`). In a dead
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

function cancelActive(
  input?: DraggableInput,
  reason: DragCanceledReason = REASONS.imperativeAction,
  event?: Event,
): void {
  const active = state.active;
  if (!active) {
    return;
  }
  const controller = active.controller;
  // `clearActive` can throw. `releasePointerCaptureSafely` only swallows
  // `DOMException`s from the element's realm, and that lookup falls back to the
  // top-level window once the realm is dead. Skipping the cancel would leave the
  // session active for the rest of the page's life, so the lifecycle is ended
  // either way. `tearDown` is idempotent, so this is safe even if `clearActive`
  // already forced it.
  try {
    clearActive(false, POINTER_AT_CANCEL[reason]);
  } finally {
    controller.cancel(input, reason, event);
  }
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
  // reported by a double-click drag until its first move (see `commitActivation`).
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
  const session = state.pending ?? state.active;
  if (!session) {
    return true;
  }
  if (!isDetachedDocument(ownerDocument(session.element))) {
    return false;
  }
  if (state.pending) {
    clearPending();
  } else {
    cancelActive(undefined, REASONS.documentDetached, event);
  }
  return !state.pending && !state.active;
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
  commitActivation();
  if (state.active) {
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

/** Whether the primary button is still down. `buttons` is a bitmask, and bit 0 is the primary. */
function isPrimaryHeld(event: PointerEvent): boolean {
  return event.buttons % 2 !== 0;
}

/** Installed only while a gesture is alive (see `onPointerDown` and `commitActivation`). */
function preventContextMenu(event: Event): void {
  event.preventDefault();
}

/**
 * Block the native HTML5 drag that a natively draggable descendant (`<img>`,
 * `<a href>`) starts from the same press. `draggable="false"` on the source
 * doesn't cover a nested `<img>` or `<a>`, so the pending and active phases
 * cancel `dragstart` directly.
 */
function preventNativeDragStart(event: Event): void {
  event.preventDefault();
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
    commitActivation();
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

function commitActivation(): void {
  const pending = state.pending;
  if (!pending) {
    return;
  }
  const { element, target, pointerId, pointerType, contextMenuSuppression } = pending;
  const lastInput = getInput(pending.lastNativeEvent);
  try {
    const getParameters = getRegistration(element);
    if (!getParameters) {
      clearPending(true);
      return;
    }
    const parameters = getParameters();
    if (state.pending !== pending) {
      return;
    }

    // Re-check the lifecycle in case another pointer started a drag during the
    // pending window. Avoid running callbacks and building a preview for a session
    // the lifecycle would refuse.
    if (getActiveSession() !== null) {
      clearPending(true);
      return;
    }

    const dragHandle = resolveDragHandle(parameters);
    if (state.pending !== pending) {
      return;
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
      clearPending(true);
      return;
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
        return;
      }
      if (eventDetails.isCanceled) {
        clearPending(true);
        return;
      }
    }

    // Remove the pending listeners and timer now. Pointer events that arrive
    // before the active phase starts are no longer pending events.
    pending.pressHoldTimer.clear();
    for (const off of pending.listeners) {
      off();
    }

    // Compiled before the session starts, so the source rect is measured before
    // `[data-dragging]` styles can restyle what custom modifiers read.
    const modifiers = createDragModifiersState(
      parameters.modifiers,
      dragSource,
      { x: lastInput.clientX, y: lastInput.clientY },
      lastInput,
    );
    if (state.pending !== pending) {
      return;
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
    // pending state is left to clean up here.
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
      onForceCleanup: clearActive,
      sensor: {
        getRawInput: getRawActivePointerInput,
        notifyScroll: notifyExternalScroll,
        cancel: () => cancelActive(),
      },
      isPickupCurrent: () => state.pending === pending,
    });

    if (!result) {
      // The lifecycle refused (a drag is already running), or consumer code ended
      // the pickup while its preview was built.
      if (state.pending === pending) {
        clearPending(true);
      }
      return;
    }

    state.pending = null;

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
      lastPointerEvent: pending.heldPointer
        ? pending.lastNativeEvent
        : (state.lastPointerDown ?? pending.lastNativeEvent),
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
      return;
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
        // detached-target case as `startContextMenuSuppression`. The source element
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
  } catch (error) {
    // A throw before the handoff leaves the pending phase to undo, which
    // `clearPending` does, including the resources the active phase would have
    // inherited and this gesture's contextmenu suppression. Every step is
    // idempotent, so running it after the pending listeners were removed is safe.
    // After the handoff, or once a callback replaced this gesture, `state.pending`
    // no longer points at it and the error only propagates.
    if (state.pending === pending) {
      clearPending(true);
    }
    throw error;
  }
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
  // See `onPendingPointerUp` for the `buttons` fallback.
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
  const controller = active.controller;
  const preview = active.preview;
  // A preview settles into place after the drop, and the source keeps
  // `[data-dragging]` until it has. A drag without a preview element takes
  // `[data-dragging]` with it when destroyed. Destroy that one only after the
  // drop, so a rule that resizes or hides the source still applies while drop
  // handlers measure local points against the layout under the pointer.
  const destroyAfterDrop = preview.getPreviewElement() === null;
  // A clean release frees the contextmenu suppression (see `clearActive`). The
  // pointer is already up, so the drag's click is imminent. A double-click
  // session holds no pointer, so `clearActive` arms nothing for it. As in
  // `cancelActive`, the lifecycle must end even if the sensor teardown throws,
  // or no drag can start again.
  preview.prepareForDrop();
  try {
    clearActive(true, 'released', !destroyAfterDrop);
  } finally {
    try {
      controller.drop(input, target, pointerEvent);
    } finally {
      if (destroyAfterDrop) {
        preview.destroy();
      }
    }
  }
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
  // `commitActivation` moves capture to the body anchor with `setPointerCapture`.
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

export function resetForTests(): void {
  clearPending();
  // Skip click suppression so the reset leaves no `click` listener armed for the
  // next test.
  clearActive(false, 'none');
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

interface PendingSession {
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

interface ActiveSession {
  element: HTMLElement;
  /** The body anchor that holds the gesture's pointer capture, never the dragged element. */
  captureTarget: Element;
  pointerId: number;
  /** See `PendingSession.heldPointer`. */
  heldPointer: boolean;
  controller: DragSessionController;
  preview: SyntheticPreviewHandle;
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
