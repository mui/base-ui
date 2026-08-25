/**
 * Shared drag-and-drop test utilities for the drag engine and its consumers.
 *
 * The DnD event polyfill and the native→synthetic bridge are installed lazily
 * (see {@link installDndTestEnv}), so importing this module has no side effects.
 */
import { afterEach } from 'vitest';
import { act, fireEvent } from '@mui/internal-test-utils';
import { installDndPolyfill } from './dndPolyfill';
import { reset, isActive as isDragActive } from '../src/utils/drag-and-drop/core/lifecycleManager';
import { resetForTests as resetSyntheticSensor } from '../src/utils/drag-and-drop/synthetic/syntheticSensor';
import { resetForTests as resetDropTargets } from '../src/utils/drag-and-drop/dropTarget';
import { resetForTests as resetDragRootLock } from '../src/utils/drag-and-drop/synthetic/dragRootLock';
import { resetForTests as resetDragCursor } from '../src/utils/drag-and-drop/synthetic/dragCursor';
import { resetForTests as resetPostDragClick } from '../src/utils/drag-and-drop/synthetic/postDragClick';
import { resetForTests as resetAutoScroller } from '../src/utils/drag-and-drop/autoScroller';
import { clearPublishedDragPreview } from '../src/utils/drag-and-drop/overlay/dragPreviewStore';
import { resetTouchTarget } from './syntheticPointer';

// ---------------------------------------------------------------------------
// Fake elements
// ---------------------------------------------------------------------------

const createdElements: HTMLElement[] = [];

/**
 * Create a `<div>` appended to `document.body` with a controlled bounding rect.
 * All created elements are automatically removed by `cleanupElements()`.
 */
export function createElement(
  rect: { top?: number; height?: number; left?: number; width?: number } = {},
): HTMLElement {
  const el = document.createElement('div');
  const { top = 0, height = 100, left = 0, width = 200 } = rect;
  el.getBoundingClientRect = () => new DOMRect(left, top, width, height);
  document.body.appendChild(el);
  createdElements.push(el);
  return el;
}

export function cleanupElements(): void {
  for (const el of createdElements) {
    el.remove();
  }
  createdElements.length = 0;
}

// ---------------------------------------------------------------------------
// Cleanup queue
// ---------------------------------------------------------------------------

const cleanupQueue: Array<() => void> = [];

/**
 * Queue a cleanup function — typically the return value of one of the engine's
 * `register*` methods — to be invoked in `afterEach`. Cleanups run LIFO.
 */
export function registerCleanup(fn: () => void): void {
  cleanupQueue.push(fn);
}

/**
 * Run every queued cleanup, then rethrow the first failure.
 *
 * Swallowing the throw entirely would hide a teardown regression — a cleanup
 * that leaves an element registered, or an attribute behind — behind a green
 * suite, which is exactly the class of bug these cleanups exist to catch. The
 * remaining cleanups still run first so one failure can't cascade into
 * cross-test leakage.
 */
function drainCleanupQueue(): void {
  let firstError: unknown;
  let failed = false;
  while (cleanupQueue.length > 0) {
    const fn = cleanupQueue.pop()!;
    try {
      fn();
    } catch (error) {
      if (!failed) {
        failed = true;
        firstError = error;
      }
    }
  }
  if (failed) {
    throw firstError;
  }
}

/**
 * Install the standard `afterEach` for drag engine tests:
 *
 * 1. Drain the cleanup queue (LIFO).
 * 2. Remove every element created via `createElement()`.
 * 3. Force-end any in-flight drag and reset the engine state machine.
 * 4. Restore the `elementFromPoint` hit-test mock.
 * 5. Run an optional `extraAfterEach` for tests with bespoke teardown.
 *
 * Every step runs even when an earlier one throws — global engine state must be
 * reset before the next test regardless — and the first failure is rethrown
 * afterwards, so a broken cleanup fails its own test instead of quietly leaking.
 */
