/**
 * Shared drag-and-drop test utilities for the drag engine and its consumers.
 * Importing this module has no side effects.
 */
import { afterEach, beforeEach } from 'vitest';
import { reset as resetWarnings } from '@base-ui/utils/warn';
import { act } from '@mui/internal-test-utils';
import { waitSingleFrame } from './wait';
import { reset, isActive as isDragActive } from '../src/utils/drag-and-drop/core/lifecycleManager';
import { resetForTests as resetSyntheticSensor } from '../src/utils/drag-and-drop/synthetic/syntheticSensor';
import { resetForTests as resetDropTargets } from '../src/utils/drag-and-drop/dropTarget';
import { unlock as resetDragRootLock } from '../src/utils/drag-and-drop/synthetic/dragRootLock';
import { unlock as resetDragCursor } from '../src/utils/drag-and-drop/synthetic/dragCursor';
import { resetForTests as resetPostDragClick } from '../src/utils/drag-and-drop/synthetic/postDragClick';
import { resetForTests as resetAutoScroller } from '../src/utils/drag-and-drop/autoScroller';
import { clearPublishedDragPreview } from '../src/utils/drag-and-drop/overlay/dragPreviewStore';
import { runAllCleanups } from '../src/utils/drag-and-drop/utils';
import { resetTouchTarget } from './syntheticPointer';
import type { DragDropEventDetails, MoveEndEventDetails } from '../src/utils/drag-and-drop/types';

// ---------------------------------------------------------------------------
// Fake elements
// ---------------------------------------------------------------------------

const createdElements: HTMLElement[] = [];

/**
 * Create a `<div>` appended to `document.body` with a controlled bounding rect.
 * `cleanupElements()` removes it after the test.
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

function cleanupElements(): void {
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
 * Queue a cleanup function, usually returned by one of the engine's `register*`
 * methods, to run in `afterEach`. Cleanups run in reverse order.
 */
export function registerCleanup(fn: () => void): void {
  cleanupQueue.push(fn);
}

/**
 * Install the standard `afterEach` for drag engine tests:
 *
 * 1. Drain the cleanup queue (LIFO).
 * 2. Remove every element created via `createElement()`.
 * 3. Force-end any in-flight drag and reset the engine state machine.
 * 4. Restore the `elementFromPoint` hit-test mock.
 *
 * Every step runs even when an earlier one throws, because global engine state
 * must be reset before the next test. The first failure is rethrown afterwards,
 * so a broken cleanup fails its own test instead of leaking into later ones.
 */
export function setupDragEngineTests(): void {
  // `warn()` logs each message once per process. Reset it so warning-count
  // assertions don't depend on test order or on `.only`.
  beforeEach(() => {
    resetWarnings();
  });
  afterEach(() => {
    runAllCleanups([...cleanupQueue.splice(0).reverse(), cleanupElements, resetDrag]);
  });
}

// ---------------------------------------------------------------------------
// Drag gestures
// ---------------------------------------------------------------------------
//
// The engine listens only to pointer events and resolves drop targets with
// `document.elementFromPoint`. `fireDrag` describes a drag as HTML5 drag-event
// steps: start on a source, enter or hover a target, and drop. It replays each
// step as the matching mouse pointer gesture and points `elementFromPoint` at
// the element the step names.
//
// This can't catch hit-testing bugs. `elementFromPoint` returns whatever element
// the test named, and drops carry no meaningful coordinates. A drop that routes
// correctly here can still resolve a different target in a real browser, where
// the hit-test uses layout. Nested target resolution, edge zones, collision, and
// anything else that depends on real geometry need a browser test
// (`describe.skipIf(isJSDOM)`) driven by raw pointer events. The synthetic
// sensor's "documented pointer-drag recipe" tests show how.

interface DragEventInput {
  clientX?: number | undefined;
  clientY?: number | undefined;
  altKey?: boolean | undefined;
  ctrlKey?: boolean | undefined;
  shiftKey?: boolean | undefined;
  metaKey?: boolean | undefined;
}

const DRAG_POINTER_ID = 1;
const PRESSED = { button: 0, buttons: 1 };
const MOVING = { button: -1, buttons: 1 };
const RELEASED = { button: 0, buttons: 0 };

