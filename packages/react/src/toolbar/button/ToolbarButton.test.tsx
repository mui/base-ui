import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { Switch } from '@base-ui-components/react/switch';
import { Menu } from '@base-ui-components/react/menu';
import { Select } from '@base-ui-components/react/select';
import { Dialog } from '@base-ui-components/react/dialog';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { Popover } from '@base-ui-components/react/popover';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';
import { NOOP } from '../../utils/noop';
import { ToolbarRootContext } from '../root/ToolbarRootContext';
import { CompositeRootContext } from '../../composite/root/CompositeRootContext';

const testCompositeContext = {
  highlightedIndex: 0,
  onHighlightedIndexChange: NOOP,
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
      const { getByTestId } = await render(
        <Toolbar.Root>
          <Toolbar.Button data-testid="button" />
        </Toolbar.Root>,
      );

      expect(getByTestId('button')).to.equal(screen.getByRole('button'));
    });
  });

  describe('prop: disabled', () => {
    it('disables the button', async () => {
      const handleClick = spy();
      const handleMouseDown = spy();
      const handlePointerDown = spy();
      const handleKeyDown = spy();

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
      expect(handleClick.callCount).to.equal(0);
      expect(handleMouseDown.callCount).to.equal(0);
      expect(handlePointerDown.callCount).to.equal(0);
      expect(handleKeyDown.callCount).to.equal(0);
    });
  });

  describe('rendering other Base UI components', () => {
    describe('Switch', () => {
      it('renders a switch', async () => {
        const { getByTestId } = await render(
          <Toolbar.Root>
            <Toolbar.Button data-testid="button" render={<Switch.Root />} />
          </Toolbar.Root>,
        );

        expect(getByTestId('button')).to.equal(screen.getByRole('switch'));
      });

      it('handles interactions', async () => {
        const handleCheckedChange = spy();
        const handleClick = spy();
        const { user } = await render(
          <Toolbar.Root>
            <Toolbar.Button
              onClick={handleClick}
              render={<Switch.Root defaultChecked={false} onCheckedChange={handleCheckedChange} />}
            />
          </Toolbar.Root>,
        );

        const switchElement = screen.getByRole('switch');
        expect(switchElement).to.have.attribute('data-unchecked');

        await user.keyboard('[Tab]');
        expect(switchElement).to.have.attribute('data-highlighted');
        expect(switchElement).to.have.attribute('tabindex', '0');

        await user.click(switchElement);
        expect(handleCheckedChange.callCount).to.equal(1);
        expect(handleClick.callCount).to.equal(1);
        expect(switchElement).to.have.attribute('data-checked');

        await user.keyboard('[Enter]');
        expect(handleCheckedChange.callCount).to.equal(2);
        expect(handleClick.callCount).to.equal(2);
        expect(switchElement).to.have.attribute('data-unchecked');

        await user.keyboard('[Space]');
        expect(handleCheckedChange.callCount).to.equal(3);
        expect(handleClick.callCount).to.equal(3);
        expect(switchElement).to.have.attribute('data-checked');
      });

      it('disabled state', async () => {
        const handleCheckedChange = spy();
        const handleClick = spy();
        const { user } = await render(
          <Toolbar.Root>
            <Toolbar.Button
              disabled
              onClick={handleClick}
              render={<Switch.Root onCheckedChange={handleCheckedChange} />}
            />
          </Toolbar.Root>,
        );

        const switchElement = screen.getByRole('switch');

        expect(switchElement).to.not.have.attribute('disabled');
        expect(switchElement).to.have.attribute('data-disabled');
        expect(switchElement).to.have.attribute('aria-disabled', 'true');

        await user.keyboard('[Tab]');
        expect(switchElement).to.have.attribute('data-highlighted');
        expect(switchElement).to.have.attribute('tabindex', '0');

        await user.keyboard('[Enter]');
        expect(handleCheckedChange.callCount).to.equal(0);
        expect(handleClick.callCount).to.equal(0);

        await user.keyboard('[Space]');
        expect(handleCheckedChange.callCount).to.equal(0);
        expect(handleClick.callCount).to.equal(0);

        await user.click(switchElement);
        expect(handleCheckedChange.callCount).to.equal(0);
        expect(handleClick.callCount).to.equal(0);
      });
    });

    describe('Menu', () => {
      it('renders a menu trigger', async () => {
        const { getByTestId } = await render(
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

        expect(getByTestId('button')).to.have.attribute('aria-haspopup', 'menu');
      });

      it('handles interactions', async () => {
        const handleOpenChange = spy();
        const handleClick = spy();
        const { getByRole, getByTestId, user } = await render(
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

        const trigger = getByRole('button', { name: 'Toggle' });

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();

        await user.keyboard('[Enter]');
        expect(handleClick.callCount).to.equal(1);
        expect(handleOpenChange.callCount).to.equal(1);
        expect(screen.queryByRole('menu')).to.not.equal(null);

        await waitFor(() => {
          expect(getByTestId('item-1')).toHaveFocus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(getByTestId('item-2')).toHaveFocus();
        });

        await user.keyboard('[ArrowDown]');
        await waitFor(() => {
          expect(getByTestId('item-3')).toHaveFocus();
        });

        await user.keyboard('[ArrowUp]');
        await waitFor(() => {
          expect(getByTestId('item-2')).toHaveFocus();
        });

        await user.keyboard('[Escape]');
        await waitFor(() => {
          expect(screen.queryByRole('menu')).to.equal(null);
        });

        expect(handleOpenChange.callCount).to.equal(2);

        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });
      });

      it('disabled state', async () => {
        const handleOpenChange = spy();
        const handleClick = spy();
        const { getByRole, user } = await render(
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

        const trigger = getByRole('button', { name: 'Toggle' });
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

        expect(handleClick.callCount).to.equal(0);
        expect(handleOpenChange.callCount).to.equal(0);
        expect(screen.queryByRole('menu')).to.equal(null);
      });
    });

    describe('Select', () => {
      it('renders a select trigger', async () => {
        const { getByTestId } = await render(
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

        const trigger = getByTestId('button');
        expect(trigger).to.equal(screen.getByRole('combobox'));
        expect(trigger).to.have.attribute('aria-haspopup', 'listbox');
      });

      it('handles interactions', async () => {
        const handleValueChange = spy();
        const { getByTestId, user } = await render(
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

        const trigger = getByTestId('button');
        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();

        await user.keyboard('[ArrowDown]');
        expect(screen.queryByRole('listbox')).to.equal(getByTestId('popup'));
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

        expect(handleValueChange.callCount).to.equal(1);
        expect(handleValueChange.args[0][0]).to.equal('b');
      });

      it('disabled state', async () => {
        const onValueChange = spy();
        const onOpenChange = spy();
        const { user } = await render(
          <Toolbar.Root>
            <Select.Root defaultValue="a" onValueChange={onValueChange} onOpenChange={onOpenChange}>
              <Toolbar.Button disabled render={<Select.Trigger />} />
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

        expect(onOpenChange.callCount).to.equal(0);
        expect(onValueChange.callCount).to.equal(0);

        await user.keyboard('[ArrowUp]');
        await user.keyboard('[ArrowDown]');
        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');

        expect(onOpenChange.callCount).to.equal(0);
        expect(onValueChange.callCount).to.equal(0);
      });
    });

    describe('Dialog', () => {
      it('renders a dialog trigger', async () => {
        const { getByTestId } = await render(
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

        expect(getByTestId('trigger')).to.equal(screen.getByRole('button'));
      });

      it('handles interactions', async () => {
        const onOpenChange = spy();
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
        expect(onOpenChange.callCount).to.equal(0);

        await user.keyboard('[Enter]');
        expect(screen.queryByText('title text')).to.not.equal(null);
        expect(onOpenChange.callCount).to.equal(1);
        expect(onOpenChange.firstCall.args[0]).to.equal(true);

        await user.keyboard('[Escape]');
        expect(screen.queryByText('title text')).to.equal(null);
        expect(onOpenChange.callCount).to.equal(2);
        expect(onOpenChange.secondCall.args[0]).to.equal(false);

        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });
      });

      it('disabled state', async () => {
        const onOpenChange = spy();
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
        expect(onOpenChange.callCount).to.equal(0);

        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        await user.keyboard('[ArrowUp]');
        await user.keyboard('[ArrowDown]');
        expect(onOpenChange.callCount).to.equal(0);
      });
    });

    describe('AlertDialog', () => {
      it('renders an alert dialog trigger', async () => {
        const { getByTestId } = await render(
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

        expect(getByTestId('trigger')).to.equal(screen.getByRole('button'));
      });

      it('handles interactions', async () => {
        const onOpenChange = spy();
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
        expect(onOpenChange.callCount).to.equal(0);

        await user.keyboard('[Enter]');
        expect(screen.queryByText('title text')).to.not.equal(null);
        expect(onOpenChange.callCount).to.equal(1);
        expect(onOpenChange.firstCall.args[0]).to.equal(true);

        await user.keyboard('[Escape]');
        expect(screen.queryByText('title text')).to.equal(null);
        expect(onOpenChange.callCount).to.equal(2);
        expect(onOpenChange.secondCall.args[0]).to.equal(false);

        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });
      });

      it('disabled state', async () => {
        const onOpenChange = spy();
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
        expect(onOpenChange.callCount).to.equal(0);

        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        await user.keyboard('[ArrowUp]');
        await user.keyboard('[ArrowDown]');
        expect(onOpenChange.callCount).to.equal(0);
      });
    });

    describe('Popover', () => {
      it('renders a popover trigger', async () => {
        const { getByTestId } = await render(
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

        expect(getByTestId('trigger')).to.equal(screen.getByRole('button'));
        expect(screen.getByRole('button')).to.have.attribute('aria-haspopup', 'dialog');
      });

      it('handles interactions', async () => {
        const onOpenChange = spy();
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
        expect(onOpenChange.callCount).to.equal(0);

        await user.keyboard('[Enter]');
        expect(screen.queryByText('Content')).to.not.equal(null);
        expect(onOpenChange.callCount).to.equal(1);
        expect(onOpenChange.args[0][0]).to.equal(true);

        await user.keyboard('[Escape]');
        expect(onOpenChange.callCount).to.equal(2);
        expect(onOpenChange.args[1][0]).to.equal(false);

        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });
      });

      it('disabled state', async () => {
        const onOpenChange = spy();
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
        expect(onOpenChange.callCount).to.equal(0);

        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        await user.keyboard('[ArrowUp]');
        await user.keyboard('[ArrowDown]');
        expect(onOpenChange.callCount).to.equal(0);
      });
    });

    describe('Toggle and ToggleGroup', () => {
      it('renders toggle and toggle group', async () => {
        const { getAllByRole } = await render(
          <Toolbar.Root>
            <Toolbar.Button render={<Toggle />} value="apple" />
            <ToggleGroup>
              <Toolbar.Button render={<Toggle />} value="one" />
              <Toolbar.Button render={<Toggle />} value="two" />
            </ToggleGroup>
          </Toolbar.Root>,
        );

        expect(getAllByRole('button').length).to.equal(3);
        getAllByRole('button').forEach((button) => {
          expect(button).to.have.attribute('aria-pressed');
        });
      });

      it('handles interactions', async () => {
        const onPressedChange = spy();
        const { getAllByRole, user } = await render(
          <Toolbar.Root>
            <Toolbar.Button render={<Toggle onPressedChange={onPressedChange} />} value="apple" />
            <ToggleGroup>
              <Toolbar.Button render={<Toggle onPressedChange={onPressedChange} />} value="one" />
              <Toolbar.Button render={<Toggle onPressedChange={onPressedChange} />} value="two" />
            </ToggleGroup>
          </Toolbar.Root>,
        );

        const [button1, button2, button3] = getAllByRole('button');

        [button1, button2, button3].forEach((button) => {
          expect(button).to.have.attribute('aria-pressed', 'false');
        });
        expect(onPressedChange.callCount).to.equal(0);

        await user.keyboard('[Tab]');
        await waitFor(() => {
          expect(button1).toHaveFocus();
        });

        await user.keyboard('[Enter]');
        expect(onPressedChange.callCount).to.equal(1);
        expect(button1).to.have.attribute('aria-pressed', 'true');

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(button2).toHaveFocus();
        });

        await user.keyboard('[Space]');
        expect(onPressedChange.callCount).to.equal(2);
        expect(button2).to.have.attribute('aria-pressed', 'true');

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(button3).toHaveFocus();
        });

        await user.keyboard('[Enter]');
        expect(onPressedChange.callCount).to.equal(3);
        expect(button3).to.have.attribute('aria-pressed', 'true');
      });

      it('disabled state', async () => {
        const onPressedChange = spy();
        const { getAllByRole, user } = await render(
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
        const [button1, button2, button3] = getAllByRole('button');

        [button1, button2, button3].forEach((button) => {
          expect(button).to.have.attribute('aria-pressed', 'false');
          expect(button).to.not.have.attribute('disabled');
          expect(button).to.have.attribute('data-disabled');
          expect(button).to.have.attribute('aria-disabled', 'true');
        });
        expect(onPressedChange.callCount).to.equal(0);

        await user.keyboard('[Tab]');
        await waitFor(() => {
          expect(button1).toHaveFocus();
        });
        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        expect(onPressedChange.callCount).to.equal(0);

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(button2).toHaveFocus();
        });
        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        expect(onPressedChange.callCount).to.equal(0);

        await user.keyboard('[ArrowRight]');
        await waitFor(() => {
          expect(button3).toHaveFocus();
        });
        await user.keyboard('[Enter]');
        await user.keyboard('[Space]');
        expect(onPressedChange.callCount).to.equal(0);
      });
    });
  });
});
