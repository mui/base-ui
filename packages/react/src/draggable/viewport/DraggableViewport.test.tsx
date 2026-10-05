import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { act } from '@mui/internal-test-utils';
import { describeConformance, isJSDOM } from '#test-utils';
import { Draggable } from '@base-ui/react/draggable';
import { createDndRenderer, testDragKind } from '../../../test/dndEngine';
import type { DraggableViewportDragScrollEventDetails } from './DraggableViewport';
import {
  createElement,
  flushRaf,
  lift,
  registerCleanup,
  setupDragEngineTests,
  fireDrag,
} from '../../../test/dnd';
import { createKind } from '../../utils/drag-and-drop/dragKind';

type RootProps = Draggable.Viewport.Props;
type ShouldScrollFn = (eventDetails: DraggableViewportDragScrollEventDetails) => boolean;
type SelectDirectionFn = (
  eventDetails: DraggableViewportDragScrollEventDetails,
) => 'all' | 'horizontal' | 'vertical';
type MaxSpeedFn = Extract<RootProps['maxSpeed'], (...args: never) => unknown>;
setupDragEngineTests();

// jsdom implements none of the scroll metrics the loop reads. Each scroller is
// stubbed as a 200x100 box over 1000x1000 of content, scrolled to the middle on
// both axes so every direction has room.
function stubScrollMetrics(node: HTMLElement, scrollByMock?: () => void): void {
  node.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
  Object.defineProperty(node, 'scrollHeight', { configurable: true, value: 1000 });
  Object.defineProperty(node, 'clientHeight', { configurable: true, value: 100 });
  Object.defineProperty(node, 'scrollWidth', { configurable: true, value: 1000 });
  Object.defineProperty(node, 'clientWidth', { configurable: true, value: 200 });
  Object.defineProperty(node, 'scrollTop', { configurable: true, value: 400, writable: true });
  Object.defineProperty(node, 'scrollLeft', { configurable: true, value: 400, writable: true });
  // jsdom doesn't implement `scrollBy`. Always install a stub so the loop doesn't
  // throw in tests that don't assert on scrolling.
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

  // Start the drag outside the scroller's 200x100 box. The loop calls a
  // scroller's callbacks whenever the pointer is inside its rect, so it only
  // sees the scroller once a `dragOver` delivers coordinates inside it.
  async function liftOutside(source: HTMLElement): Promise<void> {
    await lift(source, { clientX: 300, clientY: 300 });
  }

  // Delivers pointer coordinates and flushes the three frames they pass through:
  // the sensor's frame, the lifecycle's rAF-coalesced `onMove`, and the woken
  // loop frame. `fireDrag` resolves the engine's hit test onto `target`.
  async function dragTo(target: HTMLElement, clientX: number, clientY: number): Promise<void> {
    fireDrag.dragOver(target, { clientX, clientY });
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

  it('applies a margin added mid-drag only after the drag enters, ignores unchanged edges, and does not forward the prop', async () => {
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
    expect(scrollBy).not.toHaveBeenCalled();
    await dragTo(scroller, 100, 50);
    await dragTo(scroller, 100, 120);
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
    fireDrag.drop(source);
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
      childList: true,
      subtree: true,
    });
    fireDrag.drop(source);
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

    // A restyle queued alongside a removal still reaches the survivor.
    await dragTo(inner, 100, 50);
    const computedStyle = vi.spyOn(window, 'getComputedStyle');
    registerCleanup(() => computedStyle.mockRestore());
    act(() => {
      inner.style.direction = 'rtl';
      releaseOuter();
    });
    await flushRaf();
    await flushRaf();
    expect(computedStyle).toHaveBeenCalledWith(inner);

    // A later mutation still invalidates the survivor's cached styles.
    computedStyle.mockClear();
    inner.style.direction = 'ltr';
    await flushRaf();
    await flushRaf();
    expect(computedStyle).toHaveBeenCalledWith(inner);
    fireDrag.drop(source);
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
    fireDrag.drop(source);
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
    // The center is outside every edge zone, so this input parks the loop and
    // attaches the idle observer.
    await dragTo(scroller, 100, 50);
    const afterFirstPark = constructed;

    // Each further input wakes the loop and parks it again.
    await dragTo(scroller, 110, 50);
    await dragTo(scroller, 120, 50);

    expect(constructed).toBe(afterFirstPark);
    fireDrag.drop(source);
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
    // the next frame re-reads its geometry. They can't change which elements
    // scroll or in which direction, so the cached styles stay.
    act(() => {
      scroller.appendChild(document.createElement('div'));
    });
    await flushRaf();
    await flushRaf();

    expect(measure).toHaveBeenCalled();
    expect(computedStyle).not.toHaveBeenCalled();
    fireDrag.drop(source);
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

    // A class on the container can flip its overflow or direction, so the cached
    // answers are dropped.
    act(() => {
      scroller.classList.add('restyled');
    });
    await flushRaf();
    await flushRaf();

    expect(computedStyle).toHaveBeenCalled();
    fireDrag.drop(source);
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
        onDragScroll={(eventDetails) => {
          if (!shouldScroll(eventDetails)) {
            eventDetails.cancel();
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
    expect(shouldScroll.mock.calls[0][0].element).toBe(ref.current);
  });

  it('scrolls the container while the pointer parks in an edge zone', async () => {
    // Positive control for every `not.toHaveBeenCalled()` in this suite. The
    // shared fixture at these coordinates reaches `scrollBy`, so a missing call
    // elsewhere comes from the check under test, not a dead loop.
    const scrollBy = vi.fn();
    const { engine } = await renderDnd(<Scroller scrollByMock={scrollBy} />);
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');

    await liftOutside(source);

    // Bottom edge zone (y > 75 of the 100px box).
    await dragTo(scroller, 100, 95);
    expect(scrollBy).toHaveBeenCalled();

    // Top edge zone. Scrolling up relies on the mid-range `scrollTop` stub,
    // because at the jsdom default of 0 there is no room above.
    scrollBy.mockClear();
    await dragTo(scroller, 100, 5);
    expect(scrollBy).toHaveBeenCalled();

    // Left edge zone, which relies on the `scrollLeft` stub the same way.
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
      expect(() => fireDrag.drop(source)).not.toThrow();
    } finally {
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    }

    scrollBy.mockClear();
    await liftOutside(source);
    await dragTo(scroller, 100, 95);
    expect(scrollBy).toHaveBeenCalled();
  });

  // The scroll delta is `depth * frameSpeed`, and `frameSpeed` comes from the
  // time between rAF timestamps. The jsdom rAF stub (`test/setupVitest.ts`)
  // passes `performance.now()`, so timestamps advance there too and the
  // nonzero-delta assertions hold in both environments.

  it('direction selection is consulted per frame from the latest props', async () => {
    const vertical = vi.fn<SelectDirectionFn>(() => 'vertical');
    const horizontal = vi.fn<SelectDirectionFn>(() => 'horizontal');
    const scrollBy = vi.fn();
    const { engine, rerender } = await renderDnd(
      <Scroller
        onDragScroll={(eventDetails) => {
          const allowedDirection = vertical(eventDetails);
          if (allowedDirection !== 'all' && allowedDirection !== eventDetails.direction) {
            eventDetails.cancel();
          }
        }}
        scrollByMock={scrollBy}
      />,
    );
    const source = createElement();
    engine.registerSource(source, {});
    const scroller = screen.getByTestId('scroller');

    // In the bottom edge zone, the vertical axis engages and scrolls.
    await liftOutside(source);
    await dragTo(scroller, 100, 95);
    expect(vertical).toHaveBeenCalled();
    expect(scrollBy).toHaveBeenCalled();

    // Swap the callback mid-drag. The loop must read the new one on its next
    // frame. The pointer is only in a vertical edge zone, so allowing only the
    // horizontal axis stops the scrolling the first callback allowed at the same
    // position.
    await rerender(
      <Scroller
        onDragScroll={(eventDetails) => {
          const allowedDirection = horizontal(eventDetails);
          if (allowedDirection !== 'all' && allowedDirection !== eventDetails.direction) {
            eventDetails.cancel();
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
          onDragScroll={(eventDetails) => {
            if (!shouldScroll(eventDetails)) {
              eventDetails.cancel();
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

      // Setting `disabled` mid-drag, while the loop is engaged, stops scrolling.
      await rerender(
        <Scroller
          disabled
          onDragScroll={(eventDetails) => {
            if (!shouldScroll(eventDetails)) {
              eventDetails.cancel();
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
      // `disabled` is checked before the consumer's `shouldScroll` is called,
      // including for new input that arrives while disabled.
      await dragTo(el, 100, 95);
      expect(shouldScroll).not.toHaveBeenCalled();
      expect(scrollBy).not.toHaveBeenCalled();

      // Re-enable, still mid-drag. The registration was suspended, not torn
      // down and re-created. No pointer input follows the render, so the
      // parameter change itself must wake the parked loop.
      await rerender(
        <Scroller
          onDragScroll={(eventDetails) => {
            if (!shouldScroll(eventDetails)) {
              eventDetails.cancel();
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
      expect(shouldScroll.mock.calls[0][0].element).toBe(el);
      expect(scrollBy).toHaveBeenCalled();
      fireDrag.drop(source);
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

    // No new pointer input. The post-commit refresh must drop the cached
    // `overflow: hidden` result and wake the parked loop at the same coordinates.
    await rerender(<RestyledScroller open />);
    await flushRaf();
    await flushRaf();

    expect(screen.getByTestId('scroller')).toBe(scroller);
    expect(scrollBy).toHaveBeenCalled();
  });

  // Browser only, because jsdom doesn't apply a descendant selector from an
  // ancestor's class to the viewport's `overflow`.
  it.skipIf(isJSDOM)(
    'stops an engaged viewport when an ancestor restyle hides its overflow',
    async () => {
      const style = document.createElement('style');
      style.textContent =
        '.scroll-locked [data-testid="scroller"] { overflow: hidden !important; }';
      document.head.appendChild(style);
      registerCleanup(() => style.remove());
      // Once hidden, the viewport no longer scrolls, and the engine warns about
      // it. That warning is expected here.
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

      // The chain observer catches the ancestor's class change and drops the
      // cached overflow, so the next frame sees `hidden` and parks.
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
      fireDrag.drop(source);
    },
  );

  it('re-reads overflow when a scrolling container becomes hidden during a drag', async () => {
    // Once hidden, the registered root no longer scrolls, and the dev warning
    // reports it.
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
    fireDrag.drop(source);
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
    fireDrag.drop(source);
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
    const hitTest = vi
      .spyOn(document, 'elementFromPoint')
      .mockImplementation(() => screen.getByTestId('scroller'));
    registerCleanup(() => hitTest.mockRestore());
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
    fireDrag.drop(source);
    warnSpy.mockRestore();
  });

  it('registers exactly once under Strict Mode, and unmount releases the registration', async () => {
    // Strict Mode runs the registration effect twice (register, cleanup,
    // register). The re-register could tear the live registration down, leaving
    // the scroller dead, or leak a duplicate hold that survives unmount. The drag
    // after unmount covers both.
    const shouldScroll = vi.fn<ShouldScrollFn>(() => true);
    const { engine, unmount } = await renderDnd(
      <React.StrictMode>
        <Scroller
          onDragScroll={(eventDetails) => {
            if (!shouldScroll(eventDetails)) {
              eventDetails.cancel();
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
    expect(shouldScroll.mock.calls[0][0].element).toBe(scroller);
    expect(shouldScroll.mock.calls[0][0].input.clientY).toBe(95);
    fireDrag.drop(source);

    unmount();
    shouldScroll.mockClear();

    // The unmounted scroller's node is detached, so route the move through the
    // source. The loop uses coordinates, not the hover target.
    await liftOutside(source);
    await dragTo(source, 100, 95);

    // A leaked duplicate hold would keep the unmounted scroller registered.
    expect(shouldScroll).not.toHaveBeenCalled();
    fireDrag.drop(source);
  });

  it('keeps registration stable across re-renders and uses the latest onDragScroll', async () => {
    const first = vi.fn<ShouldScrollFn>(() => true);
    const second = vi.fn<ShouldScrollFn>(() => false);
    const scrollBy = vi.fn();
    const { rerender, engine } = await renderDnd(
      <Scroller
        onDragScroll={(eventDetails) => {
          if (!first(eventDetails)) {
            eventDetails.cancel();
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
        onDragScroll={(eventDetails) => {
          if (!second(eventDetails)) {
            eventDetails.cancel();
          }
        }}
        scrollByMock={scrollBy}
      />,
    );
    // Same DOM node, so no re-registration tore it down.
    expect(screen.getByTestId('scroller')).toBe(el);

    await liftOutside(source);
    await dragTo(el, 100, 95);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
    // The frames reached this scroller at the delivered coordinates, so the
    // missing calls above and below come from the swap and the `false` answer.
    expect(second.mock.calls[0][0].input.clientY).toBe(95);
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
          onDragScroll={(eventDetails) => {
            if (!shouldScroll(eventDetails)) {
              eventDetails.cancel();
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

      // Positive control. The same fixture, accepting the drag's kind, engages
      // at the same coordinates.
      await rerender(
        <Scroller
          accept={testDragKind}
          onDragScroll={(eventDetails) => {
            if (!shouldScroll(eventDetails)) {
              eventDetails.cancel();
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
      // The viewport builds the engine parameters by hand. A prop missing from
      // that object still typechecks and stays off the DOM, so the test above
      // would pass while the container fell back to the default speed. The
      // callback form proves the prop arrived.
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
    it('does not render onDragScroll as a DOM attribute', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await renderDnd(
          <Draggable.Viewport
            onDragScroll={(eventDetails) => {
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
  });
});
