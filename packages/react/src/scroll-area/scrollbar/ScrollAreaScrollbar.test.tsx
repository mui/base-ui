import * as React from 'react';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { screen, fireEvent } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { expect } from 'chai';
import { describeConformance } from '../../../test/describeConformance';
import { SCROLL_TIMEOUT } from '../constants';

describe('<ScrollArea.Scrollbar />', () => {
  const { render, clock } = createRenderer();

  clock.withFakeTimers();

  describeConformance(<ScrollArea.Scrollbar keepMounted />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<ScrollArea.Root>{node}</ScrollArea.Root>);
    },
  }));

  it('adds [data-scrolling] attribute when viewport is scrolled in the correct direction', async () => {
    await render(
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

    expect(verticalScrollbar).not.to.have.attribute('data-scrolling');
    expect(horizontalScrollbar).not.to.have.attribute('data-scrolling');

    fireEvent.pointerEnter(viewport);
    fireEvent.scroll(viewport, {
      target: {
        scrollTop: 1,
      },
    });

    expect(verticalScrollbar).to.have.attribute('data-scrolling', '');
    expect(horizontalScrollbar).not.to.have.attribute('data-scrolling', '');

    clock.tick(SCROLL_TIMEOUT - 1);

    expect(verticalScrollbar).to.have.attribute('data-scrolling', '');
    expect(horizontalScrollbar).not.to.have.attribute('data-scrolling', '');

    fireEvent.pointerEnter(viewport);
    fireEvent.scroll(viewport, {
      target: {
        scrollLeft: 1,
      },
    });

    clock.tick(1); // vertical just finished

    expect(verticalScrollbar).not.to.have.attribute('data-scrolling');
    expect(horizontalScrollbar).to.have.attribute('data-scrolling');

    clock.tick(SCROLL_TIMEOUT - 2); // already ticked 1ms above

    expect(verticalScrollbar).not.to.have.attribute('data-scrolling');
    expect(horizontalScrollbar).to.have.attribute('data-scrolling');

    clock.tick(1);

    expect(verticalScrollbar).not.to.have.attribute('data-scrolling');
    expect(horizontalScrollbar).not.to.have.attribute('data-scrolling');
  });
});
