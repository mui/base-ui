import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { Switch } from '@base-ui-components/react/switch';
import { Menu } from '@base-ui-components/react/menu';
import { Select } from '@base-ui-components/react/select';
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
        expect(trigger).to.have.attribute('data-highlighted');
        expect(trigger).to.have.attribute('tabindex', '0');

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
        expect(trigger).to.have.attribute('data-highlighted');
        expect(trigger).to.have.attribute('tabindex', '0');

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
        // should have role="combobox"
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
        expect(trigger).to.have.attribute('data-highlighted');
        expect(trigger).to.have.attribute('tabindex', '0');

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
    });
  });
});
