/**
 * Shared drag-and-drop test utilities for the drag engine and its consumers.
 * Importing this module has no side effects.
 */
import { afterEach } from 'vitest';
import { act } from '@mui/internal-test-utils';
import { waitSingleFrame } from './wait';
import {
  getActiveSession,
  resetForTests as resetDragSession,
} from '../src/utils/drag-and-drop/core/dragSession';
import { resetForTests as resetSyntheticSensor } from '../src/utils/drag-and-drop/synthetic/syntheticSensor';
import { resetForTests as resetPickupRecognizer } from '../src/utils/drag-and-drop/synthetic/pickupRecognizer';
import { resetForTests as resetDropTargets } from '../src/utils/drag-and-drop/dropTarget';
import { unlock as resetDragRootLock } from '../src/utils/drag-and-drop/synthetic/dragRootLock';
import { unlock as resetDragCursor } from '../src/utils/drag-and-drop/synthetic/dragCursor';
import { resetForTests as resetPostDragClick } from '../src/utils/drag-and-drop/synthetic/postDragClick';
import { finishAllEndingPreviewsForTests } from '../src/utils/drag-and-drop/synthetic/syntheticPreview';
import { resetForTests as resetAutoScroller } from '../src/utils/drag-and-drop/autoScroller';
import { clearPublishedDragPreview } from '../src/utils/drag-and-drop/overlay/dragPreviewStore';
import { runAllCleanups } from '../src/utils/drag-and-drop/utils';
import { resetTouchTarget } from './syntheticPointer';
import type { DragDropEventDetails, MoveEndEventDetails } from '../src/utils/drag-and-drop/types';

// ---------------------------------------------------------------------------
// Fake elements
// ---------------------------------------------------------------------------

/**
 * Create a `<div>` appended to `document.body` with a controlled bounding rect.
 * The cleanup queue removes it after the test.
 */
export function createElement(
  rect: { top?: number; height?: number; left?: number; width?: number } = {},
): HTMLElement {
  const el = document.createElement('div');
  const { top = 0, height = 100, left = 0, width = 200 } = rect;
  el.getBoundingClientRect = () => new DOMRect(left, top, width, height);
  document.body.appendChild(el);
  registerCleanup(() => el.remove());
  return el;
}

// ---------------------------------------------------------------------------
// Cleanup queue
// ---------------------------------------------------------------------------

const cleanupQueue: Array<() => void> = [];

/**
 * Queue a cleanup function, usually returned by one of the engine's `register*`
 * methods, to run in `afterEach`, and return it. Cleanups run in reverse order.
 */
export function registerCleanup<T extends () => void>(fn: T): T {
  cleanupQueue.push(fn);
  return fn;
}

/**
 * Install the standard `afterEach` for drag engine tests: drain the cleanup queue (which
 * restores `elementFromPoint` mocks and removes `createElement()` elements), then force-end
 * any in-flight drag. Every step runs even if one throws (see `runAllCleanups`), so a broken
 * cleanup fails its own test instead of leaking engine state into later ones.
 */
export function setupDragEngineTests(): void {
  afterEach(() => {
    runAllCleanups([...cleanupQueue.splice(0).reverse(), resetDrag]);
  });
}

// ---------------------------------------------------------------------------
// Drag gestures
// ---------------------------------------------------------------------------
//
// `fireDrag` replays HTML5-style drag steps as mouse pointer gestures and points
// `document.elementFromPoint` at the element each step names, so it can't catch hit-testing
// bugs. Layout-dependent behavior needs a browser test (`describe.skipIf(isJSDOM)`) with raw
// pointer events, like the synthetic sensor's "documented pointer-drag recipe" tests.

type DragEventInput = Pick<PointerEventInit, 'clientX' | 'clientY' | 'shiftKey'>;

const DRAG_POINTER_ID = 1;
const PRESSED = { button: 0, buttons: 1 };
const MOVING = { button: -1, buttons: 1 };
const RELEASED = { button: 0, buttons: 0 };

// How far `dragStart` moves to clear the engine's 5px mouse activation distance.
const DRAG_ACTIVATION_DISTANCE_PX = 6;

