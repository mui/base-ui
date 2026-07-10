import { expect } from 'vitest';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { createRenderer, isJSDOM, describeConformance } from '#test-utils';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { SCROLL_TIMEOUT } from '../constants';

describe('<ScrollArea.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<ScrollArea.Root>{node}</ScrollArea.Root>);
    },
  }));

  describe('data-scrolling attribute', () => {
    const { render: renderWithClock, clock } = createRenderer();

    clock.withFakeTimers();

    it('adds [data-scrolling] attribute when viewport is scrolled', async () => {
      await renderWithClock(
        <ScrollArea.Root style={{ width: 200, height: 200 }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: 1000, height: 1000 }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport');

      expect(viewport).not.toHaveAttribute('data-scrolling');

      fireEvent.pointerEnter(viewport);
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } });

      expect(viewport).toHaveAttribute('data-scrolling', '');

      await clock.tickAsync(SCROLL_TIMEOUT);

      expect(viewport).not.toHaveAttribute('data-scrolling');

      // Test horizontal scrolling
      fireEvent.pointerEnter(viewport);
      fireEvent.scroll(viewport, { target: { scrollLeft: 1 } });

      expect(viewport).toHaveAttribute('data-scrolling', '');

      await clock.tickAsync(SCROLL_TIMEOUT);

      expect(viewport).not.toHaveAttribute('data-scrolling');
    });

    it('ignores data-scrolling during programmatic scroll', async () => {
      await renderWithClock(
        <ScrollArea.Root style={{ width: 200, height: 200 }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: 1000, height: 1000 }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport');

      // No user interaction before the scroll event, as with `scrollTo()`.
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } });

      expect(viewport).not.toHaveAttribute('data-scrolling');
    });

    it('adds [data-scrolling] in touch modality even when the gesture delivers no events', async () => {
      await renderWithClock(
        <ScrollArea.Root style={{ width: 200, height: 200 }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: 1000, height: 1000 }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport');

      // The initial touch is delivered normally and establishes touch modality.
      fireEvent.pointerDown(viewport, { pointerType: 'touch' });

      // A touch that catches an in-flight momentum scroll or rubber-band
      // bounce is consumed natively by WebKit: no touch/pointer events fire
      // for the whole gesture, only scroll events after an arbitrary pause.
      await clock.tickAsync(200);
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } });

      expect(viewport).toHaveAttribute('data-scrolling', '');

      await clock.tickAsync(SCROLL_TIMEOUT);

      expect(viewport).not.toHaveAttribute('data-scrolling');
    });

    it('keeps ignoring programmatic scrolls in mouse modality', async () => {
      await renderWithClock(
        <ScrollArea.Root style={{ width: 200, height: 200 }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: 1000, height: 1000 }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport');

      fireEvent.pointerDown(viewport, { pointerType: 'mouse' });

      await clock.tickAsync(200);
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } });

      expect(viewport).not.toHaveAttribute('data-scrolling');
    });

    it('restores programmatic scroll suppression after modality flips back to mouse', async () => {
      await renderWithClock(
        <ScrollArea.Root data-testid="root" style={{ width: 200, height: 200 }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: 1000, height: 1000 }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>,
      );

      const root = screen.getByTestId('root');
      const viewport = screen.getByTestId('viewport');

      fireEvent.pointerDown(viewport, { pointerType: 'touch' });
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } });

      expect(viewport).toHaveAttribute('data-scrolling', '');

      await clock.tickAsync(SCROLL_TIMEOUT);

      expect(viewport).not.toHaveAttribute('data-scrolling');

      // A mouse pointer event on the root (not the viewport, whose own
      // handlers mark user interaction) switches back to mouse modality.
      fireEvent.pointerMove(root, { pointerType: 'mouse' });
      fireEvent.scroll(viewport, { target: { scrollTop: 2 } });

      expect(viewport).not.toHaveAttribute('data-scrolling');
    });

    it('removes [data-scrolling] after timeout', async () => {
      await renderWithClock(
        <ScrollArea.Root style={{ width: 200, height: 200 }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: 1000, height: 1000 }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport');

      // Start scrolling
      fireEvent.pointerEnter(viewport);
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } });

      expect(viewport).toHaveAttribute('data-scrolling', '');

      // Wait less than timeout - should still be scrolling
      await clock.tickAsync(SCROLL_TIMEOUT - 1);

      expect(viewport).toHaveAttribute('data-scrolling', '');

      // Wait for remaining timeout
      await clock.tickAsync(1);

      expect(viewport).not.toHaveAttribute('data-scrolling');
    });
  });

  describe.skipIf(isJSDOM)('overflow data attributes (viewport)', () => {
    const VIEWPORT_SIZE = 200;
    const SCROLLABLE_CONTENT_SIZE = 1000;

    it('applies data attributes on viewport', async () => {
      await render(
        <ScrollArea.Root style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: SCROLLABLE_CONTENT_SIZE, height: SCROLLABLE_CONTENT_SIZE }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport');

      /* eslint-disable testing-library/no-wait-for-multiple-assertions */
      await waitFor(() => {
        expect(viewport).toHaveAttribute('data-has-overflow-x');
        expect(viewport).toHaveAttribute('data-has-overflow-y');
        expect(viewport).not.toHaveAttribute('data-overflow-x-start');
        expect(viewport).toHaveAttribute('data-overflow-x-end');
        expect(viewport).not.toHaveAttribute('data-overflow-y-start');
        expect(viewport).toHaveAttribute('data-overflow-y-end');
      });
      /* eslint-enable testing-library/no-wait-for-multiple-assertions */
    });
  });

  // Only Safari reports an out-of-range `scrollTop`/`scrollLeft` while rubber-banding, and the
  // browser clamps the property on assignment, so the getter is mocked to emulate it against
  // real layout.
  describe.skipIf(isJSDOM)('overscroll feedback', () => {
    const VIEWPORT_SIZE = 200;
    const CONTENT_SIZE = 1000;
    const MAX_SCROLL = CONTENT_SIZE - VIEWPORT_SIZE;

    async function renderScrollArea(
      orientation: 'vertical' | 'horizontal',
      textDirection: 'ltr' | 'rtl' = 'ltr',
    ) {
      await render(
        <DirectionProvider direction={textDirection}>
          <ScrollArea.Root
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE, direction: textDirection }}
          >
            <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
              <div
                style={{
                  width: orientation === 'horizontal' ? CONTENT_SIZE : '100%',
                  height: orientation === 'vertical' ? CONTENT_SIZE : '100%',
                }}
              />
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
      const axis = orientation === 'vertical' ? 'height' : 'width';
      await waitFor(() => expect(thumb.getBoundingClientRect()[axis]).toBeGreaterThan(0));

      return { viewport, scrollbar, thumb };
    }

    function overscroll(viewport: HTMLDivElement, prop: 'scrollTop' | 'scrollLeft', value: number) {
      Object.defineProperty(viewport, prop, { configurable: true, get: () => value });
      fireEvent.scroll(viewport);
    }

    it('shrinks and pins the thumb to the start edge while overscrolling past the top', async () => {
      const { viewport, scrollbar, thumb } = await renderScrollArea('vertical');

      const restingHeight = thumb.getBoundingClientRect().height;

      overscroll(viewport, 'scrollTop', -50);

      // Shrinks, but damped by the content length rather than subtracting the raw pixels
      // (a 1:1 subtraction of 50px would collapse this thumb to its minimum size).
      await waitFor(() => expect(thumb.getBoundingClientRect().height).toBeLessThan(restingHeight));
      expect(thumb.getBoundingClientRect().height).toBeGreaterThan(restingHeight * 0.9);
      // Pinned to the top edge of the track.
      expect(thumb.getBoundingClientRect().top).toBeCloseTo(
        scrollbar.getBoundingClientRect().top,
        0,
      );
    });

    it('shrinks and pins the thumb to the end edge while overscrolling past the bottom', async () => {
      const { viewport, scrollbar, thumb } = await renderScrollArea('vertical');

      const restingHeight = thumb.getBoundingClientRect().height;

      overscroll(viewport, 'scrollTop', MAX_SCROLL + 50);

      await waitFor(() => expect(thumb.getBoundingClientRect().height).toBeLessThan(restingHeight));
      expect(thumb.getBoundingClientRect().height).toBeGreaterThan(restingHeight * 0.9);
      // Pinned to the bottom edge of the track.
      expect(thumb.getBoundingClientRect().bottom).toBeCloseTo(
        scrollbar.getBoundingClientRect().bottom,
        0,
      );
    });

    it('restores the resting thumb size once the viewport settles back into range', async () => {
      const { viewport, thumb } = await renderScrollArea('vertical');

      const restingHeight = thumb.getBoundingClientRect().height;

      overscroll(viewport, 'scrollTop', -50);
      await waitFor(() => expect(thumb.getBoundingClientRect().height).toBeLessThan(restingHeight));

      overscroll(viewport, 'scrollTop', 100);
      await waitFor(() =>
        expect(thumb.getBoundingClientRect().height).toBeCloseTo(restingHeight, 0),
      );
    });

    it('shrinks and pins the horizontal thumb to the inline start while overscrolling (LTR)', async () => {
      const { viewport, scrollbar, thumb } = await renderScrollArea('horizontal');

      const restingWidth = thumb.getBoundingClientRect().width;

      overscroll(viewport, 'scrollLeft', -50);

      await waitFor(() => expect(thumb.getBoundingClientRect().width).toBeLessThan(restingWidth));
      expect(thumb.getBoundingClientRect().width).toBeGreaterThan(restingWidth * 0.9);
      // Inline start is the left edge in LTR.
      expect(thumb.getBoundingClientRect().left).toBeCloseTo(
        scrollbar.getBoundingClientRect().left,
        0,
      );
    });

    it('shrinks and pins the horizontal thumb to the inline end while overscrolling (LTR)', async () => {
      const { viewport, scrollbar, thumb } = await renderScrollArea('horizontal');

      const restingWidth = thumb.getBoundingClientRect().width;

      overscroll(viewport, 'scrollLeft', MAX_SCROLL + 50);

      await waitFor(() => expect(thumb.getBoundingClientRect().width).toBeLessThan(restingWidth));
      expect(thumb.getBoundingClientRect().width).toBeGreaterThan(restingWidth * 0.9);
      // Inline end is the right edge in LTR.
      expect(thumb.getBoundingClientRect().right).toBeCloseTo(
        scrollbar.getBoundingClientRect().right,
        0,
      );
    });

    it('shrinks and pins the horizontal thumb to the inline start while overscrolling (RTL)', async () => {
      const { viewport, scrollbar, thumb } = await renderScrollArea('horizontal', 'rtl');

      const restingWidth = thumb.getBoundingClientRect().width;

      // RTL scrolls from 0 toward `-MAX_SCROLL`; overscrolling the inline start goes positive.
      overscroll(viewport, 'scrollLeft', 50);

      await waitFor(() => expect(thumb.getBoundingClientRect().width).toBeLessThan(restingWidth));
      expect(thumb.getBoundingClientRect().width).toBeGreaterThan(restingWidth * 0.9);
      // Inline start is the right edge in RTL.
      expect(thumb.getBoundingClientRect().right).toBeCloseTo(
        scrollbar.getBoundingClientRect().right,
        0,
      );
    });

    it('shrinks and pins the horizontal thumb to the inline end while overscrolling (RTL)', async () => {
      const { viewport, scrollbar, thumb } = await renderScrollArea('horizontal', 'rtl');

      const restingWidth = thumb.getBoundingClientRect().width;

      // RTL overscroll past the inline end goes beyond `-MAX_SCROLL`.
      overscroll(viewport, 'scrollLeft', -(MAX_SCROLL + 50));

      await waitFor(() => expect(thumb.getBoundingClientRect().width).toBeLessThan(restingWidth));
      expect(thumb.getBoundingClientRect().width).toBeGreaterThan(restingWidth * 0.9);
      // Inline end is the left edge in RTL.
      expect(thumb.getBoundingClientRect().left).toBeCloseTo(
        scrollbar.getBoundingClientRect().left,
        0,
      );
    });
  });
});
