import * as React from 'react';
import { expect } from 'chai';
import {
  act,
  fireEvent,
  flushMicrotasks,
  ignoreActWarnings,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { Menu } from '@base-ui/react/menu';
import { Dialog } from '@base-ui/react/dialog';
import userEvent from '@testing-library/user-event';
import { spy } from 'sinon';
import { createRenderer, isJSDOM, popupConformanceTests, wait } from '#test-utils';
import { REASONS } from '../../utils/reasons';
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';

describe('<Menu.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  popupConformanceTests({
    createComponent: (props) => (
      <Menu.Root {...props.root}>
        <Menu.Trigger {...props.trigger}>Open menu</Menu.Trigger>
        <Menu.Portal {...props.portal}>
          <Menu.Positioner>
            <Menu.Popup {...props.popup}>
              <Menu.Item>Item</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ),
    render,
    triggerMouseAction: 'click',
    expectedPopupRole: 'menu',
  });

  // All these tests run for contained and detached triggers.
  // The rendered menubar has the same structure in most cases.
  describe.for([
    { name: 'contained triggers', Component: ContainedTriggerMenu },
    { name: 'detached triggers', Component: DetachedTriggerMenu },
  ])('when using $name', ({ Component: TestMenu }) => {
    describe('keyboard navigation', () => {
      it('changes the highlighted item using the arrow keys', async () => {
        await render(<TestMenu />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await act(async () => {
          trigger.focus();
        });

        await userEvent.keyboard('[Enter]');

        const item1 = screen.getByTestId('item-1');
        const item2 = screen.getByTestId('item-2');
        const item3 = screen.getByTestId('item-3');

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
        await render(<TestMenu />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await act(async () => {
          trigger.focus();
        });

        await userEvent.keyboard('[Enter]');
        const item1 = screen.getByTestId('item-1');
        const item5 = screen.getByTestId('item-5');

        await waitFor(() => {
          expect(item1).toHaveFocus();
        });

        await userEvent.keyboard('{End}');
        await waitFor(() => {
          expect(item5).toHaveFocus();
        });

        await userEvent.keyboard('{Home}');
        await waitFor(() => {
          expect(item1).toHaveFocus();
        });
      });

      it('includes disabled items during keyboard navigation', async () => {
        await render(<TestMenu />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await act(async () => {
          trigger.focus();
        });

        await userEvent.keyboard('[Enter]');

        const item1 = screen.getByTestId('item-1');
        const item2 = screen.getByTestId('item-2');
        const disabledItem3 = screen.getByTestId('item-3');

        await waitFor(() => {
          expect(item1).toHaveFocus();
        });

        await userEvent.keyboard('{ArrowDown}');

        await waitFor(() => {
          expect(item2).toHaveFocus();
        });

        await userEvent.keyboard('{ArrowDown}');

        await waitFor(() => {
          expect(disabledItem3).toHaveFocus();
        });

        expect(disabledItem3).to.have.attribute('aria-disabled', 'true');
      });

      describe('text navigation', () => {
        it('changes the highlighted item', async ({ skip }) => {
          if (isJSDOM) {
            // useMenuPopup Text navigation match menu items using HTMLElement.innerText
            // innerText is not supported by JSDOM
            skip();
          }

          const itemElements = [
            <Menu.Item key="aa">Aa</Menu.Item>,
            <Menu.Item key="ba">Ba</Menu.Item>,
            <Menu.Item key="bb">Bb</Menu.Item>,
            <Menu.Item key="ca">Ca</Menu.Item>,
            <Menu.Item key="cb">Cb</Menu.Item>,
            <Menu.Item key="cd">Cd</Menu.Item>,
          ];

          const { user } = await render(
            <TestMenu rootProps={{ open: true }} popupProps={{ children: itemElements }} />,
          );

          const items = screen.getAllByRole('menuitem');

          await act(async () => {
            items[0].focus();
          });

          await user.keyboard('c');
          await waitFor(() => {
            expect(screen.getByText('Ca')).toHaveFocus();
          });

          expect(screen.getByText('Ca')).to.have.attribute('tabindex', '0');

          await user.keyboard('d');
          await waitFor(() => {
            expect(screen.getByText('Cd')).toHaveFocus();
          });

          expect(screen.getByText('Cd')).to.have.attribute('tabindex', '0');
        });

        it('changes the highlighted item using text navigation on label prop', async ({ skip }) => {
          if (!isJSDOM) {
            // This test is very flaky in real browsers
            skip();
          }

          const itemElements = [
            <Menu.Item key="1" label="Aa">
              1
            </Menu.Item>,
            <Menu.Item key="2" label="Ba">
              2
            </Menu.Item>,
            <Menu.Item key="3" label="Bb">
              3
            </Menu.Item>,
            <Menu.Item key="4" label="Ca">
              4
            </Menu.Item>,
          ];

          const { user } = await render(<TestMenu popupProps={{ children: itemElements }} />);

          const trigger = screen.getByRole('button', { name: 'Toggle' });
          await user.click(trigger);
          const items = screen.getAllByRole('menuitem');
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

          const itemElements = [
            <Menu.Item key="aa">Aa</Menu.Item>,
            <Menu.Item key="ba">Ba</Menu.Item>,
            <Menu.Item key="empty" />,
            <Menu.Item key="nested">
              <div>Nested Content</div>
            </Menu.Item>,
            <Menu.Item key="undefined">{undefined}</Menu.Item>,
            <Menu.Item key="null">{null}</Menu.Item>,
            <Menu.Item key="bc">Bc</Menu.Item>,
          ];

          const { user } = await render(
            <TestMenu rootProps={{ open: true }} popupProps={{ children: itemElements }} />,
          );

          const items = screen.getAllByRole('menuitem');

          await act(async () => {
            items[0].focus();
          });

          await user.keyboard('b');
          await waitFor(() => {
            expect(screen.getByText('Ba')).toHaveFocus();
          });
          expect(screen.getByText('Ba')).to.have.attribute('tabindex', '0');

          await user.keyboard('c');
          await waitFor(() => {
            expect(screen.getByText('Bc')).toHaveFocus();
          });
          expect(screen.getByText('Bc')).to.have.attribute('tabindex', '0');
        });

        it('navigate to options with diacritic characters', async ({ skip }) => {
          if (isJSDOM) {
            // useMenuPopup Text navigation match menu items using HTMLElement.innerText
            // innerText is not supported by JSDOM
            skip();
          }

          const itemElements = [
            <Menu.Item key="aa">Aa</Menu.Item>,
            <Menu.Item key="ba">Ba</Menu.Item>,
            <Menu.Item key="bb">Bb</Menu.Item>,
            <Menu.Item key="bą">Bą</Menu.Item>,
          ];

          const { user } = await render(
            <TestMenu rootProps={{ open: true }} popupProps={{ children: itemElements }} />,
          );

          const items = screen.getAllByRole('menuitem');

          await act(async () => {
            items[0].focus();
          });

          await user.keyboard('b');
          await waitFor(() => {
            expect(screen.getByText('Ba')).toHaveFocus();
          });
          expect(screen.getByText('Ba')).to.have.attribute('tabindex', '0');

          await user.keyboard('ą');
          await waitFor(() => {
            expect(screen.getByText('Bą')).toHaveFocus();
          });
          expect(screen.getByText('Bą')).to.have.attribute('tabindex', '0');
        });

        it('navigate to next options that begin with diacritic characters', async ({ skip }) => {
          if (isJSDOM) {
            // useMenuPopup Text navigation match menu items using HTMLElement.innerText
            // innerText is not supported by JSDOM
            skip();
          }

          const itemElements = [
            <Menu.Item key="aa">Aa</Menu.Item>,
            <Menu.Item key="ąa">ąa</Menu.Item>,
            <Menu.Item key="ąb">ąb</Menu.Item>,
            <Menu.Item key="ąc">ąc</Menu.Item>,
          ];

          const { user } = await render(
            <TestMenu rootProps={{ open: true }} popupProps={{ children: itemElements }} />,
          );

          const items = screen.getAllByRole('menuitem');

          await act(async () => {
            items[0].focus();
          });

          await user.keyboard('ą');
          await waitFor(() => {
            expect(screen.getByText('ąa')).toHaveFocus();
          });
          expect(screen.getByText('ąa')).to.have.attribute('tabindex', '0');
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

          const itemElements = [
            <Menu.Item key="one" onClick={() => handleClick()}>
              Item One
            </Menu.Item>,
            <Menu.Item key="two" onClick={() => handleClick()}>
              Item Two
            </Menu.Item>,
            <Menu.Item key="three" onClick={() => handleClick()}>
              Item Three
            </Menu.Item>,
          ];

          const { user } = await render(
            <TestMenu rootProps={{ open: true }} popupProps={{ children: itemElements }} />,
          );

          const items = screen.getAllByRole('menuitem');

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
        it.skipIf(isJSDOM)(
          `opens a nested menu of a ${orientation} ${direction.toUpperCase()} menu with ${openKey} key and closes it with ${closeKey}`,

          async () => {
            const { user } = await render(
              <DirectionProvider direction={direction}>
                <TestMenu rootProps={{ open: true, orientation }} submenuProps={{ orientation }} />
              </DirectionProvider>,
            );

            const submenuTrigger = screen.getByTestId('submenu-trigger');

            await act(async () => {
              submenuTrigger.focus();
            });

            // This check fails in JSDOM
            await waitFor(() => {
              expect(submenuTrigger).toHaveFocus();
            });

            await user.keyboard(`[${openKey}]`);

            let submenu: HTMLElement | null = await screen.findByTestId('submenu');

            const submenuItem1 = screen.queryByTestId('item-4_1');
            expect(submenuItem1).not.to.equal(null);
            await waitFor(() => {
              expect(submenuItem1).toHaveFocus();
            });

            await user.keyboard(`[${closeKey}]`);

            submenu = screen.queryByTestId('submenu');
            expect(submenu).to.equal(null);

            expect(submenuTrigger).toHaveFocus();
          },
        );
      });

      it('opens submenu on click when openOnHover is false', async () => {
        const { user } = await render(<TestMenu submenuTriggerProps={{ openOnHover: false }} />);

        const mainTrigger = screen.getByRole('button', { name: 'Toggle' });
        await user.click(mainTrigger);

        const menu = await screen.findByTestId('menu');
        expect(screen.queryByTestId('submenu')).to.equal(null);

        const submenuTrigger = await screen.findByTestId('submenu-trigger');
        await user.click(submenuTrigger);

        expect(menu).not.to.equal(null);
        expect(await screen.findByTestId('item-4_1')).to.have.text('Item 4.1');
      });

      it('closes submenus when focus is lost by shift-tabbing from a nested menu', async () => {
        const { user } = await render(<TestMenu />);

        const mainTrigger = screen.getByRole('button', { name: 'Toggle' });
        await user.click(mainTrigger);

        await screen.findByTestId('menu');
        expect(screen.queryByTestId('submenu')).to.equal(null);

        const submenuTrigger = await screen.findByTestId('submenu-trigger');
        await user.hover(submenuTrigger);

        await waitFor(() => {
          expect(screen.queryByTestId('submenu')).not.to.equal(null);
        });

        const submenuItem = await screen.findByTestId('item-4_1');
        await act(async () => {
          submenuItem.focus();
        });

        await waitFor(() => {
          expect(submenuItem).toHaveFocus();
        });

        // Shift+Tab should close the submenu and focus should return to the submenu trigger
        await user.keyboard('{Shift>}{Tab}{/Shift}');

        await waitFor(() => {
          expect(screen.queryByTestId('submenu')).to.equal(null);
        });

        expect(submenuTrigger).toHaveFocus();
      });

      it('closes the entire tree when clicking outside the deepest submenu', async () => {
        const { user } = await render(
          <div>
            <TestMenu />
            <button data-testid="outside">Outside</button>
          </div>,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await user.click(trigger);

        await screen.findByTestId('menu');

        await user.keyboard('[ArrowDown]');
        await user.keyboard('[ArrowDown]');
        await user.keyboard('[ArrowDown]');
        await user.keyboard('[ArrowDown]');

        const submenuTrigger1 = await screen.findByTestId('submenu-trigger');
        await waitFor(() => {
          expect(submenuTrigger1).toHaveFocus();
        });

        await user.keyboard('[ArrowRight]');
        await screen.findByTestId('submenu');

        await user.keyboard('[ArrowDown]');
        await user.keyboard('[ArrowDown]');

        const submenuTrigger2 = await screen.findByTestId('nested-submenu-trigger');
        await waitFor(() => {
          expect(submenuTrigger2).toHaveFocus();
        });

        await user.keyboard('[ArrowRight]');
        await screen.findByTestId('nested-submenu');

        const outside = screen.getByTestId('outside');
        await user.click(outside);

        await waitFor(() => {
          expect(screen.queryByTestId('level-1')).to.equal(null);
          expect(screen.queryByTestId('level-2')).to.equal(null);
          expect(screen.queryByTestId('level-3')).to.equal(null);
        });
      });
    });

    describe('nested popups', () => {
      it('keeps the menu and dialog open when pressing Shift+Tab inside a nested dialog', async () => {
        function MenuWithNestedDialog() {
          return (
            <Menu.Root>
              <Menu.Trigger data-testid="menu-trigger">Open Menu</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup data-testid="menu-popup">
                    <Menu.Item>Item 1</Menu.Item>
                    <Dialog.Root>
                      <Menu.Item
                        render={<Dialog.Trigger />}
                        closeOnClick={false}
                        nativeButton
                        data-testid="dialog-trigger"
                      >
                        Open Dialog
                      </Menu.Item>
                      <Dialog.Portal>
                        <Dialog.Popup data-testid="dialog-popup">
                          <button type="button" data-testid="dialog-button">
                            Dialog Button
                          </button>
                        </Dialog.Popup>
                      </Dialog.Portal>
                    </Dialog.Root>
                    <Menu.Item>Item 2</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          );
        }

        const { user } = await render(<MenuWithNestedDialog />);

        const menuTrigger = screen.getByTestId('menu-trigger');
        await user.click(menuTrigger);

        await waitFor(() => {
          expect(screen.queryByTestId('menu-popup')).not.to.equal(null);
        });

        const dialogTrigger = screen.getByTestId('dialog-trigger');
        await user.click(dialogTrigger);

        await waitFor(() => {
          expect(screen.queryByTestId('dialog-popup')).not.to.equal(null);
        });

        const dialogButton = screen.getByTestId('dialog-button');
        await act(async () => {
          dialogButton.focus();
        });

        await waitFor(() => {
          expect(dialogButton).toHaveFocus();
        });

        // Shift+Tab inside the dialog should NOT close the menu or the dialog
        await user.keyboard('{Shift>}{Tab}{/Shift}');

        // Both menu and dialog should still be open
        await waitFor(() => {
          expect(screen.queryByTestId('menu-popup')).not.to.equal(null);
          expect(screen.queryByTestId('dialog-popup')).not.to.equal(null);
        });
      });
    });

    describe('focus management', () => {
      it('focuses the first item after the menu is opened by keyboard', async () => {
        await render(<TestMenu />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await act(async () => {
          trigger.focus();
        });

        await userEvent.keyboard('[Enter]');

        const [firstItem, ...otherItems] = screen.getAllByRole('menuitem');
        await waitFor(() => {
          expect(firstItem.tabIndex).to.equal(0);
        });
        otherItems.forEach((item) => {
          expect(item.tabIndex).to.equal(-1);
        });
      });

      it('focuses the first item when down arrow key opens the menu', async () => {
        const { user } = await render(<TestMenu />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await act(async () => {
          trigger.focus();
        });

        await user.keyboard('[ArrowDown]');

        const [firstItem, ...otherItems] = screen.getAllByRole('menuitem');
        await waitFor(() => expect(firstItem).toHaveFocus());
        expect(firstItem.tabIndex).to.equal(0);
        otherItems.forEach((item) => {
          expect(item.tabIndex).to.equal(-1);
        });
      });

      it('focuses the last item when up arrow key opens the menu', async () => {
        const { user } = await render(<TestMenu />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        await act(async () => {
          trigger.focus();
        });

        await user.keyboard('[ArrowUp]');

        const items = screen.getAllByRole('menuitem');
        await waitFor(() => {
          expect(items[4]).toHaveFocus();
        });

        expect(items[4].tabIndex).to.equal(0);
        [items[0], items[1], items[2], items[3]].forEach((item) => {
          expect(item.tabIndex).to.equal(-1);
        });
      });

      it('focuses the trigger after the menu is closed', async () => {
        const { user } = await render(
          <div>
            <input type="text" />
            <TestMenu />
            <input type="text" />
          </div>,
        );

        const button = screen.getByRole('button', { name: 'Toggle' });
        await user.click(button);

        const menuItem = await screen.findAllByRole('menuitem');
        await user.click(menuItem[0]);

        expect(button).toHaveFocus();
      });

      it('focuses the trigger after the menu is closed but not unmounted', async ({ skip }) => {
        if (isJSDOM) {
          // TODO: this stopped working in vitest JSDOM mode
          skip();
        }

        const { user } = await render(
          <div>
            <input type="text" />
            <TestMenu portalProps={{ keepMounted: true }} />
            <input type="text" />
          </div>,
        );

        const button = screen.getByRole('button', { name: 'Toggle' });
        await user.click(button);

        const menuItem = await screen.findAllByRole('menuitem');
        await user.click(menuItem[0]);

        await waitFor(() => {
          expect(button).toHaveFocus();
        });
      });
    });

    describe('prop: closeParentOnEsc', () => {
      it('does not close the parent menu when the Escape key is pressed by default', async () => {
        const { user } = await render(<TestMenu />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await act(async () => {
          trigger.focus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(screen.getByTestId('item-1')).toHaveFocus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(screen.getByTestId('item-2')).toHaveFocus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(screen.getByTestId('item-3')).toHaveFocus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(screen.getByTestId('submenu-trigger')).toHaveFocus();
        });

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(screen.getByTestId('item-4_1')).toHaveFocus();
        });

        await user.keyboard('[Escape]');

        const menus = screen.queryAllByRole('menu', { hidden: false });
        await waitFor(() => {
          expect(menus.length).to.equal(1);
        });

        expect(menus[0].dataset.testid).to.equal('menu');
      });

      it('closes the parent menu when the Escape key is pressed  if `closeParentOnEsc=true`', async () => {
        const { user } = await render(<TestMenu submenuProps={{ closeParentOnEsc: true }} />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await act(async () => {
          trigger.focus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(screen.getByTestId('item-1')).toHaveFocus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(screen.getByTestId('item-2')).toHaveFocus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(screen.getByTestId('item-3')).toHaveFocus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(screen.getByTestId('submenu-trigger')).toHaveFocus();
        });

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(screen.getByRole('menuitem', { name: 'Item 4.1' })).toHaveFocus();
        });

        await user.keyboard('[Escape]');
        await flushMicrotasks();

        expect(screen.queryByRole('menu', { hidden: false })).to.equal(null);
      });
    });

    describe('prop: modal', () => {
      it('should render an internal backdrop when `true`', async () => {
        const { user } = await render(
          <div>
            <TestMenu rootProps={{ modal: true }} />
            <button>Outside</button>
          </div>,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        await user.click(trigger);

        await waitFor(() => {
          expect(screen.queryByRole('menu')).not.to.equal(null);
        });

        const positioner = screen.getByTestId('menu-positioner');

        expect(positioner.previousElementSibling).to.have.attribute('role', 'presentation');
      });

      it('should not render an internal backdrop when `false`', async () => {
        const { user } = await render(
          <div>
            <TestMenu rootProps={{ modal: false }} />
            <button>Outside</button>
          </div>,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        await user.click(trigger);

        await waitFor(() => {
          expect(screen.queryByRole('menu')).not.to.equal(null);
        });

        const positioner = screen.getByTestId('menu-positioner');

        expect(positioner.previousElementSibling).to.equal(null);
      });
    });

    describe.skipIf(isJSDOM)('interaction type tracking (openMethod)', () => {
      it('should not apply scroll lock when opened via touch', async () => {
        await render(<TestMenu rootProps={{ modal: true }} />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.pointerDown(trigger, { pointerType: 'touch' });
        fireEvent.mouseDown(trigger);

        const menu = await screen.findByRole('menu');

        const doc = menu.ownerDocument;

        const isScrollLocked =
          doc.documentElement.style.overflow === 'hidden' ||
          doc.documentElement.hasAttribute('data-base-ui-scroll-locked') ||
          doc.body.style.overflow === 'hidden';

        expect(isScrollLocked).to.equal(false);
      });

      it('should apply scroll lock when opened via mouse', async () => {
        const { user } = await render(<TestMenu rootProps={{ modal: true }} />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        const doc = trigger.ownerDocument;

        await user.click(trigger);
        await screen.findByRole('menu');

        const isScrollLocked =
          doc.documentElement.style.overflow === 'hidden' ||
          doc.documentElement.hasAttribute('data-base-ui-scroll-locked') ||
          doc.body.style.overflow === 'hidden';

        expect(isScrollLocked).to.equal(true);
      });
    });

    describe('prop: actionsRef', () => {
      it('unmounts the menu when the `unmount` method is called', async () => {
        const actionsRef = {
          current: {
            unmount: spy(),
            close: spy(),
          },
        };

        const { user } = await render(
          <TestMenu
            rootProps={{
              actionsRef,
              onOpenChange: (open, details) => {
                details.preventUnmountOnClose();
              },
            }}
          />,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await act(() => {
          trigger.focus();
        });

        await user.keyboard('{Enter}');

        await waitFor(() => {
          expect(screen.queryByRole('menu')).not.to.equal(null);
        });

        await user.click(trigger);

        await waitFor(() => {
          expect(screen.queryByRole('menu')).not.to.equal(null);
        });

        await act(async () => {
          await new Promise((resolve) => {
            requestAnimationFrame(resolve);
          });

          actionsRef.current.unmount();
        });

        await waitFor(() => {
          expect(screen.queryByRole('menu')).to.equal(null);
        });
      });
    });

    describe.skipIf(isJSDOM)('prop: onOpenChangeComplete', () => {
      it('is called on close when there is no exit animation defined', async () => {
        const onOpenChangeComplete = spy();

        function Test() {
          const [open, setOpen] = React.useState(true);
          return (
            <div>
              <button onClick={() => setOpen(false)}>Close</button>
              <TestMenu rootProps={{ open, onOpenChangeComplete }} />
            </div>
          );
        }

        const { user } = await render(<Test />);

        const closeButton = screen.getByText('Close');
        await user.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByTestId('menu')).to.equal(null);
        });

        expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
        expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
      });

      it('is called on close when the exit animation finishes', async () => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        const onOpenChangeComplete = spy();

        function Test() {
          const style = `
          @keyframes test-anim {
            to {
              opacity: 0;
            }
          }

          .animation-test-indicator[data-ending-style] {
            animation: test-anim 1ms;
          }
        `;

          const [open, setOpen] = React.useState(true);

          return (
            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <style dangerouslySetInnerHTML={{ __html: style }} />
              <button onClick={() => setOpen(false)}>Close</button>
              <TestMenu
                rootProps={{ open, onOpenChangeComplete }}
                popupProps={{ className: 'animation-test-indicator' }}
              />
            </div>
          );
        }

        const { user } = await render(<Test />);

        expect(screen.getByTestId('menu')).not.to.equal(null);

        // Wait for open animation to finish
        await waitFor(() => {
          expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
        });

        const closeButton = screen.getByText('Close');
        await user.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByTestId('menu')).to.equal(null);
        });

        expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
      });

      it('is called on open when there is no enter animation defined', async () => {
        const onOpenChangeComplete = spy();

        function Test() {
          const [open, setOpen] = React.useState(false);
          return (
            <div>
              <button onClick={() => setOpen(true)}>Open</button>
              <TestMenu rootProps={{ open, onOpenChangeComplete }} />
            </div>
          );
        }

        const { user } = await render(<Test />);

        const openButton = screen.getByText('Open');
        await user.click(openButton);

        await waitFor(() => {
          expect(screen.queryByTestId('menu')).not.to.equal(null);
        });

        expect(onOpenChangeComplete.callCount).to.equal(2);
        expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      });

      it('is called on open when the enter animation finishes', async () => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        const onOpenChangeComplete = spy();

        function Test() {
          const style = `
          @keyframes test-anim {
            from {
              opacity: 0;
            }
          }

          .animation-test-indicator[data-starting-style] {
            animation: test-anim 1ms;
          }
        `;

          const [open, setOpen] = React.useState(false);

          return (
            <div>
              {/* eslint-disable-next-line react/no-danger */}
              <style dangerouslySetInnerHTML={{ __html: style }} />
              <button onClick={() => setOpen(true)}>Open</button>
              <TestMenu
                rootProps={{ open, onOpenChange: setOpen, onOpenChangeComplete }}
                popupProps={{ className: 'animation-test-indicator' }}
              />
            </div>
          );
        }

        const { user } = await render(<Test />);

        const openButton = screen.getByText('Open');
        await user.click(openButton);

        // Wait for open animation to finish
        await waitFor(() => {
          expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
        });

        expect(screen.queryByTestId('menu')).not.to.equal(null);
      });

      it('does not get called on mount when not open', async () => {
        const onOpenChangeComplete = spy();

        await render(<TestMenu rootProps={{ onOpenChangeComplete }} />);

        expect(onOpenChangeComplete.callCount).to.equal(0);
      });
    });

    describe('prop: openOnHover', () => {
      it('should open the menu when the trigger is hovered', async () => {
        await render(<TestMenu triggerProps={{ openOnHover: true, delay: 0 }} />);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        await act(async () => {
          trigger.focus();
        });

        await userEvent.hover(trigger);

        await waitFor(() => {
          expect(screen.queryByRole('menu')).not.to.equal(null);
        });
      });

      it('should close the menu when the trigger is no longer hovered', async () => {
        await render(
          <TestMenu rootProps={{ modal: false }} triggerProps={{ openOnHover: true, delay: 0 }} />,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        await act(async () => {
          trigger.focus();
        });

        await userEvent.hover(trigger);

        await waitFor(() => {
          expect(screen.queryByRole('menu')).not.to.equal(null);
        });

        await userEvent.unhover(trigger);

        await waitFor(() => {
          expect(screen.queryByRole('menu')).to.equal(null);
        });
      });

      it('opens the submenu on hover with zero delay', async () => {
        await render(
          <ContainedTriggerMenu
            rootProps={{ defaultOpen: true }}
            submenuTriggerProps={{ delay: 0 }}
          />,
        );

        const submenuTrigger = screen.getByTestId('submenu-trigger');

        await userEvent.hover(submenuTrigger);

        await waitFor(() => {
          expect(screen.queryByTestId('submenu')).not.to.equal(null);
        });
      });

      it('should not close when submenu is hovered after root menu is hovered', async () => {
        await render(
          <TestMenu
            triggerProps={{ openOnHover: true, delay: 0 }}
            submenuTriggerProps={{ delay: 0 }}
          />,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        await act(async () => {
          trigger.focus();
        });

        await userEvent.hover(trigger);

        await waitFor(() => {
          expect(screen.getByTestId('menu')).not.to.equal(null);
        });

        const menu = screen.getByTestId('menu');

        await userEvent.hover(menu);

        const submenuTrigger = screen.getByRole('menuitem', { name: 'Item 4' });

        await userEvent.hover(submenuTrigger);

        await waitFor(() => {
          expect(screen.getByTestId('menu')).not.to.equal(null);
        });
        await waitFor(() => {
          expect(screen.getByTestId('submenu')).not.to.equal(null);
        });

        const submenu = screen.getByTestId('submenu');

        // Use fireEvent to bypass pointer-events checks during safe-polygon pointer events mutation
        fireEvent.mouseMove(menu);
        fireEvent.mouseLeave(menu);
        await userEvent.hover(submenu);

        await waitFor(() => {
          expect(screen.getByTestId('menu')).not.to.equal(null);
        });
        await waitFor(() => {
          expect(screen.getByTestId('submenu')).not.to.equal(null);
        });
      });

      it('keeps the parent submenu open after a third-level submenu closes due to sibling hover', async () => {
        await render(
          <ContainedTriggerMenu
            triggerProps={{ openOnHover: true, delay: 0 }}
            submenuTriggerProps={{ delay: 0 }}
          />,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        await act(async () => {
          trigger.focus();
        });

        await userEvent.hover(trigger);

        await waitFor(() => {
          expect(screen.getByTestId('menu')).not.to.equal(null);
        });

        // Open first-level submenu
        const level1Trigger = screen.getByRole('menuitem', { name: 'Item 4' });
        await userEvent.hover(level1Trigger);

        await waitFor(() => {
          expect(screen.getByTestId('submenu')).not.to.equal(null);
        });

        // Open second-level submenu
        const level2Trigger = screen.getByRole('menuitem', { name: 'Item 4.3' });
        await userEvent.hover(level2Trigger);

        await waitFor(() => {
          expect(screen.getByTestId('nested-submenu')).not.to.equal(null);
        });

        // Hover a sibling item in the parent submenu to close the second-level submenu
        const parentSibling = screen.getByRole('menuitem', { name: 'Item 4.2' });
        // Use fireEvent to bypass pointer-events checks during safe-polygon pointer events mutation
        fireEvent.mouseMove(parentSibling);

        await waitFor(() => {
          expect(screen.queryByTestId('nested-submenu')).to.equal(null);
        });

        // Now unhover the parent submenu container; it should remain open
        const submenu1 = screen.getByTestId('submenu');
        fireEvent.mouseLeave(submenu1);

        // Parent submenu should still be open
        await waitFor(() => {
          expect(screen.getByTestId('submenu')).not.to.equal(null);
        });
      });

      describe('modal behavior', () => {
        const { render: renderFakeTimers, clock } = createRenderer();

        clock.withFakeTimers();

        it('treats hover-opened menus as modal after a click', async () => {
          await renderFakeTimers(
            <Menu.Root>
              <Menu.Trigger openOnHover delay={0}>
                Toggle
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner data-testid="positioner">
                  <Menu.Popup>
                    <Menu.Item>Item 1</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>,
          );

          const trigger = screen.getByRole('button', { name: 'Toggle' });

          fireEvent.mouseEnter(trigger);
          fireEvent.mouseMove(trigger);

          await flushMicrotasks();
          expect(screen.queryByRole('menu')).not.to.equal(null);

          const positioner = screen.getByTestId('positioner');
          expect(positioner.previousElementSibling).to.equal(null);

          clock.tick(PATIENT_CLICK_THRESHOLD - 1);
          fireEvent.click(trigger);

          await flushMicrotasks();
          expect(positioner.previousElementSibling).to.have.attribute('role', 'presentation');
        });
      });
    });

    describe('prop: closeDelay', () => {
      const { render: renderFakeTimers, clock } = createRenderer();

      clock.withFakeTimers();

      it('should close after delay', async () => {
        await renderFakeTimers(
          <TestMenu triggerProps={{ openOnHover: true, delay: 0, closeDelay: 100 }} />,
        );

        const anchor = screen.getByRole('button');

        fireEvent.mouseEnter(anchor);
        fireEvent.mouseMove(anchor);

        await flushMicrotasks();

        expect(screen.getByText('Item 1')).not.to.equal(null);

        fireEvent.mouseLeave(anchor);

        clock.tick(50);

        expect(screen.getByText('Item 1')).not.to.equal(null);

        clock.tick(50);

        expect(screen.queryByText('Item 1')).to.equal(null);
      });
    });

    describe.skipIf(isJSDOM)('mouse interaction', () => {
      afterEach(async () => {
        const { cleanup } = await import('vitest-browser-react');
        await cleanup();
      });

      it('triggers a menu item and closes the menu on click, drag, release', async () => {
        ignoreActWarnings();
        const openChangeSpy = spy();
        const clickSpy = spy();

        const items = [
          <Menu.Item key="1" data-testid="item-1">
            1
          </Menu.Item>,
          <Menu.Item key="2" data-testid="item-2" onClick={clickSpy}>
            2
          </Menu.Item>,
          <Menu.Item key="3" data-testid="item-3">
            3
          </Menu.Item>,
        ];

        await render(
          <div>
            <TestMenu
              rootProps={{ onOpenChange: openChangeSpy }}
              popupProps={{ children: items }}
            />
          </div>,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        fireEvent.mouseDown(trigger);

        await waitFor(() => {
          expect(screen.queryByTestId('menu')).not.to.equal(null);
        });

        await wait(200);

        const item2 = screen.getByTestId('item-2');
        fireEvent.mouseUp(item2);

        await waitFor(() => {
          expect(screen.queryByTestId('menu')).to.equal(null);
        });

        expect(clickSpy.callCount).to.equal(1);

        expect(openChangeSpy.callCount).to.equal(2);
        expect(openChangeSpy.firstCall.args[0]).to.equal(true);
        expect(openChangeSpy.lastCall.args[0]).to.equal(false);
        expect(openChangeSpy.lastCall.args[1].reason).to.equal(REASONS.itemPress);
      });

      it('closes the menu on click, drag outside, release', async () => {
        const { userEvent: user } = await import('vitest/browser');
        const { render: vbrRender } = await import('vitest-browser-react');

        const openChangeSpy = spy();

        const items = [
          <Menu.Item key="1" data-testid="item-1">
            1
          </Menu.Item>,
          <Menu.Item key="2" data-testid="item-2">
            2
          </Menu.Item>,
          <Menu.Item key="3" data-testid="item-3">
            3
          </Menu.Item>,
        ];

        await vbrRender(
          <div>
            <TestMenu
              rootProps={{ onOpenChange: openChangeSpy }}
              popupProps={{ children: items }}
            />
            <div data-testid="outside">Outside</div>
          </div>,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        const outsideElement = screen.getByTestId('outside');

        await user.dragAndDrop(trigger, outsideElement);

        await waitFor(() => {
          expect(screen.queryByTestId('menu')).to.equal(null);
        });

        expect(openChangeSpy.callCount).to.equal(2);
        expect(openChangeSpy.firstCall.args[0]).to.equal(true);
        expect(openChangeSpy.lastCall.args[0]).to.equal(false);
        expect(openChangeSpy.lastCall.args[1].reason).to.equal(REASONS.cancelOpen);
      });
    });

    describe('BaseUIChangeEventDetails', () => {
      it('onOpenChange cancel() prevents opening while uncontrolled', async () => {
        await render(
          <TestMenu
            rootProps={{
              onOpenChange: (nextOpen, eventDetails) => {
                if (nextOpen) {
                  eventDetails.cancel();
                }
              },
            }}
          />,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        await userEvent.click(trigger);

        await waitFor(() => {
          expect(screen.queryByRole('menu')).to.equal(null);
        });
      });
    });
  });

  describe('prop: highlightItemOnHover', () => {
    it('highlights an item on mouse move by default', async () => {
      await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item data-testid="item-1">Item 1</Menu.Item>
                <Menu.Item data-testid="item-2">Item 2</Menu.Item>
                <Menu.Item data-testid="item-3">Item 3</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const item2 = screen.getByTestId('item-2');
      fireEvent.mouseMove(item2);

      await waitFor(() => {
        expect(item2).toHaveFocus();
      });
    });

    it('does not highlight items from mouse movement when disabled', async () => {
      await render(
        <Menu.Root open highlightItemOnHover={false}>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item data-testid="item-1">Item 1</Menu.Item>
                <Menu.Item data-testid="item-2">Item 2</Menu.Item>
                <Menu.Item data-testid="item-3">Item 3</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const item2 = screen.getByTestId('item-2');
      fireEvent.mouseMove(item2);

      await flushMicrotasks();

      expect(item2).not.toHaveFocus();
    });
  });

  describe('dynamic items', () => {
    const { render: renderFakeTimers, clock } = createRenderer({
      clockOptions: {
        shouldAdvanceTime: true,
      },
    });

    clock.withFakeTimers();

    it('skips null items when navigating', async () => {
      function DynamicMenu() {
        const [itemsFiltered, setItemsFiltered] = React.useState(false);

        return (
          <Menu.Root
            onOpenChange={(newOpen) => {
              if (newOpen) {
                setTimeout(() => {
                  setItemsFiltered(true);
                }, 0);
              }
            }}
            onOpenChangeComplete={(newOpen) => {
              if (!newOpen) {
                setItemsFiltered(false);
              }
            }}
          >
            <Menu.Trigger>Toggle</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item>Add to Library</Menu.Item>
                  {!itemsFiltered && (
                    <React.Fragment>
                      <Menu.Item>Add to Playlist</Menu.Item>
                      <Menu.Item>Play Next</Menu.Item>
                      <Menu.Item>Play Last</Menu.Item>
                    </React.Fragment>
                  )}
                  <Menu.Item>Favorite</Menu.Item>
                  <Menu.Item>Share</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        );
      }

      const { user } = await renderFakeTimers(<DynamicMenu />);

      const trigger = screen.getByText('Toggle');

      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.to.equal(null);
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}'); // Share
      await user.keyboard('{ArrowDown}'); // loops back to Add to Library

      expect(screen.queryByRole('menuitem', { name: 'Add to Library' })).toHaveFocus();
    });
  });
});

function ContainedTriggerMenu(props: TestMenuProps) {
  const { triggerProps, ...rest } = props;
  return (
    <TestMenuContents {...rest}>
      <Menu.Trigger {...triggerProps}>Toggle</Menu.Trigger>
    </TestMenuContents>
  );
}

function DetachedTriggerMenu(props: TestMenuProps) {
  const { triggerProps, ...rest } = props;
  const menuHandle = useRefWithInit(() => new Menu.Handle()).current;

  return (
    <React.Fragment>
      <TestMenuContents
        {...rest}
        rootProps={{ ...rest.rootProps, handle: menuHandle }}
      ></TestMenuContents>
      <Menu.Trigger handle={menuHandle} {...triggerProps}>
        Toggle
      </Menu.Trigger>
    </React.Fragment>
  );
}

type TestMenuProps = {
  rootProps?: Menu.Root.Props;
  portalProps?: Menu.Portal.Props;
  popupProps?: Menu.Popup.Props;
  triggerProps?: Menu.Trigger.Props;
  submenuProps?: Menu.SubmenuRoot.Props;
  submenuTriggerProps?: Menu.SubmenuTrigger.Props;
  children?: React.ReactNode;
};

function TestMenuContents(props: TestMenuProps) {
  const { children, rootProps, portalProps, submenuProps, submenuTriggerProps, popupProps } = props;
  return (
    <Menu.Root {...rootProps}>
      {children}
      <Menu.Portal {...portalProps}>
        <Menu.Positioner data-testid="menu-positioner">
          <Menu.Popup data-testid="menu" {...popupProps}>
            {popupProps?.children ?? (
              <React.Fragment>
                <Menu.Item data-testid="item-1">Item 1</Menu.Item>
                <Menu.Item data-testid="item-2">Item 2</Menu.Item>
                <Menu.Item data-testid="item-3" disabled>
                  Item 3
                </Menu.Item>
                <Menu.SubmenuRoot {...submenuProps}>
                  <Menu.SubmenuTrigger data-testid="submenu-trigger" {...submenuTriggerProps}>
                    Item 4
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup data-testid="submenu">
                        <Menu.Item data-testid="item-4_1">Item 4.1</Menu.Item>
                        <Menu.Item data-testid="item-4_2">Item 4.2</Menu.Item>
                        <Menu.SubmenuRoot {...submenuProps}>
                          <Menu.SubmenuTrigger
                            data-testid="nested-submenu-trigger"
                            {...submenuTriggerProps}
                          >
                            Item 4.3
                          </Menu.SubmenuTrigger>
                          <Menu.Portal>
                            <Menu.Positioner>
                              <Menu.Popup data-testid="nested-submenu">
                                <Menu.Item data-testid="item-4_3_1">Item 4.3.1</Menu.Item>
                                <Menu.Item data-testid="item-4_3_2">Item 4.3.2</Menu.Item>
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.SubmenuRoot>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
                <Menu.Item data-testid="item-5">Item 5</Menu.Item>
              </React.Fragment>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