// Source of the active drag. Move and up events are dispatched on it and bubble to
// the engine's document and window listeners.
let dragSource: HTMLElement | null = null;
// The element `document.elementFromPoint` returns, standing in for the element under the pointer.
let hitTarget: Element | null = null;
let hitTestInstalled = false;

// Uses `mockElementFromPoint` so this mock and a test's own are restored by the same
// cleanup queue, in reverse order.
function installElementFromPoint(): void {
  if (hitTestInstalled) {
    return;
  }
  hitTestInstalled = true;
  mockElementFromPoint(() => hitTarget);
  registerCleanup(() => {
    hitTestInstalled = false;
  });
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
      ...input,
      ...button,
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
   * Press on `source`, move past the activation distance, then move back so the drag
   * sits at the press point. Nothing is under the pointer until `dragEnter` or
   * `dragOver` names a target.
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
 * Flush `frames` animation frames, one at a time, inside `act`. Works in JSDOM,
 * where rAF is mapped to `setTimeout`, and in real browsers.
 */
export async function flushRaf(frames = 1): Promise<void> {
  for (let i = 0; i < frames; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      await waitSingleFrame();
    });
  }
}

/**
 * Replace `document.elementFromPoint` with `hitTest` until the test ends. Use it
 * when a test drives raw pointer events instead of `fireDrag`, which points the
 * hit test at the element each step names.
 */
export function mockElementFromPoint(hitTest: (x: number, y: number) => Element | null): void {
  const original = document.elementFromPoint;
  document.elementFromPoint = hitTest as typeof document.elementFromPoint;
  registerCleanup(() => {
    document.elementFromPoint = original;
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
  // `dragStart` only moves `DRAG_ACTIVATION_DISTANCE_PX`. A fixture with a larger
  // activation distance wouldn't start a drag, and the caller's
  // `not.toHaveBeenCalled()` assertions would pass for the wrong reason.
  if (!expectNoDrag && getActiveSession() === null) {
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
export async function dragEnter(element: Element, input?: DragEventInput): Promise<void> {
  fireDrag.dragEnter(element, input);
  await flushRaf();
}

/** Continue dragging over a drop target. */
export async function dragOver(element: Element, input?: DragEventInput): Promise<void> {
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

/**
 * Force-end any pending drag state. Runs in `setupDragEngineTests()`'s `afterEach`.
 * Every step runs even when an earlier one throws (see `setupDragEngineTests`).
 */
function resetDrag(): void {
  runAllCleanups([
    // These update React state on still-mounted consumers (`dragging`, preview
    // portals, the published preview), so run them in `act` to avoid the "not
    // wrapped in act(...)" warning. A test that aborts mid-drag would otherwise
    // leave the overlay rendering its preview.
    () =>
      act(() =>
        runAllCleanups([
          resetDragSession,
          resetSyntheticSensor,
          resetPickupRecognizer,
          clearPublishedDragPreview,
        ]),
      ),
    // Global state `resetDragSession` doesn't clear. A test that fails mid-drag would
    // otherwise leave scrolling locked, the drag cursor set, or the next click swallowed.
    resetDragRootLock,
    resetDragCursor,
    resetPostDragClick,
    // A dropped clone stays mounted until the next frame or its ending transition. A
    // test that ends right after `drop()` would leave it behind, and its ancestor
    // observer would re-home it to the body when the container is removed.
    finishAllEndingPreviewsForTests,
    // A test that fails mid-drag can leave the scroll monitor installed.
    resetAutoScroller,
    // Drop targets still registered on detached nodes would leak into the next test.
    resetDropTargets,
    () => {
      hitTarget = null;
      dragSource = null;
    },
    // Otherwise one test's touch target redirects the next test's touch and pen events.
    resetTouchTarget,
  ]);
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
        // A drop goes to the innermost target, so it is both `target` and `currentTarget`.
        onDrop({ ...eventDetails, target, currentTarget: target });
      }
    } finally {
      onMoveEnd?.(eventDetails);
    }
  };
}
