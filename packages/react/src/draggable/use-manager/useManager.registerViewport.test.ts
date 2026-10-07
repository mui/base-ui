import { describe, it, expect, vi } from 'vitest';
import { act, waitFor } from '@mui/internal-test-utils';
import { isJSDOM } from '#test-utils';
import { createDndRenderer, testDragKind } from '../../../test/dndEngine';
import {
  createElement,
  flushRaf,
  lift,
  mockElementFromPoint,
  registerCleanup,
  setupDragEngineTests,
  fireDrag,
  dragOver,
} from '../../../test/dnd';
import { touchDown, touchUp } from '../../../test/syntheticPointer';
import { resetForTests } from '../../utils/drag-and-drop/core/dragSession';
import { restrictToHorizontalAxis } from '../../utils/drag-and-drop/dragModifiers';
import { createKind } from '../../utils/drag-and-drop/dragKind';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';
import type { RegisterViewportParameters } from '../../utils/drag-and-drop/registrationTypes';
import type {
  DraggableViewportDragScrollEventDetails,
  DraggableViewportMaxSpeedContext,
} from '../viewport/DraggableViewport';

type DragAutoScrollHandler = NonNullable<RegisterViewportParameters['onDragScroll']>;

setupDragEngineTests();

// Feeds rAF callbacks a test-controlled timestamp so scroll deltas
// (`depth * (maxSpeed / 1000) * deltaMs * rampFactor`) are exact in jsdom and
// browsers. Install it before the drag starts: a real timestamp followed by the
// clock's would give the loop a negative delta.
function installFrameClock() {
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const scheduleFrame = originalRequestAnimationFrame.bind(globalThis);
  // Start above 0, because the loop treats a `lastTimestamp` of 0 as no previous frame.
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

// Runs an engaged loop past its 400ms ramp. The held frames engage the loop with
// a 0 delta, then a frame 500ms later applies a full-ramp delta (capped at 64ms)
// so the scroll has a direction to assert on.
async function runPastRamp(clock: ReturnType<typeof installFrameClock>): Promise<void> {
  await flushRaf(2);
  clock.advance(500);
  await flushRaf();
}

// Lifts at the center of the 200x200 fixtures, outside any edge zone so
// activation can't engage the loop, then moves over `hit`.
async function driveTo(
  source: HTMLElement,
  hit: Element,
  clientX: number,
  clientY: number,
): Promise<void> {
  await lift(source, { clientX: 100, clientY: 100 });
  fireDrag.dragOver(hit, { clientX, clientY });
  await flushRaf(2);
}

describe('engine.registerViewport', () => {
  const { renderDnd } = createDndRenderer();

  describe('overflow margins', () => {
    async function moveTo(scroller: HTMLElement, [clientX, clientY]: number[]): Promise<void> {
      fireDrag.dragOver(scroller, { clientX, clientY });
      await flushRaf(2);
    }

    it.each([
      { name: 'default', margin: undefined, x: 100, y: 210, scrolls: false },
      { name: 'top', margin: { top: 30 }, x: 100, y: -30, scrolls: true },
      { name: 'bottom', margin: { bottom: 30 }, x: 100, y: 230, scrolls: true },
      { name: 'left', margin: { left: 30 }, x: -30, y: 100, scrolls: true },
      { name: 'right', margin: { right: 30 }, x: 230, y: 100, scrolls: true },
      { name: 'beyond bottom', margin: { bottom: 30 }, x: 100, y: 231, scrolls: false },
      { name: 'omitted top', margin: { bottom: 30 }, x: 100, y: -1, scrolls: false },
      { name: 'outside cross axis', margin: { bottom: 30 }, x: 201, y: 210, scrolls: false },
      { name: 'corner', margin: 30, x: 220, y: 220, scrolls: true },
      { name: 'beyond corner', margin: 30, x: 231, y: 220, scrolls: false },
      { name: 'negative', margin: -30, x: 100, y: 210, scrolls: false },
      { name: 'infinite', margin: Infinity, x: 100, y: 210, scrolls: false },
      { name: 'NaN', margin: { bottom: NaN }, x: 100, y: 210, scrolls: false },
    ])(
      'resolves $name without changing the reported coordinates',
      async ({ margin, x, y, scrolls }) => {
        const { engine } = await renderDnd();
        const source = createElement();
        const scroller = makeEngageableScroller();
        const onDragScroll = vi.fn();
        engine.registerSource(source, {});
        engine.registerViewport(scroller, { overflowMargin: margin, onDragScroll });
        await driveTo(source, scroller, x, y);
        expect(onDragScroll.mock.calls.length > 0).toBe(scrolls);
        expect(
          onDragScroll.mock.calls.every(
            ([eventDetails]) =>
              eventDetails.input.clientX === x && eventDetails.input.clientY === y,
          ),
        ).toBe(true);
      },
    );

    it.each([
      { name: 'top', outside: [100, -60], margin: [100, -20] },
      { name: 'bottom', outside: [100, 260], margin: [100, 220] },
      { name: 'left', outside: [-60, 100], margin: [-20, 100] },
      { name: 'right', outside: [260, 100], margin: [220, 100] },
      { name: 'corner', outside: [260, 260], margin: [220, 220] },
    ])('only continues into the $name margin from inside', async ({ outside, margin }) => {
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeEngageableScroller();
      const onDragScroll = vi.fn();
      engine.registerSource(source, {});
      engine.registerViewport(scroller, { overflowMargin: 30, onDragScroll });
      await lift(source, { clientX: outside[0], clientY: outside[1] });

      await moveTo(scroller, margin);
      expect(onDragScroll).not.toHaveBeenCalled();
      await moveTo(scroller, [100, 100]);
      await moveTo(scroller, margin);
      expect(onDragScroll).toHaveBeenCalled();
      await moveTo(scroller, outside);
      onDragScroll.mockClear();
      await moveTo(scroller, margin);
      expect(onDragScroll).not.toHaveBeenCalled();
      await moveTo(scroller, [100, 100]);
      await moveTo(scroller, margin);
      expect(onDragScroll).toHaveBeenCalled();

      engine.cancelDrag();
      onDragScroll.mockClear();
      await lift(source, { clientX: margin[0], clientY: margin[1] });
      await flushRaf(2);
      expect(onDragScroll).not.toHaveBeenCalled();
    });

    it.each([
      { name: 'disabled', blocked: { disabled: true } },
      {
        name: 'rejecting the drag',
        blocked: { accept: createKind<unknown>('base-ui-test/other') },
      },
    ])('requires a new entry after the viewport is $name in the margin', async ({ blocked }) => {
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeEngageableScroller();
      const onDragScroll = vi.fn();
      let isBlocked = false;
      engine.registerSource(source, {});
      engine.registerViewport(scroller, () => ({
        overflowMargin: 30,
        onDragScroll,
        ...(isBlocked ? blocked : {}),
      }));
      await driveTo(source, scroller, 100, 220);
      expect(onDragScroll).toHaveBeenCalled();
      isBlocked = true;
      await moveTo(scroller, [100, 220]);
      isBlocked = false;
      onDragScroll.mockClear();
      await moveTo(scroller, [100, 220]);
      expect(onDragScroll).not.toHaveBeenCalled();
      await moveTo(scroller, [100, 100]);
      await moveTo(scroller, [100, 220]);
      expect(onDragScroll).toHaveBeenCalled();
    });

    it('tracks an outer margin while an inner viewport consumes both axes', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const outer = makeEngageableScroller();
      const inner = makeEngageableScroller();
      outer.appendChild(inner);
      inner.getBoundingClientRect = () => new DOMRect(0, 0, 400, 400);
      const onDragScroll = vi.fn();
      engine.registerSource(source, {});
      engine.registerViewport(outer, { overflowMargin: 30, onDragScroll });
      const unregisterInner = engine.registerViewport(inner, {
        onDragScroll: (details) => {
          details.cancel();
          details.consume();
        },
      });
      await lift(source, { clientX: 50, clientY: 50 });
      fireDrag.dragOver(inner, { clientX: 350, clientY: 350 });
      await flushRaf(2);
      unregisterInner();
      fireDrag.dragOver(outer, { clientX: 220, clientY: 220 });
      await flushRaf(2);
      expect(onDragScroll).not.toHaveBeenCalled();
    });

    it('caps outside engagement at the same speed as the real edge', async () => {
      const clock = installFrameClock();
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeEngageableScroller();
      engine.registerSource(source, {});
      engine.registerViewport(scroller, { overflowMargin: 160, maxSpeed: 100 });
      await driveTo(source, scroller, 100, 200);
      clock.advance(1000);
      await flushRaf();
      vi.mocked(scroller.scrollBy).mockClear();
      clock.advance(16);
      await flushRaf();
      const edgeDelta = maxVerticalDelta(scroller);
      expect(edgeDelta).toBeCloseTo(1.6);
      fireDrag.dragOver(scroller, { clientX: 100, clientY: 350 });
      await flushRaf(2);
      vi.mocked(scroller.scrollBy).mockClear();
      clock.advance(16);
      await flushRaf();
      expect(maxVerticalDelta(scroller)).toBeCloseTo(edgeDelta);
    });

    it('gives an inside viewport priority, then falls back to a deeper outside candidate at its limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const outside = makeEngageableScroller();
      const parent = createElement();
      parent.appendChild(outside);
      const inside = makeEngageableScroller();
      inside.getBoundingClientRect = () => new DOMRect(0, 100, 200, 200);
      engine.registerSource(source, {});
      engine.registerViewport(outside, { overflowMargin: { bottom: 160 } });
      engine.registerViewport(inside, {});
      await driveTo(source, inside, 100, 290);
      expect(inside.scrollBy).toHaveBeenCalled();
      expect(outside.scrollBy).not.toHaveBeenCalled();
      inside.scrollTop = inside.scrollHeight - inside.clientHeight;
      await flushRaf();
      expect(outside.scrollBy).toHaveBeenCalled();
    });

    it('uses modified positions inside a margin without scrolling the neighbour under the pointer', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const confined = makeEngageableScroller();
      const neighbour = makeEngageableScroller();
      neighbour.getBoundingClientRect = () => new DOMRect(200, 0, 200, 200);
      engine.registerSource(source, {
        modifiers: ({ point }) => ({ x: Math.min(point.x, 100), y: Math.min(point.y, 220) }),
      });
      engine.registerViewport(neighbour, {});
      engine.registerViewport(confined, { overflowMargin: { bottom: 30 } });
      await driveTo(source, neighbour, 300, 290);
      expect(confined.scrollBy).toHaveBeenCalled();
      expect(neighbour.scrollBy).not.toHaveBeenCalled();
    });

    it.each([false, true])(
      'respects custom movement with consume=%s outside the viewport',
      async (consume) => {
        const { engine } = await renderDnd();
        const source = createElement();
        const outer = makeEngageableScroller();
        const inner = makeEngageableScroller();
        outer.appendChild(inner);
        const pan = vi.fn();
        engine.registerSource(source, {});
        engine.registerViewport(outer, { overflowMargin: 30 });
        engine.registerViewport(inner, {
          overflowMargin: 30,
          onDragScroll: (details) => {
            details.cancel();
            pan(details);
            if (consume) {
              details.consume();
            }
          },
        });
        await driveTo(source, inner, 100, 220);
        expect(pan).toHaveBeenCalled();
        expect(inner.scrollBy).not.toHaveBeenCalled();
        expect(vi.mocked(outer.scrollBy).mock.calls.length > 0).toBe(!consume);
      },
    );

    it('keeps physical left/right margins in RTL', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeEngageableScroller();
      scroller.style.direction = 'rtl';
      Object.defineProperty(scroller, 'scrollWidth', { value: 1000 });
      Object.defineProperty(scroller, 'clientWidth', { value: 200 });
      Object.defineProperty(scroller, 'scrollLeft', { value: -400, writable: true });
      engine.registerSource(source, {});
      engine.registerViewport(scroller, { overflowMargin: { left: 30 } });
      await driveTo(source, scroller, -20, 100);
      expect(scroller.scrollBy).toHaveBeenCalledWith(
        expect.objectContaining({ left: expect.any(Number), top: 0 }),
      );
    });
  });

  it('reorders scrolling candidates when a registered viewport is reparented', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const outer = createElement();
    const inner = createElement();
    outer.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
    inner.getBoundingClientRect = () => new DOMRect(400, 0, 200, 200);
    const outerScroll = vi.fn<DragAutoScrollHandler>((details) => {
      details.cancel();
      details.consume();
    });
    const innerScroll = vi.fn<DragAutoScrollHandler>((details) => {
      details.cancel();
      details.consume();
    });
    engine.registerSource(source, {});
    engine.registerViewport(outer, { onDragScroll: outerScroll });
    engine.registerViewport(inner, { onDragScroll: innerScroll });
    await lift(source, { clientX: 190, clientY: 190 });
    await flushRaf();
    expect(outerScroll).toHaveBeenCalled();
    outerScroll.mockClear();
    innerScroll.mockClear();
    outer.appendChild(inner);
    inner.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
    await flushRaf(2);
    expect(innerScroll).toHaveBeenCalled();
    expect(outerScroll).not.toHaveBeenCalled();
  });

  it.each(['handler', 'parameters', 'speed'])(
    'stops the scroll frame when the %s callback cancels the drag',
    async (mode) => {
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeEngageableScroller();
      Object.defineProperty(scroller, 'scrollLeft', { value: 400, writable: true });
      Object.defineProperty(scroller, 'scrollWidth', { value: 1000 });
      Object.defineProperty(scroller, 'clientWidth', { value: 200 });
      let armed = false;
      const onDragScroll = vi.fn(() => engine.cancelDrag());
      engine.registerSource(source, {});
      engine.registerViewport(scroller, () => {
        if (armed && mode === 'parameters') {
          engine.cancelDrag();
        }
        return {
          maxSpeed: () => {
            if (armed && mode === 'speed') {
              engine.cancelDrag();
            }
            return 900;
          },
          onDragScroll,
        };
      });
      await lift(source, { clientX: 100, clientY: 100 });
      armed = true;
      fireDrag.dragOver(scroller, { clientX: 190, clientY: 190 });
      await flushRaf(2);
      expect(onDragScroll).toHaveBeenCalledTimes(mode === 'handler' ? 1 : 0);
      expect(scroller.scrollBy).not.toHaveBeenCalled();
      expect(dragSessionStore.state).toBeNull();
    },
  );

  it('re-observes the survivor once when a batch of viewports unmounts', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const survivor = makeEngageableScroller();
    engine.registerSource(source, {});
    engine.registerViewport(survivor, {});
    const removed = Array.from({ length: 20 }, () => makeEngageableScroller());
    const cleanups = removed.map((scroller) => engine.registerViewport(scroller, {}));
    await lift(source, { clientX: 100, clientY: 100 });
    await flushRaf(2);

    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    try {
      for (const cleanup of cleanups) {
        cleanup();
      }
      fireDrag.dragOver(survivor, { clientX: 100, clientY: 100 });
      await flushRaf(2);
      expect(observe.mock.calls.filter(([node]) => node === survivor)).toEqual([
        [survivor, expect.objectContaining({ subtree: true })],
      ]);
      expect(observe.mock.calls.some(([node]) => removed.includes(node as HTMLElement))).toBe(
        false,
      );
    } finally {
      observe.mockRestore();
    }
  });

  it('evaluates a viewport registered from inside a frame that then parks', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const outer = createElement({ top: 0, height: 400, left: 0, width: 400 });
    outer.style.overflow = 'auto';
    const inner = makeEngageableScroller();
    let armed = false;
    engine.registerSource(source, {});
    engine.registerViewport(outer, () => {
      if (armed) {
        armed = false;
        engine.registerViewport(inner, {});
      }
      return {};
    });
    // Inside the inner viewport's bottom edge zone, but outside the outer's.
    await lift(source, { clientX: 100, clientY: 190 });
    await flushRaf(2);
    armed = true;
    // `inner` is the later sibling in the same box, so it's the element on top.
    fireDrag.dragOver(inner, { clientX: 101, clientY: 190 });
    await flushRaf(4);
    expect(armed).toBe(false);
    expect(inner.scrollBy).toHaveBeenCalled();
  });

  it('ignores preview child changes while waking for ordinary viewport content changes', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    const preview = document.createElement('div');
    preview.setAttribute('data-base-ui-drag-preview', '');
    scroller.appendChild(preview);
    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});
    await lift(source, { clientX: 100, clientY: 100 });
    await flushRaf(2);

    const measure = vi.spyOn(scroller, 'getBoundingClientRect');
    try {
      preview.textContent = 'Updated preview';
      await flushRaf(2);
      expect(measure).not.toHaveBeenCalled();

      scroller.appendChild(document.createElement('div'));
      // The mutation observer schedules the frame after the DOM update.
      await waitFor(() => expect(measure).toHaveBeenCalled(), { interval: 16 });
    } finally {
      measure.mockRestore();
    }
  });

  it('checks a mutation batch for preview records only until it knows to wake the loop', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    const rows = Array.from({ length: 20 }, () =>
      scroller.appendChild(document.createElement('div')),
    );
    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});
    // The center is in no edge zone, so the loop parks and observes.
    await lift(source, { clientX: 100, clientY: 100 });
    await flushRaf(2);

    const matches = vi.spyOn(Element.prototype, 'matches');
    try {
      rows.forEach((row, index) => row.setAttribute('data-index', String(index)));
      await act(async () => {
        await Promise.resolve();
      });
      const previewChecks = matches.mock.calls.filter(
        ([selector]) => selector === '[data-base-ui-drag-preview]',
      );
      // One walk up from the first record, not one per record.
      expect(previewChecks.length).toBeLessThan(rows.length);
    } finally {
      matches.mockRestore();
    }
  });

  it('preserves native vertical scrolling when a handler only observes it', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    scroller.style.overflowX = 'hidden';
    scroller.style.overflowY = 'auto';
    const onDragScroll = vi.fn();
    engine.registerSource(source, {});
    engine.registerViewport(scroller, { onDragScroll });
    await driveIntoEdgeZone(source, scroller);
    expect(onDragScroll).toHaveBeenCalled();
    expect(scroller.scrollBy).toHaveBeenCalled();
    const [eventDetails] = onDragScroll.mock.calls[0];
    expect(eventDetails).toMatchObject({ direction: 'vertical', x: 0 });
    expect(eventDetails.element).toBe(scroller);
    expect(eventDetails.reason).toBe('none');
    expect(eventDetails.event).toBeInstanceOf(Event);
    expect(eventDetails.isCanceled).toBe(false);
    expect(eventDetails.isPropagationAllowed).toBe(false);
    expect(eventDetails.isConsumed).toBe(false);
  });

  it('keeps a custom surface engaged when its handler only cancels', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // No native overflow, like a canvas that pans itself.
    const surface = createElement({ top: 0, height: 200, left: 0, width: 200 });
    const scrollBy = vi.fn();
    surface.scrollBy = scrollBy;
    const deltas: number[] = [];
    engine.registerSource(source, {});
    engine.registerViewport(surface, {
      onDragScroll(eventDetails) {
        eventDetails.cancel();
        deltas.push(eventDetails.y);
        // The documented "canvas with bounds" pattern: consume only once the surface moved.
        if (eventDetails.y !== 0) {
          eventDetails.consume();
        }
      },
    });
    await lift(source, { clientX: 100, clientY: 10 });
    fireDrag.dragOver(surface, { clientX: 100, clientY: 190 });
    await flushRaf(6);
    // The ramp makes the first engaged frame's delta 0. The surface must stay
    // engaged past it instead of restarting at 0 every frame.
    expect(deltas.length).toBeGreaterThan(2);
    expect(deltas.some((y) => y > 0)).toBe(true);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('stops an engaged loop when its last registration is cleaned up', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    engine.registerSource(source, {});
    const cleanup = engine.registerViewport(scroller, {});
    await driveIntoEdgeZone(source, scroller);
    expect(scroller.scrollBy).toHaveBeenCalled();

    cleanup();
    // The scroll monitor releases on a microtask after the last registration goes.
    await Promise.resolve();
    vi.mocked(scroller.scrollBy).mockClear();
    await flushRaf(2);
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
    engine.registerSource(source, {});
    engine.registerViewport(scroller, { onDragScroll });
    await driveTo(source, scroller, 190, 190);
    expect(
      onDragScroll.mock.calls.some(([eventDetails]) => eventDetails.direction === 'horizontal'),
    ).toBe(true);
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
    engine.registerSource(source, {});
    engine.registerViewport(scroller, {
      onDragScroll() {
        throw new Error('scroll failed');
      },
    });
    try {
      await driveIntoEdgeZone(source, scroller);
      expect(error).toHaveBeenCalled();
      expect(scroller.scrollBy).not.toHaveBeenCalled();
    } finally {
      fireDrag.dragEnd();
      error.mockRestore();
    }
  });

  it('wakes a parked loop on refresh when the viewport is re-enabled under a still pointer', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    let disabled = true;
    engine.registerSource(source, {});
    engine.registerViewport(scroller, () => ({ disabled }));

    await driveIntoEdgeZone(source, scroller);
    expect(scroller.scrollBy).not.toHaveBeenCalled();

    disabled = false;
    engine.refresh(scroller);
    await flushRaf(2);
    expect(scroller.scrollBy).toHaveBeenCalled();
  });

  it('keeps a re-registration when a stale cleanup runs again', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    engine.registerSource(source, {});
    // One stable getter, as a Strict Mode remount or a ref callback registers it.
    const getParameters = () => ({});
    const staleCleanup = engine.registerViewport(scroller, getParameters);
    staleCleanup();
    engine.registerViewport(scroller, getParameters);
    staleCleanup();

    await driveIntoEdgeZone(source, scroller);
    expect(scroller.scrollBy).toHaveBeenCalled();
  });

  // A 200x200 overflow container at the origin with room to scroll either way vertically.
  function makeEngageableScroller(): HTMLElement {
    const scroller = createElement({ top: 0, height: 200, left: 0, width: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 200 });
    return scroller;
  }

  // Moves into the scroller's bottom edge zone and runs a few frames.
  async function driveIntoEdgeZone(source: HTMLElement, scroller: HTMLElement): Promise<void> {
    await lift(source, { clientX: 100, clientY: 10 });
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 190 });
    await flushRaf(2);
  }

  const MAX_SCROLL_SPEED = 900;
  const FRAME_MS = 16;

  // Frames on a held clock apply a 0 delta, so the maximum since the last
  // `mockClear` is the frame that saw the advance.
  function maxVerticalDelta(scroller: HTMLElement): number {
    const mock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    return Math.max(0, ...mock.mock.calls.map(([arg]) => Math.abs(arg.top ?? 0)));
  }

  it('engages the scroll loop and calls scrollBy when the pointer is in the edge zone', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    await driveIntoEdgeZone(source, scroller);

    // The negative tests that share this fixture rely on this positive.
    expect(scroller.scrollBy).toHaveBeenCalled();
    // An inherited `scroll-behavior: smooth` would animate each frame's delta.
    expect(scroller.scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'instant' }),
    );
  });

  it('keeps other scrollers scrolling when a scroller throws after consuming', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const buggy = makeEngageableScroller();
    const sane = makeEngageableScroller();

    engine.registerSource(source, {});
    engine.registerViewport(buggy, {
      onDragScroll(eventDetails) {
        eventDetails.consume();
        throw new Error('onDragScroll boom');
      },
    });
    engine.registerViewport(sane, {});

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await driveIntoEdgeZone(source, sane);

      expect(consoleError).toHaveBeenCalled();
      expect(buggy.scrollBy).not.toHaveBeenCalled();
      expect(sane.scrollBy).toHaveBeenCalled();
    } finally {
      fireDrag.dragEnd();
      consoleError.mockRestore();
    }
  });

  it("keeps other scrollers scrolling when one scroller's parameters getter throws", async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const buggy = makeEngageableScroller();
    const sane = makeEngageableScroller();

    engine.registerSource(source, {});
    // The getter itself throws, before the engine can read `onDragScroll`.
    engine.registerViewport(buggy, () => {
      throw new Error('getParameters boom');
    });
    engine.registerViewport(sane, {});

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await driveIntoEdgeZone(source, sane);

      expect(consoleError).toHaveBeenCalled();
      expect(buggy.scrollBy).not.toHaveBeenCalled();
      expect(sane.scrollBy).toHaveBeenCalled();
    } finally {
      fireDrag.dragEnd();
      consoleError.mockRestore();
    }
  });

  it('ignores scrollers registered from another document', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const local = makeEngageableScroller();

    // Its frame-local rect overlaps the drag point. Hit-testing it with the top
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

    engine.registerSource(source, {});
    engine.registerViewport(foreign, {});
    engine.registerViewport(local, {});

    await driveIntoEdgeZone(source, local);

    // Positive control: the same coordinates engage the local scroller, so the
    // foreign one stays idle because of the document check, not a dead loop.
    expect(local.scrollBy).toHaveBeenCalled();
    expect(foreign.scrollBy).not.toHaveBeenCalled();
  });

  it('never scrolls an element without a scrollable overflow style', async () => {
    // A registration belongs on the element with scrollable overflow.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerCleanup(() => warnSpy.mockRestore());
    const { engine } = await renderDnd();
    const source = createElement();
    // Same metrics as `makeEngageableScroller`, without `overflow: auto`.
    const plain = createElement({ top: 0, height: 200, left: 0, width: 200 });
    plain.scrollBy = vi.fn();
    Object.defineProperty(plain, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(plain, 'scrollHeight', { value: 1000 });
    Object.defineProperty(plain, 'clientHeight', { value: 200 });

    engine.registerSource(source, {});
    engine.registerViewport(plain, {});

    await driveIntoEdgeZone(source, plain);
    expect(plain.scrollBy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('registered on an element that does not scroll'),
    );

    // Positive control: the same box with `overflow: auto` scrolls, so the style
    // check, not a dead loop, blocked the call above.
    const control = makeEngageableScroller();
    engine.registerViewport(control, {});
    fireDrag.dragOver(control, { clientX: 100, clientY: 190 });
    await flushRaf(2);
    expect(control.scrollBy).toHaveBeenCalled();
    expect(plain.scrollBy).not.toHaveBeenCalled();
  });

  it('the last parameters getter registered on an element wins, and releasing it restores the first', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    // Opposite answers, so each half can tell which hold is active.
    const first = vi.fn<(eventDetails: DraggableViewportDragScrollEventDetails) => boolean>(
      () => false,
    );
    const second = vi.fn<(eventDetails: DraggableViewportDragScrollEventDetails) => boolean>(
      () => true,
    );

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {
      onDragScroll: (eventDetails) => {
        if (!first(eventDetails)) {
          eventDetails.cancel();
        }
      },
    });
    const releaseSecond = engine.registerViewport(scroller, {
      onDragScroll: (eventDetails) => {
        if (!second(eventDetails)) {
          eventDetails.cancel();
        }
      },
    });

    // Two holds on one node, as with merged refs. Only the last registered one is read.
    await driveIntoEdgeZone(source, scroller);
    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
    expect(scrollByMock).toHaveBeenCalled();
    fireDrag.dragEnd();

    // Releasing the second hold reactivates the first, whose `false` cancels the scroll.
    releaseSecond();
    first.mockClear();
    second.mockClear();
    scrollByMock.mockClear();
    await driveIntoEdgeZone(source, scroller);
    expect(first).toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    expect(scrollByMock).not.toHaveBeenCalled();
    fireDrag.dragEnd();
  });

  it('cleanup removes registration', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // Its `pan` would run every frame if the registration were still live.
    const surface = createElement({ top: 0, height: 200, left: 0, width: 200 });
    const pan = vi.fn();

    engine.registerSource(source, {});
    const cleanupScroll = engine.registerViewport(surface, {
      onDragScroll: (eventDetails) => {
        eventDetails.cancel();
        pan(eventDetails);
        eventDetails.consume();
      },
    });

    cleanupScroll();

    await driveIntoEdgeZone(source, surface);

    expect(pan).not.toHaveBeenCalled();
  });

  it("scrolls from the physical pointer, not the draggable's modifier-constrained point", async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // Below the grab row, like a grid's scrolling body under its header.
    const scroller = createElement({ top: 100, height: 200, left: 0, width: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 200 });

    const seenY: number[] = [];

    // The axis lock pins every reported y to the grab point (10), outside the scroller.
    engine.registerSource(source, { modifiers: restrictToHorizontalAxis });
    engine.registerViewport(scroller, {
      onDragScroll: ({ input }) => {
        seenY.push(input.clientY);
      },
    });

    // The grab point is outside the scroller, so only the move below wakes the loop.
    await lift(source, { clientX: 100, clientY: 10 });
    // Into the scroller's bottom edge zone (edge size 50 of its 200px height).
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 290 });
    await flushRaf(2);

    expect(scroller.scrollBy).toHaveBeenCalled();
    // The callbacks see the point the edge test used, not the pinned y.
    expect(seenY).toContain(290);
    expect(seenY).not.toContain(10);
  });

  it('still scrolls when a clamping modifier holds the physical pointer outside the container', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    // Shaped like `restrictToElement`. Pushing past the bottom leaves the physical
    // pointer outside while the clamped point stays in the edge zone, so testing
    // only the raw point would skip the container.
    engine.registerSource(source, {
      modifiers: ({ point }) => ({ x: point.x, y: Math.min(point.y, 190) }),
    });
    engine.registerViewport(scroller, {});

    // Physically past the bottom of the scroller (rect ends at 200).
    await driveTo(source, scroller, 100, 290);

    expect(scroller.scrollBy).toHaveBeenCalled();
  });

  it('scrolls at full depth when a clamping modifier stops the drag short of the edge zone', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    const seenY: number[] = [];

    // Shaped like `restrictToElement` with an 80px preview grabbed at its top. The
    // reported point stays 80px from the bottom, outside the 50px edge zone, so
    // scrolling would stop exactly when the user pushes past the edge.
    engine.registerSource(source, {
      modifiers: ({ point }) => ({ x: point.x, y: Math.min(point.y, 120) }),
    });
    engine.registerViewport(scroller, {
      onDragScroll: ({ input, y }) => {
        seenY.push(input.clientY);
        expect(y).toBeGreaterThanOrEqual(0);
      },
    });

    await driveTo(source, scroller, 100, 290);

    expect(scroller.scrollBy).toHaveBeenCalled();
    // The callbacks receive the point the edges were tested against: the physical
    // pointer on the axis it left the container through.
    expect(seenY).toContain(290);
    expect(seenY).not.toContain(120);
  });

  it('scrolls the container a clamping modifier confines the drag to, not the neighbour under the pointer', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const makeList = (left: number) => {
      const list = createElement({ top: 0, height: 200, left, width: 200 });
      list.style.overflow = 'auto';
      list.scrollBy = vi.fn();
      Object.defineProperty(list, 'scrollTop', { value: 400, writable: true });
      Object.defineProperty(list, 'scrollHeight', { value: 1000 });
      Object.defineProperty(list, 'clientHeight', { value: 200 });
      return list;
    };
    // Side-by-side lists, with the drag clamped into the left one.
    const listA = makeList(0);
    const listB = makeList(200);

    engine.registerSource(source, {
      modifiers: ({ point }) => ({ x: Math.min(point.x, 190), y: Math.min(point.y, 190) }),
    });
    // B registers first, so the loop visits it first. Unless the reported point
    // takes precedence, B consumes the vertical axis before A runs.
    engine.registerViewport(listB, {});
    engine.registerViewport(listA, {});

    await lift(source, { clientX: 100, clientY: 100 });
    mockElementFromPoint((x) => (x < 200 ? listA : listB));
    // The raw pointer is in B's bottom edge zone and the reported point in A's
    // corner. B must not take the vertical axis from A.
    fireDrag.dragOver(listB, { clientX: 300, clientY: 190 });
    await flushRaf(2);

    expect(listA.scrollBy).toHaveBeenCalled();
    expect(listB.scrollBy).not.toHaveBeenCalled();
  });

  it('a scroller registered mid-drag engages once a fresh move arrives', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    engine.registerSource(source, {});

    // The scroller's center is in no edge zone, so the frame the registration
    // wakes finds nothing to scroll.
    await lift(source, { clientX: 100, clientY: 100 });

    engine.registerViewport(scroller, {});
    await flushRaf(2);
    expect(scroller.scrollBy).not.toHaveBeenCalled();

    // The sensor flushes `onMove` in its own frame, which wakes the loop for the next one.
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 190 });
    await flushRaf(2);
    expect(scroller.scrollBy).toHaveBeenCalled();
  });

  it('a scroller registered mid-drag under a stationary pointer engages without a fresh move', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // A custom scrolling surface starts outside the registry.
    const surface = createElement({ top: 0, height: 200, left: 0, width: 200 });
    const pan = vi.fn();

    engine.registerSource(source, {});

    // Park the loop over the unregistered container, and let the move's `onMove`
    // and `onTargetChange` wakes pass so the registration can't ride on them.
    await lift(source, { clientX: 100, clientY: 10 });
    fireDrag.dragOver(surface, { clientX: 100, clientY: 190 });
    await flushRaf(5);
    expect(pan).not.toHaveBeenCalled();

    // A panel opening under a still pointer: no input will wake the parked loop,
    // so the registration has to.
    engine.registerViewport(surface, {
      onDragScroll: (eventDetails) => {
        eventDetails.cancel();
        pan(eventDetails);
        eventDetails.consume();
      },
    });
    await flushRaf(2);
    expect(pan).toHaveBeenCalled();
  });

  it('registering a second scroller mid-drag does not freeze an engaged scroll loop', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    await driveIntoEdgeZone(source, scroller);
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    expect(scrollByMock).toHaveBeenCalled();
    scrollByMock.mockClear();

    // Resetting the loop here would stop the scroll with no move to restart it.
    const other = createElement({ top: 500, height: 100, left: 0, width: 100 });
    engine.registerViewport(other, {});
    await flushRaf(2);
    expect(scrollByMock).toHaveBeenCalled();
  });

  describe('accept', () => {
    const otherKind = createKind<unknown>('base-ui-test/other');

    it('skips a scroller whose accept does not match the drag kind', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Same box, and the mismatching scroller registers first, so a broken
      // filter would let it consume the vertical axis.
      const picky = makeEngageableScroller();
      const open = makeEngageableScroller();
      const pickyShouldScroll = vi.fn<
        (eventDetails: DraggableViewportDragScrollEventDetails) => boolean
      >(() => true);

      // The drag's kind is the renderer's default `testDragKind`.
      engine.registerSource(source, {});
      engine.registerViewport(picky, {
        accept: otherKind,
        onDragScroll: (eventDetails) => {
          if (!pickyShouldScroll(eventDetails)) {
            eventDetails.cancel();
          }
        },
      });
      engine.registerViewport(open, { accept: [otherKind, testDragKind] });

      await driveIntoEdgeZone(source, picky);

      expect(picky.scrollBy).not.toHaveBeenCalled();
      expect(pickyShouldScroll).not.toHaveBeenCalled();
      // Positive control: an array `accept` containing the drag's kind engages.
      expect(open.scrollBy).toHaveBeenCalled();
    });
  });

  it('a drop target auto-scrolled under a stationary pointer becomes hovered', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    const target = createElement({ top: 150, height: 50, left: 0, width: 200 });
    const onDraggableEnter = vi.fn();

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});
    engine.registerTarget(target, { onDraggableEnter });

    await driveIntoEdgeZone(source, scroller);
    expect(scroller.scrollBy).toHaveBeenCalled();
    expect(onDraggableEnter).not.toHaveBeenCalled();

    // Fake the scroll bringing the target under the still pointer. Every engaged
    // frame marks the sensor dirty (`notifyExternalScroll`), so the next hit
    // test must find the target.
    mockElementFromPoint(() => target);
    await flushRaf(2);
    expect(onDraggableEnter).toHaveBeenCalled();
  });

  it('stops scrolling when the pointer leaves the edge zone and re-engages on return', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    await driveIntoEdgeZone(source, scroller);
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    expect(scrollByMock).toHaveBeenCalled();

    // Out of the zone. Once the move settles, the loop stops.
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 100 });
    await flushRaf(2);
    scrollByMock.mockClear();
    await flushRaf(2);
    expect(scrollByMock).not.toHaveBeenCalled();

    // Back into the zone. The loop engages again instead of staying parked.
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 190 });
    await flushRaf(2);
    expect(scrollByMock).toHaveBeenCalled();
  });

  it('caps the edge zone at 180px on a container taller than 720px', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // 1000px tall. The 25% rule alone would give a 250px edge zone, but the zone
    // is capped at MAX_EDGE_SIZE (180px), so it starts at y > 820.
    const scroller = createElement({ top: 0, height: 1000, left: 0, width: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 3000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 1000 });

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    await lift(source, { clientX: 100, clientY: 500 });

    // 200px from the bottom edge, inside the uncapped 25% zone but outside the capped one.
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 800 });
    await flushRaf(2);
    expect(scroller.scrollBy).not.toHaveBeenCalled();

    // 100px from the bottom edge, inside the capped 180px zone.
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 900 });
    await flushRaf(2);
    expect(scroller.scrollBy).toHaveBeenCalled();
  });

  it('engages a scroller inside an open shadow root before its light-DOM ancestor scroller', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // A shadow scroller in the same box as its light-DOM ancestor. The depth sort
    // walks composed parents, so the shadow scroller sorts deeper. A
    // `parentElement`-only walk would hand the axis to the ancestor.
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

    engine.registerSource(source, {});
    engine.registerViewport(outer, {});
    engine.registerViewport(inner, {});

    // y=190 is in both bottom edge zones. The shadow scroller covers its host's
    // box, so the hit test finds it.
    await driveIntoEdgeZone(source, inner);

    expect(inner.scrollBy).toHaveBeenCalled();
    expect(outer.scrollBy).not.toHaveBeenCalled();
  });

  // These assert which scroller gets `scrollBy` and on which axis, not the delta.
  // `scrollLoop` calls `scrollBy` and consumes the axis even on the first ramp
  // frame (delta 0), so they need neither frame timing nor Chromium.
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
      registerCleanup(() => element.remove());
      return { element, scrollBy };
    }

    describe('overlapping viewports', () => {
      async function dragTo(source: HTMLElement, hit: Element | null, x: number, y: number) {
        // Picked up outside every viewport, so no edge zone engages before the move.
        await lift(source, { clientX: 1000, clientY: 1000 });
        if (hit === null) {
          fireDrag.dragLeave({ clientX: x, clientY: y });
        } else {
          fireDrag.dragOver(hit, { clientX: x, clientY: y });
        }
        await flushRaf(2);
      }

      // An app shell's `main` (html > body > div > div > main) behind a bottom
      // drawer portaled to `<body>` with its own list. The drawer sits over
      // main's bottom edge zone, and main is nested deeper than the list.
      function renderShellWithDrawer() {
        const shell = document.createElement('div');
        const layout = document.createElement('div');
        shell.appendChild(layout);
        document.body.appendChild(shell);
        registerCleanup(() => shell.remove());
        const main = makeScroller({ top: 0, height: 400, left: 0, width: 400 }, layout);
        const drawer = document.createElement('div');
        document.body.appendChild(drawer);
        registerCleanup(() => drawer.remove());
        const list = makeScroller({ top: 200, height: 200, left: 0, width: 400 }, drawer);
        const row = document.createElement('div');
        list.element.appendChild(row);
        return { main, list, row };
      }

      it('scrolls the viewport under the pointer, not a deeper one behind it', async () => {
        const { engine } = await renderDnd();
        const source = createElement();
        const { main, list, row } = renderShellWithDrawer();
        engine.registerSource(source, {});
        engine.registerViewport(main.element, {});
        engine.registerViewport(list.element, {});

        // Near the drawer's bottom edge, which is also main's bottom edge zone.
        await dragTo(source, row, 200, 390);

        expect(list.scrollBy).toHaveBeenCalled();
        expect(main.scrollBy).not.toHaveBeenCalled();
      });

      it('skips a viewport where an ancestor clips it', async () => {
        const { engine } = await renderDnd();
        const source = createElement();
        // The inner viewport extends past a clipping wrapper, so near its bottom
        // edge the pointer is over the outer viewport's own content instead.
        const outer = makeScroller({ top: 0, height: 400, left: 0, width: 200 });
        const clip = document.createElement('div');
        clip.style.overflow = 'hidden';
        outer.element.appendChild(clip);
        const inner = makeScroller({ top: 0, height: 400, left: 0, width: 200 }, clip);
        const below = document.createElement('div');
        outer.element.appendChild(below);
        engine.registerSource(source, {});
        engine.registerViewport(outer.element, {});
        engine.registerViewport(inner.element, {});

        await dragTo(source, below, 100, 390);

        expect(outer.scrollBy).toHaveBeenCalled();
        expect(inner.scrollBy).not.toHaveBeenCalled();
      });

      it('keeps the nesting order when neither viewport is under the pointer', async () => {
        const { engine } = await renderDnd();
        const source = createElement();
        const { main, list } = renderShellWithDrawer();
        engine.registerSource(source, {});
        engine.registerViewport(main.element, {});
        engine.registerViewport(list.element, {});

        await dragTo(source, null, 200, 390);

        expect(main.scrollBy).toHaveBeenCalled();
        expect(list.scrollBy).not.toHaveBeenCalled();
      });

      it('finds a viewport inside a closed shadow root under the pointer', async () => {
        const { engine } = await renderDnd();
        const source = createElement();
        const outer = makeScroller({ top: 0, height: 200, left: 0, width: 200 });
        const host = document.createElement('div');
        outer.element.appendChild(host);
        const root = host.attachShadow({ mode: 'closed' });
        const inner = makeScroller({ top: 0, height: 200, left: 0, width: 200 }, host);
        root.appendChild(inner.element);
        const row = document.createElement('div');
        inner.element.appendChild(row);
        // The document retargets the hit to the host. Only the closed root, which
        // the engine knows from the registered viewport, reaches the row.
        (root as unknown as { elementFromPoint: () => Element }).elementFromPoint = () => row;
        engine.registerSource(source, {});
        engine.registerViewport(outer.element, {});
        engine.registerViewport(inner.element, {});

        await dragTo(source, host, 100, 190);

        expect(inner.scrollBy).toHaveBeenCalled();
        expect(outer.scrollBy).not.toHaveBeenCalled();
      });
    });

    it('depth-sorts inner-first: only the inner scroller scrolls in its own edge zone', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Inner (y=0..100) is nested in outer (y=0..300), so y=90 is only in the
      // inner's bottom edge zone.
      const outer = makeScroller({ top: 0, height: 300, left: 0, width: 200 });
      const inner = makeScroller({ top: 0, height: 100, left: 0, width: 200 }, outer.element);

      engine.registerSource(source, {});
      engine.registerViewport(outer.element, {});
      engine.registerViewport(inner.element, {});

      await lift(source, { clientX: 100, clientY: 90 });
      fireDrag.dragOver(inner.element, { clientX: 100, clientY: 90 });
      await flushRaf(2);

      expect(inner.scrollBy).toHaveBeenCalled();
      expect(outer.scrollBy).not.toHaveBeenCalled();
    });

    it('per-axis hand-off: inner consumes vertical, outer scrolls horizontal', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Same box, so the pointer is in both bottom and right edge zones. Inner
      // sorts first and takes only vertical, leaving horizontal to the outer.
      const outer = makeScroller({ top: 0, height: 200, left: 0, width: 200 }, document.body, true);
      const inner = makeScroller({ top: 0, height: 200, left: 0, width: 200 }, outer.element, true);

      engine.registerSource(source, {});
      engine.registerViewport(outer.element, {});
      engine.registerViewport(inner.element, {
        onDragScroll: (eventDetails) => {
          const allowedDirection = 'vertical';
          if (allowedDirection !== eventDetails.direction) {
            eventDetails.cancel();
          }
        },
      });

      await lift(source, { clientX: 190, clientY: 190 });
      fireDrag.dragOver(inner.element, { clientX: 190, clientY: 190 });
      await flushRaf(2);

      expect(inner.scrollBy).toHaveBeenCalled();
      expect(inner.scrollBy.mock.calls.every(([arg]) => (arg.left ?? 0) === 0)).toBe(true);
      expect(outer.scrollBy).toHaveBeenCalled();
      expect(outer.scrollBy.mock.calls.every(([arg]) => (arg.top ?? 0) === 0)).toBe(true);
    });

    it('hands the axis to the outer scroller when the inner sits at its scroll limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // The inner shares the outer's box but is fully scrolled (800 + 200 === 1000),
      // so the vertical axis must pass to the outer.
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
      registerCleanup(() => inner.remove());

      engine.registerSource(source, {});
      engine.registerViewport(outer.element, {});
      engine.registerViewport(inner, {});

      await driveTo(source, inner, 100, 190);

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
      registerCleanup(() => inner.remove());
      // Neither cancels nor consumes, like the analytics handler in the docs. It
      // must not withhold the axis from the outer.
      const observe = vi.fn();

      engine.registerSource(source, {});
      engine.registerViewport(outer.element, {});
      engine.registerViewport(inner, { onDragScroll: observe });

      await driveTo(source, inner, 100, 190);

      expect(
        observe.mock.calls.some(([eventDetails]) => eventDetails.direction === 'vertical'),
      ).toBe(true);
      expect(innerScrollBy).not.toHaveBeenCalled();
      expect(outer.scrollBy).toHaveBeenCalled();
    });

    it('invalidates the depth-order cache across register/unregister', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Same rect and edge zone, so only the depth order decides which scrolls.
      const outer = makeScroller({ top: 0, height: 100, left: 0, width: 200 });
      // A custom inner viewport competes with the native outer scroller.
      const inner = createElement({ top: 0, height: 100, left: 0, width: 200 });
      outer.element.appendChild(inner);
      const innerPan = vi.fn();

      engine.registerSource(source, {});
      engine.registerViewport(outer.element, {});
      const cleanupInner = engine.registerViewport(inner, {
        onDragScroll: (eventDetails) => {
          eventDetails.cancel();
          innerPan(eventDetails);
          eventDetails.consume();
        },
      });

      // Inner sorts first and consumes both axes.
      await lift(source, { clientX: 100, clientY: 50 });
      fireDrag.dragOver(inner, { clientX: 100, clientY: 90 });
      await flushRaf(2);
      expect(innerPan).toHaveBeenCalled();
      expect(outer.scrollBy).not.toHaveBeenCalled();

      // Nothing else changes, so a stale depth-order cache would keep giving the
      // axes to the unregistered inner.
      cleanupInner();
      innerPan.mockClear();
      outer.scrollBy.mockClear();
      // Re-firing the same move keeps the loop awake instead of parked on the
      // transition frame. The outer's first ramp frame scrolls by 0, so a single
      // frame would be timing-sensitive in jsdom.
      await dragOver(inner, { clientX: 100, clientY: 90 });
      fireDrag.dragOver(inner, { clientX: 100, clientY: 90 });
      await flushRaf(2);

      expect(outer.scrollBy).toHaveBeenCalled();
      expect(innerPan).not.toHaveBeenCalled();
    });

    // jsdom only. The held frame clock keeps every `frameSpeed` at 0. In a browser
    // the timestamps advance, so a 0-delta engagement is only observable here.
    it.skipIf(!isJSDOM)(
      'engages on intent: scrollBy fires on the first (delta-0) frame in an edge zone',
      async () => {
        installFrameClock();
        const { engine } = await renderDnd();
        const source = createElement();
        const scroller = makeScroller({ top: 0, height: 200, left: 0, width: 200 });

        engine.registerSource(source, {});
        engine.registerViewport(scroller.element, {});

        // Without engaging on a 0 delta, the nested-scroller hand-off would break
        // on the first ramp frame.
        await lift(source, { clientX: 100, clientY: 190 });
        fireDrag.dragOver(scroller.element, { clientX: 100, clientY: 190 });
        await flushRaf(2);

        expect(scroller.scrollBy).toHaveBeenCalled();
        expect(scroller.scrollBy.mock.calls.every(([arg]) => (arg.top ?? 0) === 0)).toBe(true);
      },
    );
  });

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

    it('does not scroll an unregistered nested container inside a viewport', async () => {
      const { engine } = await renderDnd();
      const outer = makeContainer();
      const inner = makeContainer({ parent: outer.element });
      const source = makeNestedSource(inner.element);
      engine.registerSource(source, {});
      engine.registerViewport(outer.element, {});

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

      engine.registerSource(source, {});
      engine.registerViewport(container.element, {});

      await driveTo(source, container.element, 100, 190);
      expect(container.scrollBy).not.toHaveBeenCalled();
      expect(warning).toHaveBeenCalledWith(expect.stringContaining('does not scroll'));

      container.element.style.overflow = 'auto';
      fireDrag.dragOver(inner, { clientX: 100, clientY: 190 });
      await flushRaf(2);

      expect(container.scrollBy).toHaveBeenCalled();
    });

    it('keeps shared ancestor style readings while moving between siblings', async () => {
      const { engine } = await renderDnd();
      const container = makeContainer();
      const first = document.createElement('div');
      const second = document.createElement('div');
      container.element.append(first, second);
      const source = createElement();
      engine.registerSource(source, {});
      engine.registerViewport(container.element, {});

      await driveTo(source, first, 100, 190);

      const computedStyle = vi.spyOn(window, 'getComputedStyle');
      registerCleanup(() => computedStyle.mockRestore());
      fireDrag.dragOver(second, { clientX: 100, clientY: 190 });
      await flushRaf(2);

      expect(computedStyle.mock.calls.some(([element]) => element === container.element)).toBe(
        false,
      );
    });

    it('keeps ancestor style readings when the hovered element itself is restyled', async () => {
      const { engine } = await renderDnd();
      const container = makeContainer();
      const row = document.createElement('div');
      container.element.append(row);
      const source = createElement();
      engine.registerSource(source, {});
      engine.registerViewport(container.element, {});

      await driveTo(source, row, 100, 190);
      expect(container.scrollBy).toHaveBeenCalled();

      const computedStyle = vi.spyOn(window, 'getComputedStyle');
      registerCleanup(() => computedStyle.mockRestore());
      // The row's own style can't change the overflow of a container above it,
      // so the container's cached styles stay.
      await act(async () => {
        row.className = 'hovered';
      });
      fireDrag.dragOver(row, { clientX: 100, clientY: 190 });
      await flushRaf(2);

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
      engine.registerSource(source, {});
      engine.registerViewport(first.element, {});
      engine.registerViewport(second.element, {});

      await driveTo(source, first.element, 100, 190);
      expect(first.scrollBy).toHaveBeenCalled();
      fireDrag.dragOver(second.element, { clientX: 400, clientY: 190 });
      await flushRaf(2);
      expect(second.scrollBy).toHaveBeenCalled();

      await act(async () => {
        first.element.style.overflow = 'hidden';
      });
      first.scrollBy.mockClear();
      fireDrag.dragOver(first.element, { clientX: 100, clientY: 190 });
      await flushRaf(2);

      expect(first.scrollBy).not.toHaveBeenCalled();
      expect(warning).toHaveBeenCalledWith(expect.stringContaining('does not scroll'));
    });

    it('never engages a registered container with no scroll extent', async () => {
      const { engine } = await renderDnd();
      const container = makeContainer({ vertical: false });
      const source = makeNestedSource(container.element);

      engine.registerSource(source, {});
      engine.registerViewport(container.element, {});

      await driveTo(source, container.element, 100, 190);

      expect(container.scrollBy).not.toHaveBeenCalled();
    });

    it('hands the axis an inner viewport cannot scroll to the outer one', async () => {
      const { engine } = await renderDnd();
      const board = makeContainer({ vertical: false, horizontal: true });
      const column = makeContainer({ parent: board.element });
      const source = makeNestedSource(column.element);

      engine.registerSource(source, {});
      engine.registerViewport(board.element, {});
      engine.registerViewport(column.element, {});

      await driveTo(source, column.element, 190, 190);

      expect(column.scrollBy).toHaveBeenCalled();
      expect(column.scrollBy.mock.calls.every(([arg]) => (arg.left ?? 0) === 0)).toBe(true);
      expect(board.scrollBy).toHaveBeenCalled();
      expect(board.scrollBy.mock.calls.every(([arg]) => (arg.top ?? 0) === 0)).toBe(true);
    });

    it('honors scroll cancellation on a registered viewport', async () => {
      const { engine } = await renderDnd();
      const container = makeContainer();
      const source = makeNestedSource(container.element);
      const shouldScroll = vi.fn<
        (eventDetails: DraggableViewportDragScrollEventDetails) => boolean
      >(() => false);

      engine.registerSource(source, {});
      engine.registerViewport(container.element, {
        onDragScroll: (eventDetails) => {
          if (!shouldScroll(eventDetails)) {
            eventDetails.cancel();
          }
        },
      });

      await driveTo(source, container.element, 100, 190);

      expect(shouldScroll).toHaveBeenCalled();
      expect(shouldScroll.mock.calls[0][0].element).toBe(container.element);
      expect(container.scrollBy).not.toHaveBeenCalled();
    });
  });

  // The page scrolls only when `document.documentElement` (or a `body` mapping to
  // it) is registered. jsdom reports 0 for every root metric and has no
  // `scrollBy`, so these tests define configurable ones and delete them on cleanup.
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
      // An 800x600 viewport, so vertical edge zones are 150px and horizontal ones 180px.
      define('clientWidth', 800);
      define('clientHeight', 600);
      define('scrollWidth', 2000);
      define('scrollHeight', 2000);
      // Scroll offsets in the middle, so every direction has room by default.
      define('scrollTop', overrides.scrollTop ?? 500, true);
      define('scrollLeft', overrides.scrollLeft ?? 500, true);
      define('scrollBy', scrollBy);
      // Mid-scroll, the root's rect spans the whole document with a negative top.
      // Edge math from `getBoundingClientRect` would miss every edge zone.
      define('getBoundingClientRect', () => new DOMRect(0, -500, 800, 2000));
      registerCleanup(() => {
        for (const name of installed) {
          Reflect.deleteProperty(element, name);
        }
      });
      return { element, scrollBy };
    }

    // Lifts at the viewport center, outside any edge zone, so only the `dragOver`
    // can engage the loop.
    async function drive(
      source: HTMLElement,
      clientX: number,
      clientY: number,
      target: Element = document.documentElement,
    ): Promise<void> {
      await lift(source, { clientX: 400, clientY: 300 });
      fireDrag.dragOver(target, { clientX, clientY });
      await flushRaf(2);
    }

    it('engages at the viewport bottom edge and scrolls through the scrolling element', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerSource(source, {});
      registerCleanup(engine.registerViewport(page.element, {}));

      await drive(source, 400, 590);

      expect(page.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'instant' }));
    });

    it('keeps scrolling when the captured pointer moves below the viewport', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();
      engine.registerSource(source, {});
      registerCleanup(engine.registerViewport(page.element, {}));

      await drive(source, 400, page.element.clientHeight + 100);
      await flushRaf(2);

      expect(page.scrollBy).toHaveBeenCalledWith(
        expect.objectContaining({ top: expect.any(Number), behavior: 'instant' }),
      );
      expect(page.scrollBy.mock.calls.some(([options]) => options.top > 0)).toBe(true);
    });

    it('maps a default-styled body registration to the page scroller', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerSource(source, {});
      // A default-styled `body` isn't an overflow container, so the registration
      // must map to the page instead of silently doing nothing.
      registerCleanup(engine.registerViewport(document.body, {}));

      await drive(source, 400, 590);

      expect(page.scrollBy).toHaveBeenCalled();
    });

    // `<body>`'s overflow propagates to the viewport only while `<html>`'s
    // computed overflow is `visible` on both axes. A propagating `body` stands in
    // for the page and can lock it; a non-propagating one is a regular element.
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
      // A browser computes `overflow-x: hidden` alone to `overflow-y: auto`; jsdom
      // doesn't, so the pair is spelled out. It must not turn `body` into a scroll
      // container (whose `scrollBy` moves nothing) and cut the page out.
      styleOverflow(document.body, { overflowX: 'hidden', overflowY: 'auto' });
      // Browser metrics for a viewport-spanning `body`, so a `body` wrongly treated
      // as a container would engage here and consume the axis.
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

      engine.registerSource(source, {});
      registerCleanup(engine.registerViewport(document.body, {}));

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

      engine.registerSource(source, {});
      registerCleanup(engine.registerViewport(page.element, {}));

      await drive(source, 400, 590);

      expect(page.scrollBy).toHaveBeenCalled();
    });

    it('does not scroll the page vertically when html hides the vertical axis', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();
      styleOverflow(document.documentElement, { overflowY: 'hidden' });

      engine.registerSource(source, {});
      registerCleanup(engine.registerViewport(page.element, {}));

      await drive(source, 400, 590);
      expect(page.scrollBy).not.toHaveBeenCalled();

      // The other axis stays live.
      fireDrag.dragOver(document.documentElement, { clientX: 700, clientY: 300 });
      await flushRaf(2);
      expect(page.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy.mock.calls.every(([arg]) => (arg.top ?? 0) === 0)).toBe(true);
    });

    it('does not scroll the page horizontally when html hides the horizontal axis', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();
      styleOverflow(document.documentElement, { overflowX: 'hidden' });

      engine.registerSource(source, {});
      registerCleanup(engine.registerViewport(page.element, {}));

      await drive(source, 700, 300);
      expect(page.scrollBy).not.toHaveBeenCalled();

      fireDrag.dragOver(document.documentElement, { clientX: 400, clientY: 590 });
      await flushRaf(2);
      expect(page.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy.mock.calls.every(([arg]) => (arg.left ?? 0) === 0)).toBe(true);
    });

    it('does not scroll the page vertically when body hides the vertical axis and html is visible', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();
      // A scroll lock on `body`. Its overflow propagates to the viewport while
      // `<html>` stays `visible`, so the page is blocked on that axis.
      styleOverflow(document.body, { overflowY: 'hidden' });

      engine.registerSource(source, {});
      registerCleanup(engine.registerViewport(page.element, {}));

      await drive(source, 400, 590);

      expect(page.scrollBy).not.toHaveBeenCalled();
    });

    it('measures edge zones against the viewport, not the scrolled document rect', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerSource(source, {});
      registerCleanup(engine.registerViewport(page.element, {}));

      // Against the mocked rect (top -500) the pointer is in no edge zone. Against
      // the 600px viewport it is 10px from the top, with room to scroll back up.
      await drive(source, 400, 10);

      expect(page.scrollBy).toHaveBeenCalled();
    });

    it('engages at the viewport horizontal edge without touching the vertical axis', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerSource(source, {});
      registerCleanup(engine.registerViewport(page.element, {}));

      // Right edge (x > 620), centered vertically so no vertical edge engages.
      await drive(source, 700, 300);

      expect(page.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy.mock.calls.every(([arg]) => (arg.top ?? 0) === 0)).toBe(true);
    });

    it('respects scroll cancellation', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerSource(source, {});
      registerCleanup(
        engine.registerViewport(page.element, {
          onDragScroll: (eventDetails) => {
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

      engine.registerSource(source, {});
      engine.registerViewport(inner, {});

      await drive(source, 400, 590, inner);

      expect(inner.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy).not.toHaveBeenCalled();
    });

    it('an inner overflow container consumes the axis; the page is the outermost fallback', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();
      // Its bottom edge zone (y ≈ 550..600) lies inside the viewport's (y > 450),
      // and x = 400 is in neither one's horizontal edge zone.
      const inner = createElement({ top: 400, height: 200, left: 300, width: 200 });
      inner.style.overflow = 'auto';
      inner.scrollBy = vi.fn();
      Object.defineProperty(inner, 'scrollTop', { value: 400, writable: true });
      Object.defineProperty(inner, 'scrollHeight', { value: 1000 });
      Object.defineProperty(inner, 'clientHeight', { value: 200 });

      engine.registerSource(source, {});
      registerCleanup(engine.registerViewport(page.element, {}));
      const cleanupInner = engine.registerViewport(inner, {});

      await drive(source, 400, 590, inner);

      // The root is every scroller's ancestor, so the depth sort visits it last.
      expect(inner.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy).not.toHaveBeenCalled();

      // With the inner gone, the same spot falls through to the page.
      cleanupInner();
      await dragOver(document.documentElement, { clientX: 400, clientY: 590 });
      fireDrag.dragOver(document.documentElement, { clientX: 400, clientY: 590 });
      await flushRaf(2);
      expect(page.scrollBy).toHaveBeenCalled();
    });

    it('applies the RTL home-edge normalization to the page scroller', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // RTL start position. `scrollLeft` is 0 and all the room is to the left.
      const page = mockPageScroller({ scrollLeft: 0 });
      page.element.style.direction = 'rtl';
      registerCleanup(() => page.element.style.removeProperty('direction'));

      engine.registerSource(source, {});
      registerCleanup(engine.registerViewport(page.element, {}));

      // Right edge, where RTL scrolling starts. The LTR check (`0 + 800 < 2000`)
      // would engage, but there is no room to scroll right.
      await drive(source, 700, 300);
      expect(page.scrollBy).not.toHaveBeenCalled();

      // The left edge has all the room. The LTR check (`scrollLeft > 0`) would
      // treat the page as unscrollable and never engage.
      fireDrag.dragOver(document.documentElement, { clientX: 10, clientY: 300 });
      await flushRaf(2);
      expect(page.scrollBy).toHaveBeenCalled();
    });
  });

  // Page scrolling in a real viewport. These need layout, live document scroll
  // metrics, and a `scrollingElement.scrollBy` that moves the page.
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
      const clock = installFrameClock();
      const source = createElement();
      addSpacer('10px', '4000px');
      registerCleanup(() => window.scrollTo(0, 0));

      engine.registerSource(source, {
        activation: { touch: { type: 'immediate' } },
      });
      registerCleanup(engine.registerViewport(document.documentElement, {}));

      const centerX = Math.floor(document.documentElement.clientWidth / 2);
      const viewportHeight = document.documentElement.clientHeight;

      // Bottom edge with the page at the top, so the page must scroll down.
      touchDown(source, centerX, viewportHeight - 10);
      await runPastRamp(clock);
      expect(window.scrollY).toBeGreaterThan(0);
      touchUp(centerX, viewportHeight - 10);

      // A scrolled root's rect has a negative top, so rect-based edge math would
      // never engage again. The top edge must scroll back up.
      window.scrollTo(0, 500);
      const startY = window.scrollY;
      expect(startY).toBeGreaterThan(0);
      touchDown(source, centerX, 10);
      await runPastRamp(clock);
      expect(window.scrollY).toBeLessThan(startY);
      touchUp(centerX, 10);
    });

    it('honours the RTL home edge on the real page', async () => {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      document.documentElement.setAttribute('dir', 'rtl');
      registerCleanup(() => {
        document.documentElement.removeAttribute('dir');
        window.scrollTo(0, 0);
      });
      addSpacer('4000px', '10px');

      engine.registerSource(source, {
        activation: { touch: { type: 'immediate' } },
      });
      registerCleanup(engine.registerViewport(document.documentElement, {}));

      const centerY = Math.floor(document.documentElement.clientHeight / 2);
      const viewportWidth = document.documentElement.clientWidth;

      // At the RTL start position, the right edge has no room to scroll.
      touchDown(source, viewportWidth - 10, centerY);
      await runPastRamp(clock);
      expect(window.scrollX).toBeCloseTo(0);
      touchUp(viewportWidth - 10, centerY);

      // The left edge scrolls into the content. RTL reports the offset as negative.
      touchDown(source, 10, centerY);
      await runPastRamp(clock);
      expect(window.scrollX).toBeLessThan(0);
      touchUp(10, centerY);
    });

    // HTML propagates `direction` from `<body>` to the viewport, so a `<body
    // dir="rtl">` page scrolls RTL while the root still computes as `ltr`.
    it('honours the RTL home edge when only <body> is RTL', async () => {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      document.documentElement.setAttribute('dir', 'ltr');
      document.body.setAttribute('dir', 'rtl');
      registerCleanup(() => {
        document.documentElement.removeAttribute('dir');
        document.body.removeAttribute('dir');
        window.scrollTo(0, 0);
      });
      addSpacer('4000px', '10px');

      engine.registerSource(source, {
        activation: { touch: { type: 'immediate' } },
      });
      registerCleanup(engine.registerViewport(document.documentElement, {}));

      const centerY = Math.floor(document.documentElement.clientHeight / 2);
      const viewportWidth = document.documentElement.clientWidth;

      // RTL scrolling starts at the right edge, so it has no room at the start position.
      touchDown(source, viewportWidth - 10, centerY);
      await runPastRamp(clock);
      expect(window.scrollX).toBeCloseTo(0);
      touchUp(viewportWidth - 10, centerY);

      // Reading the root's `ltr` would leave the left edge dead.
      touchDown(source, 10, centerY);
      await runPastRamp(clock);
      expect(window.scrollX).toBeLessThan(0);
      touchUp(10, centerY);
    });
  });

  it('stops the scroll loop after a normal drop', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    await driveIntoEdgeZone(source, scroller);
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    expect(scrollByMock).toHaveBeenCalled();

    // A normal drop sends `onMoveEnd` to the scroll monitor, which stops the loop.
    fireDrag.drop(scroller, { clientX: 100, clientY: 190 });
    scrollByMock.mockClear();
    await flushRaf(2);
    expect(scrollByMock).not.toHaveBeenCalled();
  });

  it('stops the scroll loop when the drag is torn down without an onMoveEnd to monitors', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // Scrollable container whose top edge zone (y < 50) engages the loop.
    const scroller = makeEngageableScroller();

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    await lift(source, { clientX: 100, clientY: 10 });
    await flushRaf();
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    expect(scrollByMock).toHaveBeenCalled();

    // A teardown that skips the terminal `onMoveEnd` (a test reset, or an engine
    // error after the end was latched) never notifies the scroll monitor.
    act(() => {
      resetForTests();
    });
    expect(dragSessionStore.getSnapshot()).toBeNull();

    // The loop must stop with the session anyway.
    scrollByMock.mockClear();
    await flushRaf(2);
    expect(scrollByMock).not.toHaveBeenCalled();
  });

  // These read the delta's sign, so `runPastRamp` advances the frame clock to give
  // the loop a nonzero delta.
  describe.skipIf(isJSDOM)('scroll direction and axis', () => {
    // RTL containers report `scrollLeft` as 0 at the right-hand start, going
    // negative toward the end. `scrollBy` deltas keep their LTR signs.
    function makeRtlScroller(scrollLeft: number): HTMLElement {
      const scroller = createElement({ top: 0, height: 200, left: 0, width: 200 });
      scroller.style.overflow = 'auto';
      scroller.style.direction = 'rtl';
      scroller.scrollBy = vi.fn();
      Object.defineProperty(scroller, 'scrollLeft', { value: scrollLeft, writable: true });
      Object.defineProperty(scroller, 'scrollWidth', { value: 1000 });
      Object.defineProperty(scroller, 'clientWidth', { value: 200 });
      mockElementFromPoint(() => scroller);
      return scroller;
    }

    it('scrolls an RTL container with correctly signed deltas at both horizontal edges', async () => {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      // In the middle (-400 of a maximum of 800), so both directions have room.
      const scroller = makeRtlScroller(-400);

      engine.registerSource(source, {
        activation: { touch: { type: 'immediate' } },
      });
      engine.registerViewport(scroller, {});

      // The left edge scrolls further left, so the deltas are negative.
      touchDown(source, 10, 100);
      await runPastRamp(clock);
      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
      const leftEdgeDeltas = scrollByMock.mock.calls.map(([arg]) => arg.left);
      expect(leftEdgeDeltas.some((left) => left < 0)).toBe(true);
      expect(leftEdgeDeltas.every((left) => left <= 0)).toBe(true);

      touchUp(10, 100);
      scrollByMock.mockClear();

      // Right edge (x=190). It scrolls back toward the start, so the deltas are positive.
      touchDown(source, 190, 100);
      await runPastRamp(clock);
      const rightEdgeDeltas = scrollByMock.mock.calls.map(([arg]) => arg.left);
      expect(rightEdgeDeltas.some((left) => left > 0)).toBe(true);
      expect(rightEdgeDeltas.every((left) => left >= 0)).toBe(true);

      touchUp(190, 100);
    });

    it('detects the RTL home position: right edge is exhausted, left edge has the full extent', async () => {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      // Start position, where `scrollLeft` is 0 in RTL.
      const scroller = makeRtlScroller(0);

      engine.registerSource(source, {
        activation: { touch: { type: 'immediate' } },
      });
      engine.registerViewport(scroller, {});

      // The right edge at the start position has no room. The LTR check
      // (`scrollLeft + clientWidth < scrollWidth`) would engage here.
      touchDown(source, 190, 100);
      await runPastRamp(clock);
      expect(scroller.scrollBy).not.toHaveBeenCalled();
      touchUp(190, 100);

      // The left edge at the start position has all the room. The LTR check
      // (`scrollLeft > 0`) would treat it as unscrollable and never engage.
      touchDown(source, 10, 100);
      await runPastRamp(clock);
      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
      const leftEdgeDeltas = scrollByMock.mock.calls.map(([arg]) => arg.left);
      expect(leftEdgeDeltas.some((left) => left < 0)).toBe(true);
      touchUp(10, 100);
    });
  });

  // A container exactly at a limit must not engage. The loop consumes the axis
  // on engagement, so it would keep the axis from an outer scroller.
  describe('scroll limits', () => {
    // Overflows on both axes, so each limit is rejected by its own guard and not
    // because the container has nothing to scroll.
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

    // Chrome 115+ reports fractional limits. 799.5 + 200 < 1000 looks scrollable,
    // so without the `Math.ceil` guard the loop would overshoot by half a pixel.
    it.each([
      { direction: 'down', edge: 'bottom', offsets: { scrollTop: 799.5 }, x: 100, y: 190 },
      { direction: 'up', edge: 'top', offsets: { scrollTop: 0 }, x: 100, y: 10 },
      { direction: 'right', edge: 'right', offsets: { scrollLeft: 799.5 }, x: 190, y: 100 },
      { direction: 'left', edge: 'left', offsets: { scrollLeft: 0 }, x: 10, y: 100 },
    ])(
      'does not scroll $direction when the container is at its $edge limit',
      async ({ offsets, x, y }) => {
        const { engine } = await renderDnd();
        const source = createElement();
        const scroller = makeScrollerAt(offsets);

        engine.registerSource(source, {});
        engine.registerViewport(scroller, {});

        await driveTo(source, scroller, x, y);

        expect(scroller.scrollBy).not.toHaveBeenCalled();
      },
    );

    it('proposes each axis separately at a corner, with the other delta at zero', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeScrollerAt({});
      const onDragScroll = vi.fn();

      engine.registerSource(source, {});
      engine.registerViewport(scroller, { onDragScroll });

      await driveTo(source, scroller, 190, 190);

      const horizontal = onDragScroll.mock.calls.filter(
        ([eventDetails]) => eventDetails.direction === 'horizontal',
      );
      const vertical = onDragScroll.mock.calls.filter(
        ([eventDetails]) => eventDetails.direction === 'vertical',
      );
      expect(horizontal.length).toBeGreaterThan(0);
      expect(vertical.length).toBeGreaterThan(0);
      expect(horizontal.every(([eventDetails]) => eventDetails.y === 0)).toBe(true);
      expect(vertical.every(([eventDetails]) => eventDetails.x === 0)).toBe(true);
    });

    it('still scrolls at every edge of the same fixture when the limits are not reached', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Positive control for the limit tests: scrolled to the middle, the same
      // fixture engages at all four points.
      const scroller = makeScrollerAt({ scrollTop: 400, scrollLeft: 400 });
      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;

      engine.registerSource(source, {});
      engine.registerViewport(scroller, {});

      await lift(source, { clientX: 100, clientY: 100 });

      // Sequential on purpose: each move starts where the previous one left the pointer.
      async function expectScrollAt(x: number, y: number): Promise<void> {
        scrollByMock.mockClear();
        fireDrag.dragOver(scroller, { clientX: x, clientY: y });
        await flushRaf(2);
        expect(scrollByMock, `edge at (${x}, ${y})`).toHaveBeenCalled();
      }

      await expectScrollAt(100, 190); // bottom
      await expectScrollAt(100, 10); // top
      await expectScrollAt(190, 100); // right
      await expectScrollAt(10, 100); // left
    });
  });

  describe('frame delta and depth weighting', () => {
    const MAX_FRAME_DELTA_MS = 64;

    // jsdom only. The frame clock is deterministic only with jsdom's
    // `setTimeout`-based rAF. In a browser the loop also sees real frames.
    it.skipIf(!isJSDOM)('clamps the per-frame delta when the frame loop stalls', async () => {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      const scroller = makeEngageableScroller();

      engine.registerSource(source, {});
      engine.registerViewport(scroller, {});

      // `driveIntoEdgeZone` leaves the pointer 0.8 deep into the 50px bottom edge zone.
      const depth = 0.8;
      await driveIntoEdgeZone(source, scroller);

      // Past the 400ms ramp, so `rampFactor` is 1 and the delta tracks `deltaMs` alone.
      clock.advance(1000);
      await flushRaf(2);

      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
      scrollByMock.mockClear();
      clock.advance(FRAME_MS);
      await flushRaf();
      const normalFrame = maxVerticalDelta(scroller);
      expect(normalFrame).toBeCloseTo((depth * MAX_SCROLL_SPEED * FRAME_MS) / 1000, 5);

      // A stalled rAF, as in a throttled tab, resumes with a huge elapsed time.
      scrollByMock.mockClear();
      clock.advance(5000);
      await flushRaf();
      const stalledFrame = maxVerticalDelta(scroller);

      // Capped at MAX_FRAME_DELTA_MS instead of 5 seconds (~3600px) of scrolling.
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

        engine.registerSource(source, {});
        engine.registerViewport(scroller, {});

        // Engage at 0.8 depth. The clock is held, so only `advance` moves the ramp.
        await driveTo(source, scroller, 100, 190);
        const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
        expect(scrollByMock).toHaveBeenCalled();

        // 200ms in, rampFactor is 0.5. Both measured frames cap at 64ms of delta,
        // so their ratio isolates the ramp factor.
        scrollByMock.mockClear();
        clock.advance(200);
        await flushRaf(2);
        const midRamp = maxVerticalDelta(scroller);

        // Past 400ms of engagement, rampFactor is 1 with the same capped delta.
        scrollByMock.mockClear();
        clock.advance(300);
        await flushRaf(2);
        const fullRamp = maxVerticalDelta(scroller);

        expect(midRamp).toBeGreaterThan(0);
        expect(midRamp / fullRamp).toBeCloseTo(0.5, 5);

        // Leaving the edge zone resets the engagement start.
        fireDrag.dragOver(scroller, { clientX: 100, clientY: 100 });
        await flushRaf(2);
        // On re-entry the ramp starts over instead of resuming at full speed.
        fireDrag.dragOver(scroller, { clientX: 100, clientY: 190 });
        await flushRaf(2);
        scrollByMock.mockClear();
        clock.advance(200);
        await flushRaf(2);
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

      engine.registerSource(source, {});
      engine.registerViewport(scroller, {});

      // Lift at the box's vertical center, outside any edge zone.
      await lift(source, { clientX: 100, clientY: 100 });
      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;

      // Returns one 16ms frame's delta at `clientY`. The clock is held while the
      // move reaches the loop, so only the measured frame's time counts.
      async function measureAt(clientY: number): Promise<number> {
        fireDrag.dragOver(scroller, { clientX: 100, clientY });
        await flushRaf(2);
        scrollByMock.mockClear();
        clock.advance(FRAME_MS);
        await flushRaf();
        return maxVerticalDelta(scroller);
      }

      // Every point below is inside the bottom edge zone (y ≥ 150), so the ramp
      // runs once here and depth is the only variable.
      await measureAt(160);
      clock.advance(1000);
      await flushRaf();

      const shallow = await measureAt(160); // 0.2 deep
      const middle = await measureAt(180); // 0.6 deep
      const deep = await measureAt(199); // 0.98 deep

      expect(shallow).toBeGreaterThan(0);
      expect(middle).toBeGreaterThan(shallow);
      expect(deep).toBeGreaterThan(middle);
      // Proportional to depth, not just ordered by it.
      expect(deep / shallow).toBeCloseTo(0.98 / 0.2, 5);
    });
  });

  describe.skipIf(!isJSDOM)('maxSpeed', () => {
    // One full-ramp 16ms frame's delta, with the pointer 0.8 deep into the 50px
    // bottom edge zone.
    async function measureFrameDelta(parameters: RegisterViewportParameters): Promise<number> {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      const scroller = makeEngageableScroller();

      engine.registerSource(source, {});
      engine.registerViewport(scroller, parameters);

      await driveIntoEdgeZone(source, scroller);
      // Past the 400ms ramp, so `rampFactor` is 1.
      clock.advance(1000);
      await flushRaf(2);

      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
      scrollByMock.mockClear();
      clock.advance(FRAME_MS);
      await flushRaf(2);

      return maxVerticalDelta(scroller);
    }

    const DEPTH = 0.8;
    const perFrame = (speed: number) => (DEPTH * speed * FRAME_MS) / 1000;

    it('scales the frame delta by a static value', async () => {
      expect(await measureFrameDelta({ maxSpeed: 300 })).toBeCloseTo(perFrame(300), 5);
    });

    it('defaults to 900 px/s when unset', async () => {
      // Positive control: the override, not the fixture, changes the speed.
      expect(await measureFrameDelta({})).toBeCloseTo(perFrame(900), 5);
    });

    it('accepts a callback, evaluated with the frame context', async () => {
      const seen: DraggableViewportMaxSpeedContext[] = [];
      const delta = await measureFrameDelta({
        maxSpeed: (context) => {
          seen.push(context);
          return 1800;
        },
      });

      expect(delta).toBeCloseTo(perFrame(1800), 5);
      // Check the last call: the lift at y=10 engages the top edge zone first.
      expect(seen.length).toBeGreaterThan(0);
      const last = seen[seen.length - 1];
      expect(last.element.style.overflow).toBe('auto');
      expect(last.input.clientY).toBe(190);
    });

    // A negative speed would scroll the container backwards and `NaN` would
    // freeze it, both without any error.
    it('falls back to the default for a negative speed', async () => {
      expect(await measureFrameDelta({ maxSpeed: -400 })).toBeCloseTo(perFrame(900), 5);
    });

    it('does not scroll at a speed of 0', async () => {
      // Unlike the fallbacks above, `0` is valid and must not be replaced.
      expect(await measureFrameDelta({ maxSpeed: 0 })).toBe(0);
    });

    it('lets the outer container take over when the inner one is pinned at 0', async () => {
      // A container at speed 0 must not consume axes it can never scroll.
      // Otherwise the outer one is blocked and the loop stays awake for nothing.
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      const outer = makeEngageableScroller();
      const inner = makeEngageableScroller();
      // Same box, and nesting makes the depth order reach `inner` first.
      outer.appendChild(inner);

      engine.registerSource(source, {});
      engine.registerViewport(inner, { maxSpeed: 0 });
      engine.registerViewport(outer, {});

      await driveIntoEdgeZone(source, inner);
      clock.advance(1000);
      await flushRaf(2);

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
        resetForTests();
        consoleError.mockRestore();
      }
    });

    it('scales a pan delta the same way', async () => {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      const viewport = createElement({ top: 0, height: 200, left: 0, width: 200 });
      viewport.style.overflow = 'visible';
      const pan = vi.fn();

      engine.registerSource(source, {});
      engine.registerViewport(viewport, {
        maxSpeed: 300,
        onDragScroll: (eventDetails) => {
          eventDetails.cancel();
          pan(eventDetails);
          eventDetails.consume();
        },
      });

      await driveTo(source, viewport, 100, 190);
      clock.advance(1000);
      await flushRaf(2);

      pan.mockClear();
      clock.advance(FRAME_MS);
      await flushRaf(2);

      const delegated = Math.max(0, ...pan.mock.calls.map(([context]) => context.y));
      expect(delegated).toBeCloseTo(perFrame(300), 5);
    });
  });

  // A registration with `onDragScroll` only needs edge detection, not a scrollable
  // overflow style or a scroll extent. Without a handler it still needs both.
  describe('pan', () => {
    // The `makeEngageableScroller` box without overflow or scroll metrics, so
    // every check a handler bypasses would reject it.
    function makeViewport(): HTMLElement {
      const viewport = createElement({ top: 0, height: 200, left: 0, width: 200 });
      viewport.style.overflow = 'visible';
      viewport.scrollBy = vi.fn();
      return viewport;
    }

    it('calls pan instead of scrolling the element', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const viewport = makeViewport();
      const pan = vi.fn();

      engine.registerSource(source, {});
      engine.registerViewport(viewport, {
        onDragScroll: (eventDetails) => {
          eventDetails.cancel();
          pan(eventDetails);
          eventDetails.consume();
        },
      });

      await driveTo(source, viewport, 100, 190);

      expect(pan).toHaveBeenCalled();
      expect(viewport.scrollBy).not.toHaveBeenCalled();
    });

    it('does not engage the same element without pan', async () => {
      // A registration on a non-scrolling element triggers the dev-only warning.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const { engine } = await renderDnd();
        const source = createElement();
        const viewport = makeViewport();

        engine.registerSource(source, {});
        engine.registerViewport(viewport, {});

        await driveTo(source, viewport, 100, 190);

        // Negative control: the element above engages only because it has a handler.
        expect(viewport.scrollBy).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('registered on an element that does not scroll'),
        );
      } finally {
        warnSpy.mockRestore();
      }
    });

    // Each of the four `canScrollToward` limit checks would reject an element with
    // no scroll extent, so every edge needs its own case.
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

        engine.registerSource(source, {});
        engine.registerViewport(viewport, {
          onDragScroll: (eventDetails) => {
            eventDetails.cancel();
            pan(eventDetails);
            eventDetails.consume();
          },
        });

        await driveTo(source, viewport, edge.clientX, edge.clientY);

        expect(pan).toHaveBeenCalled();
      });
    }

    it('passes the live drag context, plus the delta', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const viewport = makeViewport();
      const pan = vi.fn();

      engine.registerSource(source, {});
      engine.registerViewport(viewport, {
        onDragScroll: (eventDetails) => {
          eventDetails.cancel();
          pan(eventDetails);
          eventDetails.consume();
        },
      });

      await driveTo(source, viewport, 100, 190);

      const [eventDetails] = pan.mock.calls[0];
      expect(eventDetails.element).toBe(viewport);
      expect(eventDetails.source.element).toBe(source);
      expect(eventDetails.input.clientX).toBe(100);
      expect(eventDetails.input.clientY).toBe(190);
      expect(typeof eventDetails.x).toBe('number');
      expect(typeof eventDetails.y).toBe('number');
    });

    // A delegating viewport nested in a scroll container with the same box. The
    // pointer is in both bottom and right edge zones, and the inner sorts first.
    describe('axis hand-off', () => {
      // `outerAllowedAxis` restricts the outer container to one axis, so whether
      // it engages shows which axis it got. Its `scrollBy` arguments can't show
      // that reliably, because the jsdom deltas depend on frame timing.
      async function renderNested(
        onDragScroll: DragAutoScrollHandler,
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

        engine.registerSource(source, {});
        engine.registerViewport(outer, {
          onDragScroll: (eventDetails) => {
            const allowedDirection = outerAllowedAxis ?? 'all';
            if (allowedDirection !== 'all' && allowedDirection !== eventDetails.direction) {
              eventDetails.cancel();
            }
          },
        });
        engine.registerViewport(inner, { onDragScroll });

        await driveTo(source, inner, 190, 190);

        return { outerScrollBy };
      }

      it('consuming claims both proposed axes', async () => {
        const { outerScrollBy } = await renderNested((eventDetails) => {
          eventDetails.cancel();
          eventDetails.consume();
        });
        expect(outerScrollBy).not.toHaveBeenCalled();
      });

      it('stopping vertical propagation releases horizontal movement to the outer container', async () => {
        const { outerScrollBy } = await renderNested((eventDetails) => {
          eventDetails.cancel();
          if (eventDetails.direction === 'vertical') {
            eventDetails.consume();
          }
        }, 'horizontal');
        expect(outerScrollBy).toHaveBeenCalled();
      });

      it('stopping vertical propagation keeps the claimed direction', async () => {
        const { outerScrollBy } = await renderNested((eventDetails) => {
          eventDetails.cancel();
          if (eventDetails.direction === 'vertical') {
            eventDetails.consume();
          }
        }, 'vertical');
        // Counterpart to the test above, so it can't pass by the inner releasing both axes.
        expect(outerScrollBy).not.toHaveBeenCalled();
      });

      it('canceling without consuming releases both axes', async () => {
        const { outerScrollBy } = await renderNested((eventDetails) => {
          eventDetails.cancel();
        }, 'vertical');
        // A surface at its own bounds must not take an axis it didn't move,
        // including vertical, which every other handler here consumes.
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
          // The surface didn't move, so it's treated like cancel-without-consume.
          expect(result.outerScrollBy).toHaveBeenCalled();
        } finally {
          // End the drag before restoring the spy (see the throwing `maxSpeed` test).
          if (result) {
            fireDrag.dragEnd();
          }
          consoleError.mockRestore();
        }
      });

      // The held frame clock keeps every delta at 0, which shows consumption
      // follows engagement, not the applied delta. jsdom only, so the held clock
      // doesn't compete with browser scheduling.
      it.skipIf(!isJSDOM)('consumes the axes on the ramp-zero first frame', async () => {
        installFrameClock();
        const seen: number[] = [];
        const { outerScrollBy } = await renderNested((eventDetails) => {
          eventDetails.cancel();
          eventDetails.consume();
          seen.push(eventDetails.y);
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
      const pan = vi.fn();

      engine.registerSource(source, {});
      engine.registerViewport(viewport, {
        // Neither canceled nor consumed, so the surface declines. The default
        // native scroll does nothing on an element with no overflow.
        onDragScroll: (details) => {
          pan(details);
        },
      });

      await driveTo(source, viewport, 100, 190);
      expect(pan).toHaveBeenCalled();

      // A declining surface must not keep the loop (and a sensor frame through
      // `notifyExternalScroll`) running forever under a still pointer. Canceling
      // is the opposite signal: it stays engaged so its speed can ramp up from 0.
      pan.mockClear();
      await flushRaf(2);
      expect(pan).not.toHaveBeenCalled();

      // Fresh input wakes it again.
      fireDrag.dragOver(viewport, { clientX: 100, clientY: 195 });
      await flushRaf(2);
      expect(pan).toHaveBeenCalled();
    });

    // After a pan, the engine re-resolves what is under the pointer. In jsdom
    // `fireDrag` pins `elementFromPoint`, so a transform can't change the result.
    describe.skipIf(isJSDOM)('on a real transform surface', () => {
      it('resolves a drop target the pan brings under a stationary pointer', async () => {
        const { engine } = await renderDnd();
        const clock = installFrameClock();
        const source = createElement();

        // A fixed clipping viewport with a tall content layer moved by a CSS
        // transform. Nothing in the tree has a scroll offset.
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
        engine.registerSource(source, {
          activation: { touch: { type: 'immediate' } },
        });
        engine.registerViewport(viewport, {
          onDragScroll: (eventDetails) => {
            eventDetails.cancel();
            panned += eventDetails.y;
            // Written synchronously, as the API documents. The engine hit-tests
            // against it on the next frame.
            content.style.transform = `translateY(${-panned}px)`;
            eventDetails.consume();
          },
        });
        const onDraggableEnter = vi.fn();
        engine.registerTarget(target, { onDraggableEnter });

        // The pointer never moves again. At 64ms (the delta cap) per frame, 30
        // frames pan about 1200px, well past the 620px the target needs.
        touchDown(source, 200, 380);
        for (let frame = 0; frame < 30 && !onDraggableEnter.mock.calls.length; frame += 1) {
          clock.advance(64);
          // eslint-disable-next-line no-await-in-loop
          await flushRaf();
        }

        expect(panned).toBeGreaterThan(620);
        expect(onDraggableEnter).toHaveBeenCalled();

        touchUp(200, 380);
      });
    });

    it.skipIf(!isJSDOM)('reports the delta the element would have been scrolled by', async () => {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      const viewport = makeViewport();
      const pan = vi.fn();

      engine.registerSource(source, {});
      engine.registerViewport(viewport, {
        onDragScroll: (eventDetails) => {
          eventDetails.cancel();
          pan(eventDetails);
          eventDetails.consume();
        },
      });

      await driveTo(source, viewport, 100, 190);
      // Past the 400ms ramp, so `rampFactor` is 1.
      clock.advance(1000);
      await flushRaf(2);

      pan.mockClear();
      clock.advance(FRAME_MS);
      await flushRaf(2);

      // 0.8 deep into the 50px bottom edge zone. The scrolling path uses the same formula.
      const depth = 0.8;
      const delegated = Math.max(0, ...pan.mock.calls.map(([context]) => context.y));
      expect(delegated).toBeCloseTo((depth * MAX_SCROLL_SPEED * FRAME_MS) / 1000, 5);
    });
  });
});

// Browser only. jsdom has no scrolling, so every assertion above checks the
// `scrollBy` stub. These check the sign and axis of real scrolling.
describe.skipIf(isJSDOM)('engine.registerViewport (real scrolling)', () => {
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

  it('scrolls the container down and up through the vertical edge zones', async () => {
    const { engine } = await renderDnd();
    const clock = installFrameClock();
    const source = createElement();
    const scroller = makeRealScroller();
    scroller.scrollTop = 400;
    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    await driveTo(source, scroller, 100, 195);
    await runPastRamp(clock);
    expect(scroller.scrollTop).toBeGreaterThan(400);

    const afterDown = scroller.scrollTop;
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 5 });
    await runPastRamp(clock);
    expect(scroller.scrollTop).toBeLessThan(afterDown);
    fireDrag.dragEnd();
  });

  it('scrolls the container right through the horizontal edge zone', async () => {
    const { engine } = await renderDnd();
    const clock = installFrameClock();
    const source = createElement();
    const scroller = makeRealScroller();
    scroller.scrollLeft = 400;
    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    await driveTo(source, scroller, 195, 100);
    await runPastRamp(clock);
    expect(scroller.scrollLeft).toBeGreaterThan(400);
    fireDrag.dragEnd();
  });
});
