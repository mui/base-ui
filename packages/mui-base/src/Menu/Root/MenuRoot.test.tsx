import * as React from 'react';
import { expect } from 'chai';
import {
  act,
  createRenderer,
  flushMicrotasks,
  MuiRenderResult,
  RenderOptions,
  fireEvent,
} from '@mui/internal-test-utils';
import * as Menu from '@base_ui/react/Menu';

describe('<Menu.Root />', () => {
  const { render: internalRender } = createRenderer();

  async function render(
    element: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    options?: RenderOptions,
  ): Promise<MuiRenderResult> {
    const rendered = internalRender(element, options);
    await flushMicrotasks();
    return rendered;
  }

  describe('after initialization', () => {
    function Test() {
      return (
        <Menu.Root>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Popup>
            <Menu.Item>1</Menu.Item>
            <Menu.Item>2</Menu.Item>
            <Menu.Item>3</Menu.Item>
          </Menu.Popup>
        </Menu.Root>
      );
    }

    it('highlights the first item when the menu is opened', async () => {
      const { getAllByRole } = await render(<Test />);
      const [firstItem, ...otherItems] = getAllByRole('menuitem');

      expect(firstItem.tabIndex).to.equal(0);
      otherItems.forEach((item) => {
        expect(item.tabIndex).to.equal(-1);
      });
    });

    it('highlights first item when down arrow key opens the menu', async () => {
      const { getByRole, getAllByRole } = await render(<Test />);

      const trigger = getByRole('button');
      const [firstItem, ...otherItems] = getAllByRole('menuitem');

      act(() => {
        trigger.focus();
      });

      fireEvent.keyDown(trigger, { key: 'ArrowDown' });

      expect(firstItem.tabIndex).to.equal(0);
      otherItems.forEach((item) => {
        expect(item.tabIndex).to.equal(-1);
      });
    });

    it('highlights last item when up arrow key opens the menu', async () => {
      const { getByRole, getAllByRole } = await render(<Test />);

      const trigger = getByRole('button');
      const [firstItem, secondItem, lastItem] = getAllByRole('menuitem');

      act(() => {
        trigger.focus();
      });

      fireEvent.keyDown(trigger, { key: 'ArrowUp' });

      expect(lastItem.tabIndex).to.equal(0);
      [firstItem, secondItem].forEach((item) => {
        expect(item.tabIndex).to.equal(-1);
      });
    });
  });

  describe('keyboard navigation', () => {
    it('changes the highlighted item using the arrow keys', async () => {
      const { getByTestId } = await render(
        <Menu.Root open>
          <Menu.Popup>
            <Menu.Item data-testid="item-1">1</Menu.Item>
            <Menu.Item data-testid="item-2">2</Menu.Item>
            <Menu.Item data-testid="item-3">3</Menu.Item>
          </Menu.Popup>
        </Menu.Root>,
      );

      const item1 = getByTestId('item-1');
      const item2 = getByTestId('item-2');
      const item3 = getByTestId('item-3');

      act(() => {
        item1.focus();
      });

      fireEvent.keyDown(item1, { key: 'ArrowDown' });
      expect(document.activeElement).to.equal(item2);

      fireEvent.keyDown(item2, { key: 'ArrowDown' });
      expect(document.activeElement).to.equal(item3);

      fireEvent.keyDown(item3, { key: 'ArrowUp' });
      expect(document.activeElement).to.equal(item2);
    });

    it('changes the highlighted item using the Home and End keys', async () => {
      const { getByTestId } = await render(
        <Menu.Root open>
          <Menu.Popup>
            <Menu.Item data-testid="item-1">1</Menu.Item>
            <Menu.Item data-testid="item-2">2</Menu.Item>
            <Menu.Item data-testid="item-3">3</Menu.Item>
          </Menu.Popup>
        </Menu.Root>,
      );

      const item1 = getByTestId('item-1');
      const item3 = getByTestId('item-3');

      act(() => {
        item1.focus();
      });

      fireEvent.keyDown(item1, { key: 'End' });
      expect(document.activeElement).to.equal(getByTestId('item-3'));

      fireEvent.keyDown(item3, { key: 'Home' });
      expect(document.activeElement).to.equal(getByTestId('item-1'));
    });

    it('includes disabled items during keyboard navigation', async () => {
      const { getByTestId } = await render(
        <Menu.Root open>
          <Menu.Popup>
            <Menu.Item data-testid="item-1">1</Menu.Item>
            <Menu.Item disabled data-testid="item-2">
              2
            </Menu.Item>
          </Menu.Popup>
        </Menu.Root>,
      );

      const item1 = getByTestId('item-1');
      const item2 = getByTestId('item-2');

      act(() => {
        item1.focus();
      });

      fireEvent.keyDown(item1, { key: 'ArrowDown' });
      expect(document.activeElement).to.equal(item2);

      expect(item2).to.have.attribute('aria-disabled', 'true');
    });

    describe('text navigation', () => {
      it('changes the highlighted item', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <Menu.Root open>
            <Menu.Popup>
              <Menu.Item>Aa</Menu.Item>
              <Menu.Item>Ba</Menu.Item>
              <Menu.Item>Bb</Menu.Item>
              <Menu.Item>Ca</Menu.Item>
              <Menu.Item>Cb</Menu.Item>
              <Menu.Item>Cd</Menu.Item>
            </Menu.Popup>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        act(() => {
          items[0].focus();
        });

        fireEvent.keyDown(items[0], { key: 'c' });
        expect(document.activeElement).to.equal(getByText('Ca'));
        expect(getByText('Ca')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[3], { key: 'd' });
        expect(document.activeElement).to.equal(getByText('Cd'));
        expect(getByText('Cd')).to.have.attribute('tabindex', '0');
      });

      it('repeated keys circulate all items starting with that letter', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <Menu.Root>
            <Menu.Popup>
              <Menu.Item>Aa</Menu.Item>
              <Menu.Item>Ba</Menu.Item>
              <Menu.Item>Bb</Menu.Item>
              <Menu.Item>Ca</Menu.Item>
            </Menu.Popup>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        act(() => {
          items[0].focus();
        });

        fireEvent.keyDown(items[0], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Ba'));
        expect(getByText('Ba')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[1], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Bb'));
        expect(getByText('Bb')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[2], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Ba'));
        expect(getByText('Ba')).to.have.attribute('tabindex', '0');
      });

      it('changes the highlighted item using text navigation on label prop', async () => {
        const { getAllByRole } = await render(
          <Menu.Root open>
            <Menu.Popup>
              <Menu.Item label="Aa">1</Menu.Item>
              <Menu.Item label="Ba">2</Menu.Item>
              <Menu.Item label="Bb">3</Menu.Item>
              <Menu.Item label="Ca">4</Menu.Item>
            </Menu.Popup>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        act(() => {
          items[0].focus();
        });

        fireEvent.keyDown(items[0], { key: 'b' });
        expect(items[1]).toHaveFocus();
        expect(items[1]).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[1], { key: 'b' });
        expect(items[2]).toHaveFocus();
        expect(items[2]).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[2], { key: 'b' });
        expect(items[1]).toHaveFocus();
        expect(items[1]).to.have.attribute('tabindex', '0');
      });

      it('skips the non-stringifiable items', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <Menu.Root open>
            <Menu.Popup>
              <Menu.Item>Aa</Menu.Item>
              <Menu.Item>Ba</Menu.Item>
              <Menu.Item />
              <Menu.Item>
                <div>Nested Content</div>
              </Menu.Item>
              <Menu.Item>{undefined}</Menu.Item>
              <Menu.Item>{null}</Menu.Item>
              <Menu.Item>Bc</Menu.Item>
            </Menu.Popup>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        act(() => {
          items[0].focus();
        });

        fireEvent.keyDown(items[0], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Ba'));
        expect(getByText('Ba')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[1], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Bc'));
        expect(getByText('Bc')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[6], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Ba'));
        expect(getByText('Ba')).to.have.attribute('tabindex', '0');
      });

      it('navigate to options with diacritic characters', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <Menu.Root open>
            <Menu.Popup>
              <Menu.Item>Aa</Menu.Item>
              <Menu.Item>Ba</Menu.Item>
              <Menu.Item>Bb</Menu.Item>
              <Menu.Item>Bą</Menu.Item>
            </Menu.Popup>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        act(() => {
          items[0].focus();
        });

        fireEvent.keyDown(items[0], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Ba'));
        expect(getByText('Ba')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[1], { key: 'Control' });
        fireEvent.keyDown(items[1], { key: 'Alt' });
        fireEvent.keyDown(items[1], { key: 'ą' });
        expect(document.activeElement).to.equal(getByText('Bą'));
        expect(getByText('Bą')).to.have.attribute('tabindex', '0');
      });

      it('navigate to next options with beginning diacritic characters', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <Menu.Root open>
            <Menu.Popup>
              <Menu.Item>Aa</Menu.Item>
              <Menu.Item>ąa</Menu.Item>
              <Menu.Item>ąb</Menu.Item>
              <Menu.Item>ąc</Menu.Item>
            </Menu.Popup>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        act(() => {
          items[0].focus();
        });

        fireEvent.keyDown(items[0], { key: 'Control' });
        fireEvent.keyDown(items[0], { key: 'Alt' });
        fireEvent.keyDown(items[0], { key: 'ą' });
        expect(document.activeElement).to.equal(getByText('ąa'));
        expect(getByText('ąa')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[1], { key: 'Alt' });
        fireEvent.keyDown(items[1], { key: 'Control' });
        fireEvent.keyDown(items[1], { key: 'ą' });
        expect(document.activeElement).to.equal(getByText('ąb'));
        expect(getByText('ąb')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[2], { key: 'Control' });
        fireEvent.keyDown(items[2], { key: 'AltGraph' });
        fireEvent.keyDown(items[2], { key: 'ą' });
        expect(document.activeElement).to.equal(getByText('ąc'));
        expect(getByText('ąc')).to.have.attribute('tabindex', '0');
      });
    });
  });

  it('focuses the first item after the menu is opened', async () => {
    const { getByRole, getAllByRole } = await render(
      <div>
        <Menu.Root>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Popup>
            <Menu.Item>One</Menu.Item>
            <Menu.Item>Two</Menu.Item>
            <Menu.Item>Three</Menu.Item>
          </Menu.Popup>
        </Menu.Root>
      </div>,
    );

    const button = getByRole('button');
    act(() => {
      button.click();
    });

    const menuItems = getAllByRole('menuitem');

    await flushMicrotasks();

    expect(menuItems[0]).toHaveFocus();
  });

  it('focuses the trigger after the menu is closed', async () => {
    const { getByRole } = await render(
      <div>
        <input type="text" />
        <Menu.Root>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Popup>
            <Menu.Item>Close</Menu.Item>
          </Menu.Popup>
        </Menu.Root>
        <input type="text" />
      </div>,
    );

    const button = getByRole('button');
    act(() => {
      button.click();
    });

    const menuItem = getByRole('menuitem');

    await flushMicrotasks();

    act(() => {
      menuItem.click();
    });

    expect(button).toHaveFocus();
  });
});
