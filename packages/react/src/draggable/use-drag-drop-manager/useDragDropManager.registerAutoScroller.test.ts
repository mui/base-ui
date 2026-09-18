import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer, isJSDOM, testDragKind } from '#test-utils';
import {
  createElement,
  flushRaf,
  lift,
  registerCleanup,
  setupDragEngineTests,
} from '../../../test/dnd';
import { resetForTests as resetSyntheticDrag } from '../../utils/drag-and-drop/synthetic/syntheticSensor';
import { reset } from '../../utils/drag-and-drop/core/lifecycleManager';
import { restrictToHorizontalAxis } from '../../utils/drag-and-drop/dragModifiers';
import { createKind } from '../../utils/drag-and-drop/dragKind';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';
import type { DragDropManager, RegisterAutoScrollerParameters } from '../../types/dragRegistration';
import type { DragAutoScrollFrameContext } from '../../utils/drag-and-drop/autoScroller';

// The synthetic-drag test below leaves an active session; clear its rAF tick
// in the extra teardown so it doesn't fire after `document` is torn down.
setupDragEngineTests({ extraAfterEach: resetSyntheticDrag });

describe('engine.registerAutoScroller', () => {
  const { renderDnd } = createDndRenderer();

  it('preserves native vertical scrolling when a handler only observes it', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    scroller.style.overflowX = 'hidden';
    scroller.style.overflowY = 'auto';
    const onDragScroll = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, { onDragScroll });
    await driveIntoEdgeZone(source, scroller);
    expect(onDragScroll).toHaveBeenCalled();
    expect(scroller.scrollBy).toHaveBeenCalled();
    const [event, eventDetails] = onDragScroll.mock.calls[0];
    expect(event).toMatchObject({ direction: 'vertical', x: 0, element: scroller });
    expect(eventDetails.reason).toBe('pointer');
    expect(eventDetails.event).toBeInstanceOf(Event);
    expect(eventDetails.isCanceled).toBe(false);
    expect(eventDetails.isConsumed).toBe(false);
  });

  it('keeps a custom surface engaged when its handler only prevents the default', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // No native overflow at all: a canvas that pans itself.
    const surface = createElement({ top: 0, height: 200, left: 0, width: 200 });
    const scrollBy = vi.fn();
    surface.scrollBy = scrollBy;
    const deltas: number[] = [];
    engine.registerDraggable(source, {});
    engine.registerAutoScroller(surface, {
      onDragScroll({ y }, eventDetails) {
        eventDetails.cancel();
        deltas.push(y);
        // The documented "canvas with bounds" pattern: propagation stops only
        // once the surface actually moved, which needs a non-zero delta first.
        if (y !== 0) {
          eventDetails.consume();
        }
      },
    });
    await lift(source, { clientX: 100, clientY: 10 });
    fireEvent.dragOver(surface, { clientX: 100, clientY: 190 });
    for (let frame = 0; frame < 6; frame += 1) {
      // eslint-disable-next-line no-await-in-loop
      await flushRaf();
    }
    // The first engaged frame is always 0 (ramp start); the surface must stay
    // engaged past it rather than being reset to 0 every frame.
    expect(deltas.length).toBeGreaterThan(2);
    expect(deltas.some((y) => y > 0)).toBe(true);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('allows custom movement even when native scrolling has reached its limit', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    scroller.scrollTop = 800;
    const pan = vi.fn();
    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {
      onDragScroll(details, eventDetails) {
        eventDetails.cancel();
        pan(details);
        eventDetails.consume();
      },
    });
    await driveIntoEdgeZone(source, scroller);
    expect(pan).toHaveBeenCalled();
    expect(pan.mock.calls.some(([details]) => details.direction === 'vertical')).toBe(true);
    expect(scroller.scrollBy).not.toHaveBeenCalled();
    expect(scroller.scrollTop).toBe(800);
  });

  it('stops an engaged loop when its last registration is cleaned up', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    engine.registerDraggable(source, {});
    const cleanup = engine.registerAutoScroller(scroller, {});
    await driveIntoEdgeZone(source, scroller);
    expect(scroller.scrollBy).toHaveBeenCalled();

    cleanup();
    // The scroll monitor releases on a microtask after the last registration goes.
    await Promise.resolve();
    vi.mocked(scroller.scrollBy).mockClear();
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).not.toHaveBeenCalled();
  });

  it('observes an excluded native axis without enabling its default scroll', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    scroller.style.overflowX = 'hidden';
    scroller.style.overflowY = 'auto';
    const onDragScroll = vi.fn();
    const scrollBy = vi.fn();
    scroller.scrollBy = scrollBy;
    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, { onDragScroll });
    await lift(source, { clientX: 100, clientY: 100 });
    fireEvent.dragOver(scroller, { clientX: 190, clientY: 190 });
    await flushRaf();
    await flushRaf();
    expect(onDragScroll.mock.calls.some(([event]) => event.direction === 'horizontal')).toBe(true);
    expect(scroller.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 0 }));
    expect(
      scrollBy.mock.calls.every(([options]) => typeof options === 'object' && options.left === 0),
    ).toBe(true);
  });

  it('a throwing native interceptor does not perform its default scroll', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {
      onDragScroll() {
        throw new Error('scroll failed');
      },
    });
    try {
      await driveIntoEdgeZone(source, scroller);
      expect(error).toHaveBeenCalled();
      expect(scroller.scrollBy).not.toHaveBeenCalled();
    } finally {
      fireEvent.dragEnd(source);
      error.mockRestore();
    }
  });

  it('returns a cleanup function', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const cleanup = engine.registerAutoScroller(el, {});
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('cleanup is safe to call twice', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const cleanup = engine.registerAutoScroller(el, {});
    cleanup();
    expect(() => cleanup()).not.toThrow();
  });

  // A scroller the loop can actually engage: a real overflow container (so
  // `isOverflowElement` accepts it) with room to scroll down, sitting under the
  // pointer's bottom edge zone.
  function makeEngageableScroller(): HTMLElement {
    const scroller = createElement({ top: 0, height: 200, left: 0, width: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 200 });
    return scroller;
  }

  function enableUnrelatedViewport(engine: Pick<DragDropManager, 'registerAutoScroller'>): void {
    registerCleanup(engine.registerAutoScroller(document.createElement('div'), () => ({})));
  }

  // Drive the pointer into the scroller's bottom edge zone and let the loop run
  // a few frames. Routes the move through the scroller element so the native →
  // synthetic bridge replays it as a pointermove the engine resolves onto the
  // scroller (a `dragOver(window)` never reaches the bridge's document listener).
  async function driveIntoEdgeZone(source: HTMLElement, scroller: HTMLElement): Promise<void> {
    await lift(source, { clientX: 100, clientY: 10 });
    fireEvent.dragOver(scroller, { clientX: 100, clientY: 190 });
    await flushRaf();
    await flushRaf();
  }

  const MAX_SCROLL_SPEED = 900;
  const FRAME_MS = 16;

  // The applied delta is `depth * (MAX_SCROLL_SPEED / 1000) * deltaMs * rampFactor`,
  // where `deltaMs` and `rampFactor` come from rAF timestamps — and timestamps
  // advance on nobody's schedule (the jsdom stub in `test/setupVitest.ts` passes
  // `performance.now()`, a real browser its frame time), so exact magnitudes are
  // unpredictable. Wrap rAF so its callbacks receive a timestamp the test
  // drives, making the magnitudes exact in both environments.
  function installFrameClock() {
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    const scheduleFrame = originalRequestAnimationFrame.bind(globalThis);
    // Start above 0: the loop reads a `lastTimestamp` of 0 as "no previous frame".
    let now = 1000;
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      scheduleFrame(() => {
        callback(now);
      });
    registerCleanup(() => {
      globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    });
    return {
      advance(ms: number) {
        now += ms;
      },
    };
  }

  // The largest vertical delta applied since the mock was last cleared. Frames
  // that run while the clock is held still apply a 0 delta, so the maximum is
  // the single frame that saw the advance.
  function maxVerticalDelta(scroller: HTMLElement): number {
    const mock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    return Math.max(0, ...mock.mock.calls.map(([arg]) => Math.abs(arg.top ?? 0)));
  }

  it('engages the scroll loop and calls scrollBy when the pointer is in the edge zone', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {});

    await driveIntoEdgeZone(source, scroller);

    // Positive control for the `shouldScroll` / `cleanup` negatives below: with the
    // scroller genuinely overflowing and the pointer in its bottom edge zone, the
    // loop must fire `scrollBy` at least once.
    expect(scroller.scrollBy).toHaveBeenCalled();
    // Deltas must apply instantly: inheriting a CSS `scroll-behavior: smooth`
    // would turn each per-frame delta into a competing smooth animation.
    expect(scroller.scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'instant' }),
    );
  });

  it("keeps other scrollers scrolling when one scroller's onDragScroll throws", async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // Both scrollers share the same box and edge zones; the buggy one registers
    // (and would be visited) first.
    const buggy = makeEngageableScroller();
    const sane = makeEngageableScroller();

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(buggy, {
      onDragScroll() {
        throw new Error('onDragScroll boom');
      },
    });
    engine.registerAutoScroller(sane, {});

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await driveIntoEdgeZone(source, sane);

      // The throw was contained and logged (rejection path)...
      expect(consoleError).toHaveBeenCalled();
      // ...the buggy scroller was skipped, and the sane one still scrolled.
      expect(buggy.scrollBy).not.toHaveBeenCalled();
      expect(sane.scrollBy).toHaveBeenCalled();
    } finally {
      // End the drag before restoring the spy so later loop frames can't call
      // the throwing `shouldScroll` and log after the spy is gone.
      fireEvent.dragEnd(source);
      consoleError.mockRestore();
    }
  });

  it('keeps other scrollers scrolling when a scroller throws after stopping propagation', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const buggy = makeEngageableScroller();
    const sane = makeEngageableScroller();

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(buggy, {
      onDragScroll(_event, eventDetails) {
        eventDetails.consume();
        throw new Error('onDragScroll boom');
      },
    });
    engine.registerAutoScroller(sane, {});

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await driveIntoEdgeZone(source, sane);

      expect(consoleError).toHaveBeenCalled();
      expect(buggy.scrollBy).not.toHaveBeenCalled();
      expect(sane.scrollBy).toHaveBeenCalled();
    } finally {
      fireEvent.dragEnd(source);
      consoleError.mockRestore();
    }
  });

  it("keeps other scrollers scrolling when one scroller's parameters getter throws", async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const buggy = makeEngageableScroller();
    const sane = makeEngageableScroller();

    engine.registerDraggable(source, {});
    // The getter itself throws — before the engine can even read `shouldScroll`.
    engine.registerAutoScroller(buggy, () => {
      throw new Error('getParameters boom');
    });
    engine.registerAutoScroller(sane, {});

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await driveIntoEdgeZone(source, sane);

      expect(consoleError).toHaveBeenCalled();
      expect(buggy.scrollBy).not.toHaveBeenCalled();
      expect(sane.scrollBy).toHaveBeenCalled();
    } finally {
      fireEvent.dragEnd(source);
      consoleError.mockRestore();
    }
  });

  it('ignores scrollers registered from another document', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const local = makeEngageableScroller();

    // A scroller living in a different document whose (frame-local) rect happens
    // to overlap the drag's client coordinates. Edge-testing it against the top
    // document's coordinates would scroll the wrong document's container.
    const foreignDoc = document.implementation.createHTMLDocument('frame');
    const foreign = foreignDoc.createElement('div');
    foreign.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
    foreign.style.overflow = 'auto';
    foreign.scrollBy = vi.fn();
    Object.defineProperty(foreign, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(foreign, 'scrollHeight', { value: 1000 });
    Object.defineProperty(foreign, 'clientHeight', { value: 200 });
    foreignDoc.body.appendChild(foreign);

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(foreign, {});
    engine.registerAutoScroller(local, {});

    await driveIntoEdgeZone(source, local);

    // Positive control: the same coordinates engage the same-document scroller,
    // so the foreign one staying idle is the document check, not a dead loop.
    expect(local.scrollBy).toHaveBeenCalled();
    expect(foreign.scrollBy).not.toHaveBeenCalled();
  });

  it('preventDefault prevents native scrolling', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {
      onDragScroll: (_event, eventDetails) => {
        eventDetails.cancel();
      },
    });

    await driveIntoEdgeZone(source, scroller);

    // The pointer is in the edge zone of a real overflow container (the positive
    // control above proves that engages the loop), so a non-call here is `shouldScroll`
    // suppressing it, not the loop never engaging.
    expect(scroller.scrollBy).not.toHaveBeenCalled();
  });

  it('never scrolls an element without a scrollable overflow style', async () => {
    // A registration belongs on the element with scrollable overflow.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerCleanup(() => warnSpy.mockRestore());
    const { engine } = await renderDnd();
    const source = createElement();
    // Identical metrics to `makeEngageableScroller`, minus the `overflow: auto`
    // style: the content overflows, but the element is not an overflow
    // container, so the loop's style gate must reject it.
    const plain = createElement({ top: 0, height: 200, left: 0, width: 200 });
    plain.scrollBy = vi.fn();
    Object.defineProperty(plain, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(plain, 'scrollHeight', { value: 1000 });
    Object.defineProperty(plain, 'clientHeight', { value: 200 });

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(plain, {});

    await driveIntoEdgeZone(source, plain);
    expect(plain.scrollBy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('registered on an element that does not scroll'),
    );

    // Positive control: the same box with `overflow: auto`, registered
    // mid-drag while the live pointer is already parked in its bottom edge
    // zone, scrolls — so the non-call above is the gate, not a dead loop.
    const control = makeEngageableScroller();
    engine.registerAutoScroller(control, {});
    fireEvent.dragOver(control, { clientX: 100, clientY: 190 });
    await flushRaf();
    await flushRaf();
    await flushRaf();
    expect(control.scrollBy).toHaveBeenCalled();
    expect(plain.scrollBy).not.toHaveBeenCalled();
  });

  it('the last parameters getter registered on an element wins, and releasing it restores the first', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    // Asymmetric answers so both halves observe which hold is active: the
    // second allows the scroll the first forbids.
    const first = vi.fn<(context: DragAutoScrollFrameContext) => boolean>(() => false);
    const second = vi.fn<(context: DragAutoScrollFrameContext) => boolean>(() => true);

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {
      onDragScroll: (details, eventDetails) => {
        if (!first(details)) {
          eventDetails.cancel();
          return;
        }
      },
    });
    const releaseSecond = engine.registerAutoScroller(scroller, {
      onDragScroll: (details, eventDetails) => {
        if (!second(details)) {
          eventDetails.cancel();
          return;
        }
      },
    });

    // Two holds on one node (merged refs): only the last-registered one is read.
    await driveIntoEdgeZone(source, scroller);
    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
    expect(scrollByMock).toHaveBeenCalled();
    fireEvent.dragEnd(source);

    // Releasing the second hold un-shadows the first, whose `shouldScroll: false`
    // now suppresses the scroll the second allowed.
    releaseSecond();
    first.mockClear();
    second.mockClear();
    scrollByMock.mockClear();
    await driveIntoEdgeZone(source, scroller);
    expect(first).toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    expect(scrollByMock).not.toHaveBeenCalled();
    fireEvent.dragEnd(source);
  });

  it('cleanup removes registration', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // A delegating surface, whose `pan` would run every frame if the
    // registration were still live (see the positive control above). Not a plain
    // `overflow: auto` container: the ancestor walk infers one of those from the
    // hit element whether or not it was ever registered, so its scrolling would
    // outlive the cleanup and say nothing about the registry.
    const surface = createElement({ top: 0, height: 200, left: 0, width: 200 });
    const pan = vi.fn();

    engine.registerDraggable(source, {});
    const cleanupScroll = engine.registerAutoScroller(surface, {
      onDragScroll: (details, eventDetails) => {
        eventDetails.cancel();
        pan(details);
        eventDetails.consume();
      },
    });

    cleanupScroll();

    await driveIntoEdgeZone(source, surface);

    expect(pan).not.toHaveBeenCalled();
  });

  it('does not scroll when pointer is outside the element bounding box', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = createElement({ top: 50, height: 100, left: 50, width: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 100 });

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {});

    // Route moves through the scroller element so the bridge replays them as
    // pointer moves the engine resolves; each position is outside the scroller's
    // box, so the loop's bounding-box reject fires and never scrolls.
    await lift(source, { clientX: 55, clientY: 30 });

    // Above the scroller.
    fireEvent.dragOver(scroller, { clientX: 55, clientY: 30 });
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).not.toHaveBeenCalled();

    // Left of the scroller.
    fireEvent.dragOver(scroller, { clientX: 40, clientY: 100 });
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).not.toHaveBeenCalled();

    // Below the scroller.
    fireEvent.dragOver(scroller, { clientX: 100, clientY: 200 });
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).not.toHaveBeenCalled();
  });

  it("scrolls from the physical pointer, not the draggable's modifier-constrained point", async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // The scroller sits BELOW the row the drag starts on, the way a grid's
    // scrolling body sits below its header.
    const scroller = createElement({ top: 100, height: 200, left: 0, width: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 200 });

    const seenY: number[] = [];

    // The axis lock pins every reported input's y to the grab point (10), which
    // is outside the scroller entirely.
    engine.registerDraggable(source, { modifiers: restrictToHorizontalAxis });
    engine.registerAutoScroller(scroller, {
      onDragScroll: ({ input }) => {
        seenY.push(input.clientY);
      },
    });

    // The grab point is outside the scroller, so the loop parks on its first
    // frame and only the move below wakes it — a couple more frames than
    // `driveIntoEdgeZone` (which grabs inside the scroller) needs.
    await lift(source, { clientX: 100, clientY: 10 });
    // Into the scroller's bottom edge zone (edge size 50 of its 200px height).
    fireEvent.dragOver(scroller, { clientX: 100, clientY: 290 });
    await flushRaf();
    await flushRaf();
    await flushRaf();
    await flushRaf();

    expect(scroller.scrollBy).toHaveBeenCalled();
    // The callbacks see the same unconstrained point the edge test used, not the
    // pinned y the drag lifecycle reports.
    expect(seenY).toContain(290);
    expect(seenY).not.toContain(10);
  });

  it('still scrolls when a clamping modifier holds the physical pointer outside the container', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = createElement({ top: 0, height: 200, left: 0, width: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 200 });

    // The `restrictToElement` shape: the reported point is clamped into the list,
    // so pushing past its bottom leaves the *physical* pointer outside the
    // container while the drag itself stays in the bottom edge zone. Edge-testing
    // the raw point alone would skip the container here — and the candidate chain
    // is anchored at the clamped point, so the two halves would disagree.
    engine.registerDraggable(source, {
      modifiers: ({ point }) => ({ x: point.x, y: Math.min(point.y, 190) }),
    });
    engine.registerAutoScroller(scroller, {});

    await lift(source, { clientX: 100, clientY: 100 });
    // Physically past the bottom of the scroller (rect ends at 200).
    fireEvent.dragOver(scroller, { clientX: 100, clientY: 290 });
    await flushRaf();
    await flushRaf();
    await flushRaf();

    expect(scroller.scrollBy).toHaveBeenCalled();
  });

  it('a scroller registered mid-drag engages once a fresh move arrives', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    engine.registerDraggable(source, {});

    // Start the drag with NO scroller registered yet. Grab at the scroller's
    // vertical CENTRE (y=100 of 200), which is in no edge zone, so the frame the
    // registration below wakes finds nothing to scroll.
    await lift(source, { clientX: 100, clientY: 100 });

    // Register the scroller mid-drag: it joins the in-flight drag's candidate
    // set, but the pointer is parked at the centre — in no edge zone — so
    // nothing scrolls yet.
    engine.registerAutoScroller(scroller, {});
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).not.toHaveBeenCalled();

    // A pointer move into the bottom edge zone lets the mid-drag scroller
    // scroll. The sensor flushes `onMove` in its own frame, which wakes the
    // loop for the following frame.
    fireEvent.dragOver(scroller, { clientX: 100, clientY: 190 });
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).toHaveBeenCalled();
  });

  it('a scroller registered mid-drag under a stationary pointer engages without a fresh move', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // A custom scrolling surface starts outside the registry.
    const surface = createElement({ top: 0, height: 200, left: 0, width: 200 });
    const pan = vi.fn();

    engine.registerDraggable(source, {});

    // Park the pointer in the bottom edge zone of a container that is not yet a
    // candidate — nothing engages, so the loop parks itself. Flush until the
    // gesture pipeline is quiet too: the move's `onMove`/`onTargetChange`
    // trail wakes the loop for a frame or two afterwards, and a registration
    // landing inside that trail would be woken by the trail rather than by
    // itself, which is the opposite of what this pins.
    await lift(source, { clientX: 100, clientY: 10 });
    fireEvent.dragOver(surface, { clientX: 100, clientY: 190 });
    await flushRaf();
    await flushRaf();
    await flushRaf();
    await flushRaf();
    await flushRaf();
    expect(pan).not.toHaveBeenCalled();

    // The panel-opening case: the container is registered while the pointer has
    // already stopped moving, so no input will arrive to wake the parked loop.
    // The registration itself has to buy the frame.
    engine.registerAutoScroller(surface, {
      onDragScroll: (details, eventDetails) => {
        eventDetails.cancel();
        pan(details);
        eventDetails.consume();
      },
    });
    await flushRaf();
    await flushRaf();
    expect(pan).toHaveBeenCalled();
  });

  it('registering a second scroller mid-drag does not freeze an engaged scroll loop', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {});

    // Park the pointer in the scroller's bottom edge zone: the loop is engaged
    // and scrolls every frame with no further pointer movement.
    await driveIntoEdgeZone(source, scroller);
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    expect(scrollByMock).toHaveBeenCalled();
    scrollByMock.mockClear();

    // A second scroller mounting mid-drag must leave the running loop's input
    // and frame clock alone: the pointer is parked, so anything that re-seeded
    // or restarted the loop would halt a scroll with no fresh move to recover
    // on.
    const other = createElement({ top: 500, height: 100, left: 0, width: 100 });
    engine.registerAutoScroller(other, {});
    await flushRaf();
    await flushRaf();
    expect(scrollByMock).toHaveBeenCalled();
  });

  describe('accept', () => {
    const otherKind = createKind<unknown>('base-ui-test/other');

    it('skips a scroller whose accept does not match the drag kind', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Both share one box, and the mismatching scroller registers (and is
      // visited) first — a broken filter would let it consume the vertical
      // axis and starve the accepting one.
      const picky = makeEngageableScroller();
      const open = makeEngageableScroller();
      const pickyShouldScroll = vi.fn<(context: DragAutoScrollFrameContext) => boolean>(() => true);

      // The drag's kind is the renderer's default `testDragKind`.
      engine.registerDraggable(source, {});
      engine.registerAutoScroller(picky, {
        accept: otherKind,
        onDragScroll: (details, eventDetails) => {
          if (!pickyShouldScroll(details)) {
            eventDetails.cancel();
            return;
          }
        },
      });
      engine.registerAutoScroller(open, { accept: [otherKind, testDragKind] });

      await driveIntoEdgeZone(source, picky);

      // A drag this scroller doesn't accept neither scrolls it nor runs its
      // per-frame callbacks...
      expect(picky.scrollBy).not.toHaveBeenCalled();
      expect(pickyShouldScroll).not.toHaveBeenCalled();
      // ...while an array `accept` containing the drag's kind engages at the
      // very same coordinates (positive control).
      expect(open.scrollBy).toHaveBeenCalled();
    });
  });

  it('a drop target auto-scrolled under a stationary pointer becomes hovered', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    const target = createElement({ top: 150, height: 50, left: 0, width: 200 });
    const onDraggableEnter = vi.fn();

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {});
    engine.registerDropTarget(target, { onDraggableEnter });

    // Park the pointer in the scroller's bottom edge zone, hovering the
    // scroller itself: the loop engages and scrolls every frame.
    await driveIntoEdgeZone(source, scroller);
    expect(scroller.scrollBy).toHaveBeenCalled();
    expect(onDraggableEnter).not.toHaveBeenCalled();

    // The applied scroll moves the target under the parked pointer. jsdom
    // moves nothing, so model it directly: re-point the mocked
    // `elementFromPoint` at the target WITHOUT any pointer move. Every engaged
    // frame marks the sensor's frame dirty (`notifyExternalScroll`), so the
    // re-hit-test must pick the target up and fire its enter. The bridge's
    // pristine `elementFromPoint` is restored in the shared teardown.
    document.elementFromPoint = () => target;
    await flushRaf();
    await flushRaf();
    await flushRaf();
    expect(onDraggableEnter).toHaveBeenCalled();
  });

  it('stops scrolling when the pointer leaves the edge zone and re-engages on return', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {});

    await driveIntoEdgeZone(source, scroller);
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    expect(scrollByMock).toHaveBeenCalled();

    // Out of the zone: let the move settle, then the loop must go quiet.
    fireEvent.dragOver(scroller, { clientX: 100, clientY: 100 });
    await flushRaf();
    await flushRaf();
    scrollByMock.mockClear();
    await flushRaf();
    await flushRaf();
    expect(scrollByMock).not.toHaveBeenCalled();

    // Back into the zone: engagement restarts rather than staying parked. The
    // sensor frame flushes `onMove`, which wakes the loop for the next frame.
    fireEvent.dragOver(scroller, { clientX: 100, clientY: 190 });
    await flushRaf();
    await flushRaf();
    await flushRaf();
    expect(scrollByMock).toHaveBeenCalled();
  });

  it('caps the edge zone at 180px on a container taller than 720px', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // 1000px tall: the naive 25% rule would give a 250px edge zone, but the
    // zone tops out at MAX_EDGE_SIZE (180px), so it starts at y > 820.
    const scroller = createElement({ top: 0, height: 1000, left: 0, width: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 3000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 1000 });

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {});

    await lift(source, { clientX: 100, clientY: 500 });

    // 200px from the bottom edge: inside the naive 25% zone, outside the capped one.
    fireEvent.dragOver(scroller, { clientX: 100, clientY: 800 });
    await flushRaf();
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).not.toHaveBeenCalled();

    // 100px from the bottom edge: inside the capped 180px zone.
    fireEvent.dragOver(scroller, { clientX: 100, clientY: 900 });
    await flushRaf();
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).toHaveBeenCalled();
  });

  it('engages a scroller inside an open shadow root before its light-DOM ancestor scroller', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // A light-DOM ancestor scroller hosting an open shadow root whose own
    // scroller shares the same box. The depth sort walks composed parents
    // (piercing the shadow boundary), so the shadow scroller sorts deeper and
    // consumes the vertical axis first; a `parentElement`-only walk would read
    // the shadow child as depth 1 and hand the axis to the light-DOM ancestor.
    const outer = makeEngageableScroller();
    const host = document.createElement('div');
    outer.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    inner.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
    inner.style.overflow = 'auto';
    inner.scrollBy = vi.fn();
    Object.defineProperty(inner, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(inner, 'scrollHeight', { value: 1000 });
    Object.defineProperty(inner, 'clientHeight', { value: 200 });
    shadow.appendChild(inner);

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(outer, {});
    engine.registerAutoScroller(inner, {});

    // Both boxes span y=0..200, so y=190 is in both bottom edge zones.
    await driveIntoEdgeZone(source, outer);

    expect(inner.scrollBy).toHaveBeenCalled();
    expect(outer.scrollBy).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Nested scroll containers
  // ---------------------------------------------------------------------------
  //
  // These assert *which* scroller's `scrollBy` was called for a given pointer
  // position, and on which axis — all keyed on engagement INTENT, not the applied
  // delta. `scrollLoop` calls `scrollBy` (and marks the axis consumed) the moment
  // the pointer is in an edge zone, even on the ramp-up frame where the delta is 0.
  // That makes the depth-sort and per-axis hand-off observable without driving
  // frame timing, so these don't need Chromium.
  describe('nested scroll containers', () => {
    interface NestedScroller {
      element: HTMLElement;
      scrollBy: ReturnType<typeof vi.fn>;
    }

    function makeScroller(
      rect: { top: number; height: number; left: number; width: number },
      parent: HTMLElement = document.body,
      overflowBothAxes = false,
    ): NestedScroller {
      const element = document.createElement('div');
      element.getBoundingClientRect = () =>
        new DOMRect(rect.left, rect.top, rect.width, rect.height);
      element.style.overflow = 'auto';
      const scrollBy = vi.fn();
      element.scrollBy = scrollBy;
      Object.defineProperty(element, 'scrollTop', { value: 400, writable: true });
      Object.defineProperty(element, 'scrollHeight', { value: 1000 });
      Object.defineProperty(element, 'clientHeight', { value: rect.height });
      if (overflowBothAxes) {
        Object.defineProperty(element, 'scrollLeft', { value: 400, writable: true });
        Object.defineProperty(element, 'scrollWidth', { value: 1000 });
        Object.defineProperty(element, 'clientWidth', { value: rect.width });
      }
      parent.appendChild(element);
      registerCleanupElement(element);
      return { element, scrollBy };
    }

    // Track manually-created nodes so afterEach removes them (they bypass the
    // `createElement` helper's own tracking). The module-level
    // `setupDragEngineTests` already resets the engine; this only sweeps nodes.
    const extraNodes: HTMLElement[] = [];
    function registerCleanupElement(node: HTMLElement): void {
      extraNodes.push(node);
    }
    afterEach(() => {
      for (const node of extraNodes) {
        node.remove();
      }
      extraNodes.length = 0;
    });

    it('depth-sorts inner-first: only the inner scroller scrolls in its own edge zone', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Outer spans y=0..300; inner is nested inside it, spanning y=0..100 so its
      // bottom edge zone (y≈75..100) sits well inside the outer (whose bottom edge
      // is y≈225..300). A pointer at y=90 is in the inner's edge only.
      const outer = makeScroller({ top: 0, height: 300, left: 0, width: 200 });
      const inner = makeScroller({ top: 0, height: 100, left: 0, width: 200 }, outer.element);

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(outer.element, {});
      engine.registerAutoScroller(inner.element, {});

      await lift(source, { clientX: 100, clientY: 90 });
      fireEvent.dragOver(inner.element, { clientX: 100, clientY: 90 });
      await flushRaf();
      await flushRaf();

      // Inner is depth-sorted first and consumes the vertical axis in its edge
      // zone; the pointer isn't in the outer's edge zone at all, so outer stays idle.
      expect(inner.scrollBy).toHaveBeenCalled();
      expect(outer.scrollBy).not.toHaveBeenCalled();
    });

    it('per-axis hand-off: inner consumes vertical, outer scrolls horizontal', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Both containers share the same box so the pointer is in BOTH their bottom
      // edge (vertical) and right edge (horizontal) zones. Inner allows only the
      // vertical axis; outer allows all. Inner (depth-first) consumes vertical,
      // leaving the horizontal axis for the outer.
      const outer = makeScroller({ top: 0, height: 200, left: 0, width: 200 }, document.body, true);
      const inner = makeScroller({ top: 0, height: 200, left: 0, width: 200 }, outer.element, true);

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(outer.element, {});
      engine.registerAutoScroller(inner.element, {
        onDragScroll: (details, eventDetails) => {
          const allowedDirection = 'vertical';
          if (allowedDirection !== details.direction) {
            eventDetails.cancel();
            return;
          }
        },
      });

      await lift(source, { clientX: 190, clientY: 190 });
      fireEvent.dragOver(inner.element, { clientX: 190, clientY: 190 });
      await flushRaf();
      await flushRaf();

      // Inner engaged only the vertical axis (direction selection 'vertical'), so it never
      // touches `left`.
      expect(inner.scrollBy).toHaveBeenCalled();
      expect(inner.scrollBy.mock.calls.every(([arg]) => (arg.left ?? 0) === 0)).toBe(true);
      // The outer picked up the horizontal axis the inner didn't consume, without
      // double-scrolling the already-consumed vertical axis (top stays 0).
      expect(outer.scrollBy).toHaveBeenCalled();
      expect(outer.scrollBy.mock.calls.every(([arg]) => (arg.top ?? 0) === 0)).toBe(true);
    });

    it('hands the axis to the outer scroller when the inner sits at its scroll limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // The outer is mid-range; the inner shares its box but is fully scrolled
      // (800 + 200 === 1000), so its bottom edge cannot engage. The vertical
      // axis must fall through to the outer instead of dying on the deeper,
      // exhausted scroller.
      const outer = makeScroller({ top: 0, height: 200, left: 0, width: 200 });
      const inner = document.createElement('div');
      inner.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
      inner.style.overflow = 'auto';
      const innerScrollBy = vi.fn();
      inner.scrollBy = innerScrollBy;
      Object.defineProperty(inner, 'scrollTop', { value: 800, writable: true });
      Object.defineProperty(inner, 'scrollHeight', { value: 1000 });
      Object.defineProperty(inner, 'clientHeight', { value: 200 });
      outer.element.appendChild(inner);
      registerCleanupElement(inner);

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(outer.element, {});
      engine.registerAutoScroller(inner, {});

      await lift(source, { clientX: 100, clientY: 100 });
      fireEvent.dragOver(inner, { clientX: 100, clientY: 190 });
      await flushRaf();
      await flushRaf();
      await flushRaf();

      expect(innerScrollBy).not.toHaveBeenCalled();
      expect(outer.scrollBy).toHaveBeenCalled();
    });

    it('hands the axis to the outer scroller when an observing inner viewport sits at its limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const outer = makeScroller({ top: 0, height: 200, left: 0, width: 200 });
      const inner = document.createElement('div');
      inner.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
      inner.style.overflow = 'auto';
      const innerScrollBy = vi.fn();
      inner.scrollBy = innerScrollBy;
      Object.defineProperty(inner, 'scrollTop', { value: 800, writable: true });
      Object.defineProperty(inner, 'scrollHeight', { value: 1000 });
      Object.defineProperty(inner, 'clientHeight', { value: 200 });
      outer.element.appendChild(inner);
      registerCleanupElement(inner);
      // Neither prevents the default nor stops propagation: the analytics-style
      // handler from the docs. It must not withhold the axis from the outer.
      const observe = vi.fn();

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(outer.element, {});
      engine.registerAutoScroller(inner, { onDragScroll: observe });

      await lift(source, { clientX: 100, clientY: 100 });
      fireEvent.dragOver(inner, { clientX: 100, clientY: 190 });
      await flushRaf();
      await flushRaf();
      await flushRaf();

      expect(observe.mock.calls.some(([event]) => event.direction === 'vertical')).toBe(true);
      expect(innerScrollBy).not.toHaveBeenCalled();
      expect(outer.scrollBy).toHaveBeenCalled();
    });

    it('invalidates the depth-order cache across register/unregister', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Both containers share one rect, so they share one edge zone and the
      // pointer never has to move: which of them scrolls is decided by the depth
      // order alone, which is what this test is about.
      const outer = makeScroller({ top: 0, height: 100, left: 0, width: 200 });
      // A custom inner viewport competes with the native outer scroller.
      const inner = createElement({ top: 0, height: 100, left: 0, width: 200 });
      outer.element.appendChild(inner);
      const innerPan = vi.fn();

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(outer.element, {});
      const cleanupInner = engine.registerAutoScroller(inner, {
        onDragScroll: (details, eventDetails) => {
          eventDetails.cancel();
          innerPan(details);
          eventDetails.consume();
        },
      });

      // Lift mid-container (no edge zone), then move into the shared bottom edge
      // zone: inner is depth-sorted first and consumes both axes, so the outer
      // never sees them.
      // The grab point is in no edge zone, so the loop parks on its first frame
      // and only the move below wakes it — a few more frames than a lift inside
      // the zone needs (see the modifier test above).
      await lift(source, { clientX: 100, clientY: 50 });
      fireEvent.dragOver(inner, { clientX: 100, clientY: 90 });
      await flushRaf();
      await flushRaf();
      await flushRaf();
      await flushRaf();
      expect(innerPan).toHaveBeenCalled();
      expect(outer.scrollBy).not.toHaveBeenCalled();

      // Unregister the inner mid-drag with the pointer held exactly where it was
      // winning. The cached inner-first ordering has to be rebuilt without it, and
      // the outer — same rect, same edge zone, same point — has to take the axes
      // over. Nothing else about the frame changes, so a stale cache would simply
      // keep handing them to a scroller that is no longer registered.
      cleanupInner();
      innerPan.mockClear();
      outer.scrollBy.mockClear();
      // Re-fire the move at the same point. It changes nothing about the frame —
      // same input, same stack — but guarantees the loop is awake rather than
      // parked on the transition frame, and the outer re-engages from scratch
      // (its first ramp frame scrolls by 0), so a single frame would be
      // timing-sensitive in jsdom.
      fireEvent.dragOver(inner, { clientX: 100, clientY: 90 });
      await flushRaf();
      fireEvent.dragOver(inner, { clientX: 100, clientY: 90 });
      await flushRaf();
      await flushRaf();

      expect(outer.scrollBy).toHaveBeenCalled();
      expect(innerPan).not.toHaveBeenCalled();
    });

    // jsdom-only: the held frame clock keeps every rAF timestamp identical so
    // every `frameSpeed` is 0. In a real browser the timestamps advance and the
    // deltas become non-zero, so "engages with a 0 delta" is only observable here.
    it.skipIf(!isJSDOM)(
      'engages on intent: scrollBy fires on the first (delta-0) frame in an edge zone',
      async () => {
        installFrameClock();
        const { engine } = await renderDnd();
        const source = createElement();
        const scroller = makeScroller({ top: 0, height: 200, left: 0, width: 200 });

        engine.registerDraggable(source, {});
        engine.registerAutoScroller(scroller.element, {});

        // The loop must still call `scrollBy` (and mark the axis consumed) on
        // engagement intent alone — otherwise nested-scroller hand-off would break
        // on the ramp-up frame. Assert the call happened even though the delta is 0.
        await lift(source, { clientX: 100, clientY: 190 });
        fireEvent.dragOver(scroller.element, { clientX: 100, clientY: 190 });
        await flushRaf();
        await flushRaf();

        expect(scroller.scrollBy).toHaveBeenCalled();
        expect(scroller.scrollBy.mock.calls.every(([arg]) => (arg.top ?? 0) === 0)).toBe(true);
      },
    );
  });

  // ---------------------------------------------------------------------------
  // Inferred scroll containers
  // ---------------------------------------------------------------------------
  //
  describe('explicit scroll containers', () => {
    interface ExplicitScroller {
      element: HTMLElement;
      scrollBy: ReturnType<typeof vi.fn>;
    }

    function makeContainer({
      rect = { top: 0, height: 200, left: 0, width: 200 },
      parent = document.body,
      vertical = true,
      horizontal = false,
      overflow = 'auto',
    }: {
      rect?: { top: number; height: number; left: number; width: number };
      parent?: HTMLElement;
      vertical?: boolean;
      horizontal?: boolean;
      overflow?: string;
    } = {}): ExplicitScroller {
      const element = document.createElement('div');
      element.getBoundingClientRect = () =>
        new DOMRect(rect.left, rect.top, rect.width, rect.height);
      element.style.overflow = overflow;
      const scrollBy = vi.fn();
      element.scrollBy = scrollBy;
      const define = (name: string, value: number) =>
        Object.defineProperty(element, name, { configurable: true, value, writable: true });
      define('scrollTop', vertical ? 400 : 0);
      define('scrollHeight', vertical ? 1000 : rect.height);
      define('clientHeight', rect.height);
      define('scrollLeft', horizontal ? 400 : 0);
      define('scrollWidth', horizontal ? 1000 : rect.width);
      define('clientWidth', rect.width);
      parent.appendChild(element);
      registerCleanup(() => element.remove());
      return { element, scrollBy };
    }

    function makeNestedSource(parent: HTMLElement): HTMLElement {
      const source = createElement({ top: 90, height: 20, left: 0, width: 200 });
      parent.appendChild(source);
      return source;
    }

    async function driveTo(
      source: HTMLElement,
      hit: HTMLElement,
      clientX: number,
      clientY: number,
    ): Promise<void> {
      await lift(source, { clientX: 100, clientY: 100 });
      fireEvent.dragOver(hit, { clientX, clientY });
      await flushRaf();
      await flushRaf();
      await flushRaf();
    }

    it('does not scroll an unregistered ancestor when another viewport is registered', async () => {
      const { engine } = await renderDnd();
      const container = makeContainer();
      const source = makeNestedSource(container.element);

      engine.registerDraggable(source, {});
      enableUnrelatedViewport(engine);

      await driveTo(source, container.element, 100, 190);

      expect(container.scrollBy).not.toHaveBeenCalled();
    });

    it('does not scroll an unregistered nested container inside a viewport', async () => {
      const { engine } = await renderDnd();
      const outer = makeContainer();
      const inner = makeContainer({ parent: outer.element });
      const source = makeNestedSource(inner.element);
      engine.registerDraggable(source, {});
      engine.registerAutoScroller(outer.element, {});

      await driveTo(source, inner.element, 100, 190);

      expect(inner.scrollBy).not.toHaveBeenCalled();
      expect(outer.scrollBy).toHaveBeenCalled();
    });

    it('scrolls a registered container when its overflow changes mid-drag', async () => {
      const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
      registerCleanup(() => warning.mockRestore());
      const { engine } = await renderDnd();
      const container = makeContainer({ overflow: 'hidden' });
      const inner = document.createElement('div');
      inner.getBoundingClientRect = () => new DOMRect(0, 150, 200, 50);
      container.element.appendChild(inner);
      const source = makeNestedSource(container.element);

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(container.element, {});

      await driveTo(source, container.element, 100, 190);
      expect(container.scrollBy).not.toHaveBeenCalled();
      expect(warning).toHaveBeenCalledWith(expect.stringContaining('does not scroll'));

      container.element.style.overflow = 'auto';
      fireEvent.dragOver(inner, { clientX: 100, clientY: 190 });
      await flushRaf();
      await flushRaf();
      await flushRaf();

      expect(container.scrollBy).toHaveBeenCalled();
    });

    it('keeps shared ancestor style readings while moving between siblings', async () => {
      const { engine } = await renderDnd();
      const container = makeContainer();
      const first = document.createElement('div');
      const second = document.createElement('div');
      container.element.append(first, second);
      const source = createElement();
      engine.registerDraggable(source, {});
      engine.registerAutoScroller(container.element, {});

      await driveTo(source, first, 100, 190);

      const computedStyle = vi.spyOn(window, 'getComputedStyle');
      registerCleanup(() => computedStyle.mockRestore());
      fireEvent.dragOver(second, { clientX: 100, clientY: 190 });
      await flushRaf();
      await flushRaf();

      expect(computedStyle.mock.calls.some(([element]) => element === container.element)).toBe(
        false,
      );
    });

    it('refreshes a revisited container that was restyled outside the observed chains', async () => {
      const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
      registerCleanup(() => warning.mockRestore());
      const { engine } = await renderDnd();
      const first = makeContainer();
      const second = makeContainer({ rect: { left: 300, top: 0, width: 200, height: 200 } });
      const source = createElement();
      engine.registerDraggable(source, {});
      engine.registerAutoScroller(first.element, {});
      engine.registerAutoScroller(second.element, {});

      await driveTo(source, first.element, 100, 190);
      expect(first.scrollBy).toHaveBeenCalled();
      fireEvent.dragOver(second.element, { clientX: 400, clientY: 190 });
      await flushRaf();
      await flushRaf();
      expect(second.scrollBy).toHaveBeenCalled();

      await act(async () => {
        first.element.style.overflow = 'hidden';
      });
      first.scrollBy.mockClear();
      fireEvent.dragOver(first.element, { clientX: 100, clientY: 190 });
      await flushRaf();
      await flushRaf();

      expect(first.scrollBy).not.toHaveBeenCalled();
      expect(warning).toHaveBeenCalledWith(expect.stringContaining('does not scroll'));
    });

    it('scrolls a container nested inside the drop target the pointer is over', async () => {
      const { engine } = await renderDnd();
      const column = createElement({ top: 0, height: 200, left: 0, width: 200 });
      const list = makeContainer({ parent: column });
      const source = createElement();

      engine.registerDraggable(source, {});
      engine.registerDropTarget(column, {});
      engine.registerAutoScroller(list.element, {});

      await driveTo(source, list.element, 100, 190);

      expect(list.scrollBy).toHaveBeenCalled();
    });

    it('never engages a registered container with no scroll extent', async () => {
      const { engine } = await renderDnd();
      const container = makeContainer({ vertical: false });
      const source = makeNestedSource(container.element);

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(container.element, {});

      await driveTo(source, container.element, 100, 190);

      expect(container.scrollBy).not.toHaveBeenCalled();
    });

    it('hands the axis an inner viewport cannot scroll to the outer one', async () => {
      const { engine } = await renderDnd();
      const board = makeContainer({ vertical: false, horizontal: true });
      const column = makeContainer({ parent: board.element });
      const source = makeNestedSource(column.element);

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(board.element, {});
      engine.registerAutoScroller(column.element, {});

      await driveTo(source, column.element, 190, 190);

      expect(column.scrollBy).toHaveBeenCalled();
      expect(column.scrollBy.mock.calls.every(([arg]) => (arg.left ?? 0) === 0)).toBe(true);
      expect(board.scrollBy).toHaveBeenCalled();
      expect(board.scrollBy.mock.calls.every(([arg]) => (arg.top ?? 0) === 0)).toBe(true);
    });

    function renderTwoContainers() {
      const sourceContainer = makeContainer();
      const targetContainer = makeContainer();
      const source = makeNestedSource(sourceContainer.element);
      const target = document.createElement('div');
      target.getBoundingClientRect = () => new DOMRect(0, 150, 200, 50);
      targetContainer.element.appendChild(target);
      return { sourceContainer, targetContainer, source, target };
    }

    it('scrolls a registered target container without scrolling the unregistered source container', async () => {
      const { engine } = await renderDnd();
      const { sourceContainer, targetContainer, source, target } = renderTwoContainers();

      engine.registerDraggable(source, {});
      engine.registerDropTarget(target, {});
      engine.registerAutoScroller(targetContainer.element, {});

      await driveTo(source, target, 100, 190);

      expect(targetContainer.scrollBy).toHaveBeenCalled();
      expect(sourceContainer.scrollBy).not.toHaveBeenCalled();
    });

    it('still scrolls the container under the pointer when it is over no drop target', async () => {
      const { engine } = await renderDnd();
      const { targetContainer, source, target } = renderTwoContainers();

      engine.registerDraggable(source, {});
      engine.registerDropTarget(target, {});
      engine.registerAutoScroller(targetContainer.element, {});

      await driveTo(source, targetContainer.element, 100, 190);

      expect(targetContainer.scrollBy).toHaveBeenCalled();
    });

    it('scrolls a registered source container when the pointer hits an unrelated element', async () => {
      const { engine } = await renderDnd();
      const sourceContainer = makeContainer();
      const source = makeNestedSource(sourceContainer.element);
      const outsider = createElement({ top: 150, height: 50, left: 0, width: 200 });

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(sourceContainer.element, {});

      await driveTo(source, outsider, 100, 190);

      expect(sourceContainer.scrollBy).toHaveBeenCalled();
    });

    it('honors scroll cancellation on a registered viewport', async () => {
      const { engine } = await renderDnd();
      const container = makeContainer();
      const source = makeNestedSource(container.element);
      const shouldScroll = vi.fn<(context: DragAutoScrollFrameContext) => boolean>(() => false);

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(container.element, {
        onDragScroll: (details, eventDetails) => {
          if (!shouldScroll(details)) {
            eventDetails.cancel();
            return;
          }
        },
      });

      await driveTo(source, container.element, 100, 190);

      expect(shouldScroll).toHaveBeenCalled();
      expect(shouldScroll.mock.calls[0][0].element).toBe(container.element);
      expect(container.scrollBy).not.toHaveBeenCalled();
    });

    it('an accept that does not match keeps the container still for that drag', async () => {
      const { engine } = await renderDnd();
      const container = makeContainer();
      const source = makeNestedSource(container.element);

      engine.registerDraggable(source, {}); // the renderer's default `testDragKind`
      engine.registerAutoScroller(container.element, {
        accept: createKind<unknown>('base-ui-test/other-viewport'),
      });

      await driveTo(source, container.element, 100, 190);

      expect(container.scrollBy).not.toHaveBeenCalled();
    });

    it('does not scroll an unregistered ancestor with no scrollable overflow', async () => {
      const { engine } = await renderDnd();
      const viewport = makeContainer({ overflow: 'visible' });
      const source = makeNestedSource(viewport.element);

      engine.registerDraggable(source, {});
      // Another viewport keeps the scroll loop alive, so the non-call below is
      // the ancestor's, not a parked loop's.
      enableUnrelatedViewport(engine);

      await driveTo(source, viewport.element, 100, 190);

      expect(viewport.scrollBy).not.toHaveBeenCalled();
    });

    it('drives that same ancestor through an explicit pan registration', async () => {
      const { engine } = await renderDnd();
      const viewport = makeContainer({ overflow: 'visible' });
      const source = makeNestedSource(viewport.element);
      const pan = vi.fn();

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(viewport.element, {
        onDragScroll: (details, eventDetails) => {
          eventDetails.cancel();
          pan(details);
          eventDetails.consume();
        },
      });

      await driveTo(source, viewport.element, 100, 190);

      expect(pan).toHaveBeenCalled();
      expect(pan.mock.calls[0][0].element).toBe(viewport.element);
      expect(viewport.scrollBy).not.toHaveBeenCalled();
    });
  });

  // Page (viewport) scrolling
  // ---------------------------------------------------------------------------
  //
  // The page is the outermost scroll container of every drag — the ancestor
  // walk ends at the document root — and `document.documentElement` is also what
  // an app registers to configure it. Either way the loop bypasses the overflow
  // gate, measures the edge zones against the visual viewport, and scrolls
  // through the scrolling element. These tests install deterministic
  // metrics on the shared documentElement (jsdom reports 0 for all of them and
  // implements no `scrollBy`) as configurable own properties, restored through
  // the cleanup queue so later tests see a pristine root.
  describe('page scroller', () => {
    interface PageScrollerMock {
      element: HTMLElement;
      scrollBy: ReturnType<typeof vi.fn>;
    }

    function mockPageScroller(
      overrides: { scrollTop?: number; scrollLeft?: number } = {},
    ): PageScrollerMock {
      const element = document.documentElement;
      const scrollBy = vi.fn();
      const installed: PropertyKey[] = [];
      const define = (name: PropertyKey, value: unknown, writable = false) => {
        Object.defineProperty(element, name, { configurable: true, value, writable });
        installed.push(name);
      };
      // Viewport of 800×600 → vertical edge zones are 150px, horizontal 180px.
      define('clientWidth', 800);
      define('clientHeight', 600);
      define('scrollWidth', 2000);
      define('scrollHeight', 2000);
      // Mid-range scroll offsets so every direction has room by default.
      define('scrollTop', overrides.scrollTop ?? 500, true);
      define('scrollLeft', overrides.scrollLeft ?? 500, true);
      define('scrollBy', scrollBy);
      // What the root really reports mid-scroll: a rect spanning the whole
      // document with a negative top. Every test here runs against it, so edge
      // math still keyed on `getBoundingClientRect` (the historical bug) would
      // place the pointer outside every edge zone and fail these assertions.
      define('getBoundingClientRect', () => new DOMRect(0, -500, 800, 2000));
      registerCleanup(() => {
        for (const name of installed) {
          Reflect.deleteProperty(element, name);
        }
      });
      return { element, scrollBy };
    }

    // Lift at the viewport centre (no edge zone), then move to the given point.
    // Engagement comes solely from the `dragOver` here. The sensor flushes
    // `onMove` in its own frame, then the loop runs in the following frame.
    async function drive(source: HTMLElement, clientX: number, clientY: number): Promise<void> {
      await lift(source, { clientX: 400, clientY: 300 });
      fireEvent.dragOver(document.documentElement, { clientX, clientY });
      await flushRaf();
      await flushRaf();
    }

    it('does not engage with no auto-scroll registration', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerDraggable(source, {});

      await drive(source, 400, 590);

      expect(page.scrollBy).not.toHaveBeenCalled();
    });

    it('is suppressed by an imperative registration on the document root', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerDraggable(source, {});
      // The page can't be opted out with a component — `Draggable.Viewport`
      // renders a `<div>`, and there is nowhere to put one on `<html>` — so the
      // imperative registration is the escape hatch for it.
      registerCleanup(
        engine.registerAutoScroller(document.documentElement, () => ({
          onDragScroll: (_event, eventDetails) => {
            eventDetails.cancel();
          },
        })),
      );

      await drive(source, 400, 590);

      expect(page.scrollBy).not.toHaveBeenCalled();
    });

    it('engages at the viewport bottom edge and scrolls through the scrolling element', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerDraggable(source, {});
      registerCleanup(engine.registerAutoScroller(page.element, {}));

      await drive(source, 400, 590);

      expect(page.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'instant' }));
    });

    it('maps a default-styled body registration to the page scroller', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerDraggable(source, {});
      // `document.body` with default styling is not an overflow container of
      // its own, so the registration must map to the page scroller instead of
      // being silently inert.
      registerCleanup(engine.registerAutoScroller(document.body, {}));

      await drive(source, 400, 590);

      expect(page.scrollBy).toHaveBeenCalled();
    });

    // `<body>`'s overflow propagates to the viewport only while `<html>`'s
    // computed overflow is `visible` on both axes. The tests below pin both
    // sides of that rule: a propagating `body` stands in for the page (and can
    // lock it), a non-propagating one is a regular element.
    function styleOverflow(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
      const previous = {
        overflow: element.style.overflow,
        overflowX: element.style.overflowX,
        overflowY: element.style.overflowY,
      };
      Object.assign(element.style, styles);
      registerCleanup(() => {
        element.style.overflow = previous.overflow;
        element.style.overflowX = previous.overflowX;
        element.style.overflowY = previous.overflowY;
      });
    }

    it('scrolls the page when body hides one axis and html is visible', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();
      // A browser computes `overflow-x: hidden` alone to `overflow-y: auto`
      // (jsdom does not, so the pair is spelled out). That must not turn `body`
      // into a scroll container of its own — its `scrollBy` moves nothing — and
      // cut the page scroller out of the chain.
      styleOverflow(document.body, { overflowX: 'hidden', overflowY: 'auto' });
      // What a browser reports for a `body` spanning the viewport, so a `body`
      // wrongly treated as a container would engage here and consume the axis.
      const bodyScrollBy = vi.fn();
      const bodyProps: PropertyKey[] = [];
      const defineOnBody = (name: PropertyKey, value: unknown, writable = false) => {
        Object.defineProperty(document.body, name, { configurable: true, value, writable });
        bodyProps.push(name);
      };
      defineOnBody('clientHeight', 600);
      defineOnBody('scrollHeight', 2000);
      defineOnBody('scrollTop', 500, true);
      defineOnBody('scrollBy', bodyScrollBy);
      defineOnBody('getBoundingClientRect', () => new DOMRect(0, 0, 800, 600));
      registerCleanup(() => {
        for (const name of bodyProps) {
          Reflect.deleteProperty(document.body, name);
        }
      });

      engine.registerDraggable(source, {});
      registerCleanup(engine.registerAutoScroller(document.body, {}));

      await drive(source, 400, 590);

      expect(page.scrollBy).toHaveBeenCalled();
      expect(bodyScrollBy).not.toHaveBeenCalled();
    });

    it('ignores a hidden body when html sets its own overflow', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();
      // With `<html>` an overflow container, `body`'s overflow no longer
      // propagates to the viewport, so it cannot lock the page.
      styleOverflow(document.documentElement, { overflow: 'auto' });
      styleOverflow(document.body, { overflow: 'hidden' });

      engine.registerDraggable(source, {});
      registerCleanup(engine.registerAutoScroller(page.element, {}));

      await drive(source, 400, 590);

      expect(page.scrollBy).toHaveBeenCalled();
    });

    it('does not scroll the page vertically when html hides the vertical axis', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();
      styleOverflow(document.documentElement, { overflowY: 'hidden' });

      engine.registerDraggable(source, {});
      registerCleanup(engine.registerAutoScroller(page.element, {}));

      await drive(source, 400, 590);
      expect(page.scrollBy).not.toHaveBeenCalled();

      // The other axis stays live.
      fireEvent.dragOver(document.documentElement, { clientX: 700, clientY: 300 });
      await flushRaf();
      await flushRaf();
      expect(page.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy.mock.calls.every(([arg]) => (arg.top ?? 0) === 0)).toBe(true);
    });

    it('does not scroll the page horizontally when html hides the horizontal axis', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();
      styleOverflow(document.documentElement, { overflowX: 'hidden' });

      engine.registerDraggable(source, {});
      registerCleanup(engine.registerAutoScroller(page.element, {}));

      await drive(source, 700, 300);
      expect(page.scrollBy).not.toHaveBeenCalled();

      fireEvent.dragOver(document.documentElement, { clientX: 400, clientY: 590 });
      await flushRaf();
      await flushRaf();
      expect(page.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy.mock.calls.every(([arg]) => (arg.left ?? 0) === 0)).toBe(true);
    });

    it('does not scroll the page vertically when body hides the vertical axis and html is visible', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();
      // A `body`-based scroll lock: `body`'s overflow propagates to the viewport
      // while `<html>` stays `visible`, so the page is stopped on that axis.
      styleOverflow(document.body, { overflowY: 'hidden' });

      engine.registerDraggable(source, {});
      registerCleanup(engine.registerAutoScroller(page.element, {}));

      await drive(source, 400, 590);

      expect(page.scrollBy).not.toHaveBeenCalled();
    });

    it('measures edge zones against the viewport, not the scrolled document rect', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerDraggable(source, {});
      registerCleanup(engine.registerAutoScroller(page.element, {}));

      // Top edge of a page scrolled down by 500px. Against the mocked bounding
      // rect (top -500, height 2000) the pointer would sit 510px into a 2000px
      // box — in no edge zone; against the 600px viewport it is 10px from the
      // top, and `scrollTop` 500 leaves room to scroll back up.
      await drive(source, 400, 10);

      expect(page.scrollBy).toHaveBeenCalled();
    });

    it('engages at the viewport horizontal edge without touching the vertical axis', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerDraggable(source, {});
      registerCleanup(engine.registerAutoScroller(page.element, {}));

      // Right edge (x > 620), vertically centred (no vertical edge).
      await drive(source, 700, 300);

      expect(page.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy.mock.calls.every(([arg]) => (arg.top ?? 0) === 0)).toBe(true);
    });

    it('respects direction cancellation', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerDraggable(source, {});
      registerCleanup(
        engine.registerAutoScroller(page.element, {
          onDragScroll: (details, eventDetails) => {
            const allowedDirection = 'vertical';
            if (allowedDirection !== details.direction) {
              eventDetails.cancel();
              return;
            }
          },
        }),
      );

      // Left edge only: the sole engageable axis is horizontal, which
      // `direction selection: 'vertical'` forbids.
      await drive(source, 10, 300);

      expect(page.scrollBy).not.toHaveBeenCalled();
    });

    it('respects scroll cancellation', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerDraggable(source, {});
      registerCleanup(
        engine.registerAutoScroller(page.element, {
          onDragScroll: (_event, eventDetails) => {
            eventDetails.cancel();
          },
        }),
      );

      await drive(source, 400, 590);

      expect(page.scrollBy).not.toHaveBeenCalled();
    });

    it('does not scroll the page when only an inner viewport is registered', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();
      const inner = createElement({ top: 400, height: 200, left: 300, width: 200 });
      inner.style.overflow = 'auto';
      inner.scrollBy = vi.fn();
      Object.defineProperty(inner, 'scrollTop', { value: 400, writable: true });
      Object.defineProperty(inner, 'scrollHeight', { value: 1000 });
      Object.defineProperty(inner, 'clientHeight', { value: 200 });
      inner.appendChild(source);

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(inner, {});

      await drive(source, 400, 590);

      expect(inner.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy).not.toHaveBeenCalled();
    });

    it('an inner overflow container consumes the axis; the page is the outermost fallback', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();
      // An overflow container in the lower-middle of the viewport: its bottom
      // edge zone (y ≈ 550..600) lies inside the viewport's own bottom edge zone
      // (y > 450), while x = 400 is in neither one's horizontal edge.
      const inner = createElement({ top: 400, height: 200, left: 300, width: 200 });
      inner.style.overflow = 'auto';
      inner.scrollBy = vi.fn();
      Object.defineProperty(inner, 'scrollTop', { value: 400, writable: true });
      Object.defineProperty(inner, 'scrollHeight', { value: 1000 });
      Object.defineProperty(inner, 'clientHeight', { value: 200 });

      engine.registerDraggable(source, {});
      registerCleanup(engine.registerAutoScroller(page.element, {}));
      const cleanupInner = engine.registerAutoScroller(inner, {});

      await drive(source, 400, 590);

      // The root is every scroller's ancestor, so the depth sort visits it last:
      // the inner container consumes the vertical axis and the page stays idle.
      expect(inner.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy).not.toHaveBeenCalled();

      // With the inner gone, the same spot falls through to the page.
      cleanupInner();
      fireEvent.dragOver(document.documentElement, { clientX: 400, clientY: 590 });
      await flushRaf();
      fireEvent.dragOver(document.documentElement, { clientX: 400, clientY: 590 });
      await flushRaf();
      await flushRaf();
      await flushRaf();
      expect(page.scrollBy).toHaveBeenCalled();
    });

    it('applies the RTL home-edge normalization to the page scroller', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // RTL home position: `scrollLeft` is 0 and the full extent lies to the left.
      const page = mockPageScroller({ scrollLeft: 0 });
      page.element.style.direction = 'rtl';
      registerCleanup(() => page.element.style.removeProperty('direction'));

      engine.registerDraggable(source, {});
      registerCleanup(engine.registerAutoScroller(page.element, {}));

      // RIGHT (home) edge: naive LTR math (`0 + 800 < 2000`) would engage, but
      // there is nothing to scroll back toward.
      await drive(source, 700, 300);
      expect(page.scrollBy).not.toHaveBeenCalled();

      // LEFT edge holds the full extent — naive `scrollLeft > 0` would read the
      // page as non-scrollable and never engage.
      fireEvent.dragOver(document.documentElement, { clientX: 10, clientY: 300 });
      await flushRaf();
      await flushRaf();
      await flushRaf();
      expect(page.scrollBy).toHaveBeenCalled();
    });
  });

  // Real-viewport page scrolling: these need genuine layout, live document
  // scroll metrics, and `scrollingElement.scrollBy` actually moving the page.
  describe.skipIf(isJSDOM)('page scrolling (real viewport)', () => {
    function addSpacer(width: string, height: string): void {
      const spacer = document.createElement('div');
      spacer.style.width = width;
      spacer.style.height = height;
      document.body.appendChild(spacer);
      registerCleanup(() => spacer.remove());
    }

    it('scrolls the real page at the viewport bottom edge, including when already scrolled', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      addSpacer('10px', '4000px');
      registerCleanup(() => window.scrollTo(0, 0));

      engine.registerDraggable(source, {
        activation: { touch: { type: 'immediate' } },
      });
      registerCleanup(engine.registerAutoScroller(document.documentElement, {}));

      const centerX = Math.floor(document.documentElement.clientWidth / 2);
      const viewportHeight = document.documentElement.clientHeight;

      // Bottom edge from the top of the page: the page must scroll down.
      startTouchDrag(source, centerX, viewportHeight - 10);
      await waitForRampUp();
      expect(window.scrollY).toBeGreaterThan(0);
      endTouchDrag(centerX, viewportHeight - 10);

      // The historical bug: once the page is scrolled, the root's bounding rect
      // has a negative top, so rect-based edge math never engages again. From a
      // pre-scrolled page, the top edge must scroll back up.
      window.scrollTo(0, 500);
      const startY = window.scrollY;
      expect(startY).toBeGreaterThan(0);
      startTouchDrag(source, centerX, 10);
      await waitForRampUp();
      expect(window.scrollY).toBeLessThan(startY);
      endTouchDrag(centerX, 10);
    });

    it('honours the RTL home edge on the real page', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      document.documentElement.setAttribute('dir', 'rtl');
      registerCleanup(() => {
        document.documentElement.removeAttribute('dir');
        window.scrollTo(0, 0);
      });
      addSpacer('4000px', '10px');

      engine.registerDraggable(source, {
        activation: { touch: { type: 'immediate' } },
      });
      registerCleanup(engine.registerAutoScroller(document.documentElement, {}));

      const centerY = Math.floor(document.documentElement.clientHeight / 2);
      const viewportWidth = document.documentElement.clientWidth;

      // At the RTL home position the content extends to the LEFT; the right
      // (home) edge has nothing to scroll back toward.
      startTouchDrag(source, viewportWidth - 10, centerY);
      await waitForRampUp();
      expect(window.scrollX).toBeCloseTo(0);
      endTouchDrag(viewportWidth - 10, centerY);

      // The left edge scrolls into the content; the browser reports the offset
      // as negative in RTL.
      startTouchDrag(source, 10, centerY);
      await waitForRampUp();
      expect(window.scrollX).toBeLessThan(0);
      endTouchDrag(10, centerY);
    });
  });

  it('stops the scroll loop after a normal drop', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {});

    // Engage in the bottom edge zone: the loop reschedules itself every frame.
    await driveIntoEdgeZone(source, scroller);
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    expect(scrollByMock).toHaveBeenCalled();

    // A normal drop dispatches `onMoveEnd` to the scroll monitor, which must
    // tear the loop down — no further frames may scroll.
    fireEvent.drop(scroller, { clientX: 100, clientY: 190 });
    scrollByMock.mockClear();
    await flushRaf();
    await flushRaf();
    expect(scrollByMock).not.toHaveBeenCalled();
  });

  it('stops the scroll loop when the drag is torn down without an onDrop to monitors', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // Scrollable container whose top edge zone (y < 50) engages the loop.
    const scroller = createElement({ top: 0, height: 200, left: 0, width: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 200 });

    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {});

    // Park the pointer in the top edge zone so the loop engages and keeps
    // rescheduling itself while the drag is live.
    await lift(source, { clientX: 100, clientY: 10 });
    await flushRaf();
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    expect(scrollByMock).toHaveBeenCalled();

    // An abnormal end — a consumer callback throwing — tears the lifecycle down
    // via `reset()`, which runs `clearActiveMonitors()` WITHOUT ever dispatching
    // `onDrop` to the scroll monitor, so `stopScrollLoop` never fires. This is
    // the historical leak that left the loop scrolling forever; `reset()` here
    // reproduces exactly that teardown shape.
    act(() => {
      reset();
    });
    expect(dragSessionStore.getSnapshot()).toBeNull();

    // The loop must self-terminate now that no drag session is live.
    scrollByMock.mockClear();
    await flushRaf();
    await flushRaf();
    expect(scrollByMock).not.toHaveBeenCalled();
  });

  // The scroll DELTA passed to `scrollBy` is `depth * frameSpeed`, and
  // `frameSpeed` derives from the elapsed time between rAF timestamps. These
  // direction assertions read the delta's sign, so they need timestamps that
  // actually advance frame over frame — real Chromium scheduling, not the
  // stubbed `setTimeout` frames jsdom gets from `test/setupVitest.ts`.
  function startTouchDrag(source: HTMLElement, clientX: number, clientY: number) {
    act(() => {
      source.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerType: 'touch',
          pointerId: 1,
          clientX,
          clientY,
          button: 0,
          buttons: 1,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
  }

  function endTouchDrag(clientX: number, clientY: number) {
    act(() => {
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          pointerType: 'touch',
          pointerId: 1,
          clientX,
          clientY,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
  }

  async function waitForRampUp() {
    // Long enough for the ~400ms ramp-up to deliver non-zero scroll deltas.
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 500);
      });
    });
  }

  describe.skipIf(isJSDOM)('scroll direction and axis', () => {
    it('scrolls up in the top edge zone and down in the bottom edge zone', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // 200px tall scroller at y=0 → edge zone is the top/bottom 25% (50px).
      const scroller = createElement({ top: 0, height: 200, left: 0, width: 200 });
      scroller.style.overflow = 'auto';
      scroller.scrollBy = vi.fn();
      // Mid-range scrollTop so both up and down are possible.
      Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
      Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
      Object.defineProperty(scroller, 'clientHeight', { value: 200 });

      engine.registerDraggable(source, {
        activation: { touch: { type: 'immediate' } },
      });
      engine.registerAutoScroller(scroller, {});

      // Pointer in the top edge zone (y=10 of 200).
      startTouchDrag(source, 100, 10);
      await waitForRampUp();

      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
      const topDeltas = scrollByMock.mock.calls.map(([arg]) => arg.top);
      // The content must move up (negative top) and never down.
      expect(topDeltas.some((top) => top < 0)).toBe(true);
      expect(topDeltas.every((top) => top <= 0)).toBe(true);

      endTouchDrag(100, 10);
      scrollByMock.mockClear();

      // Second drag in the bottom edge zone (y=190 of 200).
      startTouchDrag(source, 100, 190);
      await waitForRampUp();

      const bottomDeltas = scrollByMock.mock.calls.map(([arg]) => arg.top);
      // The content must move down (positive top) and never up.
      expect(bottomDeltas.some((top) => top > 0)).toBe(true);
      expect(bottomDeltas.every((top) => top >= 0)).toBe(true);

      endTouchDrag(100, 190);
    });

    it('does not scroll horizontally when direction selection is "vertical" and the pointer is in a horizontal edge', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = createElement({ top: 0, height: 200, left: 0, width: 200 });
      scroller.style.overflow = 'auto';
      scroller.scrollBy = vi.fn();
      // Overflowing in both axes, scrolled mid-range so all directions are possible.
      Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
      Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
      Object.defineProperty(scroller, 'clientHeight', { value: 200 });
      Object.defineProperty(scroller, 'scrollLeft', { value: 400, writable: true });
      Object.defineProperty(scroller, 'scrollWidth', { value: 1000 });
      Object.defineProperty(scroller, 'clientWidth', { value: 200 });

      engine.registerDraggable(source, {
        activation: { touch: { type: 'immediate' } },
      });
      engine.registerAutoScroller(scroller, {
        onDragScroll: (details, eventDetails) => {
          const allowedDirection = 'vertical';
          if (allowedDirection !== details.direction) {
            eventDetails.cancel();
            return;
          }
        },
      });

      // Pointer in the LEFT edge (x=10) but vertically centred (y=100, no vertical edge).
      startTouchDrag(source, 10, 100);
      await waitForRampUp();

      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
      // The pointer is only in a horizontal edge; `direction selection: 'vertical'`
      // forbids horizontal scroll, and there is no vertical edge → no
      // horizontal scroll ever happens.
      expect(scrollByMock.mock.calls.every(([arg]) => arg.left === 0)).toBe(true);

      endTouchDrag(10, 100);
    });

    // RTL containers report `scrollLeft` as 0 at the home (right) edge, growing
    // NEGATIVE toward the end; the loop normalizes that before deciding whether
    // an edge can scroll. `scrollBy` deltas themselves stay in the same client
    // directions as LTR.
    function makeRtlScroller(scrollLeft: number): HTMLElement {
      const scroller = createElement({ top: 0, height: 200, left: 0, width: 200 });
      scroller.style.overflow = 'auto';
      scroller.style.direction = 'rtl';
      scroller.scrollBy = vi.fn();
      Object.defineProperty(scroller, 'scrollLeft', { value: scrollLeft, writable: true });
      Object.defineProperty(scroller, 'scrollWidth', { value: 1000 });
      Object.defineProperty(scroller, 'clientWidth', { value: 200 });
      return scroller;
    }

    it('scrolls an RTL container with correctly signed deltas at both horizontal edges', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Mid-range (-400 of a max extent of 800): both directions available.
      const scroller = makeRtlScroller(-400);

      engine.registerDraggable(source, {
        activation: { touch: { type: 'immediate' } },
      });
      engine.registerAutoScroller(scroller, {});

      // LEFT edge (x=10), vertically centred → scroll further leftward, so the
      // deltas must be negative and never positive.
      startTouchDrag(source, 10, 100);
      await waitForRampUp();
      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
      const leftEdgeDeltas = scrollByMock.mock.calls.map(([arg]) => arg.left);
      expect(leftEdgeDeltas.some((left) => left < 0)).toBe(true);
      expect(leftEdgeDeltas.every((left) => left <= 0)).toBe(true);

      endTouchDrag(10, 100);
      scrollByMock.mockClear();

      // RIGHT edge (x=190) → scroll back toward the home edge: positive deltas.
      startTouchDrag(source, 190, 100);
      await waitForRampUp();
      const rightEdgeDeltas = scrollByMock.mock.calls.map(([arg]) => arg.left);
      expect(rightEdgeDeltas.some((left) => left > 0)).toBe(true);
      expect(rightEdgeDeltas.every((left) => left >= 0)).toBe(true);

      endTouchDrag(190, 100);
    });

    it('detects the RTL home position: right edge is exhausted, left edge has the full extent', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Home position: `scrollLeft` is 0 in RTL.
      const scroller = makeRtlScroller(0);

      engine.registerDraggable(source, {
        activation: { touch: { type: 'immediate' } },
      });
      engine.registerAutoScroller(scroller, {});

      // RIGHT edge at home: nothing to scroll back toward. Naive LTR math
      // (`scrollLeft + clientWidth < scrollWidth` → 0 + 200 < 1000) would
      // wrongly engage here, so any call means the normalization regressed.
      startTouchDrag(source, 190, 100);
      await waitForRampUp();
      expect(scroller.scrollBy).not.toHaveBeenCalled();
      endTouchDrag(190, 100);

      // LEFT edge at home has the full extent available — naive LTR math
      // (`scrollLeft > 0`) would read it as non-scrollable and never engage.
      startTouchDrag(source, 10, 100);
      await waitForRampUp();
      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
      const leftEdgeDeltas = scrollByMock.mock.calls.map(([arg]) => arg.left);
      expect(leftEdgeDeltas.some((left) => left < 0)).toBe(true);
      endTouchDrag(10, 100);
    });
  });

  // ---------------------------------------------------------------------------
  // Scroll limits
  // ---------------------------------------------------------------------------
  //
  // A container sitting exactly at a limit must not engage at all: the loop
  // consumes the axis on engagement INTENT, so an engagement here would both
  // scroll past the limit and deny an outer scroller the axis. The `Math.ceil` /
  // `Math.floor` guards additionally reject a limit reached at a fractional
  // offset (Chrome 115+ reports fractional scroll units).
  describe('scroll limits', () => {
    // An overflow container whose scroll offsets the test controls, so a fixture
    // can sit at a limit rather than at the mid-range default. Overflows on both
    // axes, so each limit is rejected by its own guard rather than by the
    // container having nothing to scroll.
    function makeScrollerAt(offsets: { scrollTop?: number; scrollLeft?: number }): HTMLElement {
      const scroller = createElement({ top: 0, height: 200, left: 0, width: 200 });
      scroller.style.overflow = 'auto';
      scroller.scrollBy = vi.fn();
      const define = (name: string, value: number) =>
        Object.defineProperty(scroller, name, { value, writable: true });
      define('scrollTop', offsets.scrollTop ?? 400);
      define('scrollHeight', 1000);
      define('clientHeight', 200);
      define('scrollLeft', offsets.scrollLeft ?? 400);
      define('scrollWidth', 1000);
      define('clientWidth', 200);
      return scroller;
    }

    // Lift at the box's centre (in no edge zone), then move to the given point.
    async function drive(source: HTMLElement, scroller: HTMLElement, x: number, y: number) {
      await lift(source, { clientX: 100, clientY: 100 });
      fireEvent.dragOver(scroller, { clientX: x, clientY: y });
      await flushRaf();
      await flushRaf();
      await flushRaf();
    }

    it('does not scroll down when the container is already at its bottom limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Fully scrolled: 800 + 200 === 1000.
      const scroller = makeScrollerAt({ scrollTop: 800 });

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(scroller, {});

      await drive(source, scroller, 100, 190);

      expect(scroller.scrollBy).not.toHaveBeenCalled();
    });

    it('does not scroll down when the bottom limit is reached at a fractional offset', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Chrome 115+ fractional scroll units: 799.5 + 200 < 1000 reads as
      // scrollable, so without the `Math.ceil` guard the loop would engage and
      // overshoot the limit by half a pixel.
      const scroller = makeScrollerAt({ scrollTop: 799.5 });

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(scroller, {});

      await drive(source, scroller, 100, 190);

      expect(scroller.scrollBy).not.toHaveBeenCalled();
    });

    it('does not scroll up when the container is at the top limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeScrollerAt({ scrollTop: 0 });

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(scroller, {});

      await drive(source, scroller, 100, 10);

      expect(scroller.scrollBy).not.toHaveBeenCalled();
    });

    it('does not scroll right when the container is already at its right limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // 799.5 exercises the `Math.ceil` guard the exhausted right edge relies on.
      const scroller = makeScrollerAt({ scrollLeft: 799.5 });

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(scroller, {});

      await drive(source, scroller, 190, 100);

      expect(scroller.scrollBy).not.toHaveBeenCalled();
    });

    it('allows custom horizontal movement past the native right limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeScrollerAt({ scrollLeft: 800 });
      const pan = vi.fn();

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(scroller, {
        onDragScroll(details, eventDetails) {
          eventDetails.cancel();
          pan(details);
          eventDetails.consume();
        },
      });

      await drive(source, scroller, 190, 100);

      expect(pan.mock.calls.some(([details]) => details.direction === 'horizontal')).toBe(true);
      expect(scroller.scrollBy).not.toHaveBeenCalled();
      expect(scroller.scrollLeft).toBe(800);
    });

    it('proposes each axis separately at a corner, with the other delta at zero', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeScrollerAt({});
      const onDragScroll = vi.fn();

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(scroller, { onDragScroll });

      await drive(source, scroller, 190, 190);

      const horizontal = onDragScroll.mock.calls.filter(
        ([event]) => event.direction === 'horizontal',
      );
      const vertical = onDragScroll.mock.calls.filter(([event]) => event.direction === 'vertical');
      expect(horizontal.length).toBeGreaterThan(0);
      expect(vertical.length).toBeGreaterThan(0);
      expect(horizontal.every(([event]) => event.y === 0)).toBe(true);
      expect(vertical.every(([event]) => event.x === 0)).toBe(true);
    });

    it('does not scroll left when the container is at the left limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeScrollerAt({ scrollLeft: 0 });

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(scroller, {});

      await drive(source, scroller, 10, 100);

      expect(scroller.scrollBy).not.toHaveBeenCalled();
    });

    it('still scrolls at every edge of the same fixture when the limits are not reached', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Positive control for all five negatives above: the identical fixture,
      // mid-range on both axes, engages at each of those four points — so a
      // non-call there is the limit guard, not the loop failing to engage.
      const scroller = makeScrollerAt({ scrollTop: 400, scrollLeft: 400 });
      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(scroller, {});

      await lift(source, { clientX: 100, clientY: 100 });

      // Sequential by construction: each edge is driven from the pointer position
      // the previous one left behind.
      async function expectScrollAt(x: number, y: number): Promise<void> {
        scrollByMock.mockClear();
        fireEvent.dragOver(scroller, { clientX: x, clientY: y });
        await flushRaf();
        await flushRaf();
        await flushRaf();
        expect(scrollByMock, `edge at (${x}, ${y})`).toHaveBeenCalled();
      }

      await expectScrollAt(100, 190); // bottom
      await expectScrollAt(100, 10); // top
      await expectScrollAt(190, 100); // right
      await expectScrollAt(10, 100); // left
    });
  });

  // ---------------------------------------------------------------------------
  // Frame delta and depth weighting
  // ---------------------------------------------------------------------------
  describe('frame delta and depth weighting', () => {
    const MAX_FRAME_DELTA_MS = 64;

    // jsdom only: the fake frame clock feeds the loop its own timestamps, which
    // only drives deterministically against jsdom's setTimeout-backed rAF. Under
    // a real compositor the loop also sees real frames, so the per-frame delta
    // stops being the clock's to dictate.
    it.skipIf(!isJSDOM)('clamps the per-frame delta when the frame loop stalls', async () => {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      const scroller = makeEngageableScroller();

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(scroller, {});

      // `driveIntoEdgeZone` parks the pointer at y=190 of a 200px box, i.e. 0.8
      // deep into the 50px bottom edge zone.
      const depth = 0.8;
      await driveIntoEdgeZone(source, scroller);

      // Past the 400ms ramp, so `rampFactor` is 1 and the delta tracks `deltaMs` alone.
      clock.advance(1000);
      await flushRaf();
      await flushRaf();

      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
      scrollByMock.mockClear();
      clock.advance(FRAME_MS);
      await flushRaf();
      const normalFrame = maxVerticalDelta(scroller);
      expect(normalFrame).toBeCloseTo((depth * MAX_SCROLL_SPEED * FRAME_MS) / 1000, 5);

      // A stalled rAF — a long consumer `onMove`, a GC pause, a throttled tab —
      // resumes reporting a huge elapsed time.
      scrollByMock.mockClear();
      clock.advance(5000);
      await flushRaf();
      const stalledFrame = maxVerticalDelta(scroller);

      // The delta is capped at MAX_FRAME_DELTA_MS' worth of scrolling instead of
      // the 5 seconds' worth (~3600px) an unclamped `deltaMs` would apply.
      expect(stalledFrame).toBeCloseTo((depth * MAX_SCROLL_SPEED * MAX_FRAME_DELTA_MS) / 1000, 5);
      expect(stalledFrame / normalFrame).toBeCloseTo(MAX_FRAME_DELTA_MS / FRAME_MS, 5);
    });

    it.skipIf(!isJSDOM)(
      'ramps up over 400ms and restarts the ramp when the pointer re-enters the edge zone',
      async () => {
        const { engine } = await renderDnd();
        const clock = installFrameClock();
        const source = createElement();
        const scroller = makeEngageableScroller();

        engine.registerDraggable(source, {});
        engine.registerAutoScroller(scroller, {});

        // Engage at 0.8 depth (y=190 of the 200px box). The clock stands still,
        // so every engaged frame applies a 0 delta and the ramp's elapsed time is
        // exactly what `advance` dictates.
        await lift(source, { clientX: 100, clientY: 100 });
        fireEvent.dragOver(scroller, { clientX: 100, clientY: 190 });
        await flushRaf();
        await flushRaf();
        await flushRaf();
        const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
        expect(scrollByMock).toHaveBeenCalled();

        // One frame 200ms into the ramp: rampFactor 0.5. (The 200ms elapsed is
        // capped to a 64ms scroll delta — identical to the full-ramp frame below,
        // so the ratio isolates the ramp factor.)
        scrollByMock.mockClear();
        clock.advance(200);
        await flushRaf();
        await flushRaf();
        const midRamp = maxVerticalDelta(scroller);

        // Past 400ms of engagement: rampFactor 1 with the same capped delta.
        scrollByMock.mockClear();
        clock.advance(300);
        await flushRaf();
        await flushRaf();
        const fullRamp = maxVerticalDelta(scroller);

        expect(midRamp).toBeGreaterThan(0);
        expect(midRamp / fullRamp).toBeCloseTo(0.5, 5);

        // Leave the edge zone — the engagement bookkeeping resets...
        fireEvent.dragOver(scroller, { clientX: 100, clientY: 100 });
        await flushRaf();
        await flushRaf();
        await flushRaf();
        // ...and re-enter: the ramp starts over instead of resuming at full speed.
        fireEvent.dragOver(scroller, { clientX: 100, clientY: 190 });
        await flushRaf();
        await flushRaf();
        await flushRaf();
        scrollByMock.mockClear();
        clock.advance(200);
        await flushRaf();
        await flushRaf();
        const reEntry = maxVerticalDelta(scroller);

        expect(reEntry).toBeCloseTo(midRamp, 5);
        expect(reEntry).toBeLessThan(fullRamp);
      },
    );

    it('scrolls faster the deeper the pointer sits in the edge zone', async () => {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      const scroller = makeEngageableScroller();

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(scroller, {});

      // Lift at the box's vertical centre, in no edge zone.
      await lift(source, { clientX: 100, clientY: 100 });
      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;

      // Move to `clientY` and return the delta the loop applies for exactly one
      // 16ms frame there. The clock is held still while the move travels to the
      // loop (sensor frame → flushed `onMove`), so those frames apply a 0
      // delta and only the measured frame's elapsed time counts.
      async function measureAt(clientY: number): Promise<number> {
        fireEvent.dragOver(scroller, { clientX: 100, clientY });
        await flushRaf();
        await flushRaf();
        await flushRaf();
        scrollByMock.mockClear();
        clock.advance(FRAME_MS);
        await flushRaf();
        await flushRaf();
        return maxVerticalDelta(scroller);
      }

      // Every point below is inside the bottom edge zone (y ≥ 150), so the
      // element never disengages: its ramp-up runs once here and `rampFactor`
      // stays pinned at 1, leaving depth as the only variable.
      await measureAt(160);
      clock.advance(1000);
      await flushRaf();

      const shallow = await measureAt(160); // 0.2 deep
      const middle = await measureAt(180); // 0.6 deep
      const deep = await measureAt(199); // 0.98 deep

      // Speed rises with depth — the ramp only sets how fast that speed is reached.
      expect(shallow).toBeGreaterThan(0);
      expect(middle).toBeGreaterThan(shallow);
      expect(deep).toBeGreaterThan(middle);
      // Weighted by depth linearly, not merely ordered by it.
      expect(deep / shallow).toBeCloseTo(0.98 / 0.2, 5);
    });
  });

  // ---------------------------------------------------------------------------
  // maxSpeed
  // ---------------------------------------------------------------------------
  describe.skipIf(!isJSDOM)('maxSpeed', () => {
    // The delta one 16ms frame applies at full ramp, for a scroller registered
    // with `parameters`. The scroller sits at 0..200 and the pointer parks at
    // y=190, which is 0.8 of the way into the 50px bottom edge zone.
    async function measureFrameDelta(parameters: RegisterAutoScrollerParameters): Promise<number> {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      const scroller = makeEngageableScroller();

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(scroller, parameters);

      await driveIntoEdgeZone(source, scroller);
      // Past the 400ms ramp, so `rampFactor` is pinned at 1.
      clock.advance(1000);
      await flushRaf();
      await flushRaf();

      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
      scrollByMock.mockClear();
      clock.advance(FRAME_MS);
      await flushRaf();
      await flushRaf();

      return maxVerticalDelta(scroller);
    }

    const DEPTH = 0.8;
    const perFrame = (speed: number) => (DEPTH * speed * FRAME_MS) / 1000;

    it('scales the frame delta by a static value', async () => {
      expect(await measureFrameDelta({ maxSpeed: 300 })).toBeCloseTo(perFrame(300), 5);
    });

    it('defaults to 900 px/s when unset', async () => {
      // The positive control for the test above: the override is doing the work,
      // not the fixture.
      expect(await measureFrameDelta({})).toBeCloseTo(perFrame(900), 5);
    });

    it('accepts a callback, evaluated with the frame context', async () => {
      const seen: DragAutoScrollFrameContext[] = [];
      const delta = await measureFrameDelta({
        maxSpeed: (context) => {
          seen.push(context);
          return 1800;
        },
      });

      expect(delta).toBeCloseTo(perFrame(1800), 5);
      // The last call, not the first: the lift at y=10 lands in the scroller's
      // *top* edge zone, so the loop engages there before the move to y=190.
      expect(seen.length).toBeGreaterThan(0);
      const last = seen[seen.length - 1];
      expect(last.element.style.overflow).toBe('auto');
      expect(last.input.clientY).toBe(190);
    });

    // A negative speed would drive the container backwards and a `NaN` would
    // freeze it, both silently; neither is a state the loop should carry.
    it('falls back to the default for a negative speed', async () => {
      expect(await measureFrameDelta({ maxSpeed: -400 })).toBeCloseTo(perFrame(900), 5);
    });

    it('does not scroll at a speed of 0', async () => {
      // Distinct from the fallbacks above: `0` is a deliberate value, so it must
      // be honoured rather than replaced by the default.
      expect(await measureFrameDelta({ maxSpeed: 0 })).toBe(0);
    });

    it('lets the outer container take over when the inner one is pinned at 0', async () => {
      // A pinned container must not consume the axes it can never scroll, or the
      // outer one is blocked and the loop is held awake for nothing.
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      const outer = makeEngageableScroller();
      const inner = makeEngageableScroller();
      // Same box, so the pointer sits in both bottom edge zones; nesting is what
      // makes `inner` the one the depth order reaches first.
      outer.appendChild(inner);

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(inner, { maxSpeed: 0 });
      engine.registerAutoScroller(outer, {});

      await driveIntoEdgeZone(source, inner);
      clock.advance(1000);
      await flushRaf();
      await flushRaf();

      expect(inner.scrollBy).not.toHaveBeenCalled();
      expect(outer.scrollBy).toHaveBeenCalled();
    });

    it('falls back to the default for a speed that is not a number', async () => {
      expect(await measureFrameDelta({ maxSpeed: Number.NaN })).toBeCloseTo(perFrame(900), 5);
    });

    it('falls back to the default when the callback throws', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const delta = await measureFrameDelta({
          maxSpeed: () => {
            throw new Error('maxSpeed boom');
          },
        });
        expect(consoleError).toHaveBeenCalled();
        expect(delta).toBeCloseTo(perFrame(900), 5);
      } finally {
        // The drag has to end before the spy is restored, or later loop frames
        // log through the throwing callback after it is gone.
        reset();
        consoleError.mockRestore();
      }
    });

    it('scales an pan delta the same way', async () => {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      const viewport = createElement({ top: 0, height: 200, left: 0, width: 200 });
      viewport.style.overflow = 'visible';
      const pan = vi.fn();

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(viewport, {
        maxSpeed: 300,
        onDragScroll: (details, eventDetails) => {
          eventDetails.cancel();
          pan(details);
          eventDetails.consume();
        },
      });

      await lift(source, { clientX: 100, clientY: 100 });
      fireEvent.dragOver(viewport, { clientX: 100, clientY: 190 });
      await flushRaf();
      await flushRaf();
      await flushRaf();
      clock.advance(1000);
      await flushRaf();
      await flushRaf();

      pan.mockClear();
      clock.advance(FRAME_MS);
      await flushRaf();
      await flushRaf();

      const delegated = Math.max(0, ...pan.mock.calls.map(([context]) => context.y));
      expect(delegated).toBeCloseTo(perFrame(300), 5);
    });
  });

  // ---------------------------------------------------------------------------
  // pan
  // ---------------------------------------------------------------------------
  //
  // A delegating registration is an edge-detection viewport, not a scroll
  // container: the two things that define one — a scrollable overflow style and
  // a scroll extent to move within — must both stop being required, without
  // loosening either for a registration that doesn't delegate.
  describe('pan', () => {
    // The delegating counterpart to `makeEngageableScroller`: same box, but
    // deliberately NOT an overflow element and with no scroll metrics at all, so
    // every gate this feature is meant to skip would otherwise reject it.
    function makeViewport(): HTMLElement {
      const viewport = createElement({ top: 0, height: 200, left: 0, width: 200 });
      viewport.style.overflow = 'visible';
      viewport.scrollBy = vi.fn();
      return viewport;
    }

    // Lift at the box's centre — in no edge zone, so the activation nudge can't
    // engage the loop before the move below — then drive the pointer to `clientX`
    // / `clientY` and let it travel the pipeline.
    async function driveTo(
      source: HTMLElement,
      viewport: HTMLElement,
      clientX: number,
      clientY: number,
    ): Promise<void> {
      await lift(source, { clientX: 100, clientY: 100 });
      fireEvent.dragOver(viewport, { clientX, clientY });
      await flushRaf();
      await flushRaf();
      await flushRaf();
    }

    it('calls pan instead of scrolling the element', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const viewport = makeViewport();
      const pan = vi.fn();

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(viewport, {
        onDragScroll: (details, eventDetails) => {
          eventDetails.cancel();
          pan(details);
          eventDetails.consume();
        },
      });

      await driveTo(source, viewport, 100, 190);

      // An element with no scrollable overflow and no scroll extent still
      // engages, and the engine never touches its scroll offsets.
      expect(pan).toHaveBeenCalled();
      expect(viewport.scrollBy).not.toHaveBeenCalled();
    });

    it('does not engage the same element without pan', async () => {
      // A non-scrolling element with parameters trips the dev-only warning.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const { engine } = await renderDnd();
        const source = createElement();
        const viewport = makeViewport();

        engine.registerDraggable(source, {});
        engine.registerAutoScroller(viewport, {});

        await driveTo(source, viewport, 100, 190);

        // The negative control: that element is engageable only because it
        // delegates, not because the overflow gate stopped working.
        expect(viewport.scrollBy).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('registered on an element that does not scroll'),
        );
      } finally {
        warnSpy.mockRestore();
      }
    });

    // Each of the four `shouldScrollUp/Down/Left/Right` limit checks would reject an
    // element with no scroll extent, so all four have to be skipped — not just
    // the vertical pair a single fixture would cover.
    const EDGES = [
      { name: 'top', clientX: 100, clientY: 10 },
      { name: 'bottom', clientX: 100, clientY: 190 },
      { name: 'left', clientX: 10, clientY: 100 },
      { name: 'right', clientX: 190, clientY: 100 },
    ];

    for (const edge of EDGES) {
      it(`engages at the ${edge.name} edge with no scroll extent to move within`, async () => {
        const { engine } = await renderDnd();
        const source = createElement();
        const viewport = makeViewport();
        const pan = vi.fn();

        engine.registerDraggable(source, {});
        engine.registerAutoScroller(viewport, {
          onDragScroll: (details, eventDetails) => {
            eventDetails.cancel();
            pan(details);
            eventDetails.consume();
          },
        });

        await driveTo(source, viewport, edge.clientX, edge.clientY);

        expect(pan).toHaveBeenCalled();
      });
    }

    it('passes the same live drag context shouldScroll receives, plus the delta', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const viewport = makeViewport();
      const pan = vi.fn();

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(viewport, {
        onDragScroll: (details, eventDetails) => {
          eventDetails.cancel();
          pan(details);
          eventDetails.consume();
        },
      });

      await driveTo(source, viewport, 100, 190);

      const context = pan.mock.calls[0][0];
      expect(context.element).toBe(viewport);
      expect(context.source.element).toBe(source);
      expect(context.input.clientX).toBe(100);
      expect(context.input.clientY).toBe(190);
      expect(typeof context.x).toBe('number');
      expect(typeof context.y).toBe('number');
    });

    it('never runs for a drag its accept rejects', async () => {
      const accepted = createKind<undefined>('accepted-viewport-drag');
      const rejected = createKind<undefined>('rejected-viewport-drag');
      const { engine } = await renderDnd();
      const source = createElement();
      const viewport = makeViewport();
      const pan = vi.fn();

      engine.registerDraggable(source, { kind: rejected, payload: undefined });
      engine.registerAutoScroller(viewport, {
        accept: accepted,
        onDragScroll: (details, eventDetails) => {
          eventDetails.cancel();
          pan(details);
          eventDetails.consume();
        },
      });

      await driveTo(source, viewport, 100, 190);

      expect(pan).not.toHaveBeenCalled();
    });

    it('runs for a drag its accept matches', async () => {
      const accepted = createKind<undefined>('accepted-viewport-drag');
      const { engine } = await renderDnd();
      const source = createElement();
      const viewport = makeViewport();
      const pan = vi.fn();

      engine.registerDraggable(source, { kind: accepted, payload: undefined });
      engine.registerAutoScroller(viewport, {
        accept: accepted,
        onDragScroll: (details, eventDetails) => {
          eventDetails.cancel();
          pan(details);
          eventDetails.consume();
        },
      });

      await driveTo(source, viewport, 100, 190);

      // The positive control, so the rejection above isn't vacuous.
      expect(pan).toHaveBeenCalled();
    });

    it('reports no horizontal delta when direction selection excludes that axis', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const viewport = makeViewport();
      const pan = vi.fn();

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(viewport, {
        onDragScroll: (details, eventDetails) => {
          const allowedDirection = 'vertical';
          if (allowedDirection !== details.direction) {
            eventDetails.cancel();
            return;
          }
          eventDetails.cancel();
          pan(details);
          eventDetails.consume();
        },
      });

      // The pointer sits in the bottom AND right edge zones; only the vertical
      // one is allowed through. `x` is exactly 0 whatever the frame clock says,
      // so this holds in jsdom where every timestamp is the same.
      await driveTo(source, viewport, 190, 190);

      expect(pan).toHaveBeenCalled();
      expect(pan.mock.calls.every(([context]) => context.x === 0)).toBe(true);
    });

    // What a delegating surface returns is the only thing deciding which axes an
    // ancestor container gets, so every case is measured through the same
    // fixture: a delegating viewport nested inside a real scroll container that
    // shares its box. The pointer sits in the bottom AND right edge zones of
    // both, and the inner one is depth-sorted first.
    describe('axis hand-off', () => {
      // `outerAllowedAxis` restricts the outer container to a single axis, so
      // whether it engages at all *is* the per-axis signal. Reading the axis off
      // its `scrollBy` arguments instead would be vacuous: JSDOM pins every rAF
      // timestamp to 0, so both deltas are 0 whichever axis engaged.
      async function renderNested(
        onDragScroll: import('../../utils/drag-and-drop/autoScroller').DragAutoScrollHandler,
        outerAllowedAxis?: 'vertical' | 'horizontal',
      ) {
        const { engine } = await renderDnd();
        const source = createElement();

        const outer = document.createElement('div');
        outer.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
        outer.style.overflow = 'auto';
        const outerScrollBy = vi.fn();
        outer.scrollBy = outerScrollBy;
        const define = (name: string, value: number) =>
          Object.defineProperty(outer, name, { value, writable: true });
        define('scrollTop', 400);
        define('scrollHeight', 1000);
        define('clientHeight', 200);
        define('scrollLeft', 400);
        define('scrollWidth', 1000);
        define('clientWidth', 200);
        document.body.appendChild(outer);
        registerCleanup(() => {
          outer.remove();
        });

        const inner = document.createElement('div');
        inner.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
        inner.style.overflow = 'visible';
        outer.appendChild(inner);

        engine.registerDraggable(source, {});
        engine.registerAutoScroller(outer, {
          onDragScroll: (details, eventDetails) => {
            const allowedDirection = outerAllowedAxis ?? 'all';
            if (allowedDirection !== 'all' && allowedDirection !== details.direction) {
              eventDetails.cancel();
              return;
            }
          },
        });
        engine.registerAutoScroller(inner, { onDragScroll });

        await lift(source, { clientX: 100, clientY: 100 });
        fireEvent.dragOver(inner, { clientX: 190, clientY: 190 });
        await flushRaf();
        await flushRaf();
        await flushRaf();

        return { outerScrollBy, source };
      }

      it('stopping propagation claims both proposed axes', async () => {
        const { outerScrollBy } = await renderNested((_event, eventDetails) => {
          eventDetails.cancel();
          eventDetails.consume();
        });
        expect(outerScrollBy).not.toHaveBeenCalled();
      });

      it('stopping vertical propagation releases horizontal movement to the outer container', async () => {
        const { outerScrollBy } = await renderNested(({ direction }, eventDetails) => {
          eventDetails.cancel();
          if (direction === 'vertical') {
            eventDetails.consume();
          }
        }, 'horizontal');
        expect(outerScrollBy).toHaveBeenCalled();
      });

      it('stopping vertical propagation keeps the claimed direction', async () => {
        const { outerScrollBy } = await renderNested(({ direction }, eventDetails) => {
          eventDetails.cancel();
          if (direction === 'vertical') {
            eventDetails.consume();
          }
        }, 'vertical');
        // The counterpart to the test above, so "released the other axis" can't
        // pass by the inner having released both.
        expect(outerScrollBy).not.toHaveBeenCalled();
      });

      it('preventing the default without stopping propagation releases both axes', async () => {
        const { outerScrollBy } = await renderNested((_event, eventDetails) => {
          eventDetails.cancel();
        }, 'vertical');
        // A surface parked at its own bounds must not swallow the axis it didn't
        // move — including the vertical one every other return value holds on to.
        expect(outerScrollBy).toHaveBeenCalled();
      });

      it('a throwing pan is contained and hands both axes on', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        let result: Awaited<ReturnType<typeof renderNested>> | undefined;
        try {
          result = await renderNested(() => {
            throw new Error('pan boom');
          });

          expect(consoleError).toHaveBeenCalled();
          // The surface demonstrably didn't move, so it is treated exactly like
          // one that prevents the default without stopping propagation rather than silently eating the axes.
          expect(result.outerScrollBy).toHaveBeenCalled();
        } finally {
          // End the drag before restoring the spy, so later loop frames can't log
          // through the throwing callback after the spy is gone.
          if (result) {
            fireEvent.dragEnd(result.source);
          }
          consoleError.mockRestore();
        }
      });

      // A held frame clock reports the same timestamp for every frame, so the
      // ramp factor — and with it every delta — is pinned at 0. That makes this
      // the natural place to prove consumption keys off engagement intent rather
      // than the applied delta: the outer container must stay locked out even
      // though the inner one was handed a delta of exactly 0. jsdom-only so the
      // held clock owns rAF without fighting real browser scheduling.
      it.skipIf(!isJSDOM)('consumes the axes on the ramp-zero first frame', async () => {
        // Held frame clock: identical rAF timestamps keep every delta at 0.
        installFrameClock();
        const seen: number[] = [];
        const { outerScrollBy } = await renderNested(({ y }, eventDetails) => {
          eventDetails.cancel();
          eventDetails.consume();
          seen.push(y);
        });

        expect(seen.length).toBeGreaterThan(0);
        expect(seen.every((y) => y === 0)).toBe(true);
        expect(outerScrollBy).not.toHaveBeenCalled();
      });
    });

    it('parks the loop when the surface leaves the proposal alone', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const viewport = makeViewport();
      const pan = vi.fn<(context: DragAutoScrollFrameContext) => null>(() => null);

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(viewport, {
        // Neither prevented nor stopped: the surface declines the direction. The
        // default (a native scroll) is a no-op on an element with no overflow.
        onDragScroll: (details) => {
          pan(details);
        },
      });

      await driveTo(source, viewport, 100, 190);
      expect(pan).toHaveBeenCalled();

      // A surface that declines must not hold the loop awake, or it burns a
      // frame — and a sensor frame, through `notifyExternalScroll` — forever under
      // a stationary pointer. (Preventing the default is the opposite signal: it
      // keeps the surface engaged so its speed can ramp up from zero.)
      pan.mockClear();
      await flushRaf();
      await flushRaf();
      await flushRaf();
      expect(pan).not.toHaveBeenCalled();

      // Fresh input wakes it again.
      fireEvent.dragOver(viewport, { clientX: 100, clientY: 195 });
      await flushRaf();
      await flushRaf();
      await flushRaf();
      expect(pan).toHaveBeenCalled();
    });

    // The claim only a real browser can settle: after a delegated frame moves the
    // surface, the engine re-resolves what is under the pointer. JSDOM can't show
    // it — the test bridge pins `elementFromPoint`, so a transform there changes
    // nothing about which element answers.
    describe.skipIf(isJSDOM)('on a real transform surface', () => {
      it('resolves a drop target the pan brings under a stationary pointer', async () => {
        const { engine } = await renderDnd();
        const source = createElement();

        // A fixed clipping viewport with a tall content layer moved by a CSS
        // transform — no scroll offsets anywhere in the tree.
        const viewport = document.createElement('div');
        viewport.style.cssText =
          'position:fixed;left:0;top:0;width:400px;height:400px;overflow:hidden;';
        const content = document.createElement('div');
        content.style.cssText = 'position:absolute;left:0;top:0;width:400px;height:4000px;';
        // Starts 620px below the pointer, so only panning can bring it there.
        const target = document.createElement('div');
        target.style.cssText = 'position:absolute;left:0;top:1000px;width:400px;height:400px;';
        content.appendChild(target);
        viewport.appendChild(content);
        document.body.appendChild(viewport);
        registerCleanup(() => {
          viewport.remove();
        });

        let panned = 0;
        engine.registerDraggable(source, {
          activation: { touch: { type: 'immediate' } },
        });
        engine.registerAutoScroller(viewport, {
          onDragScroll: (details, eventDetails) => {
            eventDetails.cancel();
            (({ y }) => {
              panned += y;
              // Written synchronously, which is the contract the API documents:
              // the engine hit-tests against this on the very next frame.
              content.style.transform = `translateY(${-panned}px)`;
            })(details);
            eventDetails.consume();
          },
        });
        const onDraggableEnter = vi.fn();
        engine.registerDropTarget(target, { onDraggableEnter });

        // The pointer parks in the bottom edge zone and never moves again.
        startTouchDrag(source, 200, 380);
        await act(async () => {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 2000);
          });
        });

        expect(panned).toBeGreaterThan(620);
        expect(onDraggableEnter).toHaveBeenCalled();

        endTouchDrag(200, 380);
      });
    });

    it.skipIf(!isJSDOM)('reports the delta the element would have been scrolled by', async () => {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      const viewport = makeViewport();
      const pan = vi.fn();

      engine.registerDraggable(source, {});
      engine.registerAutoScroller(viewport, {
        onDragScroll: (details, eventDetails) => {
          eventDetails.cancel();
          pan(details);
          eventDetails.consume();
        },
      });

      await driveTo(source, viewport, 100, 190);
      // Past the 400ms ramp, so `rampFactor` is pinned at 1 and depth is the only
      // variable left.
      clock.advance(1000);
      await flushRaf();
      await flushRaf();

      pan.mockClear();
      clock.advance(FRAME_MS);
      await flushRaf();
      await flushRaf();

      // y=190 in a 0..200 box: the bottom edge zone is 50px deep, so the pointer
      // sits 0.8 of the way into it. Same formula the scrolling path applies.
      const depth = 0.8;
      const delegated = Math.max(0, ...pan.mock.calls.map(([context]) => context.y));
      expect(delegated).toBeCloseTo((depth * MAX_SCROLL_SPEED * FRAME_MS) / 1000, 5);
    });
  });
  it('scrolls during a synthetic (touch) drag when the pointer enters the edge zone', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = createElement();
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 100 });

    engine.registerDraggable(source, {
      activation: { touch: { type: 'immediate' } },
    });
    engine.registerAutoScroller(scroller, {});

    const down = new PointerEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 50,
      clientY: 95,
      button: 0,
      buttons: 1,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      source.dispatchEvent(down);
    });

    // Wait long enough for the ramp-up (~400ms) to deliver some scroll.
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 500);
      });
    });

    expect((scroller.scrollBy as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);

    const up = new PointerEvent('pointerup', {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 50,
      clientY: 95,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      window.dispatchEvent(up);
    });
  });
});

