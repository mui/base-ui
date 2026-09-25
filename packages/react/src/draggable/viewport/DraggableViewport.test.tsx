import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer, describeConformance, isJSDOM, testDragKind } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import type {
  DraggableViewportDragScrollEventDetails,
  DraggableViewportDragScrollValue,
} from './DraggableViewport';
import {
  createElement,
  flushRaf,
  lift,
  registerCleanup,
  setupDragEngineTests,
} from '../../../test/dnd';
import { createKind } from '../../utils/drag-and-drop/dragKind';

type RootProps = Draggable.Viewport.Props;
type ShouldScrollFn = (
  value: DraggableViewportDragScrollValue,
  eventDetails: DraggableViewportDragScrollEventDetails,
) => boolean;
type SelectDirectionFn = (
  value: DraggableViewportDragScrollValue,
) => 'all' | 'horizontal' | 'vertical';
type MaxSpeedFn = Extract<RootProps['maxSpeed'], (...args: never) => unknown>;
type PanFn = (
  value: DraggableViewportDragScrollValue,
  eventDetails: DraggableViewportDragScrollEventDetails,
) => void;

setupDragEngineTests();

// jsdom implements none of the scroll metrics the loop reads, so every scroller
// is stubbed into a 200x100 viewport over 1000x1000 of content, scrolled
// mid-range on both axes so every direction has room to scroll.
function stubScrollMetrics(node: HTMLElement, scrollByMock?: () => void): void {
  node.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
  Object.defineProperty(node, 'scrollHeight', { configurable: true, value: 1000 });
  Object.defineProperty(node, 'clientHeight', { configurable: true, value: 100 });
  Object.defineProperty(node, 'scrollWidth', { configurable: true, value: 1000 });
  Object.defineProperty(node, 'clientWidth', { configurable: true, value: 200 });
  Object.defineProperty(node, 'scrollTop', { configurable: true, value: 400, writable: true });
  Object.defineProperty(node, 'scrollLeft', { configurable: true, value: 400, writable: true });
  // jsdom doesn't implement scrollBy; always install a stub so the scroll loop
  // doesn't explode when we're not asserting on scrolls.
  node.scrollBy = scrollByMock ?? (() => {});
  node.style.overflow = 'auto';
}

function Scroller(props: RootProps & { scrollByMock?: () => void }) {
  const { scrollByMock, ...rootProps } = props;
  const ref = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        stubScrollMetrics(node, scrollByMock);
      }
    },
    [scrollByMock],
  );
  return <Draggable.Viewport ref={ref} data-testid="scroller" {...rootProps} />;
}

