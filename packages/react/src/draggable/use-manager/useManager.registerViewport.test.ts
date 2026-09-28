import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, waitFor } from '@mui/internal-test-utils';
import { createDndRenderer, isJSDOM, testDragKind } from '#test-utils';
import {
  createElement,
  flushRaf,
  lift,
  registerCleanup,
  setupDragEngineTests,
  fireDrag,
} from '../../../test/dnd';
import { reset } from '../../utils/drag-and-drop/core/lifecycleManager';
import { restrictToHorizontalAxis } from '../../utils/drag-and-drop/dragModifiers';
import { createKind } from '../../utils/drag-and-drop/dragKind';
import { dragSessionStore } from '../../utils/drag-and-drop/dragSessionStore';
import type {
  DraggableManager,
  RegisterViewportParameters,
} from '../../utils/drag-and-drop/registrationTypes';
import type {
  DraggableViewportDragScrollEventDetails,
  DraggableViewportMaxSpeedContext,
} from '../viewport/DraggableViewport';

type DragAutoScrollHandler = NonNullable<RegisterViewportParameters['onDragScroll']>;

setupDragEngineTests();

describe('engine.registerViewport', () => {
  const { renderDnd } = createDndRenderer();

  describe('overflow margins', () => {
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
        await lift(source, { clientX: 100, clientY: 100 });
        fireDrag.dragOver(scroller, { clientX: x, clientY: y });
        await flushRaf();
        await flushRaf();
        await flushRaf();
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

      async function moveTo(point: number[]) {
        fireDrag.dragOver(scroller, { clientX: point[0], clientY: point[1] });
        await flushRaf();
        await flushRaf();
        await flushRaf();
      }

      await moveTo(margin);
      expect(onDragScroll).not.toHaveBeenCalled();
      await moveTo([100, 100]);
      await moveTo(margin);
      expect(onDragScroll).toHaveBeenCalled();
      await moveTo(outside);
      onDragScroll.mockClear();
      await moveTo(margin);
      expect(onDragScroll).not.toHaveBeenCalled();
      await moveTo([100, 100]);
      await moveTo(margin);
      expect(onDragScroll).toHaveBeenCalled();

      engine.cancelDrag();
      onDragScroll.mockClear();
      await lift(source, { clientX: margin[0], clientY: margin[1] });
      await flushRaf();
      await flushRaf();
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
      await lift(source, { clientX: 100, clientY: 100 });

      async function moveTo(point: number[]) {
        fireDrag.dragOver(scroller, { clientX: point[0], clientY: point[1] });
        await flushRaf();
        await flushRaf();
        await flushRaf();
      }

      await moveTo([100, 220]);
      expect(onDragScroll).toHaveBeenCalled();
      isBlocked = true;
      await moveTo([100, 220]);
      isBlocked = false;
      onDragScroll.mockClear();
      await moveTo([100, 220]);
      expect(onDragScroll).not.toHaveBeenCalled();
      await moveTo([100, 100]);
      await moveTo([100, 220]);
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
      await flushRaf();
      await flushRaf();
      unregisterInner();
      fireDrag.dragOver(outer, { clientX: 220, clientY: 220 });
      await flushRaf();
      await flushRaf();
      expect(onDragScroll).not.toHaveBeenCalled();
    });

    it('caps outside engagement at the same speed as the real edge', async () => {
      const clock = installFrameClock();
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeEngageableScroller();
      engine.registerSource(source, {});
      engine.registerViewport(scroller, { overflowMargin: 160, maxSpeed: 100 });
      await lift(source, { clientX: 100, clientY: 100 });
      fireDrag.dragOver(scroller, { clientX: 100, clientY: 200 });
      await flushRaf();
      await flushRaf();
      clock.advance(1000);
      await flushRaf();
      vi.mocked(scroller.scrollBy).mockClear();
      clock.advance(16);
      await flushRaf();
      const edgeDelta = maxVerticalDelta(scroller);
      expect(edgeDelta).toBeCloseTo(1.6);
      fireDrag.dragOver(scroller, { clientX: 100, clientY: 350 });
      await flushRaf();
      await flushRaf();
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
      await lift(source, { clientX: 100, clientY: 100 });
      fireDrag.dragOver(inside, { clientX: 100, clientY: 290 });
      await flushRaf();
      await flushRaf();
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
      await lift(source, { clientX: 100, clientY: 100 });
      fireDrag.dragOver(neighbour, { clientX: 300, clientY: 290 });
      await flushRaf();
      await flushRaf();
      await flushRaf();
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
        await lift(source, { clientX: 100, clientY: 100 });
        fireDrag.dragOver(inner, { clientX: 100, clientY: 220 });
        await flushRaf();
        await flushRaf();
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
      await lift(source, { clientX: 100, clientY: 100 });
      fireDrag.dragOver(scroller, { clientX: -20, clientY: 100 });
      await flushRaf();
      await flushRaf();
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
    await flushRaf();
    await flushRaf();
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
      await flushRaf();
      await flushRaf();
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
    await flushRaf();
    await flushRaf();

    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    try {
      for (const cleanup of cleanups) {
        cleanup();
      }
      fireDrag.dragOver(survivor, { clientX: 100, clientY: 100 });
      await flushRaf();
      await flushRaf();
      await flushRaf();
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
    await flushRaf();
    await flushRaf();
    armed = true;
    fireDrag.dragOver(outer, { clientX: 101, clientY: 190 });
    await flushRaf();
    await flushRaf();
    await flushRaf();
    await flushRaf();
    expect(armed).toBe(false);
    expect(inner.scrollBy).toHaveBeenCalled();
  });

  it('ignores preview child changes while waking for ordinary viewport content changes', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();
    const preview = document.createElement('div');
    preview.setAttribute('data-drag-preview', '');
    scroller.appendChild(preview);
    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});
    await lift(source, { clientX: 100, clientY: 100 });
    await flushRaf();
    await flushRaf();

    const measure = vi.spyOn(scroller, 'getBoundingClientRect');
    try {
      preview.textContent = 'Updated preview';
      await flushRaf();
      await flushRaf();
      expect(measure).not.toHaveBeenCalled();

      scroller.appendChild(document.createElement('div'));
      // The mutation observer schedules the frame after the DOM update.
      await waitFor(() => expect(measure).toHaveBeenCalled());
    } finally {
      measure.mockRestore();
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
        // The documented "canvas with bounds" pattern, which consumes only after
        // the surface moved. That needs a nonzero delta first.
        if (eventDetails.y !== 0) {
          eventDetails.consume();
        }
      },
    });
    await lift(source, { clientX: 100, clientY: 10 });
    fireDrag.dragOver(surface, { clientX: 100, clientY: 190 });
    for (let frame = 0; frame < 6; frame += 1) {
      // eslint-disable-next-line no-await-in-loop
      await flushRaf();
    }
    // The first engaged frame's delta is 0 because the ramp starts there. The
    // surface must stay engaged past it instead of restarting at 0 every frame.
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
    engine.registerSource(source, {});
    engine.registerViewport(scroller, {
      onDragScroll(eventDetails) {
        eventDetails.cancel();
        pan(eventDetails);
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
    engine.registerSource(source, {});
    const cleanup = engine.registerViewport(scroller, {});
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
    engine.registerSource(source, {});
    engine.registerViewport(scroller, { onDragScroll });
    await lift(source, { clientX: 100, clientY: 100 });
    fireDrag.dragOver(scroller, { clientX: 190, clientY: 190 });
    await flushRaf();
    await flushRaf();
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

  it('returns a cleanup function', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const cleanup = engine.registerViewport(el, {});
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('cleanup is safe to call twice', async () => {
    const { engine } = await renderDnd();
    const el = createElement();
    const cleanup = engine.registerViewport(el, {});
    cleanup();
    expect(() => cleanup()).not.toThrow();
  });

  // A 200x200 overflow container at the origin with room to scroll down, so the
  // loop can engage it from its bottom edge zone.
  function makeEngageableScroller(): HTMLElement {
    const scroller = createElement({ top: 0, height: 200, left: 0, width: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 200 });
    return scroller;
  }

  function enableUnrelatedViewport(engine: Pick<DraggableManager, 'registerViewport'>): void {
    registerCleanup(engine.registerViewport(document.createElement('div'), () => ({})));
  }

  // Moves the pointer into the scroller's bottom edge zone and lets the loop run
  // a few frames. The move goes through the scroller element so `fireDrag`
  // resolves the engine's hit test onto it.
  async function driveIntoEdgeZone(source: HTMLElement, scroller: HTMLElement): Promise<void> {
    await lift(source, { clientX: 100, clientY: 10 });
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 190 });
    await flushRaf();
    await flushRaf();
  }

  const MAX_SCROLL_SPEED = 900;
  const FRAME_MS = 16;

  // The applied delta is `depth * (MAX_SCROLL_SPEED / 1000) * deltaMs * rampFactor`,
  // where `deltaMs` and `rampFactor` come from rAF timestamps. The jsdom stub in
  // `test/setupVitest.ts` passes `performance.now()` and a browser passes its
  // frame time, so exact magnitudes vary. This wraps rAF so callbacks receive a
  // timestamp the test controls, which makes the magnitudes exact in both
  // environments.
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

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    await driveIntoEdgeZone(source, scroller);

    // Positive control for the `cancel()` and `cleanup` negatives below. With the
    // scroller overflowing and the pointer in its bottom edge zone, the loop must
    // call `scrollBy`.
    expect(scroller.scrollBy).toHaveBeenCalled();
    // Deltas apply instantly. Inheriting a CSS `scroll-behavior: smooth` would
    // turn each frame's delta into its own smooth animation.
    expect(scroller.scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'instant' }),
    );
  });

  it("keeps other scrollers scrolling when one scroller's onDragScroll throws", async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // Both scrollers share the same box and edge zones. The buggy one registers
    // first, so the loop visits it first.
    const buggy = makeEngageableScroller();
    const sane = makeEngageableScroller();

    engine.registerSource(source, {});
    engine.registerViewport(buggy, {
      onDragScroll() {
        throw new Error('onDragScroll boom');
      },
    });
    engine.registerViewport(sane, {});

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await driveIntoEdgeZone(source, sane);

      // The throw was caught and logged.
      expect(consoleError).toHaveBeenCalled();
      // The buggy scroller was skipped, and the sane one still scrolled.
      expect(buggy.scrollBy).not.toHaveBeenCalled();
      expect(sane.scrollBy).toHaveBeenCalled();
    } finally {
      // End the drag before restoring the spy so later loop frames can't call
      // the throwing `onDragScroll` and log after the spy is gone.
      fireDrag.dragEnd();
      consoleError.mockRestore();
    }
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

    // A scroller in another document whose frame-local rect overlaps the drag's
    // client coordinates. Testing it against the top document's coordinates
    // would scroll the wrong document's container.
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

    // Positive control. The same coordinates engage the same-document scroller,
    // so the foreign one stays idle because of the document check, not a dead
    // loop.
    expect(local.scrollBy).toHaveBeenCalled();
    expect(foreign.scrollBy).not.toHaveBeenCalled();
  });

  it('cancel() prevents native scrolling', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {
      onDragScroll: (eventDetails) => {
        eventDetails.cancel();
      },
    });

    await driveIntoEdgeZone(source, scroller);

    // The pointer is in the edge zone of an overflow container, which the
    // positive control above shows engages the loop. So the missing call comes
    // from `cancel()`, not from the loop never engaging.
    expect(scroller.scrollBy).not.toHaveBeenCalled();
  });

  it('never scrolls an element without a scrollable overflow style', async () => {
    // A registration belongs on the element with scrollable overflow.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerCleanup(() => warnSpy.mockRestore());
    const { engine } = await renderDnd();
    const source = createElement();
    // Same metrics as `makeEngageableScroller`, without `overflow: auto`. The
    // content overflows, but the element is not an overflow container, so the
    // loop's style check must reject it.
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

    // Positive control. The same box with `overflow: auto`, registered mid-drag
    // while the pointer rests in its bottom edge zone, scrolls. So the missing
    // call above comes from the style check, not a dead loop.
    const control = makeEngageableScroller();
    engine.registerViewport(control, {});
    fireDrag.dragOver(control, { clientX: 100, clientY: 190 });
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
    // The second allows the scroll the first forbids, so both halves of the
    // test can tell which hold is active.
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

    // Releasing the second hold makes the first active again, and its `false`
    // answer cancels the scroll the second allowed.
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
    // A delegating surface. Its `pan` would run every frame if the registration
    // were still live (see the positive control above).
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

  it('does not scroll when pointer is outside the element bounding box', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = createElement({ top: 50, height: 100, left: 50, width: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 100 });

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    // Route moves through the scroller element so `fireDrag` resolves them onto
    // it. Each position is outside the scroller's box, so the loop's bounding-box
    // check rejects it.
    await lift(source, { clientX: 55, clientY: 30 });

    // Above the scroller.
    fireDrag.dragOver(scroller, { clientX: 55, clientY: 30 });
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).not.toHaveBeenCalled();

    // Left of the scroller.
    fireDrag.dragOver(scroller, { clientX: 40, clientY: 100 });
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).not.toHaveBeenCalled();

    // Below the scroller.
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 200 });
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).not.toHaveBeenCalled();
  });

  it("scrolls from the physical pointer, not the draggable's modifier-constrained point", async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // The scroller sits below the row the drag starts on, the way a grid's
    // scrolling body sits below its header.
    const scroller = createElement({ top: 100, height: 200, left: 0, width: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 200 });

    const seenY: number[] = [];

    // The axis lock pins every reported input's y to the grab point (10), which
    // is outside the scroller.
    engine.registerSource(source, { modifiers: restrictToHorizontalAxis });
    engine.registerViewport(scroller, {
      onDragScroll: ({ input }) => {
        seenY.push(input.clientY);
      },
    });

    // The grab point is outside the scroller, so the loop parks on its first
    // frame and only the move below wakes it. That takes a couple more frames
    // than `driveIntoEdgeZone`, which grabs inside the scroller.
    await lift(source, { clientX: 100, clientY: 10 });
    // Into the scroller's bottom edge zone (edge size 50 of its 200px height).
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 290 });
    await flushRaf();
    await flushRaf();
    await flushRaf();
    await flushRaf();

    expect(scroller.scrollBy).toHaveBeenCalled();
    // The callbacks see the unconstrained point the edge test used, not the
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

    // Shaped like `restrictToElement`. The reported point is clamped into the
    // list, so pushing past its bottom moves the physical pointer outside the
    // container while the drag stays in the bottom edge zone. Testing only the
    // raw point would skip the container.
    engine.registerSource(source, {
      modifiers: ({ point }) => ({ x: point.x, y: Math.min(point.y, 190) }),
    });
    engine.registerViewport(scroller, {});

    await lift(source, { clientX: 100, clientY: 100 });
    // Physically past the bottom of the scroller (rect ends at 200).
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 290 });
    await flushRaf();
    await flushRaf();
    await flushRaf();

    expect(scroller.scrollBy).toHaveBeenCalled();
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
    // Two side-by-side lists. The drag is clamped into the left one, so the
    // right one can never receive the item.
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
    // The physical pointer is in B's bottom edge zone, and the reported point is
    // pinned to A's bottom-right corner. B contains only the raw pointer, so it
    // must not take the vertical axis from A.
    fireDrag.dragOver(listB, { clientX: 300, clientY: 190 });
    await flushRaf();
    await flushRaf();
    await flushRaf();

    expect(listA.scrollBy).toHaveBeenCalled();
    expect(listB.scrollBy).not.toHaveBeenCalled();
  });

  it('a scroller registered mid-drag engages once a fresh move arrives', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeEngageableScroller();

    engine.registerSource(source, {});

    // Start the drag with no scroller registered. Grab at the scroller's
    // vertical center (y=100 of 200), which is in no edge zone, so the frame the
    // registration below wakes finds nothing to scroll.
    await lift(source, { clientX: 100, clientY: 100 });

    // Register the scroller mid-drag. It joins the current drag's candidates,
    // but the pointer rests at the center, in no edge zone, so nothing scrolls
    // yet.
    engine.registerViewport(scroller, {});
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).not.toHaveBeenCalled();

    // A pointer move into the bottom edge zone lets the mid-drag scroller
    // scroll. The sensor flushes `onMove` in its own frame, which wakes the
    // loop for the following frame.
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 190 });
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

    engine.registerSource(source, {});

    // Rest the pointer in the bottom edge zone of a container that isn't
    // registered yet. Nothing engages, so the loop parks. Flush until the
    // gesture pipeline is quiet too. The move's `onMove` and `onTargetChange`
    // wake the loop for a frame or two afterwards, and a registration during
    // those frames would ride on their wake instead of its own.
    await lift(source, { clientX: 100, clientY: 10 });
    fireDrag.dragOver(surface, { clientX: 100, clientY: 190 });
    await flushRaf();
    await flushRaf();
    await flushRaf();
    await flushRaf();
    await flushRaf();
    expect(pan).not.toHaveBeenCalled();

    // A panel opening under the pointer. The container registers after the
    // pointer stopped moving, so no input will wake the parked loop. The
    // registration itself has to wake it.
    engine.registerViewport(surface, {
      onDragScroll: (eventDetails) => {
        eventDetails.cancel();
        pan(eventDetails);
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

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    // Rest the pointer in the scroller's bottom edge zone. The loop engages and
    // scrolls every frame with no further pointer movement.
    await driveIntoEdgeZone(source, scroller);
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    expect(scrollByMock).toHaveBeenCalled();
    scrollByMock.mockClear();

    // A second scroller mounting mid-drag must not touch the running loop's
    // input or frame clock. The pointer isn't moving, so resetting the loop
    // would stop the scroll with no new move to restart it.
    const other = createElement({ top: 500, height: 100, left: 0, width: 100 });
    engine.registerViewport(other, {});
    await flushRaf();
    await flushRaf();
    expect(scrollByMock).toHaveBeenCalled();
  });

  describe('accept', () => {
    const otherKind = createKind<unknown>('base-ui-test/other');

    it('skips a scroller whose accept does not match the drag kind', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Both share one box, and the mismatching scroller registers first, so the
      // loop visits it first. A broken filter would let it consume the vertical
      // axis before the accepting one.
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

      // A drag this scroller doesn't accept neither scrolls it nor runs its
      // per-frame callbacks.
      expect(picky.scrollBy).not.toHaveBeenCalled();
      expect(pickyShouldScroll).not.toHaveBeenCalled();
      // Positive control. An array `accept` containing the drag's kind engages
      // at the same coordinates.
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

    // Rest the pointer in the scroller's bottom edge zone, over the scroller
    // itself. The loop engages and scrolls every frame.
    await driveIntoEdgeZone(source, scroller);
    expect(scroller.scrollBy).toHaveBeenCalled();
    expect(onDraggableEnter).not.toHaveBeenCalled();

    // The scroll moves the target under the resting pointer. jsdom moves
    // nothing, so point the mocked `elementFromPoint` at the target without
    // moving the pointer. Every engaged frame marks the sensor's frame dirty
    // (`notifyExternalScroll`), so the next hit test must find the target and
    // fire its enter. The shared teardown restores `elementFromPoint`.
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

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    await driveIntoEdgeZone(source, scroller);
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    expect(scrollByMock).toHaveBeenCalled();

    // Out of the zone. Once the move settles, the loop must stop scrolling.
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 100 });
    await flushRaf();
    await flushRaf();
    scrollByMock.mockClear();
    await flushRaf();
    await flushRaf();
    expect(scrollByMock).not.toHaveBeenCalled();

    // Back into the zone. The loop engages again instead of staying parked. The
    // sensor frame flushes `onMove`, which wakes the loop for the next frame.
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 190 });
    await flushRaf();
    await flushRaf();
    await flushRaf();
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
    await flushRaf();
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).not.toHaveBeenCalled();

    // 100px from the bottom edge, inside the capped 180px zone.
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 900 });
    await flushRaf();
    await flushRaf();
    await flushRaf();
    expect(scroller.scrollBy).toHaveBeenCalled();
  });

  it('engages a scroller inside an open shadow root before its light-DOM ancestor scroller', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // A light-DOM scroller hosts an open shadow root with its own scroller in
    // the same box. The depth sort walks composed parents across the shadow
    // boundary, so the shadow scroller sorts deeper and consumes the vertical
    // axis first. A walk using only `parentElement` would give the shadow child
    // depth 1 and hand the axis to the light-DOM ancestor.
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

    // Both boxes span y=0..200, so y=190 is in both bottom edge zones.
    await driveIntoEdgeZone(source, outer);

    expect(inner.scrollBy).toHaveBeenCalled();
    expect(outer.scrollBy).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Nested scroll containers
  // ---------------------------------------------------------------------------
  //
  // These assert which scroller's `scrollBy` was called for a pointer position,
  // and on which axis. That depends on engagement, not on the applied delta.
  // `scrollLoop` calls `scrollBy` and consumes the axis as soon as the pointer is
  // in an edge zone, even on the first ramp frame where the delta is 0. So the
  // depth sort and per-axis hand-off are visible without controlling frame
  // timing, and these don't need Chromium.
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

    // Track nodes created by hand so `afterEach` removes them, because they
    // bypass the `createElement` helper's tracking. The module-level
    // `setupDragEngineTests` already resets the engine, so this only removes nodes.
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
      // Outer spans y=0..300. Inner is nested inside it and spans y=0..100, so
      // its bottom edge zone (y≈75..100) is far from the outer's (y≈225..300).
      // A pointer at y=90 is only in the inner's edge zone.
      const outer = makeScroller({ top: 0, height: 300, left: 0, width: 200 });
      const inner = makeScroller({ top: 0, height: 100, left: 0, width: 200 }, outer.element);

      engine.registerSource(source, {});
      engine.registerViewport(outer.element, {});
      engine.registerViewport(inner.element, {});

      await lift(source, { clientX: 100, clientY: 90 });
      fireDrag.dragOver(inner.element, { clientX: 100, clientY: 90 });
      await flushRaf();
      await flushRaf();

      // Inner sorts first and consumes the vertical axis in its edge zone. The
      // pointer isn't in the outer's edge zone, so outer stays idle.
      expect(inner.scrollBy).toHaveBeenCalled();
      expect(outer.scrollBy).not.toHaveBeenCalled();
    });

    it('per-axis hand-off: inner consumes vertical, outer scrolls horizontal', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Both containers share the same box, so the pointer is in both their
      // bottom (vertical) and right (horizontal) edge zones. Inner allows only
      // the vertical axis and outer allows both. Inner sorts first and consumes
      // vertical, which leaves horizontal for the outer.
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
      await flushRaf();
      await flushRaf();

      // Inner cancels the horizontal axis, so it never scrolls `left`.
      expect(inner.scrollBy).toHaveBeenCalled();
      expect(inner.scrollBy.mock.calls.every(([arg]) => (arg.left ?? 0) === 0)).toBe(true);
      // The outer took the horizontal axis the inner didn't consume, and left the
      // consumed vertical axis alone (top stays 0).
      expect(outer.scrollBy).toHaveBeenCalled();
      expect(outer.scrollBy.mock.calls.every(([arg]) => (arg.top ?? 0) === 0)).toBe(true);
    });

    it('hands the axis to the outer scroller when the inner sits at its scroll limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // The outer is scrolled to the middle. The inner shares its box but is
      // fully scrolled (800 + 200 === 1000), so its bottom edge can't engage.
      // The vertical axis must pass to the outer instead of stopping at the
      // deeper scroller.
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

      engine.registerSource(source, {});
      engine.registerViewport(outer.element, {});
      engine.registerViewport(inner, {});

      await lift(source, { clientX: 100, clientY: 100 });
      fireDrag.dragOver(inner, { clientX: 100, clientY: 190 });
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
      // Neither cancels nor consumes, like the analytics handler in the docs. It
      // must not withhold the axis from the outer.
      const observe = vi.fn();

      engine.registerSource(source, {});
      engine.registerViewport(outer.element, {});
      engine.registerViewport(inner, { onDragScroll: observe });

      await lift(source, { clientX: 100, clientY: 100 });
      fireDrag.dragOver(inner, { clientX: 100, clientY: 190 });
      await flushRaf();
      await flushRaf();
      await flushRaf();

      expect(
        observe.mock.calls.some(([eventDetails]) => eventDetails.direction === 'vertical'),
      ).toBe(true);
      expect(innerScrollBy).not.toHaveBeenCalled();
      expect(outer.scrollBy).toHaveBeenCalled();
    });

    it('invalidates the depth-order cache across register/unregister', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Both containers share one rect and one edge zone, so the pointer never
      // has to move. Only the depth order decides which of them scrolls.
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

      // Lift mid-container, outside any edge zone, then move into the shared
      // bottom edge zone. Inner sorts first and consumes both axes, so the outer
      // never sees them. The loop parks on its first frame and only the move
      // wakes it, which takes a few more frames than a lift inside the zone (see
      // the modifier test above).
      await lift(source, { clientX: 100, clientY: 50 });
      fireDrag.dragOver(inner, { clientX: 100, clientY: 90 });
      await flushRaf();
      await flushRaf();
      await flushRaf();
      await flushRaf();
      expect(innerPan).toHaveBeenCalled();
      expect(outer.scrollBy).not.toHaveBeenCalled();

      // Unregister the inner mid-drag with the pointer where the inner was
      // winning. The cached inner-first order must be rebuilt without it, and the
      // outer, with the same rect, edge zone, and point, must take the axes over.
      // Nothing else changes, so a stale cache would keep giving the axes to a
      // scroller that is no longer registered.
      cleanupInner();
      innerPan.mockClear();
      outer.scrollBy.mockClear();
      // Fire the move again at the same point. The input and stack don't change,
      // but it keeps the loop awake instead of parked on the transition frame.
      // The outer engages from scratch and its first ramp frame scrolls by 0, so
      // a single frame would be timing-sensitive in jsdom.
      fireDrag.dragOver(inner, { clientX: 100, clientY: 90 });
      await flushRaf();
      fireDrag.dragOver(inner, { clientX: 100, clientY: 90 });
      await flushRaf();
      await flushRaf();

      expect(outer.scrollBy).toHaveBeenCalled();
      expect(innerPan).not.toHaveBeenCalled();
    });

    // jsdom only. The held frame clock keeps every rAF timestamp identical, so
    // every `frameSpeed` is 0. In a browser the timestamps advance and the deltas
    // become nonzero, so engaging with a 0 delta can only be observed here.
    it.skipIf(!isJSDOM)(
      'engages on intent: scrollBy fires on the first (delta-0) frame in an edge zone',
      async () => {
        installFrameClock();
        const { engine } = await renderDnd();
        const source = createElement();
        const scroller = makeScroller({ top: 0, height: 200, left: 0, width: 200 });

        engine.registerSource(source, {});
        engine.registerViewport(scroller.element, {});

        // The loop must call `scrollBy` and consume the axis as soon as it
        // engages. Otherwise the nested-scroller hand-off would break on the first
        // ramp frame. The call must happen even though the delta is 0.
        await lift(source, { clientX: 100, clientY: 190 });
        fireDrag.dragOver(scroller.element, { clientX: 100, clientY: 190 });
        await flushRaf();
        await flushRaf();

        expect(scroller.scrollBy).toHaveBeenCalled();
        expect(scroller.scrollBy.mock.calls.every(([arg]) => (arg.top ?? 0) === 0)).toBe(true);
      },
    );
  });

  // ---------------------------------------------------------------------------
  // Explicit scroll containers
  // ---------------------------------------------------------------------------
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
      fireDrag.dragOver(hit, { clientX, clientY });
      await flushRaf();
      await flushRaf();
      await flushRaf();
    }

    it('does not scroll an unregistered ancestor when another viewport is registered', async () => {
      const { engine } = await renderDnd();
      const container = makeContainer();
      const source = makeNestedSource(container.element);

      engine.registerSource(source, {});
      enableUnrelatedViewport(engine);

      await driveTo(source, container.element, 100, 190);

      expect(container.scrollBy).not.toHaveBeenCalled();
    });

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
      engine.registerSource(source, {});
      engine.registerViewport(container.element, {});

      await driveTo(source, first, 100, 190);

      const computedStyle = vi.spyOn(window, 'getComputedStyle');
      registerCleanup(() => computedStyle.mockRestore());
      fireDrag.dragOver(second, { clientX: 100, clientY: 190 });
      await flushRaf();
      await flushRaf();

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
      // A hover class toggled on the row under the pointer. The row's own style
      // can't change the overflow of a container above it, so the container's
      // cached styles stay.
      await act(async () => {
        row.className = 'hovered';
      });
      fireDrag.dragOver(row, { clientX: 100, clientY: 190 });
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
      engine.registerSource(source, {});
      engine.registerViewport(first.element, {});
      engine.registerViewport(second.element, {});

      await driveTo(source, first.element, 100, 190);
      expect(first.scrollBy).toHaveBeenCalled();
      fireDrag.dragOver(second.element, { clientX: 400, clientY: 190 });
      await flushRaf();
      await flushRaf();
      expect(second.scrollBy).toHaveBeenCalled();

      await act(async () => {
        first.element.style.overflow = 'hidden';
      });
      first.scrollBy.mockClear();
      fireDrag.dragOver(first.element, { clientX: 100, clientY: 190 });
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

      engine.registerSource(source, {});
      engine.registerTarget(column, {});
      engine.registerViewport(list.element, {});

      await driveTo(source, list.element, 100, 190);

      expect(list.scrollBy).toHaveBeenCalled();
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

      engine.registerSource(source, {});
      engine.registerTarget(target, {});
      engine.registerViewport(targetContainer.element, {});

      await driveTo(source, target, 100, 190);

      expect(targetContainer.scrollBy).toHaveBeenCalled();
      expect(sourceContainer.scrollBy).not.toHaveBeenCalled();
    });

    it('still scrolls the container under the pointer when it is over no drop target', async () => {
      const { engine } = await renderDnd();
      const { targetContainer, source, target } = renderTwoContainers();

      engine.registerSource(source, {});
      engine.registerTarget(target, {});
      engine.registerViewport(targetContainer.element, {});

      await driveTo(source, targetContainer.element, 100, 190);

      expect(targetContainer.scrollBy).toHaveBeenCalled();
    });

    it('scrolls a registered source container when the pointer hits an unrelated element', async () => {
      const { engine } = await renderDnd();
      const sourceContainer = makeContainer();
      const source = makeNestedSource(sourceContainer.element);
      const outsider = createElement({ top: 150, height: 50, left: 0, width: 200 });

      engine.registerSource(source, {});
      engine.registerViewport(sourceContainer.element, {});

      await driveTo(source, outsider, 100, 190);

      expect(sourceContainer.scrollBy).toHaveBeenCalled();
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

    it('an accept that does not match keeps the container still for that drag', async () => {
      const { engine } = await renderDnd();
      const container = makeContainer();
      const source = makeNestedSource(container.element);

      engine.registerSource(source, {}); // the renderer's default `testDragKind`
      engine.registerViewport(container.element, {
        accept: createKind<unknown>('base-ui-test/other-viewport'),
      });

      await driveTo(source, container.element, 100, 190);

      expect(container.scrollBy).not.toHaveBeenCalled();
    });

    it('does not scroll an unregistered ancestor with no scrollable overflow', async () => {
      const { engine } = await renderDnd();
      const viewport = makeContainer({ overflow: 'visible' });
      const source = makeNestedSource(viewport.element);

      engine.registerSource(source, {});
      // Another viewport keeps the scroll loop alive, so the missing call below
      // comes from the ancestor, not a parked loop.
      enableUnrelatedViewport(engine);

      await driveTo(source, viewport.element, 100, 190);

      expect(viewport.scrollBy).not.toHaveBeenCalled();
    });

    it('drives that same ancestor through an explicit pan registration', async () => {
      const { engine } = await renderDnd();
      const viewport = makeContainer({ overflow: 'visible' });
      const source = makeNestedSource(viewport.element);
      const pan = vi.fn();

      engine.registerSource(source, {});
      engine.registerViewport(viewport.element, {
        onDragScroll: (eventDetails) => {
          eventDetails.cancel();
          pan(eventDetails);
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
  // The page scrolls only when an app registers `document.documentElement`, or a
  // `body` that maps to it. The loop then reads the page's overflow instead of
  // the element's, measures the edge zones against the viewport, and scrolls
  // through the scrolling element. jsdom reports 0 for every metric and has no
  // `scrollBy`, so these tests define fixed metrics on `documentElement` as
  // configurable own properties. The cleanup queue removes them so later tests
  // see an untouched root.
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
      // What the root reports mid-scroll, a rect spanning the whole document with
      // a negative top. Edge math based on `getBoundingClientRect` would place
      // the pointer outside every edge zone and fail these tests.
      define('getBoundingClientRect', () => new DOMRect(0, -500, 800, 2000));
      registerCleanup(() => {
        for (const name of installed) {
          Reflect.deleteProperty(element, name);
        }
      });
      return { element, scrollBy };
    }

    // Lift at the viewport center, outside any edge zone, then move to the given
    // point, so only the `dragOver` can engage the loop. The sensor flushes
    // `onMove` in its own frame, and the loop runs in the next one.
    async function drive(source: HTMLElement, clientX: number, clientY: number): Promise<void> {
      await lift(source, { clientX: 400, clientY: 300 });
      fireDrag.dragOver(document.documentElement, { clientX, clientY });
      await flushRaf();
      await flushRaf();
    }

    it('does not engage with no auto-scroll registration', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerSource(source, {});

      await drive(source, 400, 590);

      expect(page.scrollBy).not.toHaveBeenCalled();
    });

    it('is suppressed by an imperative registration on the document root', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerSource(source, {});
      // `Draggable.Viewport` renders a `<div>` and can't be placed on `<html>`, so
      // the imperative registration is the only way to opt the page out.
      registerCleanup(
        engine.registerViewport(document.documentElement, () => ({
          onDragScroll: (eventDetails) => {
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
      await flushRaf();
      await flushRaf();

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
      // `document.body` with default styling is not an overflow container, so
      // the registration must map to the page scroller instead of silently doing
      // nothing.
      registerCleanup(engine.registerViewport(document.body, {}));

      await drive(source, 400, 590);

      expect(page.scrollBy).toHaveBeenCalled();
    });

    // `<body>`'s overflow propagates to the viewport only while `<html>`'s
    // computed overflow is `visible` on both axes. The tests below cover both
    // sides. A propagating `body` stands in for the page and can lock it, and a
    // non-propagating one is a regular element.
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
      // A browser computes `overflow-x: hidden` alone to `overflow-y: auto`.
      // jsdom doesn't, so the pair is spelled out. That must not turn `body` into
      // a scroll container, whose `scrollBy` would move nothing, and cut the page
      // scroller out of the chain.
      styleOverflow(document.body, { overflowX: 'hidden', overflowY: 'auto' });
      // What a browser reports for a `body` spanning the viewport. A `body`
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

      engine.registerSource(source, {});
      registerCleanup(engine.registerViewport(page.element, {}));

      await drive(source, 700, 300);
      expect(page.scrollBy).not.toHaveBeenCalled();

      fireDrag.dragOver(document.documentElement, { clientX: 400, clientY: 590 });
      await flushRaf();
      await flushRaf();
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

      // Top edge of a page scrolled down by 500px. Against the mocked bounding
      // rect (top -500, height 2000) the pointer is 510px into a 2000px box, in
      // no edge zone. Against the 600px viewport it is 10px from the top, and
      // `scrollTop` 500 leaves room to scroll back up.
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

    it('respects direction cancellation', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();

      engine.registerSource(source, {});
      registerCleanup(
        engine.registerViewport(page.element, {
          onDragScroll: (eventDetails) => {
            const allowedDirection = 'vertical';
            if (allowedDirection !== eventDetails.direction) {
              eventDetails.cancel();
            }
          },
        }),
      );

      // Left edge only. The only axis that can engage is horizontal, which the
      // handler cancels.
      await drive(source, 10, 300);

      expect(page.scrollBy).not.toHaveBeenCalled();
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

      await drive(source, 400, 590);

      expect(inner.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy).not.toHaveBeenCalled();
    });

    it('an inner overflow container consumes the axis; the page is the outermost fallback', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const page = mockPageScroller();
      // An overflow container in the lower middle of the viewport. Its bottom
      // edge zone (y ≈ 550..600) is inside the viewport's bottom edge zone
      // (y > 450), and x = 400 is in neither one's horizontal edge zone.
      const inner = createElement({ top: 400, height: 200, left: 300, width: 200 });
      inner.style.overflow = 'auto';
      inner.scrollBy = vi.fn();
      Object.defineProperty(inner, 'scrollTop', { value: 400, writable: true });
      Object.defineProperty(inner, 'scrollHeight', { value: 1000 });
      Object.defineProperty(inner, 'clientHeight', { value: 200 });

      engine.registerSource(source, {});
      registerCleanup(engine.registerViewport(page.element, {}));
      const cleanupInner = engine.registerViewport(inner, {});

      await drive(source, 400, 590);

      // The root is every scroller's ancestor, so the depth sort visits it last.
      // The inner container consumes the vertical axis and the page stays idle.
      expect(inner.scrollBy).toHaveBeenCalled();
      expect(page.scrollBy).not.toHaveBeenCalled();

      // With the inner gone, the same spot falls through to the page.
      cleanupInner();
      fireDrag.dragOver(document.documentElement, { clientX: 400, clientY: 590 });
      await flushRaf();
      fireDrag.dragOver(document.documentElement, { clientX: 400, clientY: 590 });
      await flushRaf();
      await flushRaf();
      await flushRaf();
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
      await flushRaf();
      await flushRaf();
      await flushRaf();
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
      startTouchDrag(source, centerX, viewportHeight - 10);
      await waitForRampUp();
      expect(window.scrollY).toBeGreaterThan(0);
      endTouchDrag(centerX, viewportHeight - 10);

      // Once the page is scrolled, the root's bounding rect has a negative top,
      // so edge math based on that rect would never engage again. From a
      // scrolled page, the top edge must scroll back up.
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

      engine.registerSource(source, {
        activation: { touch: { type: 'immediate' } },
      });
      registerCleanup(engine.registerViewport(document.documentElement, {}));

      const centerY = Math.floor(document.documentElement.clientHeight / 2);
      const viewportWidth = document.documentElement.clientWidth;

      // At the RTL start position the content extends to the left, so the right
      // edge has no room to scroll.
      startTouchDrag(source, viewportWidth - 10, centerY);
      await waitForRampUp();
      expect(window.scrollX).toBeCloseTo(0);
      endTouchDrag(viewportWidth - 10, centerY);

      // The left edge scrolls into the content. The browser reports the offset
      // as negative in RTL.
      startTouchDrag(source, 10, centerY);
      await waitForRampUp();
      expect(window.scrollX).toBeLessThan(0);
      endTouchDrag(10, centerY);
    });

    // HTML propagates `direction` from `<body>` to the viewport, so a `<body
    // dir="rtl">` page scrolls RTL while the root still computes as `ltr`.
    it('honours the RTL home edge when only <body> is RTL', async () => {
      const { engine } = await renderDnd();
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
      startTouchDrag(source, viewportWidth - 10, centerY);
      await waitForRampUp();
      expect(window.scrollX).toBeCloseTo(0);
      endTouchDrag(viewportWidth - 10, centerY);

      // Reading the root's `ltr` would leave this edge dead. The left edge must
      // scroll into the content.
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

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    // Engage in the bottom edge zone, so the loop reschedules itself every frame.
    await driveIntoEdgeZone(source, scroller);
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    expect(scrollByMock).toHaveBeenCalled();

    // A normal drop sends `onMoveEnd` to the scroll monitor, which must stop the
    // loop. No later frame may scroll.
    fireDrag.drop(scroller, { clientX: 100, clientY: 190 });
    scrollByMock.mockClear();
    await flushRaf();
    await flushRaf();
    expect(scrollByMock).not.toHaveBeenCalled();
  });

  it('stops the scroll loop when the drag is torn down without an onMoveEnd to monitors', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    // Scrollable container whose top edge zone (y < 50) engages the loop.
    const scroller = createElement({ top: 0, height: 200, left: 0, width: 200 });
    scroller.style.overflow = 'auto';
    scroller.scrollBy = vi.fn();
    Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scroller, 'clientHeight', { value: 200 });

    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    // Rest the pointer in the top edge zone so the loop engages and keeps
    // rescheduling itself during the drag.
    await lift(source, { clientX: 100, clientY: 10 });
    await flushRaf();
    const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
    expect(scrollByMock).toHaveBeenCalled();

    // When a consumer callback throws, the lifecycle is torn down through
    // `reset()`. It runs `clearActiveMonitors()` without sending `onMoveEnd` to
    // the scroll monitor, so `stopScrollLoop` never runs. Calling `reset()` here
    // reproduces that teardown, which used to leave the loop scrolling forever.
    act(() => {
      reset();
    });
    expect(dragSessionStore.getSnapshot()).toBeNull();

    // The loop must stop itself now that no drag session is live.
    scrollByMock.mockClear();
    await flushRaf();
    await flushRaf();
    expect(scrollByMock).not.toHaveBeenCalled();
  });

  // The delta passed to `scrollBy` is `depth * frameSpeed`, and `frameSpeed`
  // comes from the time between rAF timestamps. The direction assertions below
  // read the delta's sign, so they need timestamps that advance every frame.
  // That takes Chromium's scheduling, not the `setTimeout` frames jsdom gets from
  // `test/setupVitest.ts`.
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
    // Long enough for the ~400ms ramp-up to produce nonzero scroll deltas.
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
      // A 200px tall scroller at y=0, so each edge zone is 25% of it (50px).
      const scroller = createElement({ top: 0, height: 200, left: 0, width: 200 });
      scroller.style.overflow = 'auto';
      scroller.scrollBy = vi.fn();
      // `scrollTop` in the middle, so it can scroll both up and down.
      Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
      Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
      Object.defineProperty(scroller, 'clientHeight', { value: 200 });

      engine.registerSource(source, {
        activation: { touch: { type: 'immediate' } },
      });
      engine.registerViewport(scroller, {});

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
      // Overflows on both axes and is scrolled to the middle, so every direction has room.
      Object.defineProperty(scroller, 'scrollTop', { value: 400, writable: true });
      Object.defineProperty(scroller, 'scrollHeight', { value: 1000 });
      Object.defineProperty(scroller, 'clientHeight', { value: 200 });
      Object.defineProperty(scroller, 'scrollLeft', { value: 400, writable: true });
      Object.defineProperty(scroller, 'scrollWidth', { value: 1000 });
      Object.defineProperty(scroller, 'clientWidth', { value: 200 });

      engine.registerSource(source, {
        activation: { touch: { type: 'immediate' } },
      });
      engine.registerViewport(scroller, {
        onDragScroll: (eventDetails) => {
          const allowedDirection = 'vertical';
          if (allowedDirection !== eventDetails.direction) {
            eventDetails.cancel();
          }
        },
      });

      // Pointer at the left edge (x=10), centered vertically (y=100) so no vertical edge engages.
      startTouchDrag(source, 10, 100);
      await waitForRampUp();

      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
      // The pointer is only in a horizontal edge zone, which the handler cancels,
      // and there is no vertical edge zone. So no horizontal scroll happens.
      expect(scrollByMock.mock.calls.every(([arg]) => arg.left === 0)).toBe(true);

      endTouchDrag(10, 100);
    });

    // RTL containers report `scrollLeft` as 0 at the right-hand start, going
    // negative toward the end. The loop accounts for that before deciding
    // whether an edge can scroll. `scrollBy` deltas use the same directions as
    // in LTR.
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
      // In the middle (-400 of a maximum of 800), so both directions have room.
      const scroller = makeRtlScroller(-400);

      engine.registerSource(source, {
        activation: { touch: { type: 'immediate' } },
      });
      engine.registerViewport(scroller, {});

      // Left edge (x=10), centered vertically. It scrolls further left, so the
      // deltas must be negative and never positive.
      startTouchDrag(source, 10, 100);
      await waitForRampUp();
      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
      const leftEdgeDeltas = scrollByMock.mock.calls.map(([arg]) => arg.left);
      expect(leftEdgeDeltas.some((left) => left < 0)).toBe(true);
      expect(leftEdgeDeltas.every((left) => left <= 0)).toBe(true);

      endTouchDrag(10, 100);
      scrollByMock.mockClear();

      // Right edge (x=190). It scrolls back toward the start, so the deltas are positive.
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
      // Start position, where `scrollLeft` is 0 in RTL.
      const scroller = makeRtlScroller(0);

      engine.registerSource(source, {
        activation: { touch: { type: 'immediate' } },
      });
      engine.registerViewport(scroller, {});

      // The right edge at the start position has no room. The LTR check
      // (`scrollLeft + clientWidth < scrollWidth`, so 0 + 200 < 1000) would
      // engage here, so any call means the RTL handling broke.
      startTouchDrag(source, 190, 100);
      await waitForRampUp();
      expect(scroller.scrollBy).not.toHaveBeenCalled();
      endTouchDrag(190, 100);

      // The left edge at the start position has all the room. The LTR check
      // (`scrollLeft > 0`) would treat it as unscrollable and never engage.
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
  // A container exactly at a limit must not engage. The loop consumes the axis
  // as soon as it engages, so engaging here would scroll past the limit and keep
  // the axis from an outer scroller. The `Math.ceil` and `Math.floor` guards also
  // reject a limit reached at a fractional offset, which Chrome 115+ reports.
  describe('scroll limits', () => {
    // An overflow container whose scroll offsets the test sets, so it can sit at
    // a limit instead of the default middle position. It overflows on both axes,
    // so each limit is rejected by its own guard and not because the container
    // has nothing to scroll.
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

    // Lift at the box's center, outside any edge zone, then move to the given point.
    async function drive(source: HTMLElement, scroller: HTMLElement, x: number, y: number) {
      await lift(source, { clientX: 100, clientY: 100 });
      fireDrag.dragOver(scroller, { clientX: x, clientY: y });
      await flushRaf();
      await flushRaf();
      await flushRaf();
    }

    it('does not scroll down when the container is already at its bottom limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Fully scrolled: 800 + 200 === 1000.
      const scroller = makeScrollerAt({ scrollTop: 800 });

      engine.registerSource(source, {});
      engine.registerViewport(scroller, {});

      await drive(source, scroller, 100, 190);

      expect(scroller.scrollBy).not.toHaveBeenCalled();
    });

    it('does not scroll down when the bottom limit is reached at a fractional offset', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Chrome 115+ reports fractional offsets. 799.5 + 200 < 1000 looks
      // scrollable, so without the `Math.ceil` guard the loop would engage and
      // overshoot the limit by half a pixel.
      const scroller = makeScrollerAt({ scrollTop: 799.5 });

      engine.registerSource(source, {});
      engine.registerViewport(scroller, {});

      await drive(source, scroller, 100, 190);

      expect(scroller.scrollBy).not.toHaveBeenCalled();
    });

    it('does not scroll up when the container is at the top limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeScrollerAt({ scrollTop: 0 });

      engine.registerSource(source, {});
      engine.registerViewport(scroller, {});

      await drive(source, scroller, 100, 10);

      expect(scroller.scrollBy).not.toHaveBeenCalled();
    });

    it('does not scroll right when the container is already at its right limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // 799.5 exercises the `Math.ceil` guard the exhausted right edge relies on.
      const scroller = makeScrollerAt({ scrollLeft: 799.5 });

      engine.registerSource(source, {});
      engine.registerViewport(scroller, {});

      await drive(source, scroller, 190, 100);

      expect(scroller.scrollBy).not.toHaveBeenCalled();
    });

    it('allows custom horizontal movement past the native right limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeScrollerAt({ scrollLeft: 800 });
      const pan = vi.fn();

      engine.registerSource(source, {});
      engine.registerViewport(scroller, {
        onDragScroll(eventDetails) {
          eventDetails.cancel();
          pan(eventDetails);
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

      engine.registerSource(source, {});
      engine.registerViewport(scroller, { onDragScroll });

      await drive(source, scroller, 190, 190);

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

    it('does not scroll left when the container is at the left limit', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const scroller = makeScrollerAt({ scrollLeft: 0 });

      engine.registerSource(source, {});
      engine.registerViewport(scroller, {});

      await drive(source, scroller, 10, 100);

      expect(scroller.scrollBy).not.toHaveBeenCalled();
    });

    it('still scrolls at every edge of the same fixture when the limits are not reached', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      // Positive control for the five negatives above. The same fixture, scrolled
      // to the middle on both axes, engages at each of their four points. So the
      // missing calls there come from the limit guards, not a loop that never
      // engages.
      const scroller = makeScrollerAt({ scrollTop: 400, scrollLeft: 400 });
      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;

      engine.registerSource(source, {});
      engine.registerViewport(scroller, {});

      await lift(source, { clientX: 100, clientY: 100 });

      // Sequential on purpose. Each move starts from where the previous one left
      // the pointer.
      async function expectScrollAt(x: number, y: number): Promise<void> {
        scrollByMock.mockClear();
        fireDrag.dragOver(scroller, { clientX: x, clientY: y });
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

    // jsdom only. The fake frame clock feeds the loop its own timestamps, which
    // is only deterministic with jsdom's `setTimeout`-based rAF. In a browser the
    // loop also sees real frames, so the clock no longer controls the per-frame
    // delta.
    it.skipIf(!isJSDOM)('clamps the per-frame delta when the frame loop stalls', async () => {
      const { engine } = await renderDnd();
      const clock = installFrameClock();
      const source = createElement();
      const scroller = makeEngageableScroller();

      engine.registerSource(source, {});
      engine.registerViewport(scroller, {});

      // `driveIntoEdgeZone` leaves the pointer at y=190 of a 200px box, 0.8 deep
      // into the 50px bottom edge zone.
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

      // A stalled rAF, after a long consumer `onMove`, a GC pause, or a throttled
      // tab, resumes with a huge elapsed time.
      scrollByMock.mockClear();
      clock.advance(5000);
      await flushRaf();
      const stalledFrame = maxVerticalDelta(scroller);

      // The delta is capped at MAX_FRAME_DELTA_MS of scrolling instead of the 5
      // seconds (~3600px) an uncapped `deltaMs` would apply.
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

        // Engage at 0.8 depth (y=190 of the 200px box). The clock doesn't move,
        // so every engaged frame applies a 0 delta and only `advance` moves the
        // ramp forward.
        await lift(source, { clientX: 100, clientY: 100 });
        fireDrag.dragOver(scroller, { clientX: 100, clientY: 190 });
        await flushRaf();
        await flushRaf();
        await flushRaf();
        const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;
        expect(scrollByMock).toHaveBeenCalled();

        // One frame 200ms into the ramp, so rampFactor is 0.5. The 200ms is capped
        // to a 64ms scroll delta, the same as the full-ramp frame below, so the
        // ratio isolates the ramp factor.
        scrollByMock.mockClear();
        clock.advance(200);
        await flushRaf();
        await flushRaf();
        const midRamp = maxVerticalDelta(scroller);

        // Past 400ms of engagement, rampFactor is 1 with the same capped delta.
        scrollByMock.mockClear();
        clock.advance(300);
        await flushRaf();
        await flushRaf();
        const fullRamp = maxVerticalDelta(scroller);

        expect(midRamp).toBeGreaterThan(0);
        expect(midRamp / fullRamp).toBeCloseTo(0.5, 5);

        // Leaving the edge zone resets the engagement start.
        fireDrag.dragOver(scroller, { clientX: 100, clientY: 100 });
        await flushRaf();
        await flushRaf();
        await flushRaf();
        // On re-entry the ramp starts over instead of resuming at full speed.
        fireDrag.dragOver(scroller, { clientX: 100, clientY: 190 });
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

      engine.registerSource(source, {});
      engine.registerViewport(scroller, {});

      // Lift at the box's vertical center, outside any edge zone.
      await lift(source, { clientX: 100, clientY: 100 });
      const scrollByMock = scroller.scrollBy as ReturnType<typeof vi.fn>;

      // Move to `clientY` and return the delta the loop applies for one 16ms
      // frame there. The clock doesn't move while the move reaches the loop
      // through the sensor frame and the flushed `onMove`, so those frames apply
      // a 0 delta and only the measured frame's time counts.
      async function measureAt(clientY: number): Promise<number> {
        fireDrag.dragOver(scroller, { clientX: 100, clientY });
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
      // element never disengages. Its ramp runs once here and `rampFactor` stays
      // at 1, which leaves depth as the only variable.
      await measureAt(160);
      clock.advance(1000);
      await flushRaf();

      const shallow = await measureAt(160); // 0.2 deep
      const middle = await measureAt(180); // 0.6 deep
      const deep = await measureAt(199); // 0.98 deep

      // Speed rises with depth. The ramp only sets how fast that speed is reached.
      expect(shallow).toBeGreaterThan(0);
      expect(middle).toBeGreaterThan(shallow);
      expect(deep).toBeGreaterThan(middle);
      // Proportional to depth, not just ordered by it.
      expect(deep / shallow).toBeCloseTo(0.98 / 0.2, 5);
    });
  });

  // ---------------------------------------------------------------------------
  // maxSpeed
  // ---------------------------------------------------------------------------
  describe.skipIf(!isJSDOM)('maxSpeed', () => {
    // The delta one 16ms frame applies at full ramp, for a scroller registered
    // with `parameters`. The scroller spans 0..200 and the pointer rests at
    // y=190, which is 0.8 of the way into the 50px bottom edge zone.
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
      // Positive control for the test above, showing the override changes the
      // speed and the fixture doesn't.
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
      // Check the last call, not the first. The lift at y=10 lands in the
      // scroller's top edge zone, so the loop engages there before the move to
      // y=190.
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
      // Unlike the fallbacks above, `0` is a valid value, so it must be kept
      // instead of replaced by the default.
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
      // Same box, so the pointer is in both bottom edge zones. Nesting makes the
      // depth order reach `inner` first.
      outer.appendChild(inner);

      engine.registerSource(source, {});
      engine.registerViewport(inner, { maxSpeed: 0 });
      engine.registerViewport(outer, {});

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

      await lift(source, { clientX: 100, clientY: 100 });
      fireDrag.dragOver(viewport, { clientX: 100, clientY: 190 });
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
  // A registration with an `onDragScroll` handler only needs edge detection. It
  // doesn't need a scrollable overflow style or a scroll extent, and a
  // registration without a handler still needs both.
  describe('pan', () => {
    // Like `makeEngageableScroller`, with the same box, but not an overflow
    // element and with no scroll metrics. Every check a handler bypasses would
    // otherwise reject it.
    function makeViewport(): HTMLElement {
      const viewport = createElement({ top: 0, height: 200, left: 0, width: 200 });
      viewport.style.overflow = 'visible';
      viewport.scrollBy = vi.fn();
      return viewport;
    }

    // Lift at the box's center, outside any edge zone, so the activation move
    // can't engage the loop before the move below. Then move the pointer to
    // `clientX` and `clientY` and flush the frames it passes through.
    async function driveTo(
      source: HTMLElement,
      viewport: HTMLElement,
      clientX: number,
      clientY: number,
    ): Promise<void> {
      await lift(source, { clientX: 100, clientY: 100 });
      fireDrag.dragOver(viewport, { clientX, clientY });
      await flushRaf();
      await flushRaf();
      await flushRaf();
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

      // An element with no scrollable overflow and no scroll extent still
      // engages, and the engine never touches its scroll offsets.
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

        // Negative control. The element above engages only because it has a
        // handler, not because the overflow check stopped working.
        expect(viewport.scrollBy).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('registered on an element that does not scroll'),
        );
      } finally {
        warnSpy.mockRestore();
      }
    });

    // Each of the four `canScrollToward` limit checks (up, down, left, right)
    // would reject an element with no scroll extent, so all four must be
    // skipped, not just the vertical pair a single fixture would cover.
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

    it('never runs for a drag its accept rejects', async () => {
      const accepted = createKind<undefined>('accepted-viewport-drag');
      const rejected = createKind<undefined>('rejected-viewport-drag');
      const { engine } = await renderDnd();
      const source = createElement();
      const viewport = makeViewport();
      const pan = vi.fn();

      engine.registerSource(source, { kind: rejected, payload: undefined });
      engine.registerViewport(viewport, {
        accept: accepted,
        onDragScroll: (eventDetails) => {
          eventDetails.cancel();
          pan(eventDetails);
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

      engine.registerSource(source, { kind: accepted, payload: undefined });
      engine.registerViewport(viewport, {
        accept: accepted,
        onDragScroll: (eventDetails) => {
          eventDetails.cancel();
          pan(eventDetails);
          eventDetails.consume();
        },
      });

      await driveTo(source, viewport, 100, 190);

      // Positive control, so the rejection in the previous test means something.
      expect(pan).toHaveBeenCalled();
    });

    it('reports no horizontal delta when direction selection excludes that axis', async () => {
      const { engine } = await renderDnd();
      const source = createElement();
      const viewport = makeViewport();
      const pan = vi.fn();

      engine.registerSource(source, {});
      engine.registerViewport(viewport, {
        onDragScroll: (eventDetails) => {
          const allowedDirection = 'vertical';
          if (allowedDirection !== eventDetails.direction) {
            eventDetails.cancel();
            return;
          }
          eventDetails.cancel();
          pan(eventDetails);
          eventDetails.consume();
        },
      });

      // The pointer is in both the bottom and right edge zones, and only the
      // vertical one gets through. `x` is exactly 0 whatever the frame clock
      // says, so this holds in jsdom where every timestamp is the same.
      await driveTo(source, viewport, 190, 190);

      expect(pan).toHaveBeenCalled();
      expect(pan.mock.calls.every(([context]) => context.x === 0)).toBe(true);
    });

    // The axes a delegating surface consumes decide which axes an ancestor
    // container gets. Every case uses the same fixture, a delegating viewport
    // nested inside a scroll container with the same box. The pointer is in the
    // bottom and right edge zones of both, and the inner one sorts first.
    describe('axis hand-off', () => {
      // `outerAllowedAxis` restricts the outer container to one axis, so whether
      // it engages at all shows which axis it got. Its `scrollBy` arguments
      // can't show that, because jsdom pins every rAF timestamp to 0 and both
      // deltas are 0 whichever axis engaged.
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

        await lift(source, { clientX: 100, clientY: 100 });
        fireDrag.dragOver(inner, { clientX: 190, clientY: 190 });
        await flushRaf();
        await flushRaf();
        await flushRaf();

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
        // The counterpart to the test above, so "released the other axis" can't
        // pass by the inner having released both.
        expect(outerScrollBy).not.toHaveBeenCalled();
      });

      it('canceling without consuming releases both axes', async () => {
        const { outerScrollBy } = await renderNested((eventDetails) => {
          eventDetails.cancel();
        }, 'vertical');
        // A surface at its own bounds must not take an axis it didn't move. That
        // includes the vertical axis, which every other handler here consumes.
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
          // The surface didn't move, so it is treated like one that cancels
          // without consuming, and doesn't keep the axes.
          expect(result.outerScrollBy).toHaveBeenCalled();
        } finally {
          // End the drag before restoring the spy, so later loop frames can't log
          // through the throwing callback after the spy is gone.
          if (result) {
            fireDrag.dragEnd();
          }
          consoleError.mockRestore();
        }
      });

      // A held frame clock reports the same timestamp for every frame, so the
      // ramp factor and every delta stay at 0. That shows consumption follows
      // engagement, not the applied delta. The outer container must stay locked
      // out even though the inner one got a delta of exactly 0. jsdom only, so
      // the held clock controls rAF without competing with browser scheduling.
      it.skipIf(!isJSDOM)('consumes the axes on the ramp-zero first frame', async () => {
        // Held frame clock. Identical rAF timestamps keep every delta at 0.
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
        // Neither canceled nor consumed, so the surface declines the direction.
        // The default native scroll does nothing on an element with no overflow.
        onDragScroll: (details) => {
          pan(details);
        },
      });

      await driveTo(source, viewport, 100, 190);
      expect(pan).toHaveBeenCalled();

      // A surface that declines must not keep the loop awake. Otherwise it would
      // run a frame, plus a sensor frame through `notifyExternalScroll`, forever
      // under a stationary pointer. Canceling is the opposite signal and keeps
      // the surface engaged so its speed can ramp up from 0.
      pan.mockClear();
      await flushRaf();
      await flushRaf();
      await flushRaf();
      expect(pan).not.toHaveBeenCalled();

      // Fresh input wakes it again.
      fireDrag.dragOver(viewport, { clientX: 100, clientY: 195 });
      await flushRaf();
      await flushRaf();
      await flushRaf();
      expect(pan).toHaveBeenCalled();
    });

    // Only a browser can show this. After a delegated frame moves the surface,
    // the engine re-resolves what is under the pointer. In jsdom `fireDrag` pins
    // `elementFromPoint`, so a transform doesn't change which element it returns.
    describe.skipIf(isJSDOM)('on a real transform surface', () => {
      it('resolves a drop target the pan brings under a stationary pointer', async () => {
        const { engine } = await renderDnd();
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

        // The pointer rests in the bottom edge zone and never moves again.
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

      engine.registerSource(source, {});
      engine.registerViewport(viewport, {
        onDragScroll: (eventDetails) => {
          eventDetails.cancel();
          pan(eventDetails);
          eventDetails.consume();
        },
      });

      await driveTo(source, viewport, 100, 190);
      // Past the 400ms ramp, so `rampFactor` is 1 and depth is the only variable
      // left.
      clock.advance(1000);
      await flushRaf();
      await flushRaf();

      pan.mockClear();
      clock.advance(FRAME_MS);
      await flushRaf();
      await flushRaf();

      // y=190 in a 0..200 box. The bottom edge zone is 50px deep, so the pointer
      // is 0.8 of the way into it. The scrolling path uses the same formula.
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

    engine.registerSource(source, {
      activation: { touch: { type: 'immediate' } },
    });
    engine.registerViewport(scroller, {});

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
    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    await lift(source, { clientX: 100, clientY: 100 });
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 195 });
    await settle(30);
    expect(scroller.scrollTop).toBeGreaterThan(400);

    const afterDown = scroller.scrollTop;
    fireDrag.dragOver(scroller, { clientX: 100, clientY: 5 });
    await settle(30);
    expect(scroller.scrollTop).toBeLessThan(afterDown);
    fireDrag.dragEnd();
  });

  it('scrolls the container right through the horizontal edge zone', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    const scroller = makeRealScroller();
    scroller.scrollLeft = 400;
    engine.registerSource(source, {});
    engine.registerViewport(scroller, {});

    await lift(source, { clientX: 100, clientY: 100 });
    fireDrag.dragOver(scroller, { clientX: 195, clientY: 100 });
    await settle(30);
    expect(scroller.scrollLeft).toBeGreaterThan(400);
    fireDrag.dragEnd();
  });
});
