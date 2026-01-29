import { expect, vi } from 'vitest';
import { Toolbar } from '@base-ui/react/toolbar';
import { Switch } from '@base-ui/react/switch';
import { Menu } from '@base-ui/react/menu';
import { Select } from '@base-ui/react/select';
import { Dialog } from '@base-ui/react/dialog';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Popover } from '@base-ui/react/popover';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { ToolbarRootContext } from '../root/ToolbarRootContext';
import { CompositeRootContext } from '../../composite/root/CompositeRootContext';

const testCompositeContext: CompositeRootContext = {
  highlightedIndex: 0,
  onHighlightedIndexChange: NOOP,
  highlightItemOnHover: false,
  relayKeyboardEvent: NOOP,
};

const testToolbarContext: ToolbarRootContext = {
  disabled: false,
  orientation: 'horizontal',
  setItemMap: NOOP,
};

describe('<Toolbar.Button />', () => {
  const { render } = createRenderer();

  describeConformance(<Toolbar.Button />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render: (node) => {
      return render(
        <ToolbarRootContext.Provider value={testToolbarContext}>
          <CompositeRootContext.Provider value={testCompositeContext}>
            {node}
          </CompositeRootContext.Provider>
        </ToolbarRootContext.Provider>,
      );
    },
  }));

  describe('ARIA attributes', () => {
    it('renders a button', async () => {
      await render(
        <Toolbar.Root>
          <Toolbar.Button data-testid="button" />
        </Toolbar.Root>,
      );

      expect(screen.getByTestId('button')).to.equal(screen.getByRole('button'));
    });
  });

  describe('prop: disabled', () => {
    it('disables the button', async () => {
      const handleClick = vi.fn();
      const handleMouseDown = vi.fn().mockName('handleMouseDown');
      const handlePointerDown = vi.fn();
      const handleKeyDown = vi.fn();

      const { user } = await render(
        <Toolbar.Root>
          <Toolbar.Button
            disabled
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
          />
        </Toolbar.Root>,
      );

      const button = screen.getByRole('button');

      expect(button).to.not.have.attribute('disabled');
      expect(button).to.have.attribute('data-disabled');
      expect(button).to.have.attribute('aria-disabled', 'true');

      await user.click(button);
      await user.keyboard(`[Space]`);
      await user.keyboard(`[Enter]`);
      expect(handleClick).toHaveBeenCalledTimes(0);
      expect(handleMouseDown).toHaveBeenCalledTimes(0);
      expect(handlePointerDown).toHaveBeenCalledTimes(0);
      expect(handleKeyDown).toHaveBeenCalledTimes(0);
    });
  });

  describe('rendering other Base UI components', () => {
    describe('Switch', () => {
      it('renders a switch', async () => {
        vi.spyOn(console, 'error')
          .mockName('console.error')
          .mockImplementation(() => {});

        await render(
          <Toolbar.Root>
            <Toolbar.Button data-testid="button" render={<Switch.Root />} />
          </Toolbar.Root>,
        );

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Base UI: A component that acts as a button was not rendered as a native <button>, which does not match the default. Ensure that the element passed to the `render` prop of the component is a real <button>, or set the `nativeButton` prop on the component to `false`.',
          ),
        );

        expect(screen.getByTestId('button')).to.equal(screen.getByRole('switch'));
      });

      it('handles interactions', async () => {
        vi.spyOn(console, 'error')
          .mockName('console.error')
          .mockImplementation(() => {});

        const handleCheckedChange = vi.fn();
        const handleClick = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <Toolbar.Button
              onClick={handleClick}
              render={<Switch.Root defaultChecked={false} onCheckedChange={handleCheckedChange} />}
            />
          </Toolbar.Root>,
        );

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Base UI: A component that acts as a button was not rendered as a native <button>, which does not match the default. Ensure that the element passed to the `render` prop of the component is a real <button>, or set the `nativeButton` prop on the component to `false`.',
          ),
        );

        const switchElement = screen.getByRole('switch');
        expect(switchElement).to.have.attribute('data-unchecked');

        await user.keyboard('[Tab]');
        expect(switchElement).to.have.attribute('tabindex', '0');

        await user.click(switchElement);
        expect(handleCheckedChange).toHaveBeenCalledTimes(1);
        expect(handleClick).toHaveBeenCalledTimes(1);
        expect(switchElement).to.have.attribute('data-checked');

        await user.keyboard('[Enter]');
        expect(handleCheckedChange).toHaveBeenCalledTimes(2);
        expect(handleClick).toHaveBeenCalledTimes(2);
        expect(switchElement).to.have.attribute('data-unchecked');

        await user.keyboard('[Space]');
        expect(handleCheckedChange).toHaveBeenCalledTimes(3);
        expect(handleClick).toHaveBeenCalledTimes(3);
        expect(switchElement).to.have.attribute('data-checked');
      });

      it('disabled state', async () => {
        vi.spyOn(console, 'error')
          .mockName('console.error')
          .mockImplementation(() => {});

        const handleCheckedChange = vi.fn();
        const handleClick = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <Toolbar.Button
              disabled
              onClick={handleClick}
              render={<Switch.Root onCheckedChange={handleCheckedChange} />}
            />
          </Toolbar.Root>,
        );

        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining(
            'Base UI: A component that acts as a button was not rendered as a native <button>, which does not match the default. Ensure that the element passed to the `render` prop of the component is a real <button>, or set the `nativeButton` prop on the component to `false`.',
          ),
        );

        const switchElement = screen.getByRole('switch');

        expect(switchElement).to.not.have.attribute('disabled');
        expect(switchElement).to.have.attribute('data-disabled');
        expect(switchElement).to.have.attribute('aria-disabled', 'true');

        await user.keyboard('[Tab]');
        expect(switchElement).to.have.attribute('tabindex', '0');

        await user.keyboard('[Enter]');
        expect(handleCheckedChange).toHaveBeenCalledTimes(0);
        expect(handleClick).toHaveBeenCalledTimes(0);

        await user.keyboard('[Space]');
        expect(handleCheckedChange).toHaveBeenCalledTimes(0);
        expect(handleClick).toHaveBeenCalledTimes(0);

        await user.click(switchElement);
        expect(handleCheckedChange).toHaveBeenCalledTimes(0);
        expect(handleClick).toHaveBeenCalledTimes(0);
      });
    });

    describe('Menu', () => {
      it('renders a menu trigger', async () => {
        await render(
          <Toolbar.Root>
            <Menu.Root>
              <Toolbar.Button data-testid="button" render={<Menu.Trigger>Toggle</Menu.Trigger>} />
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item data-testid="item-1">1</Menu.Item>
                    <Menu.Item data-testid="item-2">2</Menu.Item>
                    <Menu.Item data-testid="item-3">3</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Toolbar.Root>,
        );

        expect(screen.getByTestId('button')).to.have.attribute('aria-haspopup', 'menu');
      });

      it('handles interactions', async () => {
        const handleOpenChange = vi.fn();
        const handleClick = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <Menu.Root onOpenChange={handleOpenChange}>
              <Toolbar.Button
                data-testid="button"
                onClick={handleClick}
                render={<Menu.Trigger>Toggle</Menu.Trigger>}
              />
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item data-testid="item-1">1</Menu.Item>
                    <Menu.Item data-testid="item-2">2</Menu.Item>
                    <Menu.Item data-testid="item-3">3</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Toolbar.Root>,
        );

        expect(screen.queryByRole('menu')).to.equal(null);

        const trigger = screen.getByRole('button', { name: 'Toggle' });

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();

        await user.keyboard('[Enter]');
        expect(handleClick).toHaveBeenCalledTimes(1);
        expect(handleOpenChange).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('menu')).not.to.equal(null);

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

        await user.keyboard('[ArrowUp]');
        await waitFor(() => {
          expect(screen.getByTestId('item-2')).toHaveFocus();
        });

        await user.keyboard('[Escape]');
        await waitFor(() => {
          expect(screen.queryByRole('menu')).to.equal(null);
        });

        expect(handleOpenChange).toHaveBeenCalledTimes(2);

        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });
      });

      it('disabled state', async () => {
        const handleOpenChange = vi.fn();
        const handleClick = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <Menu.Root onOpenChange={handleOpenChange}>
              <Toolbar.Button
                data-testid="button"
                disabled
                onClick={handleClick}
                render={<Menu.Trigger>Toggle</Menu.Trigger>}
              />
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Item data-testid="item-1">1</Menu.Item>
                    <Menu.Item data-testid="item-2">2</Menu.Item>
                    <Menu.Item data-testid="item-3">3</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Toolbar.Root>,
        );

        const trigger = screen.getByRole('button', { name: 'Toggle' });
        expect(trigger).to.not.have.attribute('disabled');
        expect(trigger).to.have.attribute('data-disabled');
        expect(trigger).to.have.attribute('aria-disabled', 'true');

        expect(screen.queryByRole('menu')).to.equal(null);

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();

        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        await user.keyboard('[ArrowUp]');
        await user.keyboard('[ArrowDown]');

        expect(handleClick).toHaveBeenCalledTimes(0);
        expect(handleOpenChange).toHaveBeenCalledTimes(0);
        expect(screen.queryByRole('menu')).to.equal(null);
      });
    });

    describe('Select', () => {
      it('renders a select trigger', async () => {
        await render(
          <Toolbar.Root>
            <Select.Root defaultValue="a">
              <Toolbar.Button data-testid="button" render={<Select.Trigger />} />
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.Item value="a">a</Select.Item>
                    <Select.Item value="b">b</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Toolbar.Root>,
        );

        const trigger = screen.getByTestId('button');
        expect(trigger).to.equal(screen.getByRole('combobox'));
        expect(trigger).to.have.attribute('aria-haspopup', 'listbox');
      });

      it.skipIf(!isJSDOM)('handles interactions', async () => {
        const handleValueChange = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <Select.Root defaultValue="a" onValueChange={handleValueChange}>
              <Toolbar.Button data-testid="button" render={<Select.Trigger />} />
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup data-testid="popup">
                    <Select.Item value="a" data-testid="item-a">
                      a
                    </Select.Item>
                    <Select.Item value="b" data-testid="item-b">
                      b
                    </Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </Toolbar.Root>,
        );

        expect(screen.queryByRole('listbox')).to.equal(null);

        const trigger = screen.getByTestId('button');
        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();

        await user.keyboard('[ArrowDown]');
        expect(screen.queryByRole('listbox')).to.equal(screen.getByTestId('popup'));
        await waitFor(() => {
          expect(screen.getByRole('option', { name: 'a' })).toHaveFocus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(screen.getByRole('option', { name: 'b' })).toHaveFocus();
        });

        await user.keyboard('[Enter]');
        await waitFor(() => {
          expect(screen.queryByRole('listbox')).to.equal(null);
        });

        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });

        expect(handleValueChange).toHaveBeenCalledTimes(1);
        expect(handleValueChange).toHaveBeenCalledWith('b', expect.anything());
      });

      it('disabled state', async () => {
        await expect(async () => {
          const onValueChange = vi.fn();
          const onOpenChange = vi.fn();
          const { user } = await render(
            <Toolbar.Root>
              <Select.Root
                defaultValue="a"
                onValueChange={onValueChange}
                onOpenChange={onOpenChange}
              >
                <Toolbar.Button disabled render={<Select.Trigger nativeButton={false} />} />
                <Select.Portal>
                  <Select.Positioner>
                    <Select.Popup>
                      <Select.Item value="a" />
                      <Select.Item value="b" />
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            </Toolbar.Root>,
          );

          expect(screen.queryByRole('listbox')).to.equal(null);

          const trigger = screen.getByRole('combobox');
          expect(trigger).to.not.have.attribute('disabled');
          expect(trigger).to.have.attribute('data-disabled');
          expect(trigger).to.have.attribute('aria-disabled', 'true');

          await user.keyboard('[Tab]');
          expect(trigger).toHaveFocus();

          expect(onOpenChange).toHaveBeenCalledTimes(0);
          expect(onValueChange).toHaveBeenCalledTimes(0);

          await user.keyboard('[ArrowUp]');
          await user.keyboard('[ArrowDown]');
          await user.keyboard('[Enter]');
          await user.keyboard('[Space]');

          expect(onOpenChange).toHaveBeenCalledTimes(0);
          expect(onValueChange).toHaveBeenCalledTimes(0);
        }).toErrorDev([
          'Base UI: A component that acts as a button was rendered as a native <button>, which does not match the default. Ensure that the element passed to the `render` prop of the component is not a real <button>, or set the `nativeButton` prop on the component to `true`.',
        ]);
      });
    });

    describe('Dialog', () => {
      it('renders a dialog trigger', async () => {
        await render(
          <Toolbar.Root>
            <Dialog.Root modal={false}>
              <Toolbar.Button render={<Dialog.Trigger data-testid="trigger" />} />
              <Dialog.Portal>
                <Dialog.Backdrop />
                <Dialog.Popup>
                  <Dialog.Title>title text</Dialog.Title>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </Toolbar.Root>,
        );

        expect(screen.getByTestId('trigger')).to.equal(screen.getByRole('button'));
      });

      it('handles interactions', async () => {
        const onOpenChange = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <Dialog.Root modal={false} onOpenChange={onOpenChange}>
              <Toolbar.Button render={<Dialog.Trigger />} />
              <Dialog.Portal>
                <Dialog.Backdrop />
                <Dialog.Popup>
                  <Dialog.Title>title text</Dialog.Title>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </Toolbar.Root>,
        );

        expect(screen.queryByText('title text')).to.equal(null);

        const trigger = screen.getByRole('button');
        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        expect(onOpenChange).toHaveBeenCalledTimes(0);

        await user.keyboard('[Enter]');
        expect(screen.queryByText('title text')).not.to.equal(null);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenNthCalledWith(1, true, expect.anything());

        await user.keyboard('[Escape]');
        expect(screen.queryByText('title text')).to.equal(null);
        expect(onOpenChange).toHaveBeenCalledTimes(2);
        expect(onOpenChange).toHaveBeenNthCalledWith(2, false, expect.anything());

        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });
      });

      it('disabled state', async () => {
        const onOpenChange = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <Dialog.Root modal={false} onOpenChange={onOpenChange}>
              <Toolbar.Button disabled render={<Dialog.Trigger />} />
              <Dialog.Portal>
                <Dialog.Backdrop />
                <Dialog.Popup>
                  <Dialog.Title>title text</Dialog.Title>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </Toolbar.Root>,
        );

        expect(screen.queryByText('title text')).to.equal(null);

        const trigger = screen.getByRole('button');
        expect(trigger).to.not.have.attribute('disabled');
        expect(trigger).to.have.attribute('data-disabled');
        expect(trigger).to.have.attribute('aria-disabled', 'true');

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        expect(onOpenChange).toHaveBeenCalledTimes(0);

        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        await user.keyboard('[ArrowUp]');
        await user.keyboard('[ArrowDown]');
        expect(onOpenChange).toHaveBeenCalledTimes(0);
      });

      it('prevents composite keydowns from escaping', async () => {
        const onOpenChange = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <Dialog.Root modal={false} onOpenChange={onOpenChange}>
              <Toolbar.Button render={<Dialog.Trigger />}>dialog</Toolbar.Button>
              <Dialog.Portal>
                <Dialog.Popup />
              </Dialog.Portal>
            </Dialog.Root>

            <Toolbar.Button>empty</Toolbar.Button>
          </Toolbar.Root>,
        );

        expect(screen.queryByRole('dialog')).to.equal(null);

        const trigger = screen.getByRole('button', { name: 'dialog' });
        await user.click(trigger);

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).toHaveFocus();
        });

        await user.keyboard('{ArrowRight}');

        expect(onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());
      });
    });

    describe('AlertDialog', () => {
      it('renders an alert dialog trigger', async () => {
        await render(
          <Toolbar.Root>
            <AlertDialog.Root>
              <Toolbar.Button render={<AlertDialog.Trigger data-testid="trigger" />} />
              <AlertDialog.Portal>
                <AlertDialog.Backdrop />
                <AlertDialog.Popup>
                  <AlertDialog.Title>title text</AlertDialog.Title>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </Toolbar.Root>,
        );

        expect(screen.getByTestId('trigger')).to.equal(screen.getByRole('button'));
      });

      it('handles interactions', async () => {
        const onOpenChange = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <AlertDialog.Root onOpenChange={onOpenChange}>
              <Toolbar.Button render={<AlertDialog.Trigger />} />
              <AlertDialog.Portal>
                <AlertDialog.Backdrop />
                <AlertDialog.Popup>
                  <AlertDialog.Title>title text</AlertDialog.Title>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </Toolbar.Root>,
        );

        expect(screen.queryByText('title text')).to.equal(null);

        const trigger = screen.getByRole('button');
        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        expect(onOpenChange).toHaveBeenCalledTimes(0);

        await user.keyboard('[Enter]');
        expect(screen.queryByText('title text')).not.to.equal(null);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenNthCalledWith(1, true, expect.anything());

        await user.keyboard('[Escape]');
        expect(screen.queryByText('title text')).to.equal(null);
        expect(onOpenChange).toHaveBeenCalledTimes(2);
        expect(onOpenChange).toHaveBeenNthCalledWith(2, false, expect.anything());

        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });
      });

      it('disabled state', async () => {
        const onOpenChange = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <AlertDialog.Root onOpenChange={onOpenChange}>
              <Toolbar.Button disabled render={<AlertDialog.Trigger />} />
              <AlertDialog.Portal>
                <AlertDialog.Backdrop />
                <AlertDialog.Popup>
                  <AlertDialog.Title>title text</AlertDialog.Title>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </Toolbar.Root>,
        );

        expect(screen.queryByText('title text')).to.equal(null);

        const trigger = screen.getByRole('button');
        expect(trigger).to.not.have.attribute('disabled');
        expect(trigger).to.have.attribute('data-disabled');
        expect(trigger).to.have.attribute('aria-disabled', 'true');

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        expect(onOpenChange).toHaveBeenCalledTimes(0);

        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        await user.keyboard('[ArrowUp]');
        await user.keyboard('[ArrowDown]');
        expect(onOpenChange).toHaveBeenCalledTimes(0);
      });

      it('prevents composite keydowns from escaping', async () => {
        const onOpenChange = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <AlertDialog.Root onOpenChange={onOpenChange}>
              <Toolbar.Button render={<AlertDialog.Trigger />}>dialog</Toolbar.Button>
              <AlertDialog.Portal>
                <AlertDialog.Popup />
              </AlertDialog.Portal>
            </AlertDialog.Root>

            <Toolbar.Button>empty</Toolbar.Button>
          </Toolbar.Root>,
        );

        expect(screen.queryByRole('dialog')).to.equal(null);

        const trigger = screen.getByRole('button', { name: 'dialog' });
        await user.click(trigger);

        await waitFor(() => {
          expect(screen.queryByRole('alertdialog')).toHaveFocus();
        });

        await user.keyboard('{ArrowRight}');

        expect(onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());
      });
    });

    describe('Popover', () => {
      it('renders a popover trigger', async () => {
        await render(
          <Toolbar.Root>
            <Popover.Root>
              <Toolbar.Button render={<Popover.Trigger data-testid="trigger" />} />
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>Content</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </Toolbar.Root>,
        );

        expect(screen.getByTestId('trigger')).to.equal(screen.getByRole('button'));
        expect(screen.getByRole('button')).to.have.attribute('aria-haspopup', 'dialog');
      });

      it('handles interactions', async () => {
        const onOpenChange = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <Popover.Root onOpenChange={onOpenChange}>
              <Toolbar.Button render={<Popover.Trigger />} />
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>Content</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </Toolbar.Root>,
        );

        expect(screen.queryByText('Content')).to.equal(null);

        const trigger = screen.getByRole('button');
        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        expect(onOpenChange).toHaveBeenCalledTimes(0);

        await user.keyboard('[Enter]');
        expect(screen.queryByText('Content')).not.to.equal(null);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenNthCalledWith(1, true, expect.anything());

        await user.keyboard('[Escape]');
        expect(onOpenChange).toHaveBeenCalledTimes(2);
        expect(onOpenChange).toHaveBeenNthCalledWith(2, false, expect.anything());
        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });
      });

      it('disabled state', async () => {
        const onOpenChange = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <Popover.Root onOpenChange={onOpenChange}>
              <Toolbar.Button disabled render={<Popover.Trigger />} />
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>Content</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </Toolbar.Root>,
        );

        expect(screen.queryByText('Content')).to.equal(null);

        const trigger = screen.getByRole('button');
        expect(trigger).to.not.have.attribute('disabled');
        expect(trigger).to.have.attribute('data-disabled');
        expect(trigger).to.have.attribute('aria-disabled', 'true');

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();
        expect(onOpenChange).toHaveBeenCalledTimes(0);

        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        await user.keyboard('[ArrowUp]');
        await user.keyboard('[ArrowDown]');
        expect(onOpenChange).toHaveBeenCalledTimes(0);
      });
    });

    describe('Toggle and ToggleGroup', () => {
      it('renders toggle and toggle group', async () => {
        await render(
          <Toolbar.Root>
            <Toolbar.Button render={<Toggle />} value="apple" />
            <ToggleGroup>
              <Toolbar.Button render={<Toggle />} value="one" />
              <Toolbar.Button render={<Toggle />} value="two" />
            </ToggleGroup>
          </Toolbar.Root>,
        );

        expect(screen.getAllByRole('button').length).to.equal(3);
        screen.getAllByRole('button').forEach((button) => {
          expect(button).to.have.attribute('aria-pressed');
        });
      });

      it('handles interactions', async () => {
        const onPressedChange = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <Toolbar.Button render={<Toggle onPressedChange={onPressedChange} />} value="apple" />
            <ToggleGroup>
              <Toolbar.Button render={<Toggle onPressedChange={onPressedChange} />} value="one" />
              <Toolbar.Button render={<Toggle onPressedChange={onPressedChange} />} value="two" />
            </ToggleGroup>
          </Toolbar.Root>,
        );

        const [button1, button2, button3] = screen.getAllByRole('button');

        [button1, button2, button3].forEach((button) => {
          expect(button).to.have.attribute('aria-pressed', 'false');
        });
        expect(onPressedChange).toHaveBeenCalledTimes(0);

        await user.keyboard('[Tab]');
        await waitFor(() => {
          expect(button1).toHaveFocus();
        });

        await user.keyboard('[Enter]');
        expect(onPressedChange).toHaveBeenCalledTimes(1);
        expect(button1).to.have.attribute('aria-pressed', 'true');

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(button2).toHaveFocus();
        });

        await user.keyboard('[Space]');
        expect(onPressedChange).toHaveBeenCalledTimes(2);
        expect(button2).to.have.attribute('aria-pressed', 'true');

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(button3).toHaveFocus();
        });

        await user.keyboard('[Enter]');
        expect(onPressedChange).toHaveBeenCalledTimes(3);
        expect(button3).to.have.attribute('aria-pressed', 'true');
      });

      it('disabled state', async () => {
        const onPressedChange = vi.fn();
        const { user } = await render(
          <Toolbar.Root>
            <Toolbar.Button
              disabled
              render={<Toggle onPressedChange={onPressedChange} />}
              value="apple"
            />
            <ToggleGroup>
              <Toolbar.Button
                disabled
                render={<Toggle onPressedChange={onPressedChange} />}
                value="one"
              />
              <Toolbar.Button
                disabled
                render={<Toggle onPressedChange={onPressedChange} />}
                value="two"
              />
            </ToggleGroup>
          </Toolbar.Root>,
        );
        const [button1, button2, button3] = screen.getAllByRole('button');

        [button1, button2, button3].forEach((button) => {
          expect(button).to.have.attribute('aria-pressed', 'false');
          expect(button).to.not.have.attribute('disabled');
          expect(button).to.have.attribute('data-disabled');
          expect(button).to.have.attribute('aria-disabled', 'true');
        });
        expect(onPressedChange).toHaveBeenCalledTimes(0);

        await user.keyboard('[Tab]');
        await waitFor(() => {
          expect(button1).toHaveFocus();
        });
        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        expect(onPressedChange).toHaveBeenCalledTimes(0);

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(button2).toHaveFocus();
        });
        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        expect(onPressedChange).toHaveBeenCalledTimes(0);

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(button3).toHaveFocus();
        });
        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        expect(onPressedChange).toHaveBeenCalledTimes(0);
      });
    });
  });
});