// How far `dragStart` nudges the pointer to clear the engine's mouse activation
// distance (5px). A native drag only starts past the OS threshold, so the
// gesture replays that movement to start the synthetic drag.
const DRAG_ACTIVATION_DISTANCE_PX = 6;

// The source element of the active drag. Mouse move/up events are dispatched
// here and propagate to the document and window, where the engine's
// active-phase listeners live.
let dragSource: HTMLElement | null = null;
// The element `document.elementFromPoint` returns, standing in for the element under the pointer.
let hitTarget: Element | null = null;
let originalElementFromPoint: ((x: number, y: number) => Element | null) | null = null;

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
  input: DragEventInput,
  button: { button: number; buttons: number },
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerType: 'mouse',
      pointerId: DRAG_POINTER_ID,
      clientX: input.clientX ?? 0,
      clientY: input.clientY ?? 0,
      button: button.button,
      buttons: button.buttons,
      altKey: input.altKey ?? false,
      ctrlKey: input.ctrlKey ?? false,
      shiftKey: input.shiftKey ?? false,
      metaKey: input.metaKey ?? false,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** Move the active drag, with `target` under the pointer. */
function moveTo(target: Element | null, input: DragEventInput = {}): void {
  if (!dragSource) {
    return;
  }
  hitTarget = target;
  dispatchPointer('pointermove', dragSource, input, MOVING);
}

/**
 * Synchronous drag steps, each wrapped in `act`. Unlike the async helpers below,
 * they don't flush the engine's frame, so a test controls exactly when it runs.
 */
export const fireDrag = {
  /**
   * Press on `source`, move past the activation distance, then settle back onto
   * the press point so the drag is positioned exactly where the gesture began.
   * Nothing is under the pointer until a `dragEnter`/`dragOver` routes a target.
   */
  dragStart(source: HTMLElement, input: DragEventInput = {}): void {
    act(() => {
      installElementFromPoint();
      hitTarget = null;
      dragSource = source;
      dispatchPointer('pointerdown', source, input, PRESSED);
      dispatchPointer(
        'pointermove',
        source,
        { ...input, clientX: (input.clientX ?? 0) + DRAG_ACTIVATION_DISTANCE_PX },
        MOVING,
      );
      dispatchPointer('pointermove', source, input, MOVING);
    });
  },
  /** Move onto `target`. The engine resolves it on its next frame. */
  dragEnter(target: Element, input?: DragEventInput): void {
    act(() => moveTo(target, input));
  },
  /** Keep moving over `target`. */
  dragOver(target: Element, input?: DragEventInput): void {
    act(() => moveTo(target, input));
  },
  /** Move off every target. */
  dragLeave(input?: DragEventInput): void {
    act(() => moveTo(null, input));
  },
  /** Release over `target`. */
  drop(target: Element, input: DragEventInput = {}): void {
    act(() => {
      if (!dragSource) {
        return;
      }
      hitTarget = target;
      dispatchPointer('pointerup', dragSource, input, RELEASED);
      dragSource = null;
    });
  },
  /** End the drag without a drop by pressing Escape, which cancels an active drag. */
  dragEnd(): void {
    act(() => {
      if (!dragSource) {
        return;
      }
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      dragSource = null;
    });
  },
};

/**
 * Flush one requestAnimationFrame tick.
 * Uses rAF directly so it works both in JSDOM (where rAF is mapped to
 * setTimeout) and in real browsers (where rAF runs on the next paint frame).
 */
export async function flushRaf(): Promise<void> {
  await act(async () => {
    await waitSingleFrame();
  });
}

// ---------------------------------------------------------------------------
// Drag sequence helpers
// ---------------------------------------------------------------------------
//
// `fireDrag` steps paced like the engine. Moves resolve on the next frame, so
// starting, entering, and hovering flush it. Dropping is synchronous.

