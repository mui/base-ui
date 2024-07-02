import * as React from 'react';
import { expect } from 'chai';
import {
  act,
  flushMicrotasks,
  MuiRenderResult,
  RenderOptions,
  fireEvent,
  createRenderer,
} from '@mui/internal-test-utils';
import * as Menu from '@base_ui/react/Menu';
import userEvent from '@testing-library/user-event';

async function waitForPosition() {
  return act(async () => {});
}

describe('<Menu.Root />', () => {
  const { render: internalRender, clock } = createRenderer({ clock: 'fake' });

  async function render(
    element: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    options?: RenderOptions,
  ): Promise<MuiRenderResult> {
    const rendered = internalRender(element, options);
    await act(async () => {});
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
      expect(item2).toHaveFocus();

      fireEvent.keyDown(item2, { key: 'ArrowDown' });
      expect(item3).toHaveFocus();

      fireEvent.keyDown(item3, { key: 'ArrowUp' });
      expect(item2).toHaveFocus();
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
      expect(item3).toHaveFocus();

      fireEvent.keyDown(item3, { key: 'Home' });
      expect(item1).toHaveFocus();
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
      expect(item2).toHaveFocus();
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

  describe('nested menus', () => {
    clock.withFakeTimers();
    const user = userEvent.setup({
      advanceTimers: (delay) => {
        clock.tick(delay);
      },
    });

    (
      [
        ['vertical', 'ltr', 'ArrowRight', 'ArrowLeft'],
        ['vertical', 'rtl', 'ArrowLeft', 'ArrowRight'],
        ['horizontal', 'ltr', 'ArrowDown', 'ArrowUp'],
        ['horizontal', 'rtl', 'ArrowDown', 'ArrowUp'],
      ] as const
    ).forEach(([orientation, direction, openKey, closeKey]) => {
      it(`opens a nested menu of a ${orientation} ${direction.toUpperCase()} menu when the trigger is focused and the ${openKey} key is pressed`, async () => {
        const { getByTestId, queryByTestId } = await render(
          <Menu.Root open orientation={orientation} dir={direction}>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>1</Menu.Item>
                <Menu.Root>
                  <Menu.SubmenuTrigger data-testid="submenu-trigger">2</Menu.SubmenuTrigger>
                  <Menu.Positioner>
                    <Menu.Popup data-testid="submenu">
                      <Menu.Item data-testid="submenu-item-1">2.1</Menu.Item>
                      <Menu.Item>2.2</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Root>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Root>,
        );

        const submenuTrigger = getByTestId('submenu-trigger');

        await act(() => {
          submenuTrigger.focus();
        });

        await user.keyboard(`[${openKey}]`);

        const submenu = queryByTestId('submenu');
        expect(submenu).not.to.equal(null);

        const submenuItem1 = queryByTestId('submenu-item-1');
        expect(submenuItem1).not.to.equal(null);
        expect(submenuItem1).toHaveFocus();
      });

      it(`closes a ${orientation} ${direction.toUpperCase()} nested menu when the trigger is focused and the ${closeKey} key is pressed`, async () => {
        const { getByTestId } = await render(
          <Menu.Root open>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>1</Menu.Item>
                <Menu.Root defaultOpen orientation={orientation} dir={direction}>
                  <Menu.SubmenuTrigger data-testid="submenu-trigger">2</Menu.SubmenuTrigger>
                  <Menu.Positioner>
                    <Menu.Popup data-testid="submenu">
                      <Menu.Item data-testid="submenu-item-1">2.1</Menu.Item>
                      <Menu.Item>2.2</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Root>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Root>,
        );

        const submenuTrigger = getByTestId('submenu-trigger');
        const submenu = getByTestId('submenu');
        const submenuItem1 = getByTestId('submenu-item-1');

        await act(() => {
          submenuItem1.focus();
        });

        await user.keyboard(`[${closeKey}]`);

        expect(submenuTrigger).toHaveFocus();
        expect(submenu).toBeInaccessible();
      });
    });

    it('closes the whole tree when the Escape key is pressed on a nested menu', async () => {
      const { getByTestId, queryAllByRole } = await render(
        <Menu.Root defaultOpen>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>1</Menu.Item>
              <Menu.Root defaultOpen>
                <Menu.SubmenuTrigger>2</Menu.SubmenuTrigger>
                <Menu.Positioner>
                  <Menu.Popup data-testid="submenu">
                    <Menu.Item>2.1</Menu.Item>
                    <Menu.Root defaultOpen>
                      <Menu.SubmenuTrigger>2.2</Menu.SubmenuTrigger>
                      <Menu.Positioner>
                        <Menu.Popup data-testid="submenu">
                          <Menu.Item data-testid="submenu-item-221">2.2.1</Menu.Item>
                          <Menu.Item>2.2.2</Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Root>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Root>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const deeplyNestedItem = getByTestId('submenu-item-221');

      await act(() => {
        deeplyNestedItem.focus();
      });

      expect(deeplyNestedItem).toHaveFocus();

      await user.keyboard('[Escape]');

      const allMenus = queryAllByRole('menu', { hidden: false });
      expect(allMenus).to.have.length(0);
    });

    it('opens a nested menu on mouse hover', async () => {
      const { getByTestId, queryByTestId } = await render(
        <Menu.Root defaultOpen>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>1</Menu.Item>
              <Menu.Root>
                <Menu.SubmenuTrigger data-testid="submenu-trigger">2</Menu.SubmenuTrigger>
                <Menu.Positioner>
                  <Menu.Popup data-testid="submenu">
                    <Menu.Item>2.1</Menu.Item>
                    <Menu.Item>2.2</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Root>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const submenuTrigger = getByTestId('submenu-trigger');
      const submenu = queryByTestId('submenu');

      user.hover(submenuTrigger);

      clock.tick(200);

      await waitForPosition();

      expect(submenu).not.to.equal(null);
      expect(submenu).not.toBeInaccessible();
    });
  });

  describe('focus management', () => {
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
});
