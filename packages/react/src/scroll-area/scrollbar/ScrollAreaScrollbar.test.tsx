import { expect } from 'vitest';
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