export function setupDragEngineTests(options: { extraAfterEach?: () => void } = {}): void {
  installDndTestEnv();
  afterEach(() => {
    let firstError: unknown;
    let failed = false;
    const run = (step: () => void) => {
      try {
        step();
      } catch (error) {
        if (!failed) {
          failed = true;
          firstError = error;
        }
      }
    };
    run(drainCleanupQueue);
    run(cleanupElements);
    run(resetDrag);
    if (options.extraAfterEach) {
      run(options.extraAfterEach);
    }
    if (failed) {
      throw firstError;
    }
  });
}

// ---------------------------------------------------------------------------
// Native → synthetic drag bridge
// ---------------------------------------------------------------------------
//
// Tests drive drags with `fireEvent.dragStart/dragEnter/dragOver/drop` — the
// HTML5 drag events. The engine, however, only listens to pointer events and
// resolves drop targets via `document.elementFromPoint`. This bridge listens
// for those native drag events and replays each as the matching mouse-pointer
// gesture, routing `elementFromPoint` at the dragged-over element so the engine
// sees exactly the drag the test described. Installed by `setupDragEngineTests`.
//
// What the bridge cannot prove: it *pins* `elementFromPoint` to the element the
// test named, and its drops carry no meaningful coordinates. So a drop that
// routes correctly here can still resolve a different target in a real browser,
// where the hit-test answers from layout. Anything whose correctness depends on
// real geometry — nested target resolution, edge zones, collision — needs a
// browser test (`describe.skipIf(isJSDOM)`), and a drag driven from raw pointer
// events rather than through this bridge (see the synthetic sensor's
// "documented pointer-drag recipe" tests).

interface DragEventInput {
  clientX?: number | undefined;
  clientY?: number | undefined;
  altKey?: boolean | undefined;
  ctrlKey?: boolean | undefined;
  shiftKey?: boolean | undefined;
  metaKey?: boolean | undefined;
}

const DRAG_POINTER_ID = 1;

// How far the bridge nudges the pointer to clear the engine's mouse activation
// distance (5px). A native drag only fires `dragstart` after the OS threshold
// is crossed, so the bridge replays that movement to start the synthetic drag.
const DRAG_ACTIVATION_DISTANCE_PX = 6;

// The source element of the active bridged drag (the `dragstart` target). Mouse
// move/up events are dispatched here because the engine binds its active-phase
// listeners to the pointerdown target.
let bridgeSource: HTMLElement | null = null;
// What `document.elementFromPoint` resolves to — the element under the pointer.
let hitTarget: Element | null = null;
let originalElementFromPoint: ((x: number, y: number) => Element | null) | null = null;
let bridgeInstalled = false;

function installElementFromPoint(): void {
  if (originalElementFromPoint) {
    return;
  }
  originalElementFromPoint = document.elementFromPoint.bind(document);
  document.elementFromPoint = () => hitTarget;
}

function restoreElementFromPoint(): void {
  if (originalElementFromPoint) {
    document.elementFromPoint = originalElementFromPoint;
    originalElementFromPoint = null;
  }
  hitTarget = null;
}

