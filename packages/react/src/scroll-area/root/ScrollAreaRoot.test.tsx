import * as React from 'react';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { expect } from 'chai';
import { describeConformance } from '../../../test/describeConformance';
import { DirectionProvider } from '../../direction-provider/DirectionProvider';

const VIEWPORT_SIZE = 200;
const SCROLLABLE_CONTENT_SIZE = 1000;
const SCROLLBAR_WIDTH = 10;
const SCROLLBAR_HEIGHT = 10;

describe('<ScrollArea.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Root />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe.skipIf(isJSDOM)('sizing', () => {
    it('should correctly set thumb height and width based on scrollable content', async () => {
      await render(
        <ScrollArea.Root style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: SCROLLABLE_CONTENT_SIZE, height: SCROLLABLE_CONTENT_SIZE }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical-scrollbar">
            <ScrollArea.Thumb data-testid="vertical-thumb" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal" data-testid="horizontal-scrollbar">
            <ScrollArea.Thumb data-testid="horizontal-thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>,
      );

      const verticalThumb = screen.getByTestId('vertical-thumb');
      const horizontalThumb = screen.getByTestId('horizontal-thumb');

      expect(
        getComputedStyle(verticalThumb).getPropertyValue('--scroll-area-thumb-height'),
      ).to.equal(`${(VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE) * VIEWPORT_SIZE}px`);
      expect(
        getComputedStyle(horizontalThumb).getPropertyValue('--scroll-area-thumb-width'),
      ).to.equal(`${(VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE) * VIEWPORT_SIZE}px`);
    });

    it('should not add padding for overlay scrollbars', async () => {
      await render(
        <ScrollArea.Root style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: SCROLLABLE_CONTENT_SIZE, height: SCROLLABLE_CONTENT_SIZE }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            style={{ width: SCROLLBAR_WIDTH, height: '100%' }}
          />
          <ScrollArea.Scrollbar
            orientation="horizontal"
            style={{ height: SCROLLBAR_HEIGHT, width: '100%' }}
          />
        </ScrollArea.Root>,
      );

      const contentWrapper = screen.getByTestId('viewport').firstElementChild!;
      const style = getComputedStyle(contentWrapper);

      expect(style.paddingLeft).to.equal('0px');
      expect(style.paddingRight).to.equal('0px');
      expect(style.paddingBottom).to.equal('0px');
    });

    it('accounts for scrollbar padding', async () => {
      const PADDING = 8;

      await render(
        <ScrollArea.Root style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: SCROLLABLE_CONTENT_SIZE, height: SCROLLABLE_CONTENT_SIZE }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            data-testid="vertical-scrollbar"
            style={{ paddingBlock: PADDING }}
          >
            <ScrollArea.Thumb data-testid="vertical-thumb" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar
            orientation="horizontal"
            data-testid="horizontal-scrollbar"
            style={{ paddingInline: PADDING }}
          >
            <ScrollArea.Thumb data-testid="horizontal-thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>,
      );

      const verticalThumb = screen.getByTestId('vertical-thumb');
      const horizontalThumb = screen.getByTestId('horizontal-thumb');

      expect(
        getComputedStyle(verticalThumb).getPropertyValue('--scroll-area-thumb-height'),
      ).to.equal(`${(VIEWPORT_SIZE - PADDING * 2) * (VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE)}px`);
      expect(
        getComputedStyle(horizontalThumb).getPropertyValue('--scroll-area-thumb-width'),
      ).to.equal(`${(VIEWPORT_SIZE - PADDING * 2) * (VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE)}px`);
    });

    it('accounts for scrollbar margin', async () => {
      const margin = 11;
      const viewportSize = 390;

      await render(
        <ScrollArea.Root style={{ width: viewportSize, height: viewportSize }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: SCROLLABLE_CONTENT_SIZE, height: SCROLLABLE_CONTENT_SIZE }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            data-testid="vertical-scrollbar"
            style={{ marginInline: margin }}
          >
            <ScrollArea.Thumb data-testid="vertical-thumb" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar
            orientation="horizontal"
            data-testid="horizontal-scrollbar"
            style={{ marginBlock: margin }}
          >
            <ScrollArea.Thumb data-testid="horizontal-thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>,
      );

      const verticalThumb = screen.getByTestId('vertical-thumb');
      const horizontalThumb = screen.getByTestId('horizontal-thumb');

      expect(
        getComputedStyle(verticalThumb).getPropertyValue('--scroll-area-thumb-height'),
      ).to.equal(`${viewportSize * (viewportSize / SCROLLABLE_CONTENT_SIZE)}px`);
      expect(
        getComputedStyle(horizontalThumb).getPropertyValue('--scroll-area-thumb-width'),
      ).to.equal(`${viewportSize * (viewportSize / SCROLLABLE_CONTENT_SIZE)}px`);
    });

    it('accounts for thumb margin', async () => {
      const MARGIN = 8;

      await render(
        <ScrollArea.Root style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: SCROLLABLE_CONTENT_SIZE, height: SCROLLABLE_CONTENT_SIZE }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical-scrollbar">
            <ScrollArea.Thumb data-testid="vertical-thumb" style={{ marginBlock: MARGIN }} />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal" data-testid="horizontal-scrollbar">
            <ScrollArea.Thumb data-testid="horizontal-thumb" style={{ marginInline: MARGIN }} />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>,
      );

      const verticalThumb = screen.getByTestId('vertical-thumb');
      const horizontalThumb = screen.getByTestId('horizontal-thumb');

      expect(
        getComputedStyle(verticalThumb).getPropertyValue('--scroll-area-thumb-height'),
      ).to.equal(`${(VIEWPORT_SIZE - MARGIN * 2) * (VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE)}px`);
      expect(
        getComputedStyle(horizontalThumb).getPropertyValue('--scroll-area-thumb-width'),
      ).to.equal(`${(VIEWPORT_SIZE - MARGIN * 2) * (VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE)}px`);
    });
  });

  describe.skipIf(isJSDOM)('overflow data attributes', () => {
    it('applies data attributes on root, viewport and scrollbars based on overflow and edges', async () => {
      await render(
        <ScrollArea.Root data-testid="root" style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}>
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

      const root = screen.getByTestId('root');
      const viewport = screen.getByTestId('viewport');
      const vScrollbar = screen.getByTestId('scrollbar-vertical');
      const hScrollbar = screen.getByTestId('scrollbar-horizontal');

      // Initial: at start (top/left)
      expect(root).to.have.attribute('data-has-overflow-x');
      expect(root).to.have.attribute('data-has-overflow-y');
      expect(root).not.to.have.attribute('data-overflow-x-start');
      expect(root).to.have.attribute('data-overflow-x-end');
      expect(root).not.to.have.attribute('data-overflow-y-start');
      expect(root).to.have.attribute('data-overflow-y-end');

      expect(viewport).to.have.attribute('data-has-overflow-x');
      expect(viewport).to.have.attribute('data-has-overflow-y');
      expect(viewport).not.to.have.attribute('data-overflow-x-start');
      expect(viewport).to.have.attribute('data-overflow-x-end');
      expect(viewport).not.to.have.attribute('data-overflow-y-start');
      expect(viewport).to.have.attribute('data-overflow-y-end');

      expect(vScrollbar).to.have.attribute('data-has-overflow-y');
      expect(vScrollbar).not.to.have.attribute('data-overflow-y-start');
      expect(vScrollbar).to.have.attribute('data-overflow-y-end');
      expect(hScrollbar).to.have.attribute('data-has-overflow-x');
      expect(hScrollbar).not.to.have.attribute('data-overflow-x-start');
      expect(hScrollbar).to.have.attribute('data-overflow-x-end');

      // Scroll to middle
      const halfY = (viewport.scrollHeight - viewport.clientHeight) / 2;
      const halfX = (viewport.scrollWidth - viewport.clientWidth) / 2;
      fireEvent.scroll(viewport, {
        target: { scrollTop: halfY, scrollLeft: halfX },
      });
      await flushMicrotasks();

      expect(root).to.have.attribute('data-overflow-y-start');
      expect(root).to.have.attribute('data-overflow-y-end');
      expect(root).to.have.attribute('data-overflow-x-start');
      expect(root).to.have.attribute('data-overflow-x-end');

      expect(viewport).to.have.attribute('data-overflow-y-start');
      expect(viewport).to.have.attribute('data-overflow-y-end');
      expect(viewport).to.have.attribute('data-overflow-x-start');
      expect(viewport).to.have.attribute('data-overflow-x-end');

      expect(vScrollbar).to.have.attribute('data-overflow-y-start');
      expect(vScrollbar).to.have.attribute('data-overflow-y-end');
      expect(hScrollbar).to.have.attribute('data-overflow-x-start');
      expect(hScrollbar).to.have.attribute('data-overflow-x-end');

      // Scroll to end (bottom-right)
      fireEvent.scroll(viewport, {
        target: {
          scrollTop: viewport.scrollHeight - viewport.clientHeight,
          scrollLeft: viewport.scrollWidth - viewport.clientWidth,
        },
      });
      await flushMicrotasks();

      expect(root).to.have.attribute('data-overflow-y-start');
      expect(root).not.to.have.attribute('data-overflow-y-end');
      expect(root).to.have.attribute('data-overflow-x-start');
      expect(root).not.to.have.attribute('data-overflow-x-end');

      expect(viewport).to.have.attribute('data-overflow-y-start');
      expect(viewport).not.to.have.attribute('data-overflow-y-end');
      expect(viewport).to.have.attribute('data-overflow-x-start');
      expect(viewport).not.to.have.attribute('data-overflow-x-end');

      expect(vScrollbar).to.have.attribute('data-overflow-y-start');
      expect(vScrollbar).not.to.have.attribute('data-overflow-y-end');
      expect(hScrollbar).to.have.attribute('data-overflow-x-start');
      expect(hScrollbar).not.to.have.attribute('data-overflow-x-end');
    });

    it('rtl', async () => {
      await render(
        <DirectionProvider direction="rtl">
          <ScrollArea.Root
            data-testid="root"
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE, direction: 'rtl' }}
          >
            <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
              <div style={{ width: SCROLLABLE_CONTENT_SIZE, height: 200 }} />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation="horizontal" data-testid="scrollbar-horizontal">
              <ScrollArea.Thumb />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </DirectionProvider>,
      );

      const root = screen.getByTestId('root');
      const viewport = screen.getByTestId('viewport');

      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
      fireEvent.scroll(viewport, {
        target: {
          scrollLeft: 0,
        },
      });
      await flushMicrotasks();

      expect(root).to.have.attribute('data-has-overflow-x');
      expect(root).not.to.have.attribute('data-overflow-x-start');
      expect(root).to.have.attribute('data-overflow-x-end');

      fireEvent.scroll(viewport, {
        target: {
          scrollLeft: -maxScrollLeft / 2,
        },
      });
      await flushMicrotasks();

      expect(root).to.have.attribute('data-overflow-x-start');
      expect(root).to.have.attribute('data-overflow-x-end');

      fireEvent.scroll(viewport, {
        target: {
          scrollLeft: -maxScrollLeft,
        },
      });
      await flushMicrotasks();

      expect(root).to.have.attribute('data-overflow-x-start');
      expect(root).not.to.have.attribute('data-overflow-x-end');
    });
  });
});
