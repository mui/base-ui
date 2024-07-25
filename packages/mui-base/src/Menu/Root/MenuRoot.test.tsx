import * as React from 'react';
import { expect } from 'chai';
import { act, waitFor } from '@mui/internal-test-utils';
import * as Menu from '@base_ui/react/Menu';
import userEvent from '@testing-library/user-event';
import { createRenderer } from '../../../test';

describe('<Menu.Root />', () => {
  const { render } = createRenderer();
  const user = userEvent.setup();

  describe('keyboard navigation', () => {
    it('changes the highlighted item using the arrow keys', async () => {
      const { getByRole, getByTestId } = await render(
        <Menu.Root animated={false}>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item data-testid="item-1">1</Menu.Item>
              <Menu.Item data-testid="item-2">2</Menu.Item>
              <Menu.Item data-testid="item-3">3</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Toggle' });
      await act(() => {
        trigger.focus();
      });

      await userEvent.keyboard('[Enter]');

      const item1 = getByTestId('item-1');
      const item2 = getByTestId('item-2');
      const item3 = getByTestId('item-3');

      await waitFor(() => {
        expect(item1).toHaveFocus();
      });

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(item2).toHaveFocus();
      });

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(item3).toHaveFocus();
      });

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => {
        expect(item2).toHaveFocus();
      });
    });

    it('changes the highlighted item using the Home and End keys', async () => {
      const { getByRole, getByTestId } = await render(
        <Menu.Root animated={false}>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item data-testid="item-1">1</Menu.Item>
              <Menu.Item data-testid="item-2">2</Menu.Item>
              <Menu.Item data-testid="item-3">3</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Toggle' });
      await act(() => {
        trigger.focus();
      });

      await userEvent.keyboard('[Enter]');
      const item1 = getByTestId('item-1');
      const item3 = getByTestId('item-3');

      await waitFor(() => {
        expect(item1).toHaveFocus();
      });

      await userEvent.keyboard('{End}');
      await waitFor(() => {
        expect(item3).toHaveFocus();
      });

      await userEvent.keyboard('{Home}');
      await waitFor(() => {
        expect(item1).toHaveFocus();
      });
    });

    it('includes disabled items during keyboard navigation', async () => {
      const { getByRole, getByTestId } = await render(
        <Menu.Root animated={false}>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item data-testid="item-1">1</Menu.Item>
              <Menu.Item disabled data-testid="item-2">
                2
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Toggle' });
      await act(() => {
        trigger.focus();
      });

      await userEvent.keyboard('[Enter]');

      const item1 = getByTestId('item-1');
      const item2 = getByTestId('item-2');

      await waitFor(() => {
        expect(item1).toHaveFocus();
      });

      await userEvent.keyboard('[ArrowDown]');

      await waitFor(() => {
        expect(item2).toHaveFocus();
        expect(item2).to.have.attribute('aria-disabled', 'true');
      });
    });

    describe('text navigation', () => {
      it('changes the highlighted item', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <Menu.Root open animated={false}>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>Aa</Menu.Item>
                <Menu.Item>Ba</Menu.Item>
                <Menu.Item>Bb</Menu.Item>
                <Menu.Item>Ca</Menu.Item>
                <Menu.Item>Cb</Menu.Item>
                <Menu.Item>Cd</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        await act(() => {
          items[0].focus();
        });

        await user.keyboard('c');
        await waitFor(() => {
          expect(document.activeElement).to.equal(getByText('Ca'));
          expect(getByText('Ca')).to.have.attribute('tabindex', '0');
        });

        await user.keyboard('d');
        await waitFor(() => {
          expect(document.activeElement).to.equal(getByText('Cd'));
          expect(getByText('Cd')).to.have.attribute('tabindex', '0');
        });
      });

      it('changes the highlighted item using text navigation on label prop', async () => {
        const { getByRole, getAllByRole } = await render(
          <Menu.Root animated={false}>
            <Menu.Trigger>Toggle</Menu.Trigger>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item label="Aa">1</Menu.Item>
                <Menu.Item label="Ba">2</Menu.Item>
                <Menu.Item label="Bb">3</Menu.Item>
                <Menu.Item label="Ca">4</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Root>,
        );

        const trigger = getByRole('button', { name: 'Toggle' });
        await user.click(trigger);

        const items = getAllByRole('menuitem');

        await user.keyboard('b');
        await waitFor(() => {
          expect(items[1]).toHaveFocus();
          expect(items[1]).to.have.attribute('tabindex', '0');
        });

        await user.keyboard('b');
        await waitFor(() => {
          expect(items[2]).toHaveFocus();
          expect(items[2]).to.have.attribute('tabindex', '0');
        });

        await user.keyboard('b');
        await waitFor(() => {
          expect(items[2]).toHaveFocus();
          expect(items[2]).to.have.attribute('tabindex', '0');
        });
      });

      it('skips the non-stringifiable items', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <Menu.Root open animated={false}>
            <Menu.Positioner>
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
            </Menu.Positioner>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        await act(() => {
          items[0].focus();
        });

        await user.keyboard('b');
        await waitFor(() => {
          expect(getByText('Ba')).toHaveFocus();
          expect(getByText('Ba')).to.have.attribute('tabindex', '0');
        });

        await user.keyboard('c');
        await waitFor(() => {
          expect(getByText('Bc')).toHaveFocus();
          expect(getByText('Bc')).to.have.attribute('tabindex', '0');
        });
      });

      it('navigate to options with diacritic characters', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <Menu.Root open animated={false}>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>Aa</Menu.Item>
                <Menu.Item>Ba</Menu.Item>
                <Menu.Item>Bb</Menu.Item>
                <Menu.Item>Bą</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        await act(() => {
          items[0].focus();
        });

        await user.keyboard('b');
        await waitFor(() => {
          expect(getByText('Ba')).toHaveFocus();
          expect(getByText('Ba')).to.have.attribute('tabindex', '0');
        });

        await user.keyboard('ą');
        await waitFor(() => {
          expect(getByText('Bą')).toHaveFocus();
          expect(getByText('Bą')).to.have.attribute('tabindex', '0');
        });
      });

      it('navigate to next options beginning with diacritic characters', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <Menu.Root open animated={false}>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>Aa</Menu.Item>
                <Menu.Item>ąa</Menu.Item>
                <Menu.Item>ąb</Menu.Item>
                <Menu.Item>ąc</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        await act(() => {
          items[0].focus();
        });

        await user.keyboard('ą');
        await waitFor(() => {
          expect(getByText('ąa')).toHaveFocus();
          expect(getByText('ąa')).to.have.attribute('tabindex', '0');
        });
      });
    });
  });

  describe('nested menus', () => {
    (
      [
        ['vertical', 'ltr', 'ArrowRight', 'ArrowLeft'],
        ['vertical', 'rtl', 'ArrowLeft', 'ArrowRight'],
        ['horizontal', 'ltr', 'ArrowDown', 'ArrowUp'],
        ['horizontal', 'rtl', 'ArrowDown', 'ArrowUp'],
      ] as const
    ).forEach(([orientation, direction, openKey, closeKey]) => {
      it(`opens a nested menu of a ${orientation} ${direction.toUpperCase()} menu with ${openKey} key and closes it with ${closeKey}`, async () => {
        const { getByTestId, queryByTestId } = await render(
          <Menu.Root open orientation={orientation} dir={direction} animated={false}>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>1</Menu.Item>
                <Menu.Root orientation={orientation} dir={direction} animated={false}>
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

        let submenu = queryByTestId('submenu');
        expect(submenu).not.to.equal(null);

        const submenuItem1 = queryByTestId('submenu-item-1');
        expect(submenuItem1).not.to.equal(null);
        await waitFor(() => {
          expect(submenuItem1).toHaveFocus();
        });

        await user.keyboard(`[${closeKey}]`);

        submenu = queryByTestId('submenu');
        expect(submenu).to.equal(null);

        expect(submenuTrigger).toHaveFocus();
      });
    });
  });

  describe('focus management', () => {
    function Test() {
      return (
        <Menu.Root animated={false}>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>1</Menu.Item>
              <Menu.Item>2</Menu.Item>
              <Menu.Item>3</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>
      );
    }

    it('focuses the first item after the menu is opened by keyboard', async () => {
      const { getAllByRole, getByRole } = await render(<Test />);

      const trigger = getByRole('button', { name: 'Toggle' });
      await act(() => {
        trigger.focus();
      });

      await userEvent.keyboard('[Enter]');

      const [firstItem, ...otherItems] = getAllByRole('menuitem');
      expect(firstItem.tabIndex).to.equal(0);
      otherItems.forEach((item) => {
        expect(item.tabIndex).to.equal(-1);
      });
    });

    it('focuses the first item when down arrow key opens the menu', async () => {
      const { getByRole, getAllByRole } = await render(<Test />);

      const trigger = getByRole('button', { name: 'Toggle' });
      await act(() => {
        trigger.focus();
      });

      await user.keyboard('[ArrowDown]');

      const [firstItem, ...otherItems] = getAllByRole('menuitem');
      await waitFor(() => expect(firstItem).toHaveFocus());
      expect(firstItem.tabIndex).to.equal(0);
      otherItems.forEach((item) => {
        expect(item.tabIndex).to.equal(-1);
      });
    });

    it('focuses the last item when up arrow key opens the menu', async () => {
      const { getByRole, getAllByRole } = await render(<Test />);

      const trigger = getByRole('button', { name: 'Toggle' });

      await act(() => {
        trigger.focus();
      });

      await user.keyboard('[ArrowUp]');

      const [firstItem, secondItem, lastItem] = getAllByRole('menuitem');
      await waitFor(() => {
        expect(lastItem).toHaveFocus();
      });

      expect(lastItem.tabIndex).to.equal(0);
      [firstItem, secondItem].forEach((item) => {
        expect(item.tabIndex).to.equal(-1);
      });
    });

    it('focuses the trigger after the menu is closed', async () => {
      const { getByRole } = await render(
        <div>
          <input type="text" />
          <Menu.Root animated={false}>
            <Menu.Trigger>Toggle</Menu.Trigger>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>Close</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Root>
          <input type="text" />
        </div>,
      );

      const button = getByRole('button', { name: 'Toggle' });
      await user.click(button);

      const menuItem = getByRole('menuitem');
      await user.click(menuItem);

      expect(button).toHaveFocus();
    });

    it('focuses the trigger after the menu is closed but not unmounted', async () => {
      const { getByRole } = await render(
        <div>
          <input type="text" />
          <Menu.Root animated={false}>
            <Menu.Trigger>Toggle</Menu.Trigger>
            <Menu.Positioner keepMounted>
              <Menu.Popup>
                <Menu.Item>Close</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Root>
          <input type="text" />
        </div>,
      );

      const button = getByRole('button', { name: 'Toggle' });
      await user.click(button);

      const menuItem = getByRole('menuitem');
      await user.click(menuItem);

      expect(button).toHaveFocus();
    });
  });

  describe('prop: closeParentOnEsc', () => {
    it('closes the parent menu when the Escape key is pressed by default', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root animated={false}>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>1</Menu.Item>
              <Menu.Root animated={false}>
                <Menu.SubmenuTrigger>2</Menu.SubmenuTrigger>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item>2.1</Menu.Item>
                    <Menu.Item>2.2</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Root>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await act(() => {
        trigger.focus();
      });

      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(getByRole('menuitem', { name: '1' })).toHaveFocus();
      });

      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(getByRole('menuitem', { name: '2' })).toHaveFocus();
      });

      await user.keyboard('[ArrowRight]');
      await waitFor(() => {
        expect(getByRole('menuitem', { name: '2.1' })).toHaveFocus();
      });

      await user.keyboard('[Escape]');
      await act(async () => {});

      expect(queryByRole('menu', { hidden: false })).to.equal(null);
    });

    it('does not close the parent menu when the Escape key is pressed if `closeParentOnEsc=false`', async () => {
      const { getByRole, queryAllByRole } = await render(
        <Menu.Root animated={false}>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner id="parent-menu">
            <Menu.Popup>
              <Menu.Item>1</Menu.Item>
              <Menu.Root animated={false} closeParentOnEsc={false}>
                <Menu.SubmenuTrigger>2</Menu.SubmenuTrigger>
                <Menu.Positioner id="submenu">
                  <Menu.Popup>
                    <Menu.Item>2.1</Menu.Item>
                    <Menu.Item>2.2</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Root>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await act(() => {
        trigger.focus();
      });

      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(getByRole('menuitem', { name: '1' })).toHaveFocus();
      });

      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(getByRole('menuitem', { name: '2' })).toHaveFocus();
      });

      await user.keyboard('[ArrowRight]');
      await waitFor(() => {
        expect(getByRole('menuitem', { name: '2.1' })).toHaveFocus();
      });

      await user.keyboard('[Escape]');
      await waitFor(() => {
        const menus = queryAllByRole('menu', { hidden: false });
        expect(menus.length).to.equal(1);
        expect(menus[0].id).to.equal('parent-menu');
      });
    });
  });
});
