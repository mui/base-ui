import * as React from 'react';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { expect } from 'chai';
import { describeConformance } from '../../../test/describeConformance';

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

  describe.skipIf(isJSDOM)('interactions', () => {
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

    describe('prop: gutter', () => {
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

      expect(
        getComputedStyle(verticalThumb).getPropertyValue('--scroll-area-thumb-height'),
      ).to.equal(`${(VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE) * VIEWPORT_SIZE - PADDING * 2}px`);

      const horizontalThumb = screen.getByTestId('horizontal-thumb');

      expect(
        getComputedStyle(horizontalThumb).getPropertyValue('--scroll-area-thumb-width'),
      ).to.equal(`${(VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE) * VIEWPORT_SIZE - PADDING * 2}px`);
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

      expect(
        getComputedStyle(verticalThumb).getPropertyValue('--scroll-area-thumb-height'),
      ).to.equal(`${(VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE) * VIEWPORT_SIZE - MARGIN * 2}px`);

      const horizontalThumb = screen.getByTestId('horizontal-thumb');

      expect(
        getComputedStyle(horizontalThumb).getPropertyValue('--scroll-area-thumb-width'),
      ).to.equal(`${(VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE) * VIEWPORT_SIZE - MARGIN * 2}px`);
    });
  });
});