// Real layout only: jsdom has no scrolling, so every assertion above targets the
// `scrollBy` stub. These pin the sign and axis of what actually moves.
describe.skipIf(isJSDOM)('engine.registerAutoScroller (real scrolling)', () => {
  const { renderDnd } = createDndRenderer();

  function makeRealScroller(): HTMLElement {
    const scroller = document.createElement('div');
    scroller.style.cssText = 'position:fixed;top:0;left:0;width:200px;height:200px;overflow:auto;';
    const content = document.createElement('div');
    content.style.cssText = 'width:1000px;height:1000px;';
    scroller.appendChild(content);
    document.body.appendChild(scroller);
    registerCleanup(() => scroller.remove());
    return scroller;
  }

  async function settle(frames: number): Promise<void> {
    for (let index = 0; index < frames; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      await flushRaf();
    }
  }

  it('scrolls the container down and up through the vertical edge zones', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeRealScroller();
    scroller.scrollTop = 400;
    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {});

    await lift(source, { clientX: 100, clientY: 100 });
    fireEvent.dragOver(scroller, { clientX: 100, clientY: 195 });
    await settle(30);
    expect(scroller.scrollTop).toBeGreaterThan(400);

    const afterDown = scroller.scrollTop;
    fireEvent.dragOver(scroller, { clientX: 100, clientY: 5 });
    await settle(30);
    expect(scroller.scrollTop).toBeLessThan(afterDown);
    fireEvent.dragEnd(source);
  });

  it('scrolls the container right through the horizontal edge zone', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeRealScroller();
    scroller.scrollLeft = 400;
    engine.registerDraggable(source, {});
    engine.registerAutoScroller(scroller, {});

    await lift(source, { clientX: 100, clientY: 100 });
    fireEvent.dragOver(scroller, { clientX: 195, clientY: 100 });
    await settle(30);
    expect(scroller.scrollLeft).toBeGreaterThan(400);
    fireEvent.dragEnd(source);
  });
});
