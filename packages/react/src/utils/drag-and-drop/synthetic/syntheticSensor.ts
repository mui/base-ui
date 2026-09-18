/**
 * The pointer-events sensor. Activates drags from mouse, touch and pen input
 * rather than the native HTML5 Drag and Drop API, which can't be made to work
 * uniformly across desktop and tablets. The lifecycle itself (target
 * resolution, consumer dispatch) lives in `core/lifecycleManager.ts`.
 */

import { NOOP } from '@base-ui/utils/empty';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { contains, getTarget } from '@base-ui/utils/shadowDom';
import { WindowAnimationFrame } from '../../windowAnimationFrame';
import { WindowTimeout } from '../../windowTimeout';
import { createChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import {
  evaluateActivation,
  getActivationDelayMs,
  hasDoubleClickActivation,
  resolveActivation,
  type DragActivation,
} from '../activation';
import {
  canStart as canStartLifecycle,
  type DragSessionController,
} from '../core/lifecycleManager';
import { createPreviewAndStartSession, type PreviewSessionHandle } from '../core/sensorSession';
import type { SyntheticPreviewHandle } from './syntheticPreview';
import { clearActivePreviewHandle } from '../activePreview';
import * as dragRootLock from './dragRootLock';
import * as dragCursor from './dragCursor';
import { suppressNextClick } from './postDragClick';
import { getSharedSlot } from '../sharedState';
import { setActivePointerAccessors } from '../activePointer';
import { createEventRootBinding, type DragEventRoot } from '../documentBinding';
import type { DraggableConfig } from '../draggable';
import { getRegistration, resolveDragHandle, resolveDraggablePickup } from '../draggableRegistry';
import { hasInteractiveAncestorWithin } from '../interactiveElement';
import {
  getDropTargetShadowRoots,
  getDropTargetShadowRootsByHost,
  subscribeDropTargetShadowRoots,
} from '../dropTarget';
import type {
  BeforeMoveStartEventDetails,
  DragCanceledReason,
  DragCleanupFn,
  DragHandle,
  DragInput,
  DragMoveReason,
  DragPointerType,
} from '../../../types/drag';
import {
  modifyDragPoint,
  createDragModifiersState,
  type DragModifiersState,
} from '../dragModifiers';
import {
  deepElementFromPoint,
  elementFromPointIgnoring,
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
  /** At most one of `pending` / `active` is non-null at any time. */
  pending: PendingSession | null;
  active: ActiveSession | null;
  /** The first tap of a possible touch/pen double-tap (see `recordTap`). */
  lastTap: TapRecord | null;
  /** The pointer type of the last `pointerdown` anywhere (see `onDoubleClick`). */
  lastPointerDownType: DragPointerType | null;
  cleanupContextMenuSuppression: DragCleanupFn | null;
  /** Lets terminal handlers run intentional `.click()` calls before suppression. */
  terminalCallbacksRunning: boolean;
}

const state = getSharedSlot<SyntheticDragState>('syntheticDrag', () => ({
  pending: null,
  active: null,
  lastTap: null,
  lastPointerDownType: null,
  cleanupContextMenuSuppression: null,
  terminalCallbacksRunning: false,
}));
const handledPointerDownEvents = getSharedSlot<WeakSet<Event>>(
  'syntheticDrag.handledPointerDownEvents',
  () => new WeakSet<Event>(),
);
const CONTEXT_MENU_SUPPRESSION_MS = 1500;

setActivePointerAccessors({
  getInput: getRawActivePointerInput,
  getHitElement: getActiveHitElement,
  notifyScroll: notifyExternalScroll,
});

/**
 * The double-tap window for touch and pen `double-click` activation: the second
 * `pointerdown` must land this soon after the first, and this close to it.
 * Touch and pen have no `dblclick` to lean on — browsers synthesize it
 * inconsistently for a double-tap, if at all — so the sensor pairs the taps.
 */
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_TOLERANCE_PX = 25;

/** Cursor pinned across the document during a pointer drag (see `dragCursor`). */
const DEFAULT_DRAG_CURSOR = 'grabbing';

/**
 * Per-document-or-shadow-root `pointerdown` listener that starts a pointer
 * gesture, ref-counted across draggables. Binding inside the actual shadow root
 * preserves the internal target even when a closed root retargets the event at
 * its host for outside listeners.
 */
const documentBinding = createEventRootBinding({
  slot: 'syntheticDrag.documentBindings',
  shadowRootsSlot: 'syntheticDrag.boundShadowRoots',
  type: 'pointerdown',
  listener: onPointerDown,
  options: { passive: false },
});

const doubleClickBinding = createEventRootBinding({
  slot: 'syntheticDrag.doubleClickBindings',
  shadowRootsSlot: 'syntheticDrag.boundDoubleClickShadowRoots',
  type: 'dblclick',
  listener: onDoubleClick,
});

export function bindPointerListeners(root: DragEventRoot): void {
  documentBinding.bind(root);
  doubleClickBinding.bind(root);
}

export function unbindPointerListeners(root: DragEventRoot): void {
  documentBinding.unbind(root);
  doubleClickBinding.unbind(root);
}

function suppressNativeDragForSyntheticPointer(
  element: HTMLElement,
  pointerId: number,
  win: Window,
): DragCleanupFn {
  const previousDraggable = element.getAttribute('draggable');
  const cleanupListeners: DragCleanupFn[] = [];

  const restore = onceCleanup(() => {
    for (const off of cleanupListeners) {
      off();
    }
    // Restore unconditionally: even if the element was unregistered mid-gesture,
    // it still carries the `draggable="false"` we forced on it. Skipping the
    // restore would strand a node whose original `draggable="true"` never comes
    // back.
    if (previousDraggable == null) {
      element.removeAttribute('draggable');
    } else {
      element.setAttribute('draggable', previousDraggable);
    }
  });

  const restoreForPointer = (event: Event) => {
    const pointerEvent = event as PointerEvent;
    if (pointerEvent.pointerId === pointerId) {
      restore();
    }
  };

  // Block the native HTML drag some browsers start from a long-press touch/pen
  // while this synthetic gesture is alive.
  element.setAttribute('draggable', 'false');
  cleanupListeners.push(
    addEventListener(win, 'pointerup', restoreForPointer, { capture: true }),
    addEventListener(win, 'pointercancel', restoreForPointer, { capture: true }),
    addEventListener(win, 'blur', restore),
  );

  return restore;
}

/**
 * Tear down the pending (pre-activation) phase. `releaseContextMenuSuppression`
 * is set by the paths where the gesture ends with the finger deliberately lifted
 * or the pickup consumed (clean `pointerup`, a chorded release, a refused or
 * failed activation commit): none of those can precede a browser-synthesized
 * `contextmenu`, so the touch/pen suppression armed in the pending phase should
 * be released. Left armed, a quick tap would swallow a deliberate long-press
 * `contextmenu` fired within the next 1.5s.
 * A browser *cancellation* (`pointercancel`/blur) keeps it armed: on Android a
 * long-press fires `pointercancel` and *then* the `contextmenu` we must suppress.
 */
function clearPending(releaseContextMenuSuppression: boolean = false): void {
  const pending = state.pending;
  if (!pending) {
    return;
  }
  // Null the singleton first, for the reason `clearActive` spells out: every step
  // below can throw on a dead realm — this is what the detached-document recovery
  // in `onPointerDown` calls, and `removeEventListener` on a dead `Window` raises
  // — and a `state.pending` left set would make every later `pointerdown` re-enter
  // this same teardown and throw again, so no drag could ever start.
  state.pending = null;
  runAllCleanups([
    pending.pressHoldTimer.clear,
    ...pending.listeners,
    // Touch implicitly captures the pointerdown target.
    () => releasePointerCaptureSafely(pending.target, pending.pointerId),
    pending.restoreNativeDrag,
    pending.touchMoveAnchor,
    ...(releaseContextMenuSuppression && pending.contextMenuSuppression
      ? [pending.contextMenuSuppression]
      : []),
  ]);
}

/**
 * Where the pointer stands when the active phase is torn down, which decides how
 * the drag's compatibility click is suppressed:
 *
 * - `released` — the pointer is already up, so the click (if any) is imminent.
 * - `held` — the button is still down (an Escape cancel, a blur), so the click
 *   only arrives whenever the user lets go.
 * - `none` — no click of ours is coming, and arming would eat someone else's.
 */
type PointerAtTeardown = 'released' | 'held' | 'none';

/**
 * Tear down the active phase. Like {@link clearPending}, the contextmenu
 * suppression armed at pointerdown is only released on a clean drop: a browser
 * cancellation (`pointercancel`/blur) keeps it armed, because on Android a
 * long-press fires `pointercancel` and *then* the `contextmenu` that must stay
 * suppressed (the 1.5s timer self-heals it).
 */
function clearActive(
  releaseContextMenuSuppression: boolean = false,
  pointerAtTeardown: PointerAtTeardown = 'held',
): void {
  const active = state.active;
  if (!active) {
    return;
  }
  // Null the singleton first so a throw during teardown can't leave
  // `active != null` (which would hold `dragRootLock` and no-op all future drags).
  const session = active;
  state.active = null;
  clearActivePreviewHandle(session.preview);

  // The gesture reached the active phase, so the compatibility click that
  // follows the release is the drag's, not a click the user meant.
  if (pointerAtTeardown !== 'none' && session.heldPointer) {
    suppressNextClick(
      session.element,
      pointerAtTeardown === 'held' ? session.pointerId : undefined,
      () => state.terminalCallbacksRunning,
    );
  }

  try {
    runAllCleanups([
      session.rafFrame.cancel,
      ...session.listeners,
      () => releasePointerCaptureSafely(session.captureTarget, session.pointerId),
      () => session.preview.destroy(),
      session.restoreNativeDrag,
      session.touchMoveAnchor,
    ]);
  } finally {
    if (releaseContextMenuSuppression) {
      // Release only the suppression *this* gesture armed (see clearPending).
      session.contextMenuSuppression?.();
    }
    // Idempotent: a no-op when the lock was skipped (touch) or already released.
    dragCursor.unlock();
    dragRootLock.unlock();
  }
}

/**
 * Run a pointer-capture operation, swallowing the `DOMException`
 * (`InvalidStateError`/`NotFoundError`) it throws when the pointer is no longer
 * active or capture was already released by the OS or a sibling listener.
 * Matched against the element's own realm so a draggable inside an
 * iframe/popout (whose `DOMException` differs from this realm's) is still
 * handled; anything else rethrows.
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
 * Where the pointer stands for each cancel cause. Total rather than partial with
 * a fallback: `held` arms a window-capture click swallow for up to five seconds,
 * so a new {@link DragCanceledReason} must state its answer rather than inherit
 * that by default.
 */
const POINTER_AT_CANCEL: Record<DragCanceledReason, PointerAtTeardown> = {
  // The button demonstrably came up — that is what this cancel detected.
  'missed-release': 'released',
  // A canceled pointer never produces a compatibility click.
  'pointer-canceled': 'none',
  // Torn down from *another* gesture's `pointerdown` (see `onPointerDown`), and
  // in a dead realm `ownerWindow` falls back to the top-level window — so
  // arming here would swallow the click belonging to the press that triggered
  // this cleanup, on the wrong document.
  'document-detached': 'none',
  // The rest interrupt a gesture whose button is still down.
  'escape-key': 'held',
  'tab-key': 'held',
  'imperative-action': 'held',
  'window-blur': 'held',
  'page-hidden': 'held',
  'capture-lost': 'held',
  'handler-error': 'held',
};

function cancelActive(
  input?: DragInput,
  reason: DragCanceledReason = 'imperative-action',
  event?: Event,
): void {
  const active = state.active;
  if (!active) {
    return;
  }
  const controller = active.controller;
  // `clearActive` is not throw-proof: `releasePointerCaptureSafely` only swallows
  // DOMExceptions matched against the element's own realm, and that lookup falls
  // back to the top-level window once the realm is dead. A throw that skipped the
  // cancel would leave the lifecycle active forever — `canStart()` false for the
  // rest of the page's life — so the lifecycle is ended either way. `tearDown` is
  // idempotent, so this is safe even when `clearActive` already forced it.
  state.terminalCallbacksRunning = true;
  try {
    try {
      clearActive(false, POINTER_AT_CANCEL[reason]);
    } finally {
      controller.cancel(input, reason, event);
    }
  } finally {
    state.terminalCallbacksRunning = false;
  }
}

/**
 * Programmatically cancel an in-progress pointer drag (fires `onMoveEnd` with
 * `canceled: true`). No-op when this sensor has no active session. Backs
 * `engine.cancelDrag()`.
 */
export function cancelActiveDrag(): void {
  // Abandon an armed pre-activation candidate too: a consumer cancelling (say,
  // a dialog opening on `pointerdown`) must not have the gesture activate a
  // drag on the next move anyway.
  clearPending();
  cancelActive();
}

/**
 * Whether the press landed in `element`'s own scrollbar gutter rather than on its
 * content.
 *
 * Only classic (space-taking) scrollbars are detectable this way, which is also
 * the only case that needs handling: an overlay scrollbar takes no layout space,
 * so the padding box already covers the whole content area and the tests below
 * are inert for it.
 */
function isScrollbarPress(event: MouseEvent, element: Element): boolean {
  const win = ownerWindow(element);
  if (!(element instanceof win.HTMLElement)) {
    return false;
  }
  // An element with no scrollable overflow has no gutter at all, and the offsets
  // below would be measuring its borders instead — a press on the border of a
  // draggable is an ordinary press and must still pick it up. The extents are
  // tested before the computed overflow: this runs on every press on a draggable,
  // and almost none of them overflow, so the style resolution is skipped for them.
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
  // Derived from the rect rather than read off `event.offsetX`/`offsetY`: those
  // are relative to `event.target`, and this listener is bound to the window, so
  // for anything inside a shadow tree `target` is the retargeted *host* while
  // `element` is the composed node the gutter belongs to — measuring one against
  // the other's box. `clientLeft`/`clientTop` are the top/left border widths, so
  // this lands at the padding edge either way.
  const rect = element.getBoundingClientRect();
  const scaleX = element.offsetWidth > 0 ? rect.width / element.offsetWidth : 1;
  const scaleY = element.offsetHeight > 0 ? rect.height / element.offsetHeight : 1;
  const offsetX = (event.clientX - rect.left) / scaleX - element.clientLeft;
  const offsetY = (event.clientY - rect.top) / scaleY - element.clientTop;
  // The gutter sits past the padding box on the trailing side, and before it on
  // the leading side — RTL puts the vertical scrollbar on the left. Only the side
  // the scrollbar is actually on is tested: the opposite side of the padding box
  // is the element's own border, and a press there is an ordinary press that must
  // still pick the draggable up. A horizontal scrollbar is always at the bottom in
  // horizontal writing modes, so the top border is never a gutter.
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

function onPointerDown(event: Event): void {
  if (handledPointerDownEvents.has(event)) {
    return;
  }
  handledPointerDownEvents.add(event);
  const pointerEvent = event as PointerEvent;
  const pointerType = normalizePointerType(pointerEvent.pointerType);
  // Read by `onDoubleClick` for a `dblclick` that carries no `pointerType`.
  state.lastPointerDownType = pointerType;

  if (!recoverDetachedSession(event)) {
    return;
  }

  // Reject only when neither signal indicates the primary button: a touch
  // primary press reports `button === 0` and `buttons === 1`, but accept either
  // alone to be robust against browser quirks.
  if (pointerEvent.button !== 0 && pointerEvent.buttons !== 1) {
    return;
  }

  const pickup = resolveDraggablePickup(getTarget(pointerEvent));
  if (!pickup) {
    return;
  }
  const { element, target, parameters, dragHandle } = pickup;
  const handle = dragHandle ?? element;

  const initialInput = getInput(pointerEvent);

  // A disabled draggable never arms the pending phase, so the press behaves like
  // an ordinary click: no contextmenu suppression, and a natively-draggable
  // descendant (`<img>`, `<a href>`) keeps its native HTML5 drag. A *dynamic*
  // veto belongs in `onBeforeMoveStart`, dispatched at activation commit.
  if (parameters.disabled) {
    return;
  }

  // A control nested inside the draggable owns its own press. Without it, pressing an inline rename
  // input and moving to select text crosses the activation threshold and the drag
  // `preventDefault()`s the selection away.
  if (hasInteractiveAncestorWithin(target, handle)) {
    return;
  }

  // Same rule, for the one "control" that isn't an element: a classic scrollbar
  // is part of its element's box and hit-tests to that element, so a press on the
  // scrollbar of a list nested inside a draggable walks up to the draggable and
  // arms the gesture — and the default mouse activation commits after 5px of
  // thumb travel, picking up the whole card the user was only trying to scroll.
  if (isScrollbarPress(pointerEvent, target)) {
    return;
  }

  if (!canStartLifecycle()) {
    return;
  }

  let activation = resolveActivation(parameters.activation, pointerType);
  let activationKind: PendingSession['activationKind'] = 'pointer';
  // Touch and pen double-tap: the second tap on the same source picks it up
  // while the pointer is still down, and the release drops it. Mouse keeps the
  // native `dblclick` (see `onDoubleClick`), which follows the pointer with no
  // button held instead.
  if (pointerType !== 'mouse' && hasDoubleClickActivation(parameters.activation, pointerType)) {
    if (isSecondTap(element, pointerEvent, pointerType)) {
      clearLastTap();
      activation = [{ type: 'immediate' }];
      activationKind = 'double-click';
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
  // Only touch/pen long-presses can emit a stray `contextmenu` after the gesture
  // ends; arming this post-gesture safety net for mouse would suppress a
  // legitimate right-click soon after a left-click that never became a drag.
  let contextMenuSuppression: DragCleanupFn | null = null;
  if (pointerType !== 'mouse') {
    contextMenuSuppression = startContextMenuSuppression(win, target);
  }
  const restoreNativeDrag = suppressNativeDragForSyntheticPointer(
    element,
    pointerEvent.pointerId,
    win,
  );

  // The pending phase stays scroll-friendly: a touch/pen swipe can become native
  // scroll and cancel the candidate (via `pointercancel`) before activation.

  const pendingRef: PendingSession = {
    element,
    target,
    pointerId: pointerEvent.pointerId,
    pointerType,
    activation,
    activationKind,
    heldPointer: true,
    originX: pointerEvent.clientX,
    originY: pointerEvent.clientY,
    lastInput: initialInput,
    lastNativeEvent: pointerEvent,
    startedAt: pointerEvent.timeStamp,
    listeners: [],
    pressHoldTimer: new WindowTimeout(win),
    restoreNativeDrag,
    contextMenuSuppression,
    // iOS Safari quirk: a `{ passive: false }` `touchmove` listener must exist
    // before the gesture would need to `preventDefault()` scroll, or the active
    // phase's `touchmove` guard can't cancel it. Held outside the pending
    // listener set, because the active phase installs its guard on the
    // *document* at commit — registering that late is the very thing the quirk
    // punishes — so this window anchor has to outlive the pending phase and is
    // released only when the whole gesture ends.
    touchMoveAnchor: addEventListener(win, 'touchmove', NOOP, { passive: false }),
  };
  state.pending = pendingRef;

  pendingRef.listeners.push(
    addEventListener(win, 'pointermove', onPendingPointerMove, { capture: true }),
    addEventListener(win, 'pointerup', onPendingPointerUp, { capture: true }),
    addEventListener(win, 'pointercancel', onPendingPointerCancel, { capture: true }),
    // Suppress native HTML5 drags a natively-draggable descendant (`<img>`,
    // `<a href>`) would otherwise start from the same press.
    addEventListener(win, 'dragstart', preventNativeDragStart, { capture: true }),
    // Escape during the pending press-hold abandons the candidate before it
    // activates (the active phase has its own Escape handler).
    addEventListener(win, 'keydown', onPendingKeyDown, { capture: true }),
    // If the window blurs or the tab is hidden (app switch, soft keyboard,
    // overlay) before the press-hold timer fires, abandon the candidate so a
    // real drag never commits while the page is backgrounded.
    addEventListener(win, 'blur', onPendingBlur),
    addEventListener(ownerDocument(element), 'visibilitychange', onPendingVisibilityChange),
  );
  if (pointerType !== 'mouse') {
    // The post-cancellation safety net removes itself after one menu. Keep this
    // phase listener until the pending gesture ends so an early `contextmenu`
    // cannot leave the rest of a still-held touch/pen gesture unguarded.
    pendingRef.listeners.push(
      addEventListener(win, 'contextmenu', preventContextMenu, { capture: true }),
    );
  }

  evaluatePendingActivation(
    pendingRef.lastInput.clientX,
    pendingRef.lastInput.clientY,
    pendingRef.startedAt,
  );
}

/**
 * Whether a new gesture may start. A gesture whose document lost its browsing
 * context (its iframe removed, its popout closed) can never end on its own —
 * every terminating listener lived in the dead realm — and would wedge the whole
 * engine shut. Detect it at the next gesture anywhere, cancel the dead session,
 * and let the new pickup proceed. Any live session still blocks.
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
    cancelActive(undefined, 'document-detached', event);
  }
  return !state.pending && !state.active;
}

/** Double-click pickup follows the mouse until a subsequent primary click. */
function onDoubleClick(event: Event): void {
  if (handledPointerDownEvents.has(event)) {
    return;
  }
  handledPointerDownEvents.add(event);
  const mouseEvent = event as MouseEvent;
  if (mouseEvent.button !== 0 || mouseEvent.detail !== 2) {
    return;
  }
  // Touch and pen pick up through the double-tap path in `onPointerDown`. A
  // `dblclick` a browser synthesizes from a double-tap must not open a session
  // that follows the mouse: no touch could move or drop it. Firefox's `dblclick`
  // carries no `pointerType`, so fall back to the press that produced it.
  const pointerType =
    'pointerType' in mouseEvent
      ? normalizePointerType((mouseEvent as PointerEvent).pointerType)
      : (state.lastPointerDownType ?? 'mouse');
  if (pointerType !== 'mouse') {
    return;
  }
  if (!recoverDetachedSession(event) || !canStartLifecycle()) {
    return;
  }
  const pickup = resolveDraggablePickup(getTarget(mouseEvent));
  if (
    !pickup ||
    pickup.parameters.disabled ||
    !hasDoubleClickActivation(pickup.parameters.activation, 'mouse')
  ) {
    return;
  }
  if (hasInteractiveAncestorWithin(pickup.target, pickup.dragHandle ?? pickup.element)) {
    return;
  }
  if (isScrollbarPress(mouseEvent, pickup.target)) {
    return;
  }
  const input = getInput(mouseEvent);
  // A session with no pointer of its own: `pointerId` never matches a real
  // pointer, and the empty `activation` list is never evaluated because the
  // activation commits right below.
  state.pending = {
    element: pickup.element,
    target: pickup.target,
    pointerId: -1,
    pointerType: 'mouse',
    activation: [],
    activationKind: 'double-click',
    heldPointer: false,
    originX: input.clientX,
    originY: input.clientY,
    lastInput: input,
    lastNativeEvent: mouseEvent,
    startedAt: mouseEvent.timeStamp,
    listeners: [],
    pressHoldTimer: new WindowTimeout(ownerWindow(pickup.element)),
    restoreNativeDrag: NOOP,
    contextMenuSuppression: null,
    touchMoveAnchor: NOOP,
  };
  commitActivation();
  if (state.active) {
    mouseEvent.preventDefault();
  }
}

/**
 * Remember a touch/pen press on a double-tap-enabled source as the first half of
 * a double-tap. The release confirms it: a `pointercancel` (native scroll took
 * the gesture) or a release far from the press is a swipe, not a tap.
 */
function recordTap(element: HTMLElement, pointerEvent: PointerEvent, pointerType: DragPointerType) {
  clearLastTap();
  const win = ownerWindow(element);
  const tap: TapRecord = {
    element,
    pointerId: pointerEvent.pointerId,
    pointerType,
    clientX: pointerEvent.clientX,
    clientY: pointerEvent.clientY,
    timeStamp: pointerEvent.timeStamp,
    released: false,
    cleanup: NOOP,
  };
  const onUp = (event: Event) => {
    const up = event as PointerEvent;
    if (up.pointerId !== tap.pointerId) {
      return;
    }
    tap.cleanup();
    tap.cleanup = NOOP;
    if (!isWithinTapTolerance(tap, up)) {
      if (state.lastTap === tap) {
        state.lastTap = null;
      }
      return;
    }
    tap.released = true;
  };
  const onCancel = (event: Event) => {
    if ((event as PointerEvent).pointerId === tap.pointerId && state.lastTap === tap) {
      clearLastTap();
    }
  };
  const cleanups = [
    addEventListener(win, 'pointerup', onUp, { capture: true }),
    addEventListener(win, 'pointercancel', onCancel, { capture: true }),
  ];
  tap.cleanup = () => runAllCleanups(cleanups);
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
  pointerType: DragPointerType,
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

function preventContextMenu(event: Event): void {
  // Only once a drag is actually running. Mouse activation is distance-based, so
  // a primary button resting on a draggable keeps a gesture `pending`
  // indefinitely — suppressing on that swallowed right-click document-wide for
  // as long as the button was held. Touch and pen still need the pending-phase
  // suppression, because their press-hold *is* the gesture the OS would answer
  // with a context menu, and that arrives before activation.
  if (state.active) {
    event.preventDefault();
    return;
  }
  if (state.pending && state.pending.pointerType !== 'mouse') {
    event.preventDefault();
  }
}

/**
 * Block the native HTML5 drag a natively-draggable descendant (`<img>`,
 * `<a href>`) starts from the same press that armed this synthetic gesture.
 * Setting `draggable="false"` on the source element doesn't cover a nested
 * `<img>`/`<a>`, so cancel the `dragstart` outright while a gesture is alive.
 */
function preventNativeDragStart(event: Event): void {
  if (state.pending || state.active) {
    event.preventDefault();
  }
}

function onPendingKeyDown(event: Event): void {
  const keyEvent = event as KeyboardEvent;
  if (state.pending && keyEvent.key === 'Escape') {
    clearPending();
  }
}

function startContextMenuSuppression(win: Window, target: Element): DragCleanupFn {
  state.cleanupContextMenuSuppression?.();

  // Window capture covers the normal connected event path. The Pointer Events
  // `contextmenu` targeting algorithm nevertheless preserves the causal event's
  // target, including after `lostpointercapture`, so retain the exact press
  // target too: a live reorder can detach it before Android delivers the menu,
  // at which point its event path no longer reaches `window`. The draggable and
  // handle need no listeners of their own: at pointerdown they contain `target`,
  // while after detachment only a listener on the preserved target is reliable.
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
    addEventListener(win, 'contextmenu', onContextMenu, { capture: true }),
    addEventListener(target, 'contextmenu', onContextMenu, { capture: true }),
  );

  state.cleanupContextMenuSuppression = cleanup;
  timeout.start(CONTEXT_MENU_SUPPRESSION_MS, cleanup);
  return cleanup;
}

function evaluatePendingActivation(clientX: number, clientY: number, now: number): void {
  const pending = state.pending;
  if (!pending) {
    return;
  }
  const elapsed = now - pending.startedAt;
  const origin = { x: pending.originX, y: pending.originY };
  const current = { x: clientX, y: clientY };
  // One pass: each activation's verdict both prunes the list (once a hold
  // exceeds its tolerance it cannot recover by moving back) and decides.
  let activate = false;
  const remaining: DragActivation[] = [];
  for (const activation of pending.activation) {
    const decision = evaluateActivation(activation, origin, current, elapsed);
    if (decision === 'activate') {
      activate = true;
    }
    if (decision !== 'cancel') {
      remaining.push(activation);
    }
  }
  const pruned = remaining.length !== pending.activation.length;
  pending.activation = remaining;
  if (activate) {
    commitActivation();
  } else if (remaining.length === 0) {
    clearPending();
  } else if (pruned || !pending.pressHoldTimer.isStarted) {
    // A running hold timer already fires at the right deadline and re-evaluates
    // with the pointer's latest position then; only re-arm when the list
    // changed (a shorter delay may now be the earliest) or nothing is armed yet.
    const delay = getActivationDelayMs(pending.activation);
    pending.pressHoldTimer.clear();
    if (delay !== null) {
      pending.pressHoldTimer.start(Math.max(0, delay - elapsed), () => {
        if (state.pending === pending) {
          evaluatePendingActivation(
            pending.lastInput.clientX,
            pending.lastInput.clientY,
            pending.startedAt + delay,
          );
        }
      });
    }
  }
}

function onPendingPointerMove(event: Event): void {
  const pointerEvent = event as PointerEvent;
  const pending = state.pending;
  if (!pending || pointerEvent.pointerId !== pending.pointerId) {
    return;
  }
  // Missed-release safety net (mirrors the active phase): `buttons === 0` means
  // the button came up without a terminating event reaching us; abandon the
  // candidate rather than let it linger or activate.
  if (pointerEvent.buttons === 0) {
    clearPending();
    return;
  }
  // Chorded release: releasing the primary button while another is still held
  // fires `pointermove` (a buttons change), not `pointerup` — the eventual
  // `pointerup` carries the *last* button and is ignored above. Without this,
  // the candidate lingers armed (blocking every future pointerdown) until a
  // move with `buttons === 0` finally clears it.
  if (pointerEvent.buttons % 2 === 0) {
    clearPending(true);
    return;
  }
  pending.lastInput = getInput(pointerEvent);
  pending.lastNativeEvent = pointerEvent;
  evaluatePendingActivation(pointerEvent.clientX, pointerEvent.clientY, pointerEvent.timeStamp);
}

function onPendingPointerUp(event: Event): void {
  const pointerEvent = event as PointerEvent;
  const pending = state.pending;
  if (!pending || pointerEvent.pointerId !== pending.pointerId) {
    return;
  }
  // Safari can misreport `button` on a quick release. Ignore a non-primary
  // release only while `buttons` confirms that the primary is still held.
  if (pointerEvent.button !== 0 && pointerEvent.buttons % 2 !== 0) {
    return;
  }
  // Clean release with no drag: release the contextmenu suppression (see clearPending).
  clearPending(true);
}

function onPendingPointerCancel(event: Event): void {
  const pointerEvent = event as PointerEvent;
  const pending = state.pending;
  if (!pending || pointerEvent.pointerId !== pending.pointerId) {
    return;
  }
  clearPending();
}

function onPendingBlur(): void {
  if (state.pending) {
    clearPending();
  }
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
  const { element, target, pointerId, pointerType, lastInput, restoreNativeDrag } = pending;
  const { contextMenuSuppression } = pending;
  const lastX = lastInput.clientX;
  const lastY = lastInput.clientY;
  const getParameters = getRegistration(element);
  if (!getParameters) {
    clearPending(true);
    return;
  }
  let parameters: DraggableConfig<any> & { pointerDragHandle?: DragHandle | undefined };
  try {
    parameters = getParameters();
  } catch (error) {
    clearPending(true);
    throw error;
  }

  if (state.pending !== pending) {
    return;
  }
  // Re-check `disabled` at commit: it may have flipped during the press.
  if (parameters.disabled) {
    clearPending(true);
    return;
  }

  // Re-check the lifecycle in case another pointer started a drag during the
  // pending window. Avoid running callbacks and building a preview for a session
  // the lifecycle would refuse.
  if (!canStartLifecycle()) {
    clearPending(true);
    return;
  }

  const dragHandle = resolveDragHandle(parameters);

  // Re-check the handle gate at commit, like `disabled` above: the draggable may
  // have swapped its handle during the press, and the press that armed this
  // gesture was never on the handle that now governs it.
  if (dragHandle && !contains(dragHandle, target)) {
    clearPending(true);
    return;
  }

  if (state.pending !== pending) {
    return;
  }
  const pointerNode = dragHandle ?? element;
  if (hasInteractiveAncestorWithin(target, pointerNode)) {
    clearPending(true);
    return;
  }

  // Let the consumer veto the drag as it is about to start. Dispatched before
  // any resource is allocated, so canceling leaves nothing to undo beyond the
  // pending phase itself — nothing has lifted yet.
  if (parameters.onBeforeMoveStart) {
    const eventDetails = createChangeEventDetails<
      string,
      Pick<BeforeMoveStartEventDetails, 'reason' | 'event'>
    >(pending.activationKind, pending.lastNativeEvent, target, {
      reason: pending.activationKind,
      event: pending.lastNativeEvent,
    }) as BeforeMoveStartEventDetails;
    try {
      parameters.onBeforeMoveStart({ input: lastInput, element, dragHandle }, eventDetails);
    } catch (error) {
      // A throwing consumer handler must not leave the pending phase armed.
      clearPending(true);
      throw error;
    }
    // Imperative cancellation or blur can clear the candidate inside the callback.
    if (state.pending !== pending) {
      return;
    }
    if (eventDetails.isCanceled) {
      clearPending(true);
      return;
    }
  }

  // Tear down the pending listeners and timer up-front: pointer events that
  // arrive between here and the active phase are no longer pending events.
  pending.pressHoldTimer.clear();
  for (const off of pending.listeners) {
    off();
  }

  // Compiled before the session starts, so the source rect is measured before
  // `[data-dragging]` styles can restyle what custom modifiers read.
  const modifiers = createDragModifiersState(
    parameters.modifiers,
    element,
    { x: lastX, y: lastY },
    { keys: lastInput },
  );
  if (state.pending !== pending) {
    return;
  }
  // Start at the constrained point, so the initial target, the session's first
  // input, and the preview seed all agree with what the first frame resolves.
  const startInput = modifiers ? remapInput(lastInput, modifiers.initialPoint) : lastInput;

  // Resolve initial drop target via elementFromPoint — the raw pointerdown
  // target may have been a child of the draggable that isn't a drop target.
  const doc = ownerDocument(element);
  const initialTarget = deepElementFromPoint(
    doc,
    startInput.clientX,
    startInput.clientY,
    getDropTargetShadowRootsByHost(),
  );

  // The shared bootstrap allocates preview + lock + lifecycle and undoes them
  // itself on a throw or a lifecycle refusal, so only the pending-phase state
  // is left to clean up here.
  let result: PreviewSessionHandle | null;
  try {
    result = createPreviewAndStartSession({
      draggableParameters: parameters,
      element,
      dragHandle,
      initialInput: startInput,
      // The `pointermove` that crossed the activation threshold.
      initialEvent: pending.lastNativeEvent,
      startReason: pending.activationKind,
      // The press, not the committed input: the grab offset must reflect where
      // the user took hold, and the activation threshold sits between the two.
      pressPoint: { x: pending.originX, y: pending.originY },
      initialTarget,
      onForceCleanup: clearActive,
      isPickupCurrent: () => state.pending === pending,
      acquire: () => dragRootLock.lock(element),
      release: () => dragRootLock.unlock(),
    });
  } catch (error) {
    // A commit that never reached the active phase leaves the whole pending
    // phase to undo, which is exactly `clearPending` — including the
    // `{ passive: false }` touchmove anchor the active phase would have
    // inherited, and this gesture's own contextmenu suppression. Re-running it
    // after the drain above is safe: every step is idempotent, and keeping the
    // resource list in one place is what stops the two from drifting apart.
    clearPending(true);
    throw error;
  }

  if (!result) {
    // The lifecycle refused (a drag is already running).
    clearPending(true);
    return;
  }

  state.pending = null;

  const { session, preview } = result;

  // Anchor pointer capture on a node that never unmounts (see the listener block below).
  const captureTarget: Element = doc.body ?? doc.documentElement;
  const win = ownerWindow(element);

  const activeRef: ActiveSession = {
    element,
    // Seeded from the activation hit test, so the first frame's auto-scroll has
    // an anchor before `onActiveFrame` has run.
    lastHitElement: initialTarget,
    captureTarget,
    pointerId,
    pointerType,
    activationKind: pending.activationKind,
    heldPointer: pending.heldPointer,
    controller: session.controller,
    preview,
    lastInput,
    lastNativeEvent: pending.lastNativeEvent,
    lastMoveReason: 'pointer',
    modifiers,
    // Resolve once on the first active frame: confirms the entered target and
    // emits the initial `onMove`. Cleared immediately after, so every later
    // stationary frame is gated.
    movedSinceFrame: true,
    scrolledSinceFrame: false,
    rafFrame: new WindowAnimationFrame(win),
    terminalFrameQueued: false,
    listeners: [],
    restoreNativeDrag,
    contextMenuSuppression,
    touchMoveAnchor: pending.touchMoveAnchor,
  };
  state.active = activeRef;

  // A start callback can remove the source iframe after the pending blur
  // listener has gone but before the active listeners below exist. End the
  // lifecycle now instead of waiting for a future pointerdown to discover the
  // dead document.
  if (isDetachedDocument(doc)) {
    cancelActive(undefined, 'document-detached', pending.lastNativeEvent);
    return;
  }

  // Override touch's implicit capture onto the body anchor, and give pen/mouse
  // explicit capture, so pointer events route here regardless of cursor position.
  if (activeRef.heldPointer) {
    setPointerCaptureSafely(captureTarget, pointerId);
  }

  // Pin the cursor for the duration of the drag. Skipped for touch, which has
  // no cursor. `false` opts out so a consumer can manage the cursor itself.
  const cursor = parameters.dragCursor ?? DEFAULT_DRAG_CURSOR;
  if (cursor && pointerType !== 'touch') {
    // The lock toggles a class on `<html>` that gates a universal-selector rule,
    // invalidating style for the whole document. Defer that work out of the
    // pickup task; the first preview is already positioned, so the lift can paint
    // before this cost.
    WindowAnimationFrame.request(() => {
      // The drag may have ended before this deferred work runs. Identity also
      // prevents a stale callback from locking the cursor for a newer session.
      if (state.active === activeRef) {
        dragCursor.lock(element, cursor, {
          nonce: parameters.styleNonce,
          disableStyleElements: parameters.disableStyleElements,
        });
      }
    }, win);
  }

  // The active-phase `pointermove` listener attaches to the document. The
  // body-anchor capture retargets every pointer event for this pointerId onto
  // `body`, so it observes the whole gesture — including after a virtualizer/
  // live-reorder unmounts the dragged element. Touch additionally needs a
  // `{ passive: false }` `touchmove` listener (attached to the document below,
  // since touch ignores pointer capture) to `preventDefault()` the scroll the
  // `touch-action` lock doesn't cover. Release (`pointerup`/`pointercancel`) is
  // handled by the window capture listeners further down, which run before any
  // document listener could.
  activeRef.listeners.push(
    // Capture-phase, like the pending phase and the window safety nets below: a
    // third-party bubble listener calling `stopPropagation()` on `pointermove`
    // (analytics shims, other gesture libraries) must not freeze the preview
    // and target resolution while the release listeners still work.
    addEventListener(doc, 'pointermove', onActivePointerMove, { capture: true }),
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
      // Keep the exact press target armed throughout a touch/pen drag for the same
      // detached causal-target case covered by `startContextMenuSuppression`. The
      // source element is an ancestor at pickup, so a second listener there adds
      // no path. Mouse context menus arise from a separate button action while
      // capture is anchored on `body`, and the window listener below sees them.
      addEventListener(target, 'contextmenu', preventContextMenu, { capture: true }),
    );
  }
  activeRef.listeners.push(
    addEventListener(win, 'keydown', onActiveKeyDown, { capture: true }),
    // Paired with the keydown above only to notice a modifier key being released; the
    // drag itself has no keyup gesture.
    addEventListener(win, 'keyup', onActiveKeyUp, { capture: true }),
    addEventListener(win, 'blur', onActiveBlur),
    addEventListener(doc, 'visibilitychange', onActiveVisibilityChange),
    addEventListener(win, 'contextmenu', preventContextMenu, { capture: true }),
    // Capture-phase scroll: `scroll` doesn't bubble, but a capture listener on
    // the document still observes scrolling in any descendant container —
    // including auto-scroll's `scrollBy`. Flag a dirty bit so the next frame
    // re-resolves the target the moved content put under a stationary pointer.
    addEventListener(doc, 'scroll', notifyExternalScroll, { capture: true, passive: true }),
  );

  // `scroll` is also not *composed*, so the document listener above never sees a
  // container scrolled inside a shadow root: wheel-scrolling a shadow-contained
  // drop area under a stationary pointer would leave the resolved target and its
  // indicator stale until the pointer moved again. Attach to each shadow root
  // holding a registered drop target. Keep the bindings current when a target
  // mounts or unmounts in a new root during the drag.
  const shadowRootScrollListeners = new Map<ShadowRoot, DragCleanupFn>();
  const updateShadowRootScrollListener = (shadowRoot: ShadowRoot, registered: boolean) => {
    if (registered) {
      if (!shadowRootScrollListeners.has(shadowRoot)) {
        shadowRootScrollListeners.set(
          shadowRoot,
          addEventListener(shadowRoot, 'scroll', notifyExternalScroll, {
            capture: true,
            passive: true,
          }),
        );
      }
      return;
    }
    shadowRootScrollListeners.get(shadowRoot)?.();
    shadowRootScrollListeners.delete(shadowRoot);
  };
  for (const shadowRoot of getDropTargetShadowRoots()) {
    updateShadowRootScrollListener(shadowRoot, true);
  }
  activeRef.listeners.push(subscribeDropTargetShadowRoots(updateShadowRootScrollListener), () => {
    for (const cleanup of shadowRootScrollListeners.values()) {
      cleanup();
    }
    shadowRootScrollListeners.clear();
  });

  // Release and hand-off, on the window in the capture phase: the earliest point
  // any listener can observe the event, so a third-party `stopPropagation()`
  // lower down cannot leave the drag stuck. The body-anchor capture routes a
  // `pointerup` here wherever the pointer is released, and if the OS hands off
  // the pointer instead (Android soft-keyboard, browser tab switch, sibling
  // frame stealing capture) `pointercancel` ends the drag the same way.
  // `lostpointercapture` needs the dedicated handler below: the capture redirect
  // above makes touch/pen fire a spurious one on the original element that must
  // not be mistaken for a hand-off.
  activeRef.listeners.push(
    addEventListener(win, 'pointerup', onActivePointerUp, { capture: true }),
    addEventListener(win, 'pointercancel', onActivePointerCancel, { capture: true }),
    addEventListener(win, 'lostpointercapture', onActiveLostPointerCapture, { capture: true }),
    // Keep blocking native HTML5 drags a natively-draggable descendant would
    // start while the drag is active (mirrors the pending-phase listener).
    addEventListener(win, 'dragstart', preventNativeDragStart, { capture: true }),
  );

  if (!activeRef.heldPointer) {
    activeRef.listeners.push(
      // The press that produces the drop click must not also focus or press the
      // destination: a button would take focus, a menu opening on pointer down
      // would open. Canceling `pointerdown` also suppresses the compatibility
      // `mousedown`; the `click` that completes the drop still fires.
      addEventListener(win, 'pointerdown', onDoubleClickPress, { capture: true }),
      addEventListener(win, 'mousedown', onDoubleClickPress, { capture: true }),
      addEventListener(win, 'click', onDoubleClickDrop, { capture: true }),
    );
  }
  scheduleActiveFrame();
}

function onDoubleClickPress(event: Event): void {
  const mouseEvent = event as MouseEvent;
  if (!state.active || state.active.heldPointer || mouseEvent.button !== 0) {
    return;
  }
  if (
    'pointerType' in mouseEvent &&
    normalizePointerType((mouseEvent as PointerEvent).pointerType) !== 'mouse'
  ) {
    return;
  }
  mouseEvent.preventDefault();
}

function onDoubleClickDrop(event: Event): void {
  const mouseEvent = event as MouseEvent;
  if (
    !state.active ||
    state.active.heldPointer ||
    mouseEvent.button !== 0 ||
    mouseEvent.detail === 0
  ) {
    return;
  }
  if ('pointerType' in mouseEvent && mouseEvent.pointerType !== 'mouse') {
    return;
  }
  // This click completes a move; it must not also open or edit the destination.
  mouseEvent.preventDefault();
  mouseEvent.stopImmediatePropagation();
  dropActiveAtPointer(mouseEvent);
}

function scheduleActiveFrame(): void {
  const active = state.active;
  if (!active) {
    return;
  }
  if (active.rafFrame.currentId !== null) {
    return;
  }
  active.rafFrame.request(onActiveFrame);
}

/** Hit-test under the pointer, ignoring this drag's preview (see {@link elementFromPointIgnoring}). */
function resolveTargetUnderPointer(
  active: ActiveSession,
  clientX: number,
  clientY: number,
): Element | null {
  return elementFromPointIgnoring(
    ownerDocument(active.element),
    clientX,
    clientY,
    active.preview.getPreviewElement()?.element ?? null,
    getDropTargetShadowRootsByHost(),
  );
}

/**
 * Apply the draggable's `modifiers` to a pointer input. The constrained
 * input drives both the drop hit-test and the preview, so a modifier governs
 * resolution as well as the visual.
 */
function modifyActiveInput(active: ActiveSession, input: DragInput): DragInput {
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

  // Only re-resolve when the pointer moved or content scrolled under it, so a
  // stationary pointer is a fixpoint (see the field docs on `movedSinceFrame`).
  // Nothing to do means the loop stops here — the move and scroll listeners
  // re-arm it, so an idle drag costs no frames at all.
  if (!active.movedSinceFrame && !active.scrolledSinceFrame) {
    return;
  }

  // Clear before `controller.update`: a re-entrant consumer `onMove` may
  // `scrollBy`, legitimately re-setting the flag for the next frame.
  active.movedSinceFrame = false;
  active.scrolledSinceFrame = false;

  // Hit-test first, then place the preview: the hit-test ignores the preview
  // via the `ignore` argument (not its position), and `elementFromPoint`
  // right after the transform write would force a synchronous style pass
  // every frame. Both still land before the next paint.
  const input = modifyActiveInput(active, active.lastInput);
  const target = resolveTargetUnderPointer(active, input.clientX, input.clientY);
  // Kept for the auto-scroller, which anchors its container walk here (see
  // `getActiveHitElement`) rather than paying for a second hit test.
  active.lastHitElement = target;
  active.preview.update(input.clientX, input.clientY, input);
  active.controller.update(input, target, active.lastNativeEvent, active.lastMoveReason);
  // A consumer callback that re-rendered synchronously may have torn out the
  // preview's host after it was positioned. Re-home it before the frame ends
  // rather than leaving it detached until the next input. (A commit React defers
  // past this frame is caught by the preview's own observer instead.)
  active.preview.getPreviewElement()?.ensureConnected();
}

// Block native scroll while a touch drag is active; the pointer stream
// (`onActivePointer*`) owns coordinates and termination.
function preventActiveTouchScroll(event: Event): void {
  if (!state.active) {
    return;
  }
  const touchEvent = event as TouchEvent;
  if (touchEvent.cancelable) {
    touchEvent.preventDefault();
  }
}

function onActivePointerMove(event: Event): void {
  const pointerEvent = event as PointerEvent;
  const active = state.active;
  if (
    !active ||
    (active.heldPointer
      ? pointerEvent.pointerId !== active.pointerId
      : // A mouse double-click session holds no pointer: it follows any mouse
        // pointer, and ignores touch and pen.
        pointerEvent.pointerType !== 'mouse')
  ) {
    return;
  }
  // Wait one frame before treating `buttons === 0` as a missed release. A
  // terminal event in the same frame must take precedence.
  if (active.heldPointer && pointerEvent.buttons === 0) {
    // Constrained like every reported input, so `onMoveEnd` doesn't leak a raw
    // coordinate the drag never reported while it was live.
    const input = modifyActiveInput(active, getInput(pointerEvent));
    active.terminalFrameQueued = true;
    active.rafFrame.request(() => {
      if (state.active === active) {
        cancelActive(input, 'missed-release', pointerEvent);
      }
    });
    return;
  }
  // Chorded release: the primary button coming up while another is still held
  // fires `pointermove` (a buttons change), not `pointerup` — and the eventual
  // `pointerup` carries the last button, which `onActivePointerUp` ignores.
  // The user did lift the primary button deliberately, so this is a drop at the
  // current position, not a cancel.
  if (active.heldPointer && pointerEvent.buttons % 2 === 0) {
    dropActiveAtPointer(pointerEvent);
    return;
  }
  active.lastInput = getInput(pointerEvent);
  active.lastNativeEvent = pointerEvent;
  active.lastMoveReason = 'pointer';
  active.movedSinceFrame = true;
  // Bypass the coalescing guard only when a terminal fallback occupies the slot:
  // a prior `buttons === 0` sample (or a lost capture) may have queued it, and
  // this held-button sample proves that signal was transient. With
  // `onActiveFrame` already pending, the set `movedSinceFrame` is all it needs.
  if (active.terminalFrameQueued || active.rafFrame.currentId === null) {
    active.terminalFrameQueued = false;
    active.rafFrame.request(onActiveFrame);
  }
}

function onActivePointerUp(event: Event): void {
  const pointerEvent = event as PointerEvent;
  const active = state.active;
  if (!active || pointerEvent.pointerId !== active.pointerId) {
    return;
  }
  // See `onPendingPointerUp` for the `buttons` fallback.
  if (pointerEvent.button !== 0 && pointerEvent.buttons % 2 !== 0) {
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
  const target = resolveTargetUnderPointer(active, input.clientX, input.clientY);
  const controller = active.controller;
  // Clean release with no cancellation: release the contextmenu suppression (see
  // clearActive). The pointer is already up, so the drag's click is imminent.
  // See `cancelActive`: the lifecycle has to be ended even if the sensor-side
  // teardown throws, or no drag can ever start again.
  active.preview.prepareForDrop();
  state.terminalCallbacksRunning = true;
  try {
    try {
      clearActive(true, active.heldPointer ? 'released' : 'none');
    } finally {
      controller.drop(input, target, pointerEvent);
    }
  } finally {
    state.terminalCallbacksRunning = false;
  }
}

function onActivePointerCancel(event: Event): void {
  const pointerEvent = event as PointerEvent;
  const active = state.active;
  if (!active || pointerEvent.pointerId !== active.pointerId) {
    return;
  }
  // `pointercancel` often carries (0,0) coordinates; pass `undefined` so the
  // lifecycle falls back to the last good input rather than snapping to origin.
  cancelActive(undefined, 'pointer-canceled', pointerEvent);
}

function onActiveLostPointerCapture(event: Event): void {
  const pointerEvent = event as PointerEvent;
  const active = state.active;
  if (!active || pointerEvent.pointerId !== active.pointerId) {
    return;
  }
  // `commitActivation` redirects the pointer onto the body anchor via
  // `setPointerCapture`. Touch and pen *implicitly* capture to the pointerdown
  // element, so that redirect makes the original element fire
  // `lostpointercapture` right before the first move — the engine's own doing,
  // not an OS hand-off. Cancelling on it would tear down every touch/pen drag
  // the moment the finger moves. The anchor still holds the pointer in that
  // case, so only cancel once the anchor itself has lost capture (tab switch,
  // soft keyboard, sibling frame stealing the pointer). Check the event target
  // as well as the current capture state because this listener is on `window`.
  if (
    getTarget(pointerEvent) !== active.captureTarget ||
    active.captureTarget.hasPointerCapture?.(pointerEvent.pointerId)
  ) {
    return;
  }
  // Give a terminal event in the same frame precedence. `lostpointercapture`
  // often carries (0,0) coordinates, so a genuine hand-off falls back to the
  // last good input.
  active.terminalFrameQueued = true;
  active.rafFrame.request(() => {
    if (state.active === active) {
      cancelActive(undefined, 'capture-lost', pointerEvent);
    }
  });
}

/**
 * Keep the session's modifier keys current, and re-run the frame when they change.
 *
 * Modifiers are applied per frame from `lastInput`, and a frame only runs when something
 * moved — so without this, a modifier gated on a key (a 45° snap on Shift) would not
 * engage until the pointer next moved. Only a real change schedules, so typing during a
 * drag costs nothing.
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
  // The press is where the new key flags came from, so it is the event the frame's
  // `onMove` should report — otherwise `eventDetails.event.shiftKey` and
  // `location.current.input.shiftKey` disagree inside the same callback.
  active.lastNativeEvent = event;
  active.lastMoveReason = 'modifier-key';
  active.movedSinceFrame = true;
  scheduleActiveFrame();
}

function onActiveKeyUp(event: Event): void {
  syncActiveModifierKeys(event as KeyboardEvent);
}

function onActiveKeyDown(event: Event): void {
  const keyEvent = event as KeyboardEvent;
  const active = state.active;
  if (!active) {
    return;
  }
  syncActiveModifierKeys(keyEvent);
  if (keyEvent.key === 'Tab') {
    cancelActive(undefined, 'tab-key', keyEvent);
    return;
  }
  if (keyEvent.key !== 'Escape') {
    return;
  }
  keyEvent.preventDefault();
  // Escape is consumed by the cancel: without this, the same keydown would also
  // reach an enclosing dialog/popover and close it — one keypress, two
  // destructive actions.
  keyEvent.stopImmediatePropagation();
  cancelActive(undefined, 'escape-key', keyEvent);
}

function onActiveBlur(event: Event): void {
  cancelActive(undefined, 'window-blur', event);
}

function onActiveVisibilityChange(event: Event): void {
  const active = state.active;
  if (!active || ownerDocument(active.element).visibilityState !== 'hidden') {
    return;
  }
  cancelActive(undefined, 'page-hidden', event);
}

/**
 * The active synthetic drag's physical pointer position — before `modifiers`,
 * unlike every reported input — or `null` when no pointer drag is running.
 * Unlike the session snapshot, which only republishes on drop-target stack
 * changes, this is current to the last pointer sample, so a consumer engaging
 * mid-drag can act on it immediately instead of waiting for the user to move
 * again. Auto-scroll reads it to keep a modifier from parking the drag point
 * outside a scroll container the user is pushing against.
 */
export function getRawActivePointerInput(): DragInput | null {
  return state.active?.lastInput ?? null;
}

/**
 * The element the last frame hit-tested under the pointer, preview excluded.
 *
 * Resolved at the *modified* point — the frame hit-tests the position `modifiers`
 * produced, not the physical pointer — so it is not the counterpart of
 * {@link getRawActivePointerInput} despite both being read by auto-scroll. A
 * clamping modifier separates the two, and anything testing this element's
 * geometry has to test it at the modified point (see the auto-scroller's
 * `resolveProbePoint`).
 *
 * Auto-scroll walks its candidate chain from here rather than from the innermost
 * drop target: a scroll container nested *inside* a target is not an ancestor of
 * it — a kanban column is the drop target and its list is the scroller — so a
 * walk from the target alone would skip the container the pointer is in.
 *
 * Read from the frame's own resolution instead of hit-testing again, so it costs
 * nothing and honors the same idle-frame gating: while the pointer is stationary
 * and nothing has scrolled, the answer cannot have changed.
 */
export function getActiveHitElement(): Element | null {
  return state.active?.lastHitElement ?? null;
}

/**
 * Flag that something scrolled under the active drag, so the next frame
 * re-resolves the target the moved content put under a stationary pointer.
 * Bound to the document's capture-phase `scroll` and to each shadow root holding
 * a drop target, and exported for scrolls neither can observe (auto-scroll's own
 * `scrollBy`). A no-op when no pointer drag is active.
 */
export function notifyExternalScroll(): void {
  const active = state.active;
  if (active) {
    active.scrolledSinceFrame = true;
    scheduleActiveFrame();
  }
}

export function resetForTests(): void {
  clearPending();
  // No click suppression: a test reset must not leave a window-capture `click`
  // handler armed for the next test.
  clearActive(false, 'none');
  clearLastTap();
  state.lastPointerDownType = null;
  state.terminalCallbacksRunning = false;
  state.cleanupContextMenuSuppression?.();
}

interface TapRecord {
  element: HTMLElement;
  pointerId: number;
  pointerType: DragPointerType;
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
   * The pointerdown event target. Forwarded to `ActiveSession` at activation
   * for its target-bound `contextmenu` listener and for releasing touch's
   * implicit pointer capture.
   */
  target: Element;
  pointerId: number;
  pointerType: DragPointerType;
  activation: DragActivation[];
  /** How the pickup happened, reported to `onBeforeMoveStart` as `eventDetails.activation`. */
  activationKind: 'pointer' | 'double-click';
  /**
   * Whether a held pointer drives the gesture: it is captured, `pointerup`
   * drops, and a `buttons` release cancels. `false` only for a mouse
   * double-click, which follows the mouse with no button down and drops on the
   * next click.
   */
  heldPointer: boolean;
  originX: number;
  originY: number;
  lastInput: DragInput;
  /** The native event behind `lastInput`, carried into `onBeforeMoveStart`'s details. */
  lastNativeEvent: PointerEvent | MouseEvent;
  startedAt: number;
  listeners: DragCleanupFn[];
  pressHoldTimer: WindowTimeout;
  restoreNativeDrag: DragCleanupFn;
  /**
   * The contextmenu suppression this gesture armed (touch/pen only), or `null`
   * for mouse. Released by the clean-`pointerup` path so a gesture only ever
   * cancels its own suppression, never a concurrent one in the global slot.
   */
  contextMenuSuppression: DragCleanupFn | null;
  /**
   * Releases the window-level `{ passive: false }` `touchmove` anchor. Handed to
   * the active session at commit rather than released with the pending listeners:
   * iOS punishes registering such a listener late, which is exactly what the
   * active phase's document-level guard is.
   */
  touchMoveAnchor: DragCleanupFn;
}

interface ActiveSession {
  element: HTMLElement;
  /** The last frame's hit test under the pointer, preview excluded; `null` before the first frame. */
  lastHitElement: Element | null;
  /** Holds the gesture's pointer capture — the document body, never the dragged element. */
  captureTarget: Element;
  pointerId: number;
  pointerType: DragPointerType;
  activationKind: 'pointer' | 'double-click';
  /** See `PendingSession.heldPointer`. */
  heldPointer: boolean;
  controller: DragSessionController;
  preview: SyntheticPreviewHandle;
  lastInput: DragInput;
  /**
   * The native event `lastInput` was read from, handed to `controller.update` so
   * the move-derived handlers get a real `eventDetails.event` (modifier keys,
   * `pointerType`) instead of a placeholder. Seeded from the activation move, so
   * it is a real event from the first frame on.
   *
   * A `KeyboardEvent` when a modifier key drove the frame rather than the pointer
   * (see `syncActiveModifierKeys`): that press is what `lastInput`'s key flags were
   * read from, so reporting the stale `pointermove` would contradict them.
   */
  lastNativeEvent: PointerEvent | MouseEvent | KeyboardEvent;
  /** Why `lastNativeEvent` caused the next movement frame. */
  lastMoveReason: DragMoveReason;
  /** Compiled `modifiers`, or `null` when the draggable declared none. */
  modifiers: DragModifiersState | null;
  /**
   * Set by `onActivePointerMove` whenever the pointer reports activity; cleared
   * each time `onActiveFrame` re-resolves. Gating on pointer activity (rather
   * than a coordinate delta) means a stationary pointer re-resolves nothing —
   * so a reorder sliding a new element under the still pointer can't re-fire
   * onMove and loop — while any genuine move re-resolves, including a move that
   * reports the same coordinates as the previous one.
   */
  movedSinceFrame: boolean;
  /**
   * Set by the capture-phase `scroll` listener; cleared each time
   * `onActiveFrame` re-resolves. Forces one re-resolution after any scroll
   * (auto-scroll's `scrollBy` or a manual scroll) so content moving under a
   * stationary pointer is still tracked.
   */
  scrolledSinceFrame: boolean;
  rafFrame: WindowAnimationFrame;
  /**
   * Whether `rafFrame` currently holds a deferred terminal callback (a missed
   * release or a lost capture) rather than `onActiveFrame`. A held-button move
   * must displace that callback, but need not replace a pending `onActiveFrame`:
   * on a 120–240 Hz pointer several moves land between two paints, and a
   * cancel/request pair for each is pure churn.
   */
  terminalFrameQueued: boolean;
  listeners: DragCleanupFn[];
  /** See {@link PendingSession.touchMoveAnchor}; released when the drag ends. */
  touchMoveAnchor: DragCleanupFn;
  restoreNativeDrag: DragCleanupFn;
  /**
   * The contextmenu suppression this gesture armed (touch/pen only), carried over
   * from the pending phase. Released only by a clean drop; a cancel path leaves it
   * armed for Android's post-`pointercancel` `contextmenu` (see `clearActive`).
   */
  contextMenuSuppression: DragCleanupFn | null;
}
