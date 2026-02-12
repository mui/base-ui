import { ScrollArea } from '@base-ui/react/scroll-area';
import { createRenderer, isJSDOM, describeConformance } from '#test-utils';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
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

      expect(viewport).not.to.have.attribute('data-scrolling');

      fireEvent.pointerEnter(viewport);
      fireEvent.scroll(viewport, { target: { scrollTop: 1 } });

      expect(viewport).to.have.attribute('data-scrolling', '');

      await clock.tickAsync(SCROLL_TIMEOUT);

      expect(viewport).not.to.have.attribute('data-scrolling');

      // Test horizontal scrolling
      fireEvent.pointerEnter(viewport);
      fireEvent.scroll(viewport, { target: { scrollLeft: 1 } });

      expect(viewport).to.have.attribute('data-scrolling', '');

      await clock.tickAsync(SCROLL_TIMEOUT);

      expect(viewport).not.to.have.attribute('data-scrolling');
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

      expect(viewport).to.have.attribute('data-scrolling', '');

      // Wait less than timeout - should still be scrolling
      await clock.tickAsync(SCROLL_TIMEOUT - 1);

      expect(viewport).to.have.attribute('data-scrolling', '');

      // Wait for remaining timeout
      await clock.tickAsync(1);

      expect(viewport).not.to.have.attribute('data-scrolling');
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

      expect(viewport).to.have.attribute('data-has-overflow-x');
      expect(viewport).to.have.attribute('data-has-overflow-y');
      expect(viewport).not.to.have.attribute('data-overflow-x-start');
      expect(viewport).to.have.attribute('data-overflow-x-end');
      expect(viewport).not.to.have.attribute('data-overflow-y-start');
      expect(viewport).to.have.attribute('data-overflow-y-end');
    });
  });
});