describe('Draggable.Viewport', () => {
  const { renderDnd } = createDndRenderer();

  // Start the drag OUTSIDE the scroller's 200x100 box, so the loop only sees
  // the scroller once a `dragOver` delivers coordinates inside it — the loop
  // consults a scroller's callbacks whenever the pointer is inside its rect.
  async function liftOutside(source: HTMLElement): Promise<void> {
    await lift(source, { clientX: 300, clientY: 300 });
  }

  // Deliver pointer coordinates and let them travel the pipeline: the sensor's
  // frame, the lifecycle's rAF-coalesced `onMove`, and the woken loop frame.
  // The event must be dispatched on an element — the test bridge listens on
  // `document` with capture, so an event fired at `window` never reaches it.
  async function dragTo(target: HTMLElement, clientX: number, clientY: number): Promise<void> {
    fireEvent.dragOver(target, { clientX, clientY });
    await flushRaf();
    await flushRaf();
    await flushRaf();
  }

  describeConformance(<Draggable.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return renderDnd(node);
    },
  }));

  it('wakes for changed margins, compares edges by value, and does not forward the prop', async () => {
    const scrollBy = vi.fn();
    const { engine, rerender } = await renderDnd(<Scroller scrollByMock={scrollBy} />);
    const source = createElement();
    engine.registerSource(source, {});
    await liftOutside(source);
    const scroller = screen.getByTestId('scroller');
    await dragTo(scroller, 100, 120);
    expect(scrollBy).not.toHaveBeenCalled();
    await rerender(<Scroller scrollByMock={scrollBy} overflowMargin={{ bottom: 30 }} />);
    await flushRaf();
    await flushRaf();
    expect(scrollBy).toHaveBeenCalled();
    expect(scroller).not.toHaveAttribute('overflowMargin');

    await rerender(<Scroller scrollByMock={scrollBy} overflowMargin={{ bottom: 10 }} />);
    await flushRaf();
    scrollBy.mockClear();
    const measure = vi.spyOn(scroller, 'getBoundingClientRect');
    await rerender(<Scroller scrollByMock={scrollBy} overflowMargin={{ bottom: 10 }} />);
    await flushRaf();
    expect(measure).not.toHaveBeenCalled();
    expect(scrollBy).not.toHaveBeenCalled();
    fireEvent.drop(source);
  });

  it('attaches and detaches cleanly without an active drag', async () => {
    const { unmount } = await renderDnd(<Scroller />);
    expect(screen.getByTestId('scroller')).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });

  it('observes a registered scroller only during a pointer drag', async () => {
    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    const { engine } = await renderDnd(<Scroller />);
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');

    expect(observe).not.toHaveBeenCalled();

    await liftOutside(source);

    expect(observe).toHaveBeenCalledWith(scroller, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      childList: true,
      subtree: true,
    });
    fireEvent.drop(source);
    observe.mockRestore();
  });

  it('shares an observer across nested scrollers and keeps observing after removal', async () => {
    const { engine } = await renderDnd();
    const source = createElement();
    engine.registerSource(source, {});
    const outer = createElement();
    const inner = createElement();
    outer.appendChild(inner);
    stubScrollMetrics(outer);
    stubScrollMetrics(inner);
    const releaseOuter = engine.registerViewport(outer, {});
    engine.registerViewport(inner, {});
    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    registerCleanup(() => observe.mockRestore());

    await liftOutside(source);
    const outerIndex = observe.mock.calls.findIndex(([node]) => node === outer);
    const innerIndex = observe.mock.calls.findIndex(([node]) => node === inner);
    expect(outerIndex).toBeGreaterThanOrEqual(0);
    expect(innerIndex).toBeGreaterThanOrEqual(0);
    const observer = observe.mock.contexts[outerIndex] as MutationObserver;
    expect(observe.mock.contexts[innerIndex]).toBe(observer);

    // Reconnecting after removal must preserve queued records for the survivor.
    await dragTo(inner, 100, 50);
    const computedStyle = vi.spyOn(window, 'getComputedStyle');
    registerCleanup(() => computedStyle.mockRestore());
    observe.mockClear();
    act(() => {
      inner.style.direction = 'rtl';
      releaseOuter();
    });
    // Removals reconnect once at the end of the batch. The browser may deliver
    // the queued restyle before that microtask, or takeRecords may drain it.
    await Promise.resolve();
    const reconnected = observe.mock.calls.filter(
      (_call, index) => observe.mock.contexts[index] === observer,
    );
    expect(reconnected.map(([node]) => node)).toEqual([inner]);
    await flushRaf();
    await flushRaf();
    expect(computedStyle).toHaveBeenCalledWith(inner);

    // A later mutation still invalidates the survivor's cached styles.
    computedStyle.mockClear();
    inner.style.direction = 'ltr';
    await flushRaf();
    await flushRaf();
    expect(computedStyle).toHaveBeenCalledWith(inner);
    fireEvent.drop(source);
  });

  it('does not wake a parked loop after an unchanged re-render', async () => {
    const scrollBy = vi.fn();
    const { engine, rerender } = await renderDnd(<Scroller scrollByMock={scrollBy} />);
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');

    await liftOutside(source);
    // The center is outside every edge zone, so this input parks the loop.
    await dragTo(scroller, 100, 50);
    const measure = vi.spyOn(scroller, 'getBoundingClientRect');

    await rerender(<Scroller scrollByMock={scrollBy} />);
    await flushRaf();

    expect(measure).not.toHaveBeenCalled();
    fireEvent.drop(source);
  });

  it('keeps one idle observer across parks instead of constructing one per wake', async () => {
    const { engine } = await renderDnd(<Scroller />);
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');
    const OriginalObserver = window.MutationObserver;
    let constructed = 0;
    class CountingObserver extends OriginalObserver {
      constructor(callback: MutationCallback) {
        super(callback);
        constructed += 1;
      }
    }
    window.MutationObserver = CountingObserver;
    registerCleanup(() => {
      window.MutationObserver = OriginalObserver;
    });

    await liftOutside(source);
    // The center is outside every edge zone: this input parks the loop, and the
    // park attaches the idle observer.
    await dragTo(scroller, 100, 50);
    const afterFirstPark = constructed;

    // Each further input wakes the loop and parks it again.
    await dragTo(scroller, 110, 50);
    await dragTo(scroller, 120, 50);

    expect(constructed).toBe(afterFirstPark);
    fireEvent.drop(source);
  });

  it('wakes a parked loop for content growth without re-reading any computed style', async () => {
    const { engine } = await renderDnd(<Scroller />);
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');

    await liftOutside(source);
    await dragTo(scroller, 100, 50);
    const measure = vi.spyOn(scroller, 'getBoundingClientRect');
    const computedStyle = vi.spyOn(window, 'getComputedStyle');
    registerCleanup(() => computedStyle.mockRestore());

    // Rows appended below the fold can give the container room to scroll, so
    // the next frame re-reads its geometry — but nothing about which elements
    // scroll, or which way, can have changed, so the cached styles stand.
    act(() => {
      scroller.appendChild(document.createElement('div'));
    });
    await flushRaf();
    await flushRaf();

    expect(measure).toHaveBeenCalled();
    expect(computedStyle).not.toHaveBeenCalled();
    fireEvent.drop(source);
  });

  it('re-reads computed styles when a parked container itself is restyled', async () => {
    const { engine } = await renderDnd(<Scroller />);
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');

    await liftOutside(source);
    await dragTo(scroller, 100, 50);
    const computedStyle = vi.spyOn(window, 'getComputedStyle');
    registerCleanup(() => computedStyle.mockRestore());

    // A class on the container can flip its overflow or direction: the cached
    // answers are dropped and the chain is walked again.
    act(() => {
      scroller.classList.add('restyled');
    });
    await flushRaf();
    await flushRaf();

    expect(computedStyle).toHaveBeenCalled();
    fireEvent.drop(source);
  });

  it('registers a scroller: shouldScroll receives the drag context during a drag', async () => {
    const shouldScroll = vi.fn<ShouldScrollFn>(() => true);
    const { engine } = await renderDnd(
      <Scroller
        onDragScroll={(details, eventDetails) => {
          if (!shouldScroll(details, eventDetails)) {
            eventDetails.cancel();
            return;
          }
        }}
      />,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');

    await liftOutside(source);
    await dragTo(scroller, 100, 95);

    expect(shouldScroll).toHaveBeenCalled();
    const [value, eventDetails] = shouldScroll.mock.calls[0];
    expect(eventDetails.element).toBe(scroller);
    expect(value.source.element).toBe(source);
    // The delivered pointer coordinates reached the callback.
    expect(eventDetails.input.clientX).toBe(100);
    expect(eventDetails.input.clientY).toBe(95);
  });

  it('forwards the ref to the same node it registers', async () => {
    const ref = React.createRef<HTMLDivElement>();
    const shouldScroll = vi.fn<ShouldScrollFn>(() => true);
    const { engine } = await renderDnd(
      <Draggable.Viewport
        ref={(node) => {
          if (node) {
            stubScrollMetrics(node);
          }
          ref.current = node;
        }}
        onDragScroll={(details, eventDetails) => {
          if (!shouldScroll(details, eventDetails)) {
            eventDetails.cancel();
            return;
          }
        }}
        data-testid="scroller"
      />,
    );
    const source = createElement();
    engine.registerSource(source, {});

    await liftOutside(source);
    await dragTo(screen.getByTestId('scroller'), 100, 95);

    expect(ref.current).toBe(screen.getByTestId('scroller'));
    expect(shouldScroll.mock.calls[0][1].element).toBe(ref.current);
  });

  it('scrolls the container while the pointer parks in an edge zone', async () => {
    // Positive control for every `not.toHaveBeenCalled()` in this suite: the
    // shared fixture at these coordinates genuinely reaches `scrollBy`, so a
    // non-call elsewhere is the gate under test, not a dead loop.
    const scrollBy = vi.fn();
    const { engine } = await renderDnd(<Scroller scrollByMock={scrollBy} />);
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');

    await liftOutside(source);

    // Bottom edge zone (y > 75 of the 100px box).
    await dragTo(scroller, 100, 95);
    expect(scrollBy).toHaveBeenCalled();

    // Top edge zone: scrolling up needs the mid-range `scrollTop` stub — at the
    // jsdom default of 0 there is nothing to scroll back toward.
    scrollBy.mockClear();
    await dragTo(scroller, 100, 5);
    expect(scrollBy).toHaveBeenCalled();

    // Left edge zone: same for `scrollLeft`.
    scrollBy.mockClear();
    await dragTo(scroller, 10, 50);
    expect(scrollBy).toHaveBeenCalled();
  });

  it('can start another scroll loop after a dead window rejects frame cancellation', async () => {
    const scrollBy = vi.fn();
    const { engine } = await renderDnd(<Scroller scrollByMock={scrollBy} />);
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');

    await liftOutside(source);
    await dragTo(scroller, 100, 95);
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    window.cancelAnimationFrame = () => {
      throw new DOMException('The browsing context is gone', 'InvalidStateError');
    };
    try {
      expect(() => fireEvent.drop(source)).not.toThrow();
    } finally {
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    }

    scrollBy.mockClear();
    await liftOutside(source);
    await dragTo(scroller, 100, 95);
    expect(scrollBy).toHaveBeenCalled();
  });

  // The scroll DELTA is `scroll{X,Y} * frameSpeed`, and `frameSpeed` derives
  // from the elapsed time between rAF timestamps. The jsdom rAF stub
  // (`test/setupVitest.ts`) passes `performance.now()`, so timestamps advance
  // there too and the nonzero-delta assertions carry meaning in both
  // environments.
  describe('direction cancellation', () => {
    it('direction selection: "horizontal" blocks vertical scrolling but allows horizontal', async () => {
      const scrollBy = vi.fn();
      const { engine } = await renderDnd(
        <Scroller
          onDragScroll={(details, eventDetails) => {
            const allowedDirection = 'horizontal';
            if (allowedDirection !== details.direction) {
              eventDetails.cancel();
              return;
            }
          }}
          scrollByMock={scrollBy}
        />,
      );
      const source = createElement();
      engine.registerSource(source, {});
      const scroller = screen.getByTestId('scroller');

      await liftOutside(source);

      // Pointer in BOTH right edge zone (x>150) and bottom edge zone (y>75) so
      // the loop wants to scroll on both axes. The direction selection filter must keep
      // horizontal and drop vertical. Drag over the scroller itself so the
      // synthetic engine resolves the pointer coordinates onto it.
      await dragTo(scroller, 175, 95);
      // Let the loop accumulate frames beyond the ramp-up window.
      await act(async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 500);
        });
      });

      const lefts = scrollBy.mock.calls.map(([arg]) => arg.left ?? 0);
      const tops = scrollBy.mock.calls.map(([arg]) => arg.top ?? 0);
      // Horizontal scroll actually happened (proves the loop engaged and the
      // direction selection filter didn't over-block), and vertical was dropped despite
      // the pointer sitting in the bottom edge.
      expect(lefts.some((left) => left !== 0)).toBe(true);
      expect(tops.every((top) => top === 0)).toBe(true);
    });
  });

  it('direction selection is consulted per frame from the latest props', async () => {
    const vertical = vi.fn<SelectDirectionFn>(() => 'vertical');
    const horizontal = vi.fn<SelectDirectionFn>(() => 'horizontal');
    const scrollBy = vi.fn();
    const { engine, rerender } = await renderDnd(
      <Scroller
        onDragScroll={(details, eventDetails) => {
          const allowedDirection = vertical(details);
          if (allowedDirection !== 'all' && allowedDirection !== details.direction) {
            eventDetails.cancel();
            return;
          }
        }}
        scrollByMock={scrollBy}
      />,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');

    // Bottom edge zone: the vertical axis is engaged and scrolls.
    await liftOutside(source);
    await dragTo(scroller, 100, 95);
    expect(vertical).toHaveBeenCalled();
    expect(scrollBy).toHaveBeenCalled();

    // Swap the callback mid-drag: the loop must read the new one on its next
    // frame, and its different answer must take effect — the pointer sits in a
    // vertical edge only, so a horizontal-only axis stops the scrolling the
    // first callback allowed at the very same position.
    await rerender(
      <Scroller
        onDragScroll={(details, eventDetails) => {
          const allowedDirection = horizontal(details);
          if (allowedDirection !== 'all' && allowedDirection !== details.direction) {
            eventDetails.cancel();
            return;
          }
        }}
        scrollByMock={scrollBy}
      />,
    );
    vertical.mockClear();
    horizontal.mockClear();
    scrollBy.mockClear();
    await dragTo(scroller, 100, 95);

    expect(horizontal).toHaveBeenCalled();
    expect(vertical).not.toHaveBeenCalled();
    expect(scrollBy).not.toHaveBeenCalled();
  });

  describe('disabled', () => {
    it('lets a disabled inner viewport hand scrolling to a registered outer viewport', async () => {
      const outerScrollBy = vi.fn();
      const innerScrollBy = vi.fn();

      function Nested(props: { disabled?: boolean }) {
        const outerRef = React.useCallback((node: HTMLDivElement | null) => {
          if (node) {
            stubScrollMetrics(node, outerScrollBy);
          }
        }, []);
        return (
          <Draggable.Viewport ref={outerRef} data-testid="outer">
            <Scroller disabled={props.disabled} scrollByMock={innerScrollBy} />
          </Draggable.Viewport>
        );
      }

      const { engine, rerender } = await renderDnd(<Nested disabled />);
      const scroller = screen.getByTestId('scroller');
      const source = createElement();
      scroller.appendChild(source);
      engine.registerSource(source, {});

      await liftOutside(source);
      await dragTo(scroller, 100, 95);

      expect(innerScrollBy).not.toHaveBeenCalled();
      expect(outerScrollBy).toHaveBeenCalled();

      await rerender(<Nested />);
      innerScrollBy.mockClear();
      outerScrollBy.mockClear();
      await dragTo(scroller, 100, 95);
      expect(innerScrollBy).toHaveBeenCalled();
      expect(outerScrollBy).not.toHaveBeenCalled();
    });

    it('suspends scrolling when disabled mid-drag and resumes on re-enable without re-registering', async () => {
      const shouldScroll = vi.fn<ShouldScrollFn>(() => true);
      const scrollBy = vi.fn();
      const { engine, rerender } = await renderDnd(
        <Scroller
          onDragScroll={(details, eventDetails) => {
            if (!shouldScroll(details, eventDetails)) {
              eventDetails.cancel();
              return;
            }
          }}
          scrollByMock={scrollBy}
        />,
      );
      const source = createElement();
      engine.registerSource(source, {});
      const el = screen.getByTestId('scroller');

      // Engage in the bottom edge zone while enabled.
      await liftOutside(source);
      await dragTo(el, 100, 95);
      expect(scrollBy).toHaveBeenCalled();
      expect(shouldScroll).toHaveBeenCalled();

      // Flip `disabled` mid-drag, while the loop is engaged: scrolling must stop.
      await rerender(
        <Scroller
          disabled
          onDragScroll={(details, eventDetails) => {
            if (!shouldScroll(details, eventDetails)) {
              eventDetails.cancel();
              return;
            }
          }}
          scrollByMock={scrollBy}
        />,
      );
      expect(el).toHaveAttribute('data-disabled');
      await flushRaf();
      scrollBy.mockClear();
      shouldScroll.mockClear();
      await flushRaf();
      await flushRaf();
      expect(scrollBy).not.toHaveBeenCalled();
      // Disabled short-circuits before the consumer's `shouldScroll` is consulted,
      // including for fresh input arriving while disabled.
      await dragTo(el, 100, 95);
      expect(shouldScroll).not.toHaveBeenCalled();
      expect(scrollBy).not.toHaveBeenCalled();

      // Re-enable, still mid-drag: the registration was suspended, not torn
      // down and re-created. No new pointer input is sent after the render;
      // the parameter change itself must wake the parked loop.
      await rerender(
        <Scroller
          onDragScroll={(details, eventDetails) => {
            if (!shouldScroll(details, eventDetails)) {
              eventDetails.cancel();
              return;
            }
          }}
          scrollByMock={scrollBy}
        />,
      );
      expect(screen.getByTestId('scroller')).toBe(el);
      expect(el).not.toHaveAttribute('data-disabled');

      await flushRaf();
      await flushRaf();
      expect(shouldScroll).toHaveBeenCalled();
      expect(shouldScroll.mock.calls[0][1].element).toBe(el);
      expect(scrollBy).toHaveBeenCalled();
      fireEvent.drop(source);
    });
  });

  it('re-reads overflow when the same scroller becomes scrollable after a render', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerCleanup(() => warnSpy.mockRestore());
    const scrollBy = vi.fn();

    function RestyledScroller({ open }: { open: boolean }) {
      const ref = React.useCallback((node: HTMLDivElement | null) => {
        if (node) {
          stubScrollMetrics(node, scrollBy);
          node.style.overflow = 'hidden';
        }
      }, []);
      return (
        <Draggable.Viewport
          ref={ref}
          data-testid="scroller"
          style={{ overflow: open ? 'auto' : 'hidden' }}
        />
      );
    }

    const { engine, rerender } = await renderDnd(<RestyledScroller open={false} />);
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');

    await liftOutside(source);
    await dragTo(scroller, 100, 95);
    expect(scrollBy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('registered on an element that does not scroll'),
    );

    // No new pointer input: the post-commit refresh must invalidate the cached
    // `overflow: hidden` result and wake the parked loop at the same coordinates.
    await rerender(<RestyledScroller open />);
    await flushRaf();
    await flushRaf();

    expect(screen.getByTestId('scroller')).toBe(scroller);
    expect(scrollBy).toHaveBeenCalled();
  });

  // Real computed styles only: jsdom does not cascade a descendant selector from
  // an ancestor's class onto the viewport's `overflow`.
  it.skipIf(isJSDOM)(
    'stops an engaged viewport when an ancestor restyle hides its overflow',
    async () => {
      const style = document.createElement('style');
      style.textContent =
        '.scroll-locked [data-testid="scroller"] { overflow: hidden !important; }';
      document.head.appendChild(style);
      registerCleanup(() => style.remove());
      // Once hidden, the viewport is a registered element that does not scroll,
      // which the engine reports; that warning is the expected outcome here.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      registerCleanup(() => warnSpy.mockRestore());
      const scrollBy = vi.fn();
      const { engine } = await renderDnd(
        <div data-testid="ancestor">
          <Scroller scrollByMock={scrollBy} />
        </div>,
      );
      const source = createElement();
      engine.registerSource(source, {});
      const scroller = screen.getByTestId('scroller');

      await liftOutside(source);
      await dragTo(scroller, 100, 95);
      expect(scrollBy).toHaveBeenCalled();

      // The ancestor's class change is caught by the chain observer, which drops
      // the cached overflow reading, so the next frame sees `hidden` and parks.
      await act(async () => {
        screen.getByTestId('ancestor').className = 'scroll-locked';
      });
      scrollBy.mockClear();
      await flushRaf();
      await flushRaf();
      await flushRaf();
      expect(scrollBy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('registered on an element that does not scroll'),
      );
      fireEvent.drop(source);
    },
  );

  it('re-reads overflow when a scrolling container becomes hidden during a drag', async () => {
    // Once hidden, the registered root no longer scrolls, which is what the dev
    // warning reports.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const scrollBy = vi.fn();
    const { engine } = await renderDnd(<Scroller scrollByMock={scrollBy} />);
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');

    await liftOutside(source);
    await dragTo(scroller, 100, 95);
    expect(scrollBy).toHaveBeenCalled();

    await act(async () => {
      scroller.style.overflow = 'hidden';
      await Promise.resolve();
    });
    scrollBy.mockClear();
    await flushRaf();

    expect(scrollBy).not.toHaveBeenCalled();
    fireEvent.drop(source);
    warnSpy.mockRestore();
  });

  it('wakes a parked loop when content growth creates scroll room', async () => {
    const scrollBy = vi.fn();
    const { engine } = await renderDnd(<Scroller scrollByMock={scrollBy} />);
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');
    let scrollHeight = 100;
    Object.defineProperty(scroller, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeight,
    });
    scroller.scrollTop = 0;

    await liftOutside(source);
    await dragTo(scroller, 100, 95);
    expect(scrollBy).not.toHaveBeenCalled();

    await act(async () => {
      scrollHeight = 1000;
      scroller.appendChild(document.createElement('div'));
      await Promise.resolve();
    });
    await flushRaf();
    await flushRaf();

    expect(scrollBy).toHaveBeenCalled();
    fireEvent.drop(source);
  });

  it('observes class and style changes on a replacement render node', async () => {
    // The node starts `overflow: hidden`, which trips the dev warning until the
    // restyle below.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const scrollBy = vi.fn();
    const ref = (node: HTMLElement | null) => {
      if (node) {
        stubScrollMetrics(node, scrollBy);
        node.style.overflow = 'hidden';
      }
    };
    const { engine, rerender } = await renderDnd(
      <Draggable.Viewport ref={ref} render={<div />} data-testid="scroller" />,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const first = screen.getByTestId('scroller');

    await liftOutside(source);
    await dragTo(first, 100, 95);
    expect(scrollBy).not.toHaveBeenCalled();

    await rerender(<Draggable.Viewport ref={ref} render={<section />} data-testid="scroller" />);
    const replacement = screen.getByTestId('scroller');
    expect(replacement).not.toBe(first);
    await flushRaf();
    scrollBy.mockClear();

    await act(async () => {
      replacement.style.overflow = 'auto';
      await Promise.resolve();
    });
    await flushRaf();
    await flushRaf();

    expect(scrollBy).toHaveBeenCalled();
    fireEvent.drop(source);
    warnSpy.mockRestore();
  });

  it('registers exactly once under Strict Mode, and unmount releases the registration', async () => {
    // Strict Mode double-invokes the registration effect (register → cleanup →
    // register). Two failure modes: the re-register tears the live registration
    // down (the scroller goes dead), or a duplicate hold leaks (the scroller
    // survives unmount). The drag after unmount pins both.
    const shouldScroll = vi.fn<ShouldScrollFn>(() => true);
    const { engine, unmount } = await renderDnd(
      <React.StrictMode>
        <Scroller
          onDragScroll={(details, eventDetails) => {
            if (!shouldScroll(details, eventDetails)) {
              eventDetails.cancel();
              return;
            }
          }}
        />
      </React.StrictMode>,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');

    await liftOutside(source);
    await dragTo(scroller, 100, 95);

    expect(shouldScroll).toHaveBeenCalled();
    expect(shouldScroll.mock.calls[0][1].element).toBe(scroller);
    expect(shouldScroll.mock.calls[0][1].input.clientY).toBe(95);
    fireEvent.drop(source);

    unmount();
    shouldScroll.mockClear();

    // The unmounted scroller's node is detached, so route the move through the
    // still-attached source; the loop keys on coordinates, not the hover target.
    await liftOutside(source);
    await dragTo(source, 100, 95);

    // A leaked duplicate hold would keep the unmounted scroller registered.
    expect(shouldScroll).not.toHaveBeenCalled();
    fireEvent.drop(source);
  });

  it('keeps registration stable across re-renders and uses the latest shouldScroll', async () => {
    const first = vi.fn<ShouldScrollFn>(() => true);
    const second = vi.fn<ShouldScrollFn>(() => false);
    const scrollBy = vi.fn();
    const { rerender, engine } = await renderDnd(
      <Scroller
        onDragScroll={(details, eventDetails) => {
          if (!first(details, eventDetails)) {
            eventDetails.cancel();
            return;
          }
        }}
        scrollByMock={scrollBy}
      />,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const el = screen.getByTestId('scroller');

    await rerender(
      <Scroller
        onDragScroll={(details, eventDetails) => {
          if (!second(details, eventDetails)) {
            eventDetails.cancel();
            return;
          }
        }}
        scrollByMock={scrollBy}
      />,
    );
    // Same DOM node — no re-registration tore it down.
    expect(screen.getByTestId('scroller')).toBe(el);

    await liftOutside(source);
    await dragTo(el, 100, 95);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
    // The frames genuinely reached this scroller at the delivered coordinates,
    // so the non-calls above and below are the swap and the `false` answer.
    expect(second.mock.calls[0][1].input.clientY).toBe(95);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  describe('accept', () => {
    const otherKind = createKind<unknown>('base-ui-test/other');

    it('never engages for a drag of a kind the scroller does not accept', async () => {
      const shouldScroll = vi.fn<ShouldScrollFn>(() => true);
      const scrollBy = vi.fn();
      const { engine, rerender } = await renderDnd(
        <Scroller
          accept={otherKind}
          onDragScroll={(details, eventDetails) => {
            if (!shouldScroll(details, eventDetails)) {
              eventDetails.cancel();
              return;
            }
          }}
          scrollByMock={scrollBy}
        />,
      );
      const source = createElement();
      engine.registerSource(source, {}); // defaults to testDragKind
      const scroller = screen.getByTestId('scroller');

      await liftOutside(source);
      await dragTo(scroller, 100, 95);

      // The kind filter runs before the per-frame callbacks.
      expect(shouldScroll).not.toHaveBeenCalled();
      expect(scrollBy).not.toHaveBeenCalled();

      // Positive control: the same fixture accepting the drag's kind engages at
      // the very same coordinates.
      await rerender(
        <Scroller
          accept={testDragKind}
          onDragScroll={(details, eventDetails) => {
            if (!shouldScroll(details, eventDetails)) {
              eventDetails.cancel();
              return;
            }
          }}
          scrollByMock={scrollBy}
        />,
      );
      await dragTo(scroller, 100, 95);
      expect(shouldScroll).toHaveBeenCalled();
      expect(scrollBy).toHaveBeenCalled();
    });

    it('does not render accept as a DOM attribute', async () => {
      await renderDnd(<Draggable.Viewport accept={testDragKind} data-testid="scroller" />);
      expect(screen.getByTestId('scroller')).not.toHaveAttribute('accept');
    });

    it('does not render maxSpeed as a DOM attribute', async () => {
      await renderDnd(<Draggable.Viewport maxSpeed={300} data-testid="scroller" />);
      expect(screen.getByTestId('scroller')).not.toHaveAttribute('maxspeed');
    });

    it('forwards maxSpeed to the engine', async () => {
      // The root rebuilds the engine parameters by hand, so a prop dropped from
      // that object still typechecks and still stays off the DOM — the sibling
      // test above would keep passing while the container silently reverted to
      // the default speed. The callback form proves it arrived.
      const maxSpeed = vi.fn<MaxSpeedFn>(() => 300);
      const scrollBy = vi.fn();
      const { engine } = await renderDnd(<Scroller maxSpeed={maxSpeed} scrollByMock={scrollBy} />);
      const source = createElement();
      engine.registerSource(source, {});
      const scroller = screen.getByTestId('scroller');

      await liftOutside(source);
      await dragTo(scroller, 100, 95);

      expect(maxSpeed).toHaveBeenCalled();
      expect(maxSpeed.mock.calls[0][0].element).toBe(scroller);
    });
  });

  describe('pan', () => {
    // The delegating counterpart to `Scroller`: no scroll metrics and no
    // scrollable overflow, so it engages only because it delegates.
    function Viewport(props: RootProps) {
      const ref = React.useCallback((node: HTMLDivElement | null) => {
        if (node) {
          node.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
        }
      }, []);
      return <Draggable.Viewport ref={ref} data-testid="viewport" {...props} />;
    }

    it('receives the frame delta for the element it is registered on', async () => {
      const pan = vi.fn<PanFn>();
      const { engine } = await renderDnd(
        <Viewport
          onDragScroll={(details, eventDetails) => {
            eventDetails.cancel();
            pan(details, eventDetails);
            eventDetails.consume();
          }}
        />,
      );
      const source = createElement();
      engine.registerSource(source, {});
      const viewport = screen.getByTestId('viewport');

      await liftOutside(source);
      await dragTo(viewport, 100, 95);

      expect(pan).toHaveBeenCalled();
      expect(pan.mock.calls[0][1].element).toBe(viewport);
      expect(pan.mock.calls[0][1].input.clientY).toBe(95);
    });

    it('does not render onDragScroll as a DOM attribute', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await renderDnd(
          <Draggable.Viewport
            onDragScroll={(_event, eventDetails) => {
              eventDetails.cancel();
              eventDetails.consume();
            }}
            data-testid="viewport"
          />,
        );
        expect(screen.getByTestId('viewport')).not.toHaveAttribute('ondragscroll');
        // React logs an unknown-prop warning for anything that reaches the DOM.
        expect(consoleError).not.toHaveBeenCalled();
      } finally {
        consoleError.mockRestore();
      }
    });

    it('is suspended by disabled mid-drag and resumes without re-registering', async () => {
      const pan = vi.fn<PanFn>();
      const { engine, rerender } = await renderDnd(
        <Viewport
          onDragScroll={(details, eventDetails) => {
            eventDetails.cancel();
            pan(details, eventDetails);
            eventDetails.consume();
          }}
        />,
      );
      const source = createElement();
      engine.registerSource(source, {});
      const viewport = screen.getByTestId('viewport');

      await liftOutside(source);
      await dragTo(viewport, 100, 95);
      expect(pan).toHaveBeenCalled();

      await rerender(
        <Viewport
          disabled
          onDragScroll={(details, eventDetails) => {
            eventDetails.cancel();
            pan(details, eventDetails);
            eventDetails.consume();
          }}
        />,
      );
      await flushRaf();
      pan.mockClear();
      await flushRaf();
      await flushRaf();
      expect(pan).not.toHaveBeenCalled();

      // Same DOM node throughout: `disabled` suspends the registration rather
      // than tearing it down and rebuilding it.
      await rerender(
        <Viewport
          onDragScroll={(details, eventDetails) => {
            eventDetails.cancel();
            pan(details, eventDetails);
            eventDetails.consume();
          }}
        />,
      );
      expect(screen.getByTestId('viewport')).toBe(viewport);
      await dragTo(viewport, 100, 95);
      expect(pan).toHaveBeenCalled();
    });

    it('uses the latest pan across re-renders', async () => {
      const first = vi.fn<PanFn>();
      const second = vi.fn<PanFn>();
      const { engine, rerender } = await renderDnd(
        <Viewport
          onDragScroll={(details, eventDetails) => {
            eventDetails.cancel();
            first(details, eventDetails);
            eventDetails.consume();
          }}
        />,
      );
      const source = createElement();
      engine.registerSource(source, {});
      const viewport = screen.getByTestId('viewport');

      await rerender(
        <Viewport
          onDragScroll={(details, eventDetails) => {
            eventDetails.cancel();
            second(details, eventDetails);
            eventDetails.consume();
          }}
        />,
      );
      expect(screen.getByTestId('viewport')).toBe(viewport);

      await liftOutside(source);
      await dragTo(viewport, 100, 95);

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalled();
    });
  });
});