function dispatchPointer(
  type: string,
  target: EventTarget,
  source: DragEventInput,
  button: { button: number; buttons: number },
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerType: 'mouse',
      pointerId: DRAG_POINTER_ID,
      clientX: source.clientX ?? 0,
      clientY: source.clientY ?? 0,
      button: button.button,
      buttons: button.buttons,
      altKey: source.altKey ?? false,
      ctrlKey: source.ctrlKey ?? false,
      shiftKey: source.shiftKey ?? false,
      metaKey: source.metaKey ?? false,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function onBridgeDragStart(event: Event): void {
  const dragEvent = event as DragEvent;
  const source = dragEvent.target as HTMLElement | null;
  if (!source) {
    return;
  }
  installElementFromPoint();
  // No drop target under the pointer until a `dragenter`/`dragover` routes one.
  hitTarget = null;
  bridgeSource = source;
  // The mouse activation default is a 5px distance, so a bare pointerdown won't
  // start the drag. Replay the movement a native drag implies (it only fires
  // `dragstart` past the OS threshold): press, nudge clear of the distance to
  // commit activation, then settle back onto the dragstart point so the active
  // drag is positioned exactly where the gesture began.
  dispatchPointer('pointerdown', source, dragEvent, { button: 0, buttons: 1 });
  const activationInput: DragEventInput = {
    clientX: (dragEvent.clientX ?? 0) + DRAG_ACTIVATION_DISTANCE_PX,
    clientY: dragEvent.clientY ?? 0,
    altKey: dragEvent.altKey,
    ctrlKey: dragEvent.ctrlKey,
    shiftKey: dragEvent.shiftKey,
    metaKey: dragEvent.metaKey,
  };
  dispatchPointer('pointermove', source, activationInput, { button: -1, buttons: 1 });
  dispatchPointer('pointermove', source, dragEvent, { button: -1, buttons: 1 });
}

function onBridgeDragMove(event: Event): void {
  if (!bridgeSource) {
    return;
  }
  const dragEvent = event as DragEvent;
  // `dragenter`/`dragover` hover a target; the engine resolves it from
  // `elementFromPoint` on its next frame.
  hitTarget = dragEvent.target as Element | null;
  dispatchPointer('pointermove', bridgeSource, dragEvent, { button: -1, buttons: 1 });
}

function onBridgeDragLeave(event: Event): void {
  if (!bridgeSource) {
    return;
  }
  // Leaving a target / the window: nothing under the pointer now.
  hitTarget = null;
  dispatchPointer('pointermove', bridgeSource, event as DragEvent, { button: -1, buttons: 1 });
}

function onBridgeDrop(event: Event): void {
  if (!bridgeSource) {
    return;
  }
  const dragEvent = event as DragEvent;
  hitTarget = dragEvent.target as Element | null;
  dispatchPointer('pointerup', bridgeSource, dragEvent, { button: 0, buttons: 0 });
  bridgeSource = null;
}

function onBridgeDragEnd(): void {
  if (!bridgeSource) {
    return;
  }
  // A `dragend` with no preceding `drop` is a cancel — the engine cancels an
  // active drag on Escape. Dispatch a raw event (not `fireEvent`) so it lands
  // synchronously even when fired re-entrantly inside the `dragend` dispatch.
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  bridgeSource = null;
}

function installNativeToSyntheticBridge(): void {
  if (bridgeInstalled) {
    return;
  }
  bridgeInstalled = true;
  document.addEventListener('dragstart', onBridgeDragStart, true);
  document.addEventListener('dragenter', onBridgeDragMove, true);
  document.addEventListener('dragover', onBridgeDragMove, true);
  document.addEventListener('dragleave', onBridgeDragLeave, true);
  document.addEventListener('drop', onBridgeDrop, true);
  document.addEventListener('dragend', onBridgeDragEnd, true);
}

/**
 * Install the DnD polyfills and the native→synthetic bridge. Idempotent.
 *
 * Called from `setupDragEngineTests()`, `createDndRenderer()`, and the drag
 * sequence helpers below, so every drag test path gets the environment before
 * it dispatches events — while suites that merely import the shared test
 * barrel keep the native `DragEvent`/`DataTransfer` and an unpatched document.
 */
export function installDndTestEnv(): void {
  installDndPolyfill();
  installNativeToSyntheticBridge();
}

/**
 * Flush one requestAnimationFrame tick.
 * Uses rAF directly so it works both in JSDOM (where rAF is mapped to
 * setTimeout) and in real browsers (where rAF runs on the next paint frame).
 */
export async function flushRaf(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  });
}

// ---------------------------------------------------------------------------
// Drag sequence helpers
// ---------------------------------------------------------------------------
//
// These fire the HTML5 drag events the bridge above replays as pointer
// gestures. The cadence mirrors the engine's: `dragstart`/`dragover` defer work
// to a rAF, so they flush; `dragenter`/`drop` are synchronous edges.

interface InputOverrides {
  altKey?: boolean | undefined;
  ctrlKey?: boolean | undefined;
  shiftKey?: boolean | undefined;
  metaKey?: boolean | undefined;
  clientX?: number | undefined;
  clientY?: number | undefined;
}

