import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { act } from '@mui/internal-test-utils';
import { createDndRenderer, describeConformance, testDragKind } from '#test-utils';
import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import { createElement, flushRaf, lift, setupDragEngineTests } from '../../../test/dnd';
import { createKind } from '../../utils/drag-and-drop/dragKind';

type RootProps = DragAutoScroll.Root.Props;
type CanScrollFn = NonNullable<RootProps['canScroll']>;
type AllowedAxisFn = Extract<RootProps['allowedAxis'], (...args: never) => unknown>;
type MaxSpeedFn = Extract<RootProps['maxSpeed'], (...args: never) => unknown>;
type ApplyScrollFn = NonNullable<RootProps['applyScroll']>;

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
  return <DragAutoScroll.Root ref={ref} data-testid="scroller" {...rootProps} />;
}

describe('DragAutoScroll.Root', () => {
  const { renderDnd } = createDndRenderer();

  // Start the drag OUTSIDE the scroller's 200x100 box, so the loop only sees
  // the scroller once a `dragOver` delivers coordinates inside it — the loop
  // consults a scroller's callbacks whenever the pointer is inside its rect.
  async function liftOutside(source: HTMLElement): Promise<void> {
    await lift(source, { clientX: 300, clientY: 300 });
  }

  // Deliver pointer coordinates and let them travel the pipeline: the sensor's
  // frame, the lifecycle's rAF-coalesced `onDrag`, and the woken loop frame.
  // The event must be dispatched on an element — the test bridge listens on
  // `document` with capture, so an event fired at `window` never reaches it.
  async function dragTo(target: HTMLElement, clientX: number, clientY: number): Promise<void> {
    fireEvent.dragOver(target, { clientX, clientY });
    await flushRaf();
    await flushRaf();
    await flushRaf();
  }

  describeConformance(<DragAutoScroll.Root />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return renderDnd(node);
    },
  }));

  it('attaches and detaches cleanly without an active drag', async () => {
    const { unmount } = await renderDnd(<Scroller />);
    expect(screen.getByTestId('scroller')).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });

  it('does not wake a parked loop after an unchanged re-render', async () => {
    const scrollBy = vi.fn();
    const { engine, rerender } = await renderDnd(<Scroller scrollByMock={scrollBy} />);
    const source = createElement();
    engine.registerDraggable(source, {});
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

  it('registers a scroller: canScroll receives the drag context during a drag', async () => {
    const canScroll = vi.fn<CanScrollFn>(() => true);
    const { engine } = await renderDnd(<Scroller canScroll={canScroll} />);
    const source = createElement();
    engine.registerDraggable(source, {});
    const scroller = screen.getByTestId('scroller');

    await liftOutside(source);
    await dragTo(scroller, 100, 95);

    expect(canScroll).toHaveBeenCalled();
    const feedback = canScroll.mock.calls[0][0];
    expect(feedback.element).toBe(scroller);
    expect(feedback.source.element).toBe(source);
    // The delivered pointer coordinates reached the callback.
    expect(feedback.input.clientX).toBe(100);
    expect(feedback.input.clientY).toBe(95);
  });

  it('forwards the ref to the same node it registers', async () => {
    const ref = React.createRef<HTMLDivElement>();
    const canScroll = vi.fn<CanScrollFn>(() => true);
    const { engine } = await renderDnd(
      <DragAutoScroll.Root
        ref={(node) => {
          if (node) {
            stubScrollMetrics(node);
          }
          ref.current = node;
        }}
        canScroll={canScroll}
        data-testid="scroller"
      />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});

    await liftOutside(source);
    await dragTo(screen.getByTestId('scroller'), 100, 95);

    expect(ref.current).toBe(screen.getByTestId('scroller'));
    expect(canScroll.mock.calls[0][0].element).toBe(ref.current);
  });

  it('scrolls the container while the pointer parks in an edge zone', async () => {
    // Positive control for every `not.toHaveBeenCalled()` in this suite: the
    // shared fixture at these coordinates genuinely reaches `scrollBy`, so a
    // non-call elsewhere is the gate under test, not a dead loop.
    const scrollBy = vi.fn();
    const { engine } = await renderDnd(<Scroller scrollByMock={scrollBy} />);
    const source = createElement();
    engine.registerDraggable(source, {});
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
    engine.registerDraggable(source, {});
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
  describe('allowedAxis', () => {
    it('allowedAxis: "horizontal" blocks vertical scrolling but allows horizontal', async () => {
      const scrollBy = vi.fn();
      const { engine } = await renderDnd(
        <Scroller allowedAxis="horizontal" scrollByMock={scrollBy} />,
      );
      const source = createElement();
      engine.registerDraggable(source, {});
      const scroller = screen.getByTestId('scroller');

      await liftOutside(source);

      // Pointer in BOTH right edge zone (x>150) and bottom edge zone (y>75) so
      // the loop wants to scroll on both axes. The allowedAxis filter must keep
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
      // allowedAxis filter didn't over-block), and vertical was dropped despite
      // the pointer sitting in the bottom edge.
      expect(lefts.some((left) => left !== 0)).toBe(true);
      expect(tops.every((top) => top === 0)).toBe(true);
    });
  });

  it('allowedAxis callback form is consulted per frame from the latest props', async () => {
    const vertical = vi.fn<AllowedAxisFn>(() => 'vertical');
    const horizontal = vi.fn<AllowedAxisFn>(() => 'horizontal');
    const scrollBy = vi.fn();
    const { engine, rerender } = await renderDnd(
      <Scroller allowedAxis={vertical} scrollByMock={scrollBy} />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
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
    await rerender(<Scroller allowedAxis={horizontal} scrollByMock={scrollBy} />);
    vertical.mockClear();
    horizontal.mockClear();
    scrollBy.mockClear();
    await dragTo(scroller, 100, 95);

    expect(horizontal).toHaveBeenCalled();
    expect(vertical).not.toHaveBeenCalled();
    expect(scrollBy).not.toHaveBeenCalled();
  });

  describe('disabled', () => {
    it('opts a container out of the inference that would otherwise scroll it', async () => {
      const outerScrollBy = vi.fn();
      const innerScrollBy = vi.fn();

      // A scrollable box inside another one, the shape this is for: a code
      // block, an embedded map, a mini-scroller the drag should scroll *past*.
      // Neither is declared to the engine — the walk finds both — so the only
      // thing `disabled` can do here is take the inner one out of that walk.
      function Nested(props: { disabled?: boolean }) {
        const outerRef = React.useCallback((node: HTMLDivElement | null) => {
          if (node) {
            stubScrollMetrics(node, outerScrollBy);
          }
        }, []);
        return (
          <div ref={outerRef} data-testid="outer">
            <Scroller disabled={props.disabled} scrollByMock={innerScrollBy} />
          </div>
        );
      }

      const { engine, rerender } = await renderDnd(<Nested disabled />);
      const scroller = screen.getByTestId('scroller');
      const source = createElement();
      scroller.appendChild(source);
      engine.registerDraggable(source, {});

      await liftOutside(source);
      await dragTo(scroller, 100, 95);

      // The inner container declined and consumed nothing, so the axis fell
      // through to the outer one — which nothing declared either.
      expect(innerScrollBy).not.toHaveBeenCalled();
      expect(outerScrollBy).toHaveBeenCalled();

      // Enabled again, the inner container is back to what inference alone
      // would have done with it: it takes the axis and the outer one idles.
      await rerender(<Nested />);
      innerScrollBy.mockClear();
      outerScrollBy.mockClear();
      await dragTo(scroller, 100, 95);
      expect(innerScrollBy).toHaveBeenCalled();
      expect(outerScrollBy).not.toHaveBeenCalled();
    });

    it('suspends scrolling when disabled mid-drag and resumes on re-enable without re-registering', async () => {
      const canScroll = vi.fn<CanScrollFn>(() => true);
      const scrollBy = vi.fn();
      const { engine, rerender } = await renderDnd(
        <Scroller canScroll={canScroll} scrollByMock={scrollBy} />,
      );
      const source = createElement();
      engine.registerDraggable(source, {});
      const el = screen.getByTestId('scroller');

      // Engage in the bottom edge zone while enabled.
      await liftOutside(source);
      await dragTo(el, 100, 95);
      expect(scrollBy).toHaveBeenCalled();
      expect(canScroll).toHaveBeenCalled();

      // Flip `disabled` mid-drag, while the loop is engaged: scrolling must stop.
      await rerender(<Scroller disabled canScroll={canScroll} scrollByMock={scrollBy} />);
      expect(el).toHaveAttribute('data-disabled');
      await flushRaf();
      scrollBy.mockClear();
      canScroll.mockClear();
      await flushRaf();
      await flushRaf();
      expect(scrollBy).not.toHaveBeenCalled();
      // Disabled short-circuits before the consumer's `canScroll` is consulted,
      // including for fresh input arriving while disabled.
      await dragTo(el, 100, 95);
      expect(canScroll).not.toHaveBeenCalled();
      expect(scrollBy).not.toHaveBeenCalled();

      // Re-enable, still mid-drag: the registration was suspended, not torn
      // down and re-created. No new pointer input is sent after the render;
      // the parameter change itself must wake the parked loop.
      await rerender(<Scroller canScroll={canScroll} scrollByMock={scrollBy} />);
      expect(screen.getByTestId('scroller')).toBe(el);
      expect(el).not.toHaveAttribute('data-disabled');

      await flushRaf();
      await flushRaf();
      expect(canScroll).toHaveBeenCalled();
      expect(canScroll.mock.calls[0][0].element).toBe(el);
      expect(scrollBy).toHaveBeenCalled();
      fireEvent.drop(source);
    });
  });

  it('re-reads overflow when the same scroller becomes scrollable after a render', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const scrollBy = vi.fn();

    function RestyledScroller({ open }: { open: boolean }) {
      const ref = React.useCallback((node: HTMLDivElement | null) => {
        if (node) {
          stubScrollMetrics(node, scrollBy);
          node.style.overflow = 'hidden';
        }
      }, []);
      return (
        <DragAutoScroll.Root
          ref={ref}
          data-testid="scroller"
          style={{ overflow: open ? 'auto' : 'hidden' }}
        />
      );
    }

    const { engine, rerender } = await renderDnd(<RestyledScroller open={false} />);
    const source = createElement();
    engine.registerDraggable(source, {});
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
    warnSpy.mockRestore();
  });

  it('wakes a parked loop when content growth creates scroll room', async () => {
    const scrollBy = vi.fn();
    const { engine } = await renderDnd(<Scroller scrollByMock={scrollBy} />);
    const source = createElement();
    engine.registerDraggable(source, {});
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
    const scrollBy = vi.fn();
    const ref = (node: HTMLElement | null) => {
      if (node) {
        stubScrollMetrics(node, scrollBy);
        node.style.overflow = 'hidden';
      }
    };
    const { engine, rerender } = await renderDnd(
      <DragAutoScroll.Root ref={ref} render={<div />} data-testid="scroller" />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const first = screen.getByTestId('scroller');

    await liftOutside(source);
    await dragTo(first, 100, 95);
    expect(scrollBy).not.toHaveBeenCalled();

    await rerender(<DragAutoScroll.Root ref={ref} render={<section />} data-testid="scroller" />);
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
  });

  it('registers exactly once under Strict Mode, and unmount releases the registration', async () => {
    // Strict Mode double-invokes the registration effect (register → cleanup →
    // register). Two failure modes: the re-register tears the live registration
    // down (the scroller goes dead), or a duplicate hold leaks (the scroller
    // survives unmount). The drag after unmount pins both.
    const canScroll = vi.fn<CanScrollFn>(() => true);
    const { engine, unmount } = await renderDnd(
      <React.StrictMode>
        <Scroller canScroll={canScroll} />
      </React.StrictMode>,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const scroller = screen.getByTestId('scroller');

    await liftOutside(source);
    await dragTo(scroller, 100, 95);

    expect(canScroll).toHaveBeenCalled();
    expect(canScroll.mock.calls[0][0].element).toBe(scroller);
    expect(canScroll.mock.calls[0][0].input.clientY).toBe(95);
    fireEvent.drop(source);

    unmount();
    canScroll.mockClear();

    // The unmounted scroller's node is detached, so route the move through the
    // still-attached source; the loop keys on coordinates, not the hover target.
    await liftOutside(source);
    await dragTo(source, 100, 95);

    // A leaked duplicate hold would keep the unmounted scroller registered.
    expect(canScroll).not.toHaveBeenCalled();
    fireEvent.drop(source);
  });

  it('keeps registration stable across re-renders and uses the latest canScroll', async () => {
    const first = vi.fn<CanScrollFn>(() => true);
    const second = vi.fn<CanScrollFn>(() => false);
    const scrollBy = vi.fn();
    const { rerender, engine } = await renderDnd(
      <Scroller canScroll={first} scrollByMock={scrollBy} />,
    );
    const source = createElement();
    engine.registerDraggable(source, {});
    const el = screen.getByTestId('scroller');

    await rerender(<Scroller canScroll={second} scrollByMock={scrollBy} />);
    // Same DOM node — no re-registration tore it down.
    expect(screen.getByTestId('scroller')).toBe(el);

    await liftOutside(source);
    await dragTo(el, 100, 95);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
    // The frames genuinely reached this scroller at the delivered coordinates,
    // so the non-calls above and below are the swap and the `false` answer.
    expect(second.mock.calls[0][0].input.clientY).toBe(95);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  describe('accept', () => {
    const otherKind = createKind<unknown>('base-ui-test/other');

    it('never engages for a drag of a kind the scroller does not accept', async () => {
      const canScroll = vi.fn<CanScrollFn>(() => true);
      const scrollBy = vi.fn();
      const { engine, rerender } = await renderDnd(
        <Scroller accept={otherKind} canScroll={canScroll} scrollByMock={scrollBy} />,
      );
      const source = createElement();
      engine.registerDraggable(source, {}); // defaults to testDragKind
      const scroller = screen.getByTestId('scroller');

      await liftOutside(source);
      await dragTo(scroller, 100, 95);

      // The kind filter runs before the per-frame callbacks.
      expect(canScroll).not.toHaveBeenCalled();
      expect(scrollBy).not.toHaveBeenCalled();

      // Positive control: the same fixture accepting the drag's kind engages at
      // the very same coordinates.
      await rerender(
        <Scroller accept={testDragKind} canScroll={canScroll} scrollByMock={scrollBy} />,
      );
      await dragTo(scroller, 100, 95);
      expect(canScroll).toHaveBeenCalled();
      expect(scrollBy).toHaveBeenCalled();
    });

    it('does not render accept as a DOM attribute', async () => {
      await renderDnd(<DragAutoScroll.Root accept={testDragKind} data-testid="scroller" />);
      expect(screen.getByTestId('scroller')).not.toHaveAttribute('accept');
    });

    it('does not render maxSpeed as a DOM attribute', async () => {
      await renderDnd(<DragAutoScroll.Root maxSpeed={300} data-testid="scroller" />);
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
      engine.registerDraggable(source, {});
      const scroller = screen.getByTestId('scroller');

      await liftOutside(source);
      await dragTo(scroller, 100, 95);

      expect(maxSpeed).toHaveBeenCalled();
      expect(maxSpeed.mock.calls[0][0].element).toBe(scroller);
    });
  });

  describe('applyScroll', () => {
    // The delegating counterpart to `Scroller`: no scroll metrics and no
    // scrollable overflow, so it engages only because it delegates.
    function Viewport(props: RootProps) {
      const ref = React.useCallback((node: HTMLDivElement | null) => {
        if (node) {
          node.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
        }
      }, []);
      return <DragAutoScroll.Root ref={ref} data-testid="viewport" {...props} />;
    }

    it('receives the frame delta for the element it is registered on', async () => {
      const applyScroll = vi.fn<ApplyScrollFn>();
      const { engine } = await renderDnd(<Viewport applyScroll={applyScroll} />);
      const source = createElement();
      engine.registerDraggable(source, {});
      const viewport = screen.getByTestId('viewport');

      await liftOutside(source);
      await dragTo(viewport, 100, 95);

      expect(applyScroll).toHaveBeenCalled();
      expect(applyScroll.mock.calls[0][0].element).toBe(viewport);
      expect(applyScroll.mock.calls[0][0].input.clientY).toBe(95);
    });

    it('does not render applyScroll as a DOM attribute', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await renderDnd(<DragAutoScroll.Root applyScroll={() => {}} data-testid="viewport" />);
        expect(screen.getByTestId('viewport')).not.toHaveAttribute('applyscroll');
        // React logs an unknown-prop warning for anything that reaches the DOM.
        expect(consoleError).not.toHaveBeenCalled();
      } finally {
        consoleError.mockRestore();
      }
    });

    it('is suspended by disabled mid-drag and resumes without re-registering', async () => {
      const applyScroll = vi.fn<ApplyScrollFn>();
      const { engine, rerender } = await renderDnd(<Viewport applyScroll={applyScroll} />);
      const source = createElement();
      engine.registerDraggable(source, {});
      const viewport = screen.getByTestId('viewport');

      await liftOutside(source);
      await dragTo(viewport, 100, 95);
      expect(applyScroll).toHaveBeenCalled();

      await rerender(<Viewport disabled applyScroll={applyScroll} />);
      await flushRaf();
      applyScroll.mockClear();
      await flushRaf();
      await flushRaf();
      expect(applyScroll).not.toHaveBeenCalled();

      // Same DOM node throughout: `disabled` suspends the registration rather
      // than tearing it down and rebuilding it.
      await rerender(<Viewport applyScroll={applyScroll} />);
      expect(screen.getByTestId('viewport')).toBe(viewport);
      await dragTo(viewport, 100, 95);
      expect(applyScroll).toHaveBeenCalled();
    });

    it('uses the latest applyScroll across re-renders', async () => {
      const first = vi.fn<ApplyScrollFn>();
      const second = vi.fn<ApplyScrollFn>();
      const { engine, rerender } = await renderDnd(<Viewport applyScroll={first} />);
      const source = createElement();
      engine.registerDraggable(source, {});
      const viewport = screen.getByTestId('viewport');

      await rerender(<Viewport applyScroll={second} />);
      expect(screen.getByTestId('viewport')).toBe(viewport);

      await liftOutside(source);
      await dragTo(viewport, 100, 95);

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalled();
    });
  });
});
