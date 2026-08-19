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
import { createEventRootBinding, type DragEventRoot } from '../documentBinding';
import type { DraggableConfig } from '../draggable';
import { getRegistration, resolveDraggablePickup } from '../draggableRegistry';
import { hasInteractiveAncestorWithin } from '../interactiveElement';
import { getDropTargetShadowRoots } from '../dropTarget';
import type {
  DragCanceledReason,
  DragCleanupFn,
  DragHandle,
  DragInput,
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
  remapInput,
  resolveElementReference,
  runAllCleanups,
} from '../utils';

interface SyntheticDragState {
  /** At most one of `pending` / `active` is non-null at any time. */
  pending: PendingSession | null;
  active: ActiveSession | null;
  cleanupContextMenuSuppression: DragCleanupFn | null;
}

const state = getSharedSlot<SyntheticDragState>('syntheticDrag', () => ({
  pending: null,
  active: null,
  cleanupContextMenuSuppression: null,
}));
const handledPointerDownEvents = getSharedSlot<WeakSet<Event>>(
  'syntheticDrag.handledPointerDownEvents',
  () => new WeakSet<Event>(),
);
const CONTEXT_MENU_SUPPRESSION_MS = 1500;

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

export function bindPointerListeners(root: DragEventRoot): void {
  documentBinding.bind(root);
}

export function unbindPointerListeners(root: DragEventRoot): void {
  documentBinding.unbind(root);
}