function getDefaultInput(overrides: InputOverrides = {}): InputOverrides {
  return {
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
    clientX: 0,
    clientY: 0,
    ...overrides,
  };
}

/** Start a drag on an element and flush the deferred `onDragStart`. */
export async function lift(
  element: HTMLElement,
  input?: InputOverrides & {
    /**
     * Skip the started-drag assertion below, for a lift that deliberately must
     * NOT start a drag (e.g. a disabled draggable).
     */
    expectNoDrag?: boolean | undefined;
  },
): Promise<void> {
  installDndTestEnv();
  const { expectNoDrag = false, ...overrides } = input ?? {};
  fireEvent.dragStart(element, getDefaultInput(overrides));
  await flushRaf();
  // The bridge clears the default 5px mouse activation with a hardcoded ~6px
  // nudge (see DRAG_ACTIVATION_DISTANCE_PX). A fixture registered with a larger
  // custom activation distance would silently not start a drag here, making the
  // caller's `not.toHaveBeenCalled()` assertions vacuous — fail loudly instead.
  if (!expectNoDrag && !isDragActive()) {
    throw new Error(
      'lift(): no drag session started after the activation move. ' +
        'The element may not be a registered draggable, or its activation constraint ' +
        '(custom distance/delay, disabled, onBeforeDragStart cancel) kept the drag from starting. ' +
        'Drive the gesture manually, or pass `{ expectNoDrag: true }` when the lift is ' +
        'intentionally expected not to start a drag.',
    );
  }
}

/** Drag onto a drop target and flush so the engine's frame resolves it. */
export async function dragEnter(element: HTMLElement, input?: InputOverrides): Promise<void> {
  installDndTestEnv();
  fireEvent.dragEnter(element, getDefaultInput(input));
  await flushRaf();
}

/** Continue dragging over a drop target. */
export async function dragOver(element: HTMLElement, input?: InputOverrides): Promise<void> {
  installDndTestEnv();
  fireEvent.dragOver(element, getDefaultInput(input));
  await flushRaf();
}

/** Drop on a target. */
export function drop(element: HTMLElement, input?: InputOverrides): void {
  installDndTestEnv();
  fireEvent.drop(element, getDefaultInput(input));
}

/** Cancel a drag (leave the window, then end it). */
export function cancel(element: HTMLElement = document.body): void {
  installDndTestEnv();
  fireEvent.dragLeave(element);
  fireEvent.dragEnd(element);
}

/** Force-end any pending drag state. Call in `afterEach`. */
export function resetDrag(): void {
  // Force-ending an active drag flips React state (isDragging, custom drag
  // preview portals) on still-mounted consumers. Flush those updates inside
  // `act` so teardown doesn't trip the "not wrapped in act(...)" warning.
  act(() => {
    reset();
    resetSyntheticSensor();
    // The published preview is React state, so it has to be cleared inside `act`
    // like the rest. A test that aborts mid-drag would otherwise leave the
    // overlay rendering the previous test's preview.
    clearPublishedDragPreview();
  });
  // Global slots the sensors take but `reset()` doesn't own: a test that fails
  // mid-drag would otherwise leave the document scrolling-locked, the drag cursor
  // pinned, or a click-swallow armed into the next test.
  resetDragRootLock();
  resetDragCursor();
  resetPostDragClick();
  // `reset()` clears the active monitors without dispatching `onDragEnd`, so the
  // scroll monitor never runs its own teardown: a still-engaged loop would keep
  // scheduling frames — and calling `scrollBy` — into the next test, while
  // holding the previous test's detached source alive.
  resetAutoScroller();
  // Clear any drop targets still registered on detached nodes so a failed/aborted
  // test can't leak them into the next one.
  resetDropTargets();
  restoreElementFromPoint();
  bridgeSource = null;
  // Clear the synthetic-pointer helpers' latched touch target so one test's
  // gesture can't route the next test's touch/pen dispatches.
  resetTouchTarget();
}
