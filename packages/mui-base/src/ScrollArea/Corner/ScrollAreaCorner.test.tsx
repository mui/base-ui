import * as React from 'react';
import * as ScrollArea from '@base_ui/react/ScrollArea';
import { expect } from 'chai';
import { createRenderer } from '#test-utils';
import { describeConformance } from '../../../test/describeConformance';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

describe('<ScrollArea.Corner />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Corner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<ScrollArea.Root>{node}</ScrollArea.Root>);
    },
  }));

  it('should apply correct corner size when both scrollbars are present', async function test() {
    if (isJSDOM) {
      this.skip();
    }

    const { getByTestId } = await render(
      <ScrollArea.Root>
        <ScrollArea.Viewport data-testid="viewport" />
        <ScrollArea.Scrollbar orientation="vertical" style={{ width: 10 }} />
        <ScrollArea.Scrollbar orientation="horizontal" style={{ height: 10 }} />
        <ScrollArea.Corner data-testid="corner" />
      </ScrollArea.Root>,
    );

    const corner = getByTestId('corner');
    const style = window.getComputedStyle(corner);

    expect(style.getPropertyValue('--scroll-area-corner-width')).to.equal('10px');
    expect(style.getPropertyValue('--scroll-area-corner-height')).to.equal('10px');
  });
});