function suppressNativeDragForSyntheticPointer(
  element: HTMLElement,
  pointerId: number,
  win: Window,
): DragCleanupFn {
  const previousDraggable = element.getAttribute('draggable');
  let restored = false;
  const cleanupListeners: DragCleanupFn[] = [];

  const restore = () => {
    if (restored) {
      return;
    }
    restored = true;
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
  };

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
  if (pointerAtTeardown !== 'none') {
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
  'pointer-down': 'held',
  'focus-out': 'held',
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
  try {
    clearActive(false, POINTER_AT_CANCEL[reason]);
  } finally {
    controller.cancel(input, reason, event);
  }
}

/**
 * Programmatically cancel an in-progress pointer drag (fires `onDragEnd` with
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
function isScrollbarPress(event: PointerEvent, element: Element): boolean {
  const win = ownerWindow(element);
  if (!(element instanceof win.HTMLElement)) {
    return false;
  }
  // An element with no scrollable overflow has no gutter at all, and the offsets
  // below would be measuring its borders instead — a press on the border of a
  // draggable is an ordinary press and must still pick it up.
  const overflow = getOverflowFlags(element);
  const scrollsY = overflow.y && element.scrollHeight > element.clientHeight;
  const scrollsX = overflow.x && element.scrollWidth > element.clientWidth;
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
  const offsetX = event.clientX - rect.left - element.clientLeft;
  const offsetY = event.clientY - rect.top - element.clientTop;
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

  if (state.pending || state.active) {
    // A gesture whose document lost its browsing context (its iframe removed,
    // its popout closed) can never end on its own — every terminating listener
    // lived in the dead realm — and would wedge the whole engine shut. Detect
    // it at the next gesture anywhere, cancel the dead session, and let this
    // pickup proceed.
    const session = state.pending ?? state.active;
    if (!session || !isDetachedDocument(session.element.ownerDocument)) {
      return;
    }
    if (state.pending) {
      clearPending();
    } else {
      cancelActive(undefined, 'document-detached', event);
    }
    if (state.pending || state.active) {
      return;
    }
  }

  // Reject only when neither signal indicates the primary button: a touch
  // primary press reports `button === 0` and `buttons === 1`, but accept either
  // alone to be robust against browser quirks.
  if (pointerEvent.button !== 0 && pointerEvent.buttons !== 1) {
    return;
  }

  const pickup = resolveDraggablePickup(getTarget(pointerEvent), 'pointer');
  if (!pickup) {
    return;
  }
  const { element, target, parameters, dragHandle } = pickup;
  const handle = (dragHandle as HTMLElement | null) ?? element;

  const initialInput = getInput(pointerEvent);

  // A disabled draggable never arms the pending phase, so the press behaves like
  // an ordinary click: no contextmenu suppression, and a natively-draggable
  // descendant (`<img>`, `<a href>`) keeps its native HTML5 drag. A *dynamic*
  // veto belongs in `onBeforeDragStart`, dispatched at activation commit.
  if (parameters.disabled) {
    return;
  }

  // A control nested inside the draggable owns its own press — the same rule the
  // keyboard sensor applies to Space/Enter. Without it, pressing an inline rename
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

  const activation = resolveActivation(parameters.pointerActivation, pointerType);
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

  const delay = getActivationDelayMs(activation);
  if (delay !== null) {
    // press-hold: the pointermove handler enforces movement tolerance,
    // cancelling if the finger drifts too far. If still pending when the
    // timer fires, the modifier is satisfied.
    pendingRef.pressHoldTimer.start(delay, () => {
      if (state.pending !== pendingRef) {
        return;
      }
      commitActivation();
    });
  } else {
    // Immediate/distance — evaluate at pointerdown for the immediate case.
    evaluatePendingActivation(pendingRef.lastInput.clientX, pendingRef.lastInput.clientY, 0);
  }
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
  let disposed = false;

  const cleanup = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    timeout.clear();
    for (const off of cleanups) {
      off();
    }
    if (state.cleanupContextMenuSuppression === cleanup) {
      state.cleanupContextMenuSuppression = null;
    }
  };

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
  const decision = evaluateActivation(
    pending.activation,
    { x: pending.originX, y: pending.originY },
    { x: clientX, y: clientY },
    elapsed,
  );
  if (decision === 'activate') {
    commitActivation();
  } else if (decision === 'cancel') {
    clearPending();
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

  // Re-check `disabled` at commit: it may have flipped during the press.
  if (parameters.disabled) {
    clearPending(true);
    return;
  }

  // Re-check the lifecycle too, as the keyboard sensor does. A keyboard drag can
  // start during the pending window (mouse held still, Space pressed), and the
  // lifecycle would refuse this one anyway — but only after `onBeforeDragStart`,
  // `getPayload` and a preview had run. The refused-session undo then
  // destroys that preview, which strips `data-dragging`/`data-drag-mode` from the
  // element the *keyboard* drag is dragging, killing its dimming for the rest of
  // the drag.
  if (!canStartLifecycle()) {
    clearPending(true);
    return;
  }

  const dragHandle = resolveElementReference(
    parameters.pointerDragHandle ?? parameters.dragHandle,
    undefined,
  );

  // Re-check the handle gate at commit, like `disabled` above: the draggable may
  // have swapped its handle during the press, and the press that armed this
  // gesture was never on the handle that now governs it.
  if (dragHandle && !contains(dragHandle, target)) {
    clearPending(true);
    return;
  }

  // Let the consumer veto the drag as it is about to start. Dispatched before
  // any resource is allocated, so canceling leaves nothing to undo beyond the
  // pending phase itself — nothing has lifted yet.
  if (parameters.onBeforeDragStart) {
    const eventDetails = createChangeEventDetails('pointer', pending.lastNativeEvent, target);
    try {
      parameters.onBeforeDragStart({ input: lastInput, element, dragHandle }, eventDetails);
    } catch (error) {
      // A throwing consumer handler must not leave the pending phase armed.
      clearPending(true);
      throw error;
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
    'pointer',
    { keys: lastInput },
  );
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
    getDropTargetShadowRoots(),
  );

  // The shared bootstrap allocates preview + lock + lifecycle and undoes them
  // itself on a throw or a lifecycle refusal, so only the pending-phase state
  // is left to clean up here.
  let result: PreviewSessionHandle | null;
  try {
    result = createPreviewAndStartSession({
      mode: 'pointer',
      draggableParameters: parameters,
      element,
      dragHandle,
      initialInput: startInput,
      // The `pointermove` that crossed the activation threshold.
      initialEvent: pending.lastNativeEvent,
      // The press, not the committed input: the grab offset must reflect where
      // the user took hold, and the activation threshold sits between the two.
      pressPoint: { x: pending.originX, y: pending.originY },
      // Resolved above, before the preview was built and moved under the pointer.
      getInitialTarget: () => initialTarget,
      onForceCleanup: clearActive,
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
    controller: session.controller,
    preview,
    lastInput,
    lastNativeEvent: pending.lastNativeEvent,
    modifiers,
    // Resolve once on the first active frame: confirms the entered target and
    // emits the initial `onDrag`. Cleared immediately after, so every later
    // stationary frame is gated.
    movedSinceFrame: true,
    scrolledSinceFrame: false,
    rafFrame: new WindowAnimationFrame(win),
    listeners: [],
    restoreNativeDrag,
    contextMenuSuppression,
    touchMoveAnchor: pending.touchMoveAnchor,
  };
  state.active = activeRef;

  // Override touch's implicit capture onto the body anchor, and give pen/mouse
  // explicit capture, so pointer events route here regardless of cursor position.
  setPointerCaptureSafely(captureTarget, pointerId);

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

  // Active-phase pointer listeners attach to the document. The body-anchor
  // capture retargets every pointer event for this pointerId onto `body`, so they
  // observe the whole gesture — including after a virtualizer/live-reorder unmounts
  // the dragged element. Touch additionally needs a `{ passive: false }` `touchmove`
  // listener (attached to the document below, since touch ignores pointer capture)
  // to `preventDefault()` the scroll the `touch-action` lock doesn't cover.
  activeRef.listeners.push(
    // Capture-phase, like the pending phase and the window safety nets below: a
    // third-party bubble listener calling `stopPropagation()` on `pointermove`
    // (analytics shims, other gesture libraries) must not freeze the preview
    // and target resolution while the release listeners still work.
    addEventListener(doc, 'pointermove', onActivePointerMove, { capture: true }),
    addEventListener(doc, 'pointerup', onActivePointerUp),
    addEventListener(doc, 'pointercancel', onActivePointerCancel),
  );
  if (pointerType !== 'mouse') {
    // Attach to the document (capture) rather than `target`: touch retargets to
    // the pointerdown node, but a virtualizer can unmount it mid-drag — a
    // target-bound listener would die with it and let the page scroll under the
    // active drag. `touchmove` bubbles, so a capture listener on the document
    // still observes it and can prevent the scroll. Installed for pen too:
    // Apple Pencil reports `pointerType: 'pen'` but iOS still scrolls the page
    // through the touch event stream it synthesizes for it.
    activeRef.listeners.push(
      addEventListener(doc, 'touchmove', preventActiveTouchScroll, {
        passive: false,
        capture: true,
      }),
    );
  }
  if (pointerType !== 'mouse') {
    // Keep the exact press target armed throughout a touch/pen drag for the same
    // detached causal-target case covered by `startContextMenuSuppression`. The
    // source element is an ancestor at pickup, so a second listener there adds
    // no path. Mouse context menus arise from a separate button action while
    // capture is anchored on `body`, and the window listener below sees them.
    activeRef.listeners.push(
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
    addEventListener(doc, 'scroll', onActiveScroll, { capture: true, passive: true }),
  );

  // `scroll` is also not *composed*, so the document listener above never sees a
  // container scrolled inside a shadow root: wheel-scrolling a shadow-contained
  // drop area under a stationary pointer would leave the resolved target and its
  // indicator stale until the pointer moved again. Attach to each shadow root
  // holding a registered drop target. (A target registered into a *new* shadow
  // root mid-drag is not covered; it can call `notifyExternalScroll()`.)
  for (const shadowRoot of getDropTargetShadowRoots()) {
    activeRef.listeners.push(
      addEventListener(shadowRoot, 'scroll', onActiveScroll, { capture: true, passive: true }),
    );
  }

  // Window-level safety net: if the OS hands off the pointer (Android
  // soft-keyboard, browser tab switch, sibling frame stealing capture) no
  // `pointerup` ever arrives at the target and the drag would stick.
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

  scheduleActiveFrame();
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
    getDropTargetShadowRoots(),
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
      'pointer',
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

  // Clear before `controller.update`: a re-entrant consumer `onDrag` may
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
  active.controller.update(input, target, active.lastNativeEvent);
  // A consumer callback that re-rendered synchronously may have torn out the
  // preview's host after it was positioned. Re-home it before the frame ends
  // rather than leaving it detached until the next input. (A commit React defers
  // past this frame is caught by the preview's own observer instead.)
  active.preview.getPreviewElement()?.ensureConnected();

  // Another frame, in case a callback moved something under the still pointer.
  scheduleActiveFrame();
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
  if (!active || pointerEvent.pointerId !== active.pointerId) {
    return;
  }
  // Wait one frame before treating `buttons === 0` as a missed release. A
  // terminal event in the same frame must take precedence.
  if (pointerEvent.buttons === 0) {
    // Constrained like every reported input, so `onDragEnd` doesn't leak a raw
    // coordinate the drag never reported while it was live.
    const input = modifyActiveInput(active, getInput(pointerEvent));
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
  if (pointerEvent.buttons % 2 === 0) {
    dropActiveAtPointer(pointerEvent);
    return;
  }
  active.lastInput = getInput(pointerEvent);
  active.lastNativeEvent = pointerEvent;
  active.movedSinceFrame = true;
  // Request directly rather than going through the coalescing guard: a prior
  // `buttons === 0` sample may have put the missed-release fallback in this
  // slot, and this held-button sample proves that signal was transient.
  active.rafFrame.request(onActiveFrame);
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
function dropActiveAtPointer(pointerEvent: PointerEvent): void {
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
  try {
    clearActive(true, 'released');
  } finally {
    controller.drop(input, target, pointerEvent);
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
  // `onDrag` should report — otherwise `eventDetails.event.shiftKey` and
  // `location.current.input.shiftKey` disagree inside the same callback.
  active.lastNativeEvent = event;
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
  if (keyEvent.key !== 'Escape') {
    return;
  }
  keyEvent.preventDefault();
  // Escape is consumed by the cancel: without this, the same keydown would also
  // reach an enclosing dialog/popover and close it — one keypress, two
  // destructive actions. Mirrors the keyboard sensor's Escape handling.
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

function onActiveScroll(): void {
  const active = state.active;
  if (active) {
    active.scrolledSinceFrame = true;
    scheduleActiveFrame();
  }
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
 * Report a scroll the document capture listener can't observe: `scroll` is not
 * composed, so scrolling inside a shadow root never reaches it. Sets the same
 * dirty bit so the next frame re-resolves the drop target. A no-op when no
 * pointer drag is active.
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
  state.cleanupContextMenuSuppression?.();
}

interface PendingSession {
  element: HTMLElement;
  /**
   * The pointerdown event target. Forwarded to `ActiveSession` at activation
   * so the active phase can attach pointer/touch listeners directly to it, and
   * the phase where touch's implicit pointer capture is released.
   */
  target: Element;
  pointerId: number;
  pointerType: DragPointerType;
  activation: DragActivation;
  originX: number;
  originY: number;
  lastInput: DragInput;
  /** The native event behind `lastInput`, carried into `onBeforeDragStart`'s details. */
  lastNativeEvent: PointerEvent;
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
  lastNativeEvent: PointerEvent | KeyboardEvent;
  /** Compiled `modifiers`, or `null` when the draggable declared none. */
  modifiers: DragModifiersState | null;
  /**
   * Set by `onActivePointerMove` whenever the pointer reports activity; cleared
   * each time `onActiveFrame` re-resolves. Gating on pointer activity (rather
   * than a coordinate delta) means a stationary pointer re-resolves nothing —
   * so a reorder sliding a new element under the still pointer can't re-fire
   * onDrag and loop — while any genuine move re-resolves, including a move that
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
