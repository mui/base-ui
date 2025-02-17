import * as React from 'react';
import { expect } from 'chai';
import { Toolbar, type Orientation } from '@base-ui-components/react/toolbar';
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

      function expectFocused(element: Element) {
        expect(element).to.have.attribute('data-highlighted');
        expect(element).to.have.attribute('tabindex', '0');
        expect(element).toHaveFocus();
      }

      describe(direction, () => {
        it(`orientation: ${orientation}`, async () => {
          const { getAllByRole, getByRole, getByText, user } = await render(
            <DirectionProvider direction={direction as TextDirection}>
              <Toolbar.Root dir={direction} orientation={orientation as Orientation}>
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

  describe('prop: disabled', () => {
    it('disables all toolbar items except links', async () => {
      const { getAllByRole, getByRole, getAllByText } = await render(
        <Toolbar.Root disabled>
          <Toolbar.Button />
          <Toolbar.Link href="https://base-ui.com">Link</Toolbar.Link>
          <Toolbar.Input defaultValue="" />
          <Toolbar.Group>
            <Toolbar.Button />
            <Toolbar.Link href="https://base-ui.com">Link</Toolbar.Link>
            <Toolbar.Input defaultValue="" />
          </Toolbar.Group>
        </Toolbar.Root>,
      );

      [...getAllByRole('button'), ...getAllByRole('textbox')].forEach((toolbarItem) => {
        expect(toolbarItem).to.have.attribute('aria-disabled', 'true');
        expect(toolbarItem).to.have.attribute('data-disabled');
      });

      expect(getByRole('group')).to.have.attribute('data-disabled');

      getAllByText('Link').forEach((link) => {
        expect(link).to.not.have.attribute('data-disabled');
        expect(link).to.not.have.attribute('aria-disabled');
      });
    });
  });

  describe.skipIf(isJSDOM)('prop: focusableWhenDisabled', () => {
    function expectFocusedWhenDisabled(element: Element) {
      expect(element).to.have.attribute('data-disabled');
      expect(element).to.have.attribute('aria-disabled', 'true');
      expect(element).to.have.attribute('data-highlighted');
      expect(element).to.have.attribute('tabindex', '0');
    }

    it('toolbar items can be focused when disabled by default', async () => {
      const { getAllByRole, getByRole, user } = await render(
        <Toolbar.Root>
          <Toolbar.Button />
          <Toolbar.Group>
            <Toolbar.Button disabled />
            <Toolbar.Button disabled />
          </Toolbar.Group>
          <Toolbar.Input defaultValue="" disabled />
        </Toolbar.Root>,
      );

      const [button1, groupedButton1, groupedButton2] = getAllByRole('button');
      const input = getByRole('textbox');

      await user.keyboard('[Tab]');
      expect(button1).to.have.attribute('data-highlighted');
      expect(button1).to.have.attribute('tabindex', '0');

      await user.keyboard('[ArrowRight]');
      expectFocusedWhenDisabled(groupedButton1);

      await user.keyboard('[ArrowRight]');
      expectFocusedWhenDisabled(groupedButton2);

      await user.keyboard('[ArrowRight]');
      expectFocusedWhenDisabled(input);

      // loop to the beginning
      await user.keyboard('[ArrowRight]');
      expect(button1).to.have.attribute('data-highlighted');

      await user.keyboard('[ArrowLeft]');
      expectFocusedWhenDisabled(input);

      await user.keyboard('[ArrowLeft]');
      expectFocusedWhenDisabled(groupedButton2);
    });

    it('toolbar items can individually disable focusableWhenDisabled', async () => {
      const { getAllByRole, getByRole, user } = await render(
        <Toolbar.Root>
          <Toolbar.Button />
          <Toolbar.Group>
            <Toolbar.Button disabled />
            <Toolbar.Button disabled focusableWhenDisabled={false} />
          </Toolbar.Group>
          <Toolbar.Input defaultValue="" disabled />
        </Toolbar.Root>,
      );

      const [button1, groupedButton1] = getAllByRole('button');
      const input = getByRole('textbox');

      await user.keyboard('[Tab]');
      expect(button1).to.have.attribute('data-highlighted');
      expect(button1).to.have.attribute('tabindex', '0');

      await user.keyboard('[ArrowRight]');
      expectFocusedWhenDisabled(groupedButton1);

      await user.keyboard('[ArrowRight]');
      expectFocusedWhenDisabled(input);

      // loop to the beginning
      await user.keyboard('[ArrowRight]');
      expect(button1).to.have.attribute('data-highlighted');

      await user.keyboard('[ArrowLeft]');
      expectFocusedWhenDisabled(input);

      await user.keyboard('[ArrowLeft]');
      expectFocusedWhenDisabled(groupedButton1);
    });
  });
});
