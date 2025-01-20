import * as React from 'react';
import { expect } from 'chai';
import { act, flushMicrotasks, waitFor, screen } from '@mui/internal-test-utils';
import { DirectionProvider } from '@base-ui-components/react/direction-provider';
import { Menu } from '@base-ui-components/react/menu';
import userEvent from '@testing-library/user-event';
import { spy } from 'sinon';
import { createRenderer, isJSDOM } from '#test-utils';

describe('<Menu.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();
  const user = userEvent.setup();

  describe('keyboard navigation', () => {
    it('changes the highlighted item using the arrow keys', async () => {
      const { getByRole, getByTestId } = await render(
        <Menu.Root>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item data-testid="item-1">1</Menu.Item>
                <Menu.Item data-testid="item-2">2</Menu.Item>
                <Menu.Item data-testid="item-3">3</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Toggle' });
      await act(async () => {
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
        <Menu.Root>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item data-testid="item-1">1</Menu.Item>
                <Menu.Item data-testid="item-2">2</Menu.Item>
                <Menu.Item data-testid="item-3">3</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Toggle' });
      await act(async () => {
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
        <Menu.Root>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item data-testid="item-1">1</Menu.Item>
                <Menu.Item disabled data-testid="item-2">
                  2
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Toggle' });
      await act(async () => {
        trigger.focus();
      });

      await userEvent.keyboard('[Enter]');

      const item1 = getByTestId('item-1');
      const item2 = getByTestId('item-2');

      await waitFor(() => {
        expect(item1).toHaveFocus();
      });

      await userEvent.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(item2).toHaveFocus();
      });

      expect(item2).to.have.attribute('aria-disabled', 'true');
    });

    describe('text navigation', () => {
      it('changes the highlighted item', async ({ skip }) => {
        if (isJSDOM) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JSDOM
          skip();
        }

        const { getByText, getAllByRole } = await render(
          <Menu.Root open>
            <Menu.Portal>
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
            </Menu.Portal>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        await act(async () => {
          items[0].focus();
        });

        await user.keyboard('c');
        await waitFor(() => {
          expect(getByText('Ca')).toHaveFocus();
        });

        expect(getByText('Ca')).to.have.attribute('tabindex', '0');

        await user.keyboard('d');
        await waitFor(() => {
          expect(getByText('Cd')).toHaveFocus();
        });

        expect(getByText('Cd')).to.have.attribute('tabindex', '0');
      });

      it('changes the highlighted item using text navigation on label prop', async ({ skip }) => {
        if (!isJSDOM) {
          // This test is very flaky in real browsers
          skip();
        }

        const { getByRole, getAllByRole } = await render(
          <Menu.Root>
            <Menu.Trigger>Toggle</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item label="Aa">1</Menu.Item>
                  <Menu.Item label="Ba">2</Menu.Item>
                  <Menu.Item label="Bb">3</Menu.Item>
                  <Menu.Item label="Ca">4</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>,
        );

        const trigger = getByRole('button', { name: 'Toggle' });
        await user.click(trigger);
        const items = getAllByRole('menuitem');
        await flushMicrotasks();

        await user.keyboard('b');
        await waitFor(() => {
          expect(items[1]).toHaveFocus();
        });

        await waitFor(() => {
          expect(items[1]).to.have.attribute('tabindex', '0');
        });

        await user.keyboard('b');
        await waitFor(() => {
          expect(items[2]).toHaveFocus();
        });

        await waitFor(() => {
          expect(items[2]).to.have.attribute('tabindex', '0');
        });

        await user.keyboard('b');
        await waitFor(() => {
          expect(items[2]).toHaveFocus();
        });

        await waitFor(() => {
          expect(items[2]).to.have.attribute('tabindex', '0');
        });
      });

      it('skips the non-stringifiable items', async ({ skip }) => {
        if (isJSDOM) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JSDOM
          skip();
        }

        const { getByText, getAllByRole } = await render(
          <Menu.Root open>
            <Menu.Portal>
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
            </Menu.Portal>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        await act(async () => {
          items[0].focus();
        });

        await user.keyboard('b');
        await waitFor(() => {
          expect(getByText('Ba')).toHaveFocus();
        });
        expect(getByText('Ba')).to.have.attribute('tabindex', '0');

        await user.keyboard('c');
        await waitFor(() => {
          expect(getByText('Bc')).toHaveFocus();
        });
        expect(getByText('Bc')).to.have.attribute('tabindex', '0');
      });

      it('navigate to options with diacritic characters', async ({ skip }) => {
        if (isJSDOM) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JSDOM
          skip();
        }

        const { getByText, getAllByRole } = await render(
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item>Aa</Menu.Item>
                  <Menu.Item>Ba</Menu.Item>
                  <Menu.Item>Bb</Menu.Item>
                  <Menu.Item>Bą</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        await act(async () => {
          items[0].focus();
        });

        await user.keyboard('b');
        await waitFor(() => {
          expect(getByText('Ba')).toHaveFocus();
        });
        expect(getByText('Ba')).to.have.attribute('tabindex', '0');

        await user.keyboard('ą');
        await waitFor(() => {
          expect(getByText('Bą')).toHaveFocus();
        });
        expect(getByText('Bą')).to.have.attribute('tabindex', '0');
      });

      it('navigate to next options beginning with diacritic characters', async ({ skip }) => {
        if (isJSDOM) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JSDOM
          skip();
        }

        const { getByText, getAllByRole } = await render(
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item>Aa</Menu.Item>
                  <Menu.Item>ąa</Menu.Item>
                  <Menu.Item>ąb</Menu.Item>
                  <Menu.Item>ąc</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        await act(async () => {
          items[0].focus();
        });

        await user.keyboard('ą');
        await waitFor(() => {
          expect(getByText('ąa')).toHaveFocus();
        });
        expect(getByText('ąa')).to.have.attribute('tabindex', '0');
      });

      it('does not trigger the onClick event when Space is pressed during text navigation', async ({
        skip,
      }) => {
        if (isJSDOM) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JSDOM
          skip();
        }

        const handleClick = spy();

        const { getAllByRole } = await render(
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item onClick={() => handleClick()}>Item One</Menu.Item>
                  <Menu.Item onClick={() => handleClick()}>Item Two</Menu.Item>
                  <Menu.Item onClick={() => handleClick()}>Item Three</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>,
        );

        const items = getAllByRole('menuitem');

        await act(async () => {
          items[0].focus();
        });

        await user.keyboard('Item T');

        expect(handleClick.called).to.equal(false);

        await waitFor(() => {
          expect(items[1]).toHaveFocus();
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
          <DirectionProvider direction={direction}>
            <Menu.Root open orientation={orientation}>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item>1</Menu.Item>
                    <Menu.Root orientation={orientation}>
                      <Menu.SubmenuTrigger data-testid="submenu-trigger">2</Menu.SubmenuTrigger>
                      <Menu.Portal>
                        <Menu.Positioner>
                          <Menu.Popup data-testid="submenu">
                            <Menu.Item data-testid="submenu-item-1">2.1</Menu.Item>
                            <Menu.Item>2.2</Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.Root>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </DirectionProvider>,
        );

        const submenuTrigger = getByTestId('submenu-trigger');

        await act(async () => {
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
        <Menu.Root>
          <Menu.Trigger>Toggle</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>1</Menu.Item>
                <Menu.Item>2</Menu.Item>
                <Menu.Item>3</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    it('focuses the first item after the menu is opened by keyboard', async () => {
      const { getAllByRole, getByRole } = await render(<Test />);

      const trigger = getByRole('button', { name: 'Toggle' });
      await act(async () => {
        trigger.focus();
      });

      await userEvent.keyboard('[Enter]');

      const [firstItem, ...otherItems] = getAllByRole('menuitem');
      await waitFor(() => {
        expect(firstItem.tabIndex).to.equal(0);
      });
      otherItems.forEach((item) => {
        expect(item.tabIndex).to.equal(-1);
      });
    });

    it('focuses the first item when down arrow key opens the menu', async () => {
      const { getByRole, getAllByRole } = await render(<Test />);

      const trigger = getByRole('button', { name: 'Toggle' });
      await act(async () => {
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

      await act(async () => {
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
          <Menu.Root>
            <Menu.Trigger>Toggle</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item>Close</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
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

    it('focuses the trigger after the menu is closed but not unmounted', async ({ skip }) => {
      if (isJSDOM) {
        // TODO: this stopped working in vitest JSDOM mode
        skip();
      }

      const { getByRole } = await render(
        <div>
          <input type="text" />
          <Menu.Root>
            <Menu.Trigger>Toggle</Menu.Trigger>
            <Menu.Portal keepMounted>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item>Close</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <input type="text" />
        </div>,
      );

      const button = getByRole('button', { name: 'Toggle' });
      await user.click(button);

      const menuItem = getByRole('menuitem');
      await user.click(menuItem);

      await waitFor(() => {
        expect(button).toHaveFocus();
      });
    });
  });

  describe('prop: closeParentOnEsc', () => {
    it('closes the parent menu when the Escape key is pressed by default', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>1</Menu.Item>
                <Menu.Root>
                  <Menu.SubmenuTrigger>2</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.Item>2.1</Menu.Item>
                        <Menu.Item>2.2</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await act(async () => {
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
      await flushMicrotasks();

      expect(queryByRole('menu', { hidden: false })).to.equal(null);
    });

    it('does not close the parent menu when the Escape key is pressed if `closeParentOnEsc=false`', async () => {
      const { getByRole, queryAllByRole } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup id="parent-menu">
                <Menu.Item>1</Menu.Item>
                <Menu.Root closeParentOnEsc={false}>
                  <Menu.SubmenuTrigger>2</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup id="submenu">
                        <Menu.Item>2.1</Menu.Item>
                        <Menu.Item>2.2</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await act(async () => {
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

      const menus = queryAllByRole('menu', { hidden: false });
      await waitFor(() => {
        expect(menus.length).to.equal(1);
      });

      expect(menus[0].id).to.equal('parent-menu');
    });
  });

  describe('controlled mode', () => {
    it('should remove the popup when and there is no exit animation defined', async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }

      function Test() {
        const [open, setOpen] = React.useState(true);

        return (
          <div>
            <button onClick={() => setOpen(false)}>Close</button>
            <Menu.Root open={open} modal={false}>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup />
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        );
      }

      await render(<Test />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });
    });

    it('should remove the popup when the animation finishes', async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }

      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      let animationFinished = false;
      const notifyAnimationFinished = () => {
        animationFinished = true;
      };

      function Test() {
        const style = `
          @keyframes test-anim {
            to {
              opacity: 0;
            }
          }

          .animation-test-popup[data-open] {
            opacity: 1;
          }

          .animation-test-popup[data-ending-style] {
            animation: test-anim 50ms;
          }
        `;

        const [open, setOpen] = React.useState(true);

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={() => setOpen(false)}>Close</button>
            <Menu.Root open={open} modal={false}>
              <Menu.Portal keepMounted>
                <Menu.Positioner>
                  <Menu.Popup
                    className="animation-test-popup"
                    onAnimationEnd={notifyAnimationFinished}
                  />
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        );
      }

      await render(<Test />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });

      expect(animationFinished).to.equal(true);
    });
  });

  describe('prop: modal', () => {
    it('should render an internal backdrop when `true`', async () => {
      await render(
        <div>
          <Menu.Root>
            <Menu.Trigger>Open</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner data-testid="positioner">
                <Menu.Popup>
                  <Menu.Item>1</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <button>Outside</button>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.to.equal(null);
      });

      const positioner = screen.getByTestId('positioner');

      // eslint-disable-next-line testing-library/no-node-access
      expect(positioner.previousElementSibling).to.have.attribute('role', 'presentation');
    });

    it('should not render an internal backdrop when `false`', async () => {
      await render(
        <div>
          <Menu.Root modal={false}>
            <Menu.Trigger>Open</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner data-testid="positioner">
                <Menu.Popup>
                  <Menu.Item>1</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <button>Outside</button>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.to.equal(null);
      });

      const positioner = screen.getByTestId('positioner');

      // eslint-disable-next-line testing-library/no-node-access
      expect(positioner.previousElementSibling).to.equal(null);
    });
  });

  describe('prop: action', () => {
    it('unmounts the menu when the `unmount` method is called', async () => {
      const actionRef = {
        current: {
          unmount: spy(),
        },
      };

      await render(
        <Menu.Root action={actionRef}>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>1</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.to.equal(null);
      });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.to.equal(null);
      });

      act(() => actionRef.current.unmount());

      await waitFor(() => {
        expect(screen.queryByRole('menu')).to.equal(null);
      });
    });
  });
});