/** Start a drag on an element and flush the engine's next frame. */
export async function lift(
  element: HTMLElement,
  input?: DragEventInput & {
    /**
     * Skip the started-drag check, for a lift that must not start a drag, such
     * as on a disabled draggable.
     */
    expectNoDrag?: boolean | undefined;
  },
): Promise<void> {
  const { expectNoDrag = false, ...overrides } = input ?? {};
  fireDrag.dragStart(element, overrides);
  await flushRaf();
  // `dragStart` clears the default 5px mouse activation with a fixed
  // `DRAG_ACTIVATION_DISTANCE_PX` move. A fixture with a larger activation distance
  // wouldn't start a drag, and the caller's `not.toHaveBeenCalled()` assertions
  // would pass for the wrong reason. Throw instead.
  if (!expectNoDrag && !isDragActive()) {
    throw new Error(
      'lift(): no drag session started after the activation move. ' +
        'The element may not be a registered draggable, or its activation constraint ' +
        '(custom distance/delay, disabled, onBeforeMoveStart cancel) kept the drag from starting. ' +
        'Drive the gesture manually, or pass `{ expectNoDrag: true }` when the lift is ' +
        'intentionally expected not to start a drag.',
    );
  }
}

/** Drag onto a drop target and flush so the engine's frame resolves it. */
export async function dragEnter(element: HTMLElement, input?: DragEventInput): Promise<void> {
  fireDrag.dragEnter(element, input);
  await flushRaf();
}

/** Continue dragging over a drop target. */
export async function dragOver(element: HTMLElement, input?: DragEventInput): Promise<void> {
  fireDrag.dragOver(element, input);
  await flushRaf();
}

/** Drop on a target. */
export function drop(element: HTMLElement, input?: DragEventInput): void {
  fireDrag.drop(element, input);
}

/** Cancel a drag by leaving every target, then pressing Escape. */
export function cancel(): void {
  fireDrag.dragLeave();
  fireDrag.dragEnd();
}

/** Force-end any pending drag state. Runs in `setupDragEngineTests()`'s `afterEach`. */
function resetDrag(): void {
  // Force-ending an active drag updates React state, such as `dragging` and
  // custom preview portals, on consumers that are still mounted. Flush those
  // updates inside `act` so teardown doesn't trigger the "not wrapped in
  // act(...)" warning.
  act(() => {
    reset();
    resetSyntheticSensor();
    // The published preview is React state, so it has to be cleared inside `act`
    // like the rest. A test that aborts mid-drag would otherwise leave the
    // overlay rendering the previous test's preview.
    clearPublishedDragPreview();
  });
  // Global state the sensors set but `reset()` doesn't clear. Without this, a
  // test that fails mid-drag would leave the next test with scrolling locked,
  // the drag cursor set, or its first click swallowed.
  resetDragRootLock();
  resetDragCursor();
  resetPostDragClick();
  // `reset()` clears the active monitors without dispatching `onMoveEnd`, so the
  // scroll monitor never runs its own teardown. A running loop would keep
  // scheduling frames and calling `scrollBy` in the next test, and keep the
  // previous test's detached source in memory.
  resetAutoScroller();
  // Clear any drop targets still registered on detached nodes, so a failed or
  // aborted test can't leak them into the next one.
  resetDropTargets();
  restoreElementFromPoint();
  dragSource = null;
  // Clear the touch target the synthetic pointer helpers remember, so one test's
  // gesture can't redirect the next test's touch and pen events.
  resetTouchTarget();
}

/**
 * Split `onMoveEnd` into a drop-only handler and the end handler, like the
 * engine's own drop dispatch. `onDrop` runs first, only for a committed drop,
 * with the target that received it. `onMoveEnd` always runs next, even when
 * `onDrop` throws.
 */
export function splitEnd<TPayload = unknown>(
  onDrop: (eventDetails: DragDropEventDetails<TPayload>) => void,
  onMoveEnd?: (eventDetails: MoveEndEventDetails<TPayload>) => void,
): (eventDetails: MoveEndEventDetails<TPayload>) => void {
  return (eventDetails) => {
    try {
      const target = eventDetails.target;
      if (eventDetails.reason === 'drop' && target !== null) {
        onDrop({ ...eventDetails, target });
      }
    } finally {
      onMoveEnd?.(eventDetails);
    }
  };
}
