import * as React from 'react';
import { expect } from 'chai';
import { Toolbar } from '@base-ui-components/react/toolbar';
import {
  DirectionProvider,
  type TextDirection,
} from '@base-ui-components/react/direction-provider';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Toolbar.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Toolbar.Root />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('ARIA attributes', () => {
    it('has role="toolbar"', async () => {
      const { container } = await render(<Toolbar.Root />);

      expect(container.firstElementChild as HTMLElement).to.have.attribute('role', 'toolbar');
    });
  });

  describe.skipIf(isJSDOM)('keyboard navigation', () => {
    [
      ['ltr', 'horizontal', 'ArrowRight', 'ArrowLeft'],
      ['ltr', 'vertical', 'ArrowDown', 'ArrowUp'],
      ['rtl', 'horizontal', 'ArrowLeft', 'ArrowRight'],
      ['rtl', 'vertical', 'ArrowDown', 'ArrowUp'],
    ].forEach((entry) => {
      const [direction, orientation, nextKey, prevKey] = entry;

      function expectFocused(element) {
        expect(element).to.have.attribute('data-highlighted');
        expect(element).to.have.attribute('tabindex', '0');
        expect(element).toHaveFocus();
      }

      describe(direction, () => {
        it(`orientation: ${orientation}`, async () => {
          const { getAllByRole, getByRole, getByText, user } = await render(
            <DirectionProvider direction={direction as TextDirection}>
              <Toolbar.Root dir={direction} orientation={orientation}>
                <Toolbar.Button />
                <Toolbar.Link href="https://base-ui.com">Link</Toolbar.Link>
                <Toolbar.Group>
                  <Toolbar.Button />
                  <Toolbar.Button />
                </Toolbar.Group>
                <Toolbar.Input defaultValue="" />
              </Toolbar.Root>
            </DirectionProvider>,
          );
          const [button1, groupedButton1, groupedButton2] = getAllByRole('button');
          const link = getByText('Link');
          const input = getByRole('textbox');

          await user.keyboard('[Tab]');
          expectFocused(button1);

          await user.keyboard(`[${nextKey}]`);
          expectFocused(link);

          await user.keyboard(`[${nextKey}]`);
          expectFocused(groupedButton1);

          await user.keyboard(`[${nextKey}]`);
          expectFocused(groupedButton2);

          await user.keyboard(`[${nextKey}]`);
          expectFocused(input);

          // loop to the beginning
          await user.keyboard(`[${nextKey}]`);
          expectFocused(button1);

          await user.keyboard(`[${prevKey}]`);
          expectFocused(input);

          await user.keyboard(`[${prevKey}]`);
          expectFocused(groupedButton2);
        });
      });
    });
  });
});
