import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { fireEvent, act, waitFor, screen } from '@mui/internal-test-utils';
import { Menu } from '@base-ui/react/menu';
import { describeConformance, createRenderer, isJSDOM } from '#test-utils';

describe('<Menu.CheckboxItem />', () => {
  const { render, clock } = createRenderer({
    clockOptions: {
      shouldAdvanceTime: true,
    },
  });

  clock.withFakeTimers();

  describeConformance(<Menu.CheckboxItem />, () => ({
    render: (node) => {
      return render(<Menu.Root open>{node}</Menu.Root>);
    },
    refInstanceof: window.HTMLDivElement,
  }));

  it('perf: does not rerender menu items unnecessarily', async ({ skip }) => {
    if (isJSDOM) {
      skip();
    }

    const renderItem1Spy = spy();
    const renderItem2Spy = spy();
    const renderItem3Spy = spy();
    const renderItem4Spy = spy();

    const LoggingRoot = React.forwardRef(function LoggingRoot(
      props: any & { renderSpy: () => void },
      ref: React.ForwardedRef<HTMLLIElement>,
    ) {
      const { renderSpy, state, ...other } = props;
      renderSpy();
      return <li {...other} ref={ref} />;
    });

    await render(
      <Menu.Root open>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.CheckboxItem render={<LoggingRoot renderSpy={renderItem1Spy} />} id="item-1">
                1
              </Menu.CheckboxItem>
              <Menu.CheckboxItem render={<LoggingRoot renderSpy={renderItem2Spy} />} id="item-2">
                2
              </Menu.CheckboxItem>
              <Menu.CheckboxItem render={<LoggingRoot renderSpy={renderItem3Spy} />} id="item-3">
                3
              </Menu.CheckboxItem>
              <Menu.CheckboxItem render={<LoggingRoot renderSpy={renderItem4Spy} />} id="item-4">
                4
              </Menu.CheckboxItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    const menuItems = screen.getAllByRole('menuitemcheckbox');
    await act(async () => {
      menuItems[0].focus();
    });

    renderItem1Spy.resetHistory();
    renderItem2Spy.resetHistory();
    renderItem3Spy.resetHistory();
    renderItem4Spy.resetHistory();

    expect(renderItem1Spy.callCount).to.equal(0);

    fireEvent.keyDown(menuItems[0], { key: 'ArrowDown' }); // highlights '2'

    // React renders twice in strict mode, so we expect twice the number of spy calls

    await waitFor(
      () => {
        expect(renderItem1Spy.callCount).to.equal(2); // '1' rerenders as it loses highlight
      },
      { timeout: 1000 },
    );

    await waitFor(
      () => {
        expect(renderItem2Spy.callCount).to.equal(2); // '2' rerenders as it receives highlight
      },
      { timeout: 1000 },
    );

    // neither the highlighted nor the selected state of these options changed,
    // so they don't need to rerender:
    expect(renderItem3Spy.callCount).to.equal(0);
    expect(renderItem4Spy.callCount).to.equal(0);
  });

  describe('state management', () => {
    (
      [
        [true, 'true', 'checked'],
        [false, 'false', 'unchecked'],
      ] as const
    ).forEach(([checked, ariaChecked, dataState]) =>
      it('adds the state and ARIA attributes when checked', async () => {
        const { user } = await render(
          <Menu.Root>
            <Menu.Trigger>Open</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.CheckboxItem checked={checked}>Item</Menu.CheckboxItem>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>,
        );

        const trigger = screen.getByRole('button', { name: 'Open' });
        await user.click(trigger);

        const item = screen.getByRole('menuitemcheckbox');
        expect(item).to.have.attribute('aria-checked', ariaChecked);
        expect(item).to.have.attribute(`data-${dataState}`, '');
      }),
    );

    it('toggles the checked state when clicked', async () => {
      const { user } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.CheckboxItem>Item</Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = screen.getByRole('menuitemcheckbox');
      await user.click(item);

      expect(item).to.have.attribute('aria-checked', 'true');
      expect(item).to.have.attribute('data-checked', '');

      await user.click(item);

      expect(item).to.have.attribute('aria-checked', 'false');
      expect(item).to.have.attribute('data-unchecked', '');
    });

    it(`toggles the checked state when Space is pressed`, async () => {
      const { user } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.CheckboxItem>Item</Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('[ArrowDown]');
      const item = screen.getByRole('menuitemcheckbox');

      await waitFor(() => {
        expect(item).toHaveFocus();
      });

      await user.keyboard(`[Space]`);
      expect(item).to.have.attribute('data-checked', '');

      await user.keyboard(`[Space]`);
      expect(item).to.have.attribute('data-unchecked', '');
    });

    it(`toggles the checked state when Enter is pressed`, async ({ skip }) => {
      if (isJSDOM) {
        skip();
      }

      const { user } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.CheckboxItem>Item</Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('[ArrowDown]');
      const item = screen.getByRole('menuitemcheckbox');

      await waitFor(() => {
        expect(item).toHaveFocus();
      });

      await user.keyboard(`[Enter]`);
      expect(item).to.have.attribute('data-checked', '');
    });

    it('calls `onCheckedChange` when the item is clicked', async () => {
      const onCheckedChange = spy();
      const { user } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.CheckboxItem onCheckedChange={onCheckedChange}>Item</Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = screen.getByRole('menuitemcheckbox');
      await user.click(item);

      expect(onCheckedChange.callCount).to.equal(1);
      expect(onCheckedChange.lastCall.args[0]).to.equal(true);

      await user.click(item);

      expect(onCheckedChange.callCount).to.equal(2);
      expect(onCheckedChange.lastCall.args[0]).to.equal(false);
    });

    it('keeps the state when closed and reopened', async () => {
      const { user } = await render(
        <Menu.Root modal={false}>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal keepMounted>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.CheckboxItem>Item</Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      await act(() => {
        trigger.focus();
      });

      await user.keyboard('{Enter}');

      const item = screen.getByRole('menuitemcheckbox');
      await user.click(item);

      await user.keyboard('{Enter}');
      await user.keyboard('{Enter}');

      const itemAfterReopen = screen.getByRole('menuitemcheckbox');
      expect(itemAfterReopen).to.have.attribute('aria-checked', 'true');
      expect(itemAfterReopen).to.have.attribute('data-checked');
    });
  });

  describe('prop: closeOnClick', () => {
    it('when `closeOnClick=true`, closes the menu when the item is clicked', async () => {
      const { user } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.CheckboxItem closeOnClick>Item</Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = screen.getByRole('menuitemcheckbox');
      await user.click(item);

      expect(screen.queryByRole('menu')).to.equal(null);
    });

    it('does not close the menu when the item is clicked by default', async () => {
      const { user } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.CheckboxItem>Item</Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = screen.getByRole('menuitemcheckbox');
      await user.click(item);

      expect(screen.queryByRole('menu')).not.to.equal(null);
    });
  });

  describe('prop: focusableWhenDisabled', () => {
    it('can be focused but not interacted with when disabled', async () => {
      const handleCheckedChange = spy();
      const handleClick = spy();
      const handleKeyDown = spy();
      const handleKeyUp = spy();

      await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.CheckboxItem
                  disabled
                  onCheckedChange={handleCheckedChange}
                  onClick={handleClick}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                >
                  Item
                </Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const item = screen.getByRole('menuitemcheckbox');
      await act(() => item.focus());
      expect(item).toHaveFocus();

      fireEvent.keyDown(item, { key: 'Enter' });
      expect(handleKeyDown.callCount).to.equal(0);
      expect(handleClick.callCount).to.equal(0);
      expect(handleCheckedChange.callCount).to.equal(0);

      fireEvent.keyUp(item, { key: 'Space' });
      expect(handleKeyUp.callCount).to.equal(0);
      expect(handleClick.callCount).to.equal(0);
      expect(handleCheckedChange.callCount).to.equal(0);

      fireEvent.click(item);
      expect(handleKeyDown.callCount).to.equal(0);
      expect(handleKeyUp.callCount).to.equal(0);
      expect(handleClick.callCount).to.equal(0);
      expect(handleCheckedChange.callCount).to.equal(0);
    });
  });
});
