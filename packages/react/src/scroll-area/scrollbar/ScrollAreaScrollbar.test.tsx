import { expect } from 'vitest';
import { DirectionProvider, type TextDirection } from '@base-ui/react/direction-provider';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { screen, fireEvent, flushMicrotasks, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM, describeConformance } from '#test-utils';
import { SCROLL_TIMEOUT } from '../constants';

describe('<ScrollArea.Scrollbar />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Scrollbar keepMounted />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<ScrollArea.Root>{node}</ScrollArea.Root>);
    },
  }));

  it('sets the orientation data attribute', async () => {
    await render(
      <ScrollArea.Root>
        <ScrollArea.Scrollbar orientation="horizontal" keepMounted data-testid="scrollbar" />
      </ScrollArea.Root>,
    );

    expect(screen.getByTestId('scrollbar')).toHaveAttribute('data-orientation', 'horizontal');
  });

  describe('data-scrolling attribute', () => {
    const { render: renderWithClock, clock } = createRenderer();

    clock.withFakeTimers();

    it('adds [data-scrolling] attribute when viewport is scrolled in the correct direction', async () => {
      await renderWithClock(
        <ScrollArea.Root style={{ width: 200, height: 200 }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: 1000, height: 1000 }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical" keepMounted />
          <ScrollArea.Scrollbar orientation="horizontal" data-testid="horizontal" keepMounted />
          <ScrollArea.Corner />
        </ScrollArea.Root>,
      );

      const verticalScrollbar = screen.getByTestId('vertical');
      const horizontalScrollbar = screen.getByTestId('horizontal');
      const viewport = screen.getByTestId('viewport');

      expect(verticalScrollbar).not.toHaveAttribute('data-scrolling');
      expect(horizontalScrollbar).not.toHaveAttribute('data-scrolling');

      fireEvent.pointerEnter(viewport);
      fireEvent.scroll(viewport, {
        target: {
          scrollTop: 1,
        },
      });

      expect(verticalScrollbar).toHaveAttribute('data-scrolling', '');
      expect(horizontalScrollbar).not.toHaveAttribute('data-scrolling', '');

      await clock.tickAsync(SCROLL_TIMEOUT - 1);

      expect(verticalScrollbar).toHaveAttribute('data-scrolling', '');
      expect(horizontalScrollbar).not.toHaveAttribute('data-scrolling', '');

      fireEvent.pointerEnter(viewport);
      fireEvent.scroll(viewport, {
        target: {
          scrollLeft: 1,
        },
      });

      await clock.tickAsync(1); // vertical just finished

      expect(verticalScrollbar).not.toHaveAttribute('data-scrolling');
      expect(horizontalScrollbar).toHaveAttribute('data-scrolling');

      await clock.tickAsync(SCROLL_TIMEOUT - 2); // already ticked 1ms above

      expect(verticalScrollbar).not.toHaveAttribute('data-scrolling');
      expect(horizontalScrollbar).toHaveAttribute('data-scrolling');

      await clock.tickAsync(1);

      expect(verticalScrollbar).not.toHaveAttribute('data-scrolling');
      expect(horizontalScrollbar).not.toHaveAttribute('data-scrolling');
    });
  });

  describe('data-hovering attribute', () => {
    it('adds [data-hovering] when the synthetic pointer target differs from the native path', async () => {
      await render(
        <ScrollArea.Root data-testid="root" style={{ width: 200, height: 200 }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: 1000, height: 1000 }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical" keepMounted />
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport');
      const verticalScrollbar = screen.getByTestId('vertical');

      // Real browser runs can start with the viewport already hovered because
      // ScrollAreaViewport syncs `:hover` on mount.
      fireEvent.pointerLeave(viewport, { pointerType: 'mouse' });
      expect(verticalScrollbar).not.toHaveAttribute('data-hovering');

      const PointerEventCtor = window.PointerEvent ?? window.Event;
      const event = new PointerEventCtor('pointerover', {
        bubbles: true,
      });

      Object.defineProperties(event, {
        composedPath: {
          configurable: true,
          value: () => [document.body, viewport],
        },
        pointerType: {
          configurable: true,
          value: 'mouse',
        },
      });

      fireEvent(viewport, event);

      expect(verticalScrollbar).toHaveAttribute('data-hovering', '');

      fireEvent.pointerLeave(viewport, { pointerType: 'mouse' });

      expect(verticalScrollbar).not.toHaveAttribute('data-hovering');
    });
  });

  describe('track pointer down', () => {
    it('ignores thumb clicks when the native path differs from the synthetic target', async () => {
      await render(
        <ScrollArea.Root style={{ width: 200, height: 200 }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: 1000, height: 1000 }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical" keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport') as HTMLDivElement;
      const verticalScrollbar = screen.getByTestId('vertical');
      const thumb = screen.getByTestId('thumb');

      Object.defineProperties(viewport, {
        clientHeight: {
          configurable: true,
          value: 200,
        },
        scrollHeight: {
          configurable: true,
          value: 1000,
        },
        scrollTop: {
          configurable: true,
          writable: true,
          value: 0,
        },
      });

      Object.defineProperties(verticalScrollbar, {
        offsetHeight: {
          configurable: true,
          value: 200,
        },
        getBoundingClientRect: {
          configurable: true,
          value: () => ({
            top: 0,
          }),
        },
      });

      Object.defineProperty(thumb, 'offsetHeight', {
        configurable: true,
        value: 40,
      });

      const event = new MouseEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientY: 160,
      });

      Object.defineProperty(event, 'composedPath', {
        configurable: true,
        value: () => [thumb, verticalScrollbar],
      });

      fireEvent(verticalScrollbar, event);

      expect(viewport.scrollTop).toBe(0);
    });

    it('marks the scroll area as scrolling when pressing the track', async () => {
      await render(
        <ScrollArea.Root style={{ width: 200, height: 200 }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: 1000, height: 1000 }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical" keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport') as HTMLDivElement;
      const verticalScrollbar = screen.getByTestId('vertical');
      const thumb = screen.getByTestId('thumb');

      Object.defineProperties(viewport, {
        clientHeight: {
          configurable: true,
          value: 200,
        },
        scrollHeight: {
          configurable: true,
          value: 1000,
        },
        scrollTop: {
          configurable: true,
          writable: true,
          value: 0,
        },
      });

      Object.defineProperties(verticalScrollbar, {
        offsetHeight: {
          configurable: true,
          value: 200,
        },
        getBoundingClientRect: {
          configurable: true,
          value: () => ({
            top: 0,
          }),
        },
      });

      Object.defineProperties(thumb, {
        offsetHeight: {
          configurable: true,
          value: 40,
        },
        setPointerCapture: {
          configurable: true,
          value: () => {},
        },
      });

      fireEvent.pointerDown(verticalScrollbar, { button: 0, clientY: 160, pointerId: 1 });

      expect(viewport.scrollTop).not.toBe(0);
      await waitFor(() => expect(verticalScrollbar).toHaveAttribute('data-scrolling'));
    });

    it('clears track drag state on pointer cancel', async () => {
      await render(
        <ScrollArea.Root style={{ width: 200, height: 200 }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: 1000, height: 1000 }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical" keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport') as HTMLDivElement;
      const verticalScrollbar = screen.getByTestId('vertical');
      const thumb = screen.getByTestId('thumb');

      Object.defineProperties(viewport, {
        clientHeight: {
          configurable: true,
          value: 200,
        },
        scrollHeight: {
          configurable: true,
          value: 1000,
        },
        scrollTop: {
          configurable: true,
          writable: true,
          value: 0,
        },
      });

      Object.defineProperties(verticalScrollbar, {
        offsetHeight: {
          configurable: true,
          value: 200,
        },
        getBoundingClientRect: {
          configurable: true,
          value: () => ({
            top: 0,
          }),
        },
      });

      Object.defineProperties(thumb, {
        offsetHeight: {
          configurable: true,
          value: 40,
        },
        setPointerCapture: {
          configurable: true,
          value: () => {},
        },
        hasPointerCapture: {
          configurable: true,
          value: () => false,
        },
      });

      fireEvent.pointerDown(verticalScrollbar, { button: 0, clientY: 160, pointerId: 1 });

      const scrollTopAfterTrackPress = viewport.scrollTop;

      fireEvent.pointerCancel(verticalScrollbar, { pointerId: 1 });
      fireEvent.pointerMove(thumb, { clientY: 180, pointerId: 1 });

      expect(viewport.scrollTop).toBe(scrollTopAfterTrackPress);
    });
  });

  // The vertical/horizontal track-click branches were consolidated into one
  // axis-parameterized path. `getOffset` reads logical margins/paddings that jsdom
  // doesn't compute, so exercise the merged branch against real layout here to pin
  // the horizontal LTR path and the RTL inversion (jsdom track-click tests above
  // assert the vertical path but pass vacuously on the offset math).
  describe.skipIf(isJSDOM)('track click by axis', () => {
    async function renderAxisTrack(
      orientation: 'horizontal' | 'vertical',
      direction: TextDirection,
    ) {
      await render(
        <DirectionProvider direction={direction}>
          <ScrollArea.Root style={{ width: 200, height: 200, direction }}>
            <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
              <div style={{ width: 1000, height: 1000 }} />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation={orientation} data-testid="scrollbar" keepMounted>
              <ScrollArea.Thumb data-testid="thumb" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </DirectionProvider>,
      );

      const viewport = screen.getByTestId('viewport') as HTMLDivElement;
      const scrollbar = screen.getByTestId('scrollbar');
      const thumb = screen.getByTestId('thumb');
      await waitFor(() => expect(thumb.offsetWidth + thumb.offsetHeight).toBeGreaterThan(0));

      return { viewport, scrollbar };
    }

    it('scrolls down when clicking below the thumb on a vertical track', async () => {
      const { viewport, scrollbar } = await renderAxisTrack('vertical', 'ltr');
      const rect = scrollbar.getBoundingClientRect();

      fireEvent.pointerDown(scrollbar, {
        button: 0,
        clientX: rect.left + rect.width / 2,
        clientY: rect.bottom - 5,
        pointerId: 1,
      });

      expect(viewport.scrollTop).toBeGreaterThan(0);
    });

    it('scrolls right when clicking the end of a horizontal LTR track', async () => {
      const { viewport, scrollbar } = await renderAxisTrack('horizontal', 'ltr');
      const rect = scrollbar.getBoundingClientRect();

      fireEvent.pointerDown(scrollbar, {
        button: 0,
        clientX: rect.right - 5,
        clientY: rect.top + rect.height / 2,
        pointerId: 1,
      });

      expect(viewport.scrollLeft).toBeGreaterThan(0);
    });

    it('scrolls into the negative RTL range when clicking a horizontal RTL track', async () => {
      const { viewport, scrollbar } = await renderAxisTrack('horizontal', 'rtl');
      const rect = scrollbar.getBoundingClientRect();

      fireEvent.pointerDown(scrollbar, {
        button: 0,
        clientX: rect.left + 5,
        clientY: rect.top + rect.height / 2,
        pointerId: 1,
      });

      expect(viewport.scrollLeft).toBeLessThan(0);
    });
  });

  // The jump-to-click assignment must run with snapping already disabled, or the
  // assigned position quantizes to the nearest snap point and the thumb stays
  // offset from the pointer for the whole drag. Requires real layout for the
  // track/thumb offset math, so Chromium only.
  describe.skipIf(isJSDOM)('scroll snap on track press', () => {
    it('does not snap the initial jump-to-click position', async () => {
      await render(
        <ScrollArea.Root style={{ width: 400, height: 200 }}>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ width: '100%', height: '100%', scrollSnapType: 'x mandatory' }}
          >
            <div style={{ display: 'flex' }}>
              {Array.from({ length: 10 }, (_, index) => (
                <div
                  key={index}
                  style={{ flexShrink: 0, width: 200, height: 100, scrollSnapAlign: 'start' }}
                />
              ))}
            </div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="horizontal" data-testid="scrollbar" keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport') as HTMLDivElement;
      const scrollbar = screen.getByTestId('scrollbar');
      const thumb = screen.getByTestId('thumb');
      await waitFor(() => expect(thumb.offsetWidth).toBeGreaterThan(0));

      // Aim mid-way between the 800 and 1000 snap points (200px items).
      const targetScroll = 900;
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      const maxThumbOffset = scrollbar.offsetWidth - thumb.offsetWidth;
      const rect = scrollbar.getBoundingClientRect();
      const clickX =
        rect.left + (targetScroll / maxScroll) * maxThumbOffset + thumb.offsetWidth / 2;

      fireEvent.pointerDown(scrollbar, {
        button: 0,
        clientX: clickX,
        clientY: rect.top + rect.height / 2,
        pointerId: 1,
      });

      expect(Math.abs(viewport.scrollLeft - targetScroll)).toBeLessThanOrEqual(1);

      // Releasing restores snapping, which re-snaps to the nearest snap point.
      fireEvent.pointerUp(scrollbar, { pointerId: 1 });
      await waitFor(() => expect(viewport.scrollLeft % 200).toBe(0));
    });
  });

  // A short or heavily padded track drives `maxThumbOffset` to zero or negative
  // once the thumb hits its `MIN_THUMB_SIZE` floor. Dragging the thumb then
  // divides by a non-positive offset, teleporting the scroll position to an
  // extreme instead of moving proportionally. Asserted with real layout: a 16px
  // track ties the floored thumb to the track length (offset 0); a 10px track is
  // shorter than the floored thumb (negative offset).
  describe.skipIf(isJSDOM)('non-positive thumb offset', () => {
    async function renderShortTrack(trackHeight: number) {
      await render(
        <ScrollArea.Root style={{ width: 200, height: 200 }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: 1000, height: 1000 }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            data-testid="vertical"
            keepMounted
            style={{ height: trackHeight, bottom: 'auto', width: 12 }}
          >
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport') as HTMLDivElement;
      const verticalScrollbar = screen.getByTestId('vertical');
      const thumb = screen.getByTestId('thumb');
      await waitFor(() => expect(thumb.offsetHeight).toBeGreaterThan(0));

      return { viewport, verticalScrollbar, thumb };
    }

    it('does not jump the scroll when dragging a thumb that fills the track', async () => {
      const { viewport, thumb } = await renderShortTrack(16);

      // Park the scroll mid-range so an erroneous jump to an edge is detectable.
      viewport.scrollTop = 400;
      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 });
      fireEvent.pointerMove(thumb, { clientY: 5, pointerId: 1 });

      expect(viewport.scrollTop).toBe(400);
    });

    it('does not jump the scroll when dragging a thumb taller than the track', async () => {
      const { viewport, thumb } = await renderShortTrack(10);

      viewport.scrollTop = 400;
      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 });
      fireEvent.pointerMove(thumb, { clientY: 5, pointerId: 1 });

      expect(viewport.scrollTop).toBe(400);
    });

    it('does not jump the scroll when clicking a track whose thumb fills the track', async () => {
      const { viewport, verticalScrollbar } = await renderShortTrack(16);

      viewport.scrollTop = 400;
      fireEvent.pointerDown(verticalScrollbar, { button: 0, clientY: 5, pointerId: 1 });

      expect(viewport.scrollTop).toBe(400);
    });

    it('does not jump the scroll when clicking a track whose thumb is taller than the track', async () => {
      const { viewport, verticalScrollbar } = await renderShortTrack(10);

      viewport.scrollTop = 400;
      fireEvent.pointerDown(verticalScrollbar, { button: 0, clientY: 5, pointerId: 1 });

      expect(viewport.scrollTop).toBe(400);
    });
  });

  describe('wheel', () => {
    async function renderWheelTest(props: {
      direction?: TextDirection;
      orientation?: 'horizontal' | 'vertical';
      scrollLeft?: number;
      scrollTop?: number;
    }) {
      const {
        direction = 'ltr',
        orientation = 'horizontal',
        scrollLeft = 0,
        scrollTop = 0,
      } = props;

      await render(
        <DirectionProvider direction={direction}>
          <ScrollArea.Root style={{ width: 200, height: 200, direction }}>
            <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
              <div style={{ width: 1000, height: 1000 }} />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation={orientation} data-testid="scrollbar" keepMounted />
          </ScrollArea.Root>
        </DirectionProvider>,
      );

      const viewport = screen.getByTestId('viewport') as HTMLDivElement;
      const scrollbar = screen.getByTestId('scrollbar');

      Object.defineProperties(viewport, {
        clientHeight: {
          configurable: true,
          value: 200,
        },
        clientWidth: {
          configurable: true,
          value: 200,
        },
        scrollHeight: {
          configurable: true,
          value: 1000,
        },
        scrollWidth: {
          configurable: true,
          value: 1000,
        },
        scrollLeft: {
          configurable: true,
          writable: true,
          value: scrollLeft,
        },
        scrollTop: {
          configurable: true,
          writable: true,
          value: scrollTop,
        },
      });

      return { viewport, scrollbar };
    }

    it('allows horizontal scrolling away from the RTL start edge', async () => {
      const { viewport, scrollbar } = await renderWheelTest({ direction: 'rtl' });

      fireEvent.wheel(scrollbar, { deltaX: -50 });

      expect(viewport.scrollLeft).toBe(-50);
    });

    it('clamps horizontal LTR wheel scrolling at both edges', async () => {
      const { viewport, scrollbar } = await renderWheelTest({ direction: 'ltr' });

      fireEvent.wheel(scrollbar, { deltaX: -50 });
      expect(viewport.scrollLeft).toBe(0);

      viewport.scrollLeft = 790;
      fireEvent.wheel(scrollbar, { deltaX: 50 });
      expect(viewport.scrollLeft).toBe(800);

      fireEvent.wheel(scrollbar, { deltaX: 50 });
      expect(viewport.scrollLeft).toBe(800);
    });

    it('clamps horizontal RTL wheel scrolling at both edges', async () => {
      const { viewport, scrollbar } = await renderWheelTest({ direction: 'rtl' });

      fireEvent.wheel(scrollbar, { deltaX: 50 });
      expect(viewport.scrollLeft).toBe(0);

      viewport.scrollLeft = -100;
      fireEvent.wheel(scrollbar, { deltaX: 50 });
      expect(viewport.scrollLeft).toBe(-50);

      viewport.scrollLeft = -790;
      fireEvent.wheel(scrollbar, { deltaX: -50 });
      expect(viewport.scrollLeft).toBe(-800);

      fireEvent.wheel(scrollbar, { deltaX: -50 });
      expect(viewport.scrollLeft).toBe(-800);

      viewport.scrollLeft = -10;
      fireEvent.wheel(scrollbar, { deltaX: 50 });
      expect(viewport.scrollLeft).toBe(0);
    });

    it('clamps vertical wheel scrolling at both edges', async () => {
      const { viewport, scrollbar } = await renderWheelTest({ orientation: 'vertical' });

      fireEvent.wheel(scrollbar, { deltaY: -50 });
      expect(viewport.scrollTop).toBe(0);

      viewport.scrollTop = 790;
      fireEvent.wheel(scrollbar, { deltaY: 50 });
      expect(viewport.scrollTop).toBe(800);

      fireEvent.wheel(scrollbar, { deltaY: 50 });
      expect(viewport.scrollTop).toBe(800);
    });

    it('preventDefaults only when it consumes the scroll, allowing chaining at edges', async () => {
      const { viewport, scrollbar } = await renderWheelTest({ orientation: 'vertical' });

      // Mid-range: the wheel scroll is consumed, so the event is cancelled.
      viewport.scrollTop = 400;
      // `fireEvent` returns the `dispatchEvent` result: `false` when `preventDefault` was called.
      expect(fireEvent.wheel(scrollbar, { deltaY: 50 })).toBe(false);

      // At the end edge scrolling further: not consumed, so the event chains to the parent/page.
      viewport.scrollTop = 800;
      expect(fireEvent.wheel(scrollbar, { deltaY: 50 })).toBe(true);

      // At the start edge scrolling further backward, the event chains too.
      viewport.scrollTop = 0;
      expect(fireEvent.wheel(scrollbar, { deltaY: -50 })).toBe(true);
    });

    it('ignores zero-delta wheel events', async () => {
      const { viewport, scrollbar } = await renderWheelTest({
        orientation: 'vertical',
        scrollTop: 400,
      });

      expect(fireEvent.wheel(scrollbar, { deltaY: 0 })).toBe(true);
      expect(viewport.scrollTop).toBe(400);
      expect(scrollbar).not.toHaveAttribute('data-scrolling');
    });

    it('marks the scroll area as scrolling when wheeling over the scrollbar', async () => {
      const { scrollbar } = await renderWheelTest({ orientation: 'vertical' });

      fireEvent.wheel(scrollbar, { deltaY: 50 });

      await waitFor(() => expect(scrollbar).toHaveAttribute('data-scrolling'));
    });

    it('marks the scroll area as scrolling when wheeling over the horizontal scrollbar', async () => {
      const { scrollbar } = await renderWheelTest({ orientation: 'horizontal' });

      fireEvent.wheel(scrollbar, { deltaX: 50 });

      await waitFor(() => expect(scrollbar).toHaveAttribute('data-scrolling'));
    });

    it('does not mark the scroll area as scrolling when chaining at an edge', async () => {
      const { viewport, scrollbar } = await renderWheelTest({ orientation: 'vertical' });

      // At the end edge scrolling further chains to the page without consuming the
      // scroll, so the area must not be marked as scrolling.
      viewport.scrollTop = 800;
      fireEvent.wheel(scrollbar, { deltaY: 50 });

      expect(scrollbar).not.toHaveAttribute('data-scrolling');
    });

    it.skipIf(isJSDOM)('registers after the horizontal scrollbar becomes visible', async () => {
      await render(
        <DirectionProvider direction="rtl">
          <ScrollArea.Root style={{ width: 200, height: 200, direction: 'rtl' }}>
            <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
              <div style={{ width: 1000, height: 200 }} />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation="horizontal" data-testid="horizontal">
              <ScrollArea.Thumb />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </DirectionProvider>,
      );

      const viewport = screen.getByTestId('viewport') as HTMLDivElement;
      const horizontalScrollbar = await screen.findByTestId('horizontal');

      await waitFor(() => expect(horizontalScrollbar).toHaveAttribute('data-has-overflow-x'));

      fireEvent.wheel(horizontalScrollbar, { deltaX: -50 });

      expect(viewport.scrollLeft).toBe(-50);
    });
  });

  describe.skipIf(isJSDOM)('data overflow attributes (scrollbars)', () => {
    const VIEWPORT_SIZE = 200;
    const SCROLLABLE_CONTENT_SIZE = 1000;

    it('applies data attributes on vertical and horizontal scrollbars', async () => {
      await render(
        <ScrollArea.Root style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: SCROLLABLE_CONTENT_SIZE, height: SCROLLABLE_CONTENT_SIZE }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="scrollbar-vertical">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal" data-testid="scrollbar-horizontal">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport');
      const vScrollbar = screen.getByTestId('scrollbar-vertical');
      const hScrollbar = screen.getByTestId('scrollbar-horizontal');

      /* eslint-disable testing-library/no-wait-for-multiple-assertions */
      await waitFor(() => {
        expect(vScrollbar).toHaveAttribute('data-has-overflow-y');
        expect(vScrollbar).not.toHaveAttribute('data-overflow-y-start');
        expect(vScrollbar).toHaveAttribute('data-overflow-y-end');

        expect(hScrollbar).toHaveAttribute('data-has-overflow-x');
        expect(hScrollbar).not.toHaveAttribute('data-overflow-x-start');
        expect(hScrollbar).toHaveAttribute('data-overflow-x-end');
      });
      /* eslint-enable testing-library/no-wait-for-multiple-assertions */

      // Scroll to middle
      const halfY = (viewport.scrollHeight - viewport.clientHeight) / 2;
      const halfX = (viewport.scrollWidth - viewport.clientWidth) / 2;
      fireEvent.scroll(viewport, {
        target: { scrollTop: halfY, scrollLeft: halfX },
      });
      await flushMicrotasks();

      expect(vScrollbar).toHaveAttribute('data-overflow-y-start');
      expect(vScrollbar).toHaveAttribute('data-overflow-y-end');
      expect(hScrollbar).toHaveAttribute('data-overflow-x-start');
      expect(hScrollbar).toHaveAttribute('data-overflow-x-end');
    });
  });
});
