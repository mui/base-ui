import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';
import { fireEvent, act, waitFor } from '@mui/internal-test-utils';
import { FloatingRootContext, FloatingTree } from '@floating-ui/react';
import * as Menu from '@base_ui/react/Menu';
import { MenuRootContext } from '@base_ui/react/Menu';
import { describeConformance, createRenderer } from '#test-utils';
import { MenuRadioGroupContext } from '../RadioGroup/MenuRadioGroupContext';

const testRootContext: MenuRootContext = {
  floatingRootContext: {} as FloatingRootContext,
  getPositionerProps: (p) => ({ ...p }),
  getTriggerProps: (p) => ({ ...p }),
  getItemProps: (p) => ({ ...p }),
  parentContext: null,
  nested: false,
  triggerElement: null,
  setTriggerElement: () => {},
  setPositionerElement: () => {},
  activeIndex: null,
  disabled: false,
  itemDomElements: { current: [] },
  itemLabels: { current: [] },
  open: true,
  setOpen: () => {},
  clickAndDragEnabled: false,
  setClickAndDragEnabled: () => {},
  popupRef: { current: null },
  mounted: true,
  transitionStatus: undefined,
  typingRef: { current: false },
};

const testRadioGroupContext = {
  value: '0',
  setValue: () => {},
};

describe('<Menu.RadioItem />', () => {
  const { render } = createRenderer();
  const user = userEvent.setup();

  describeConformance(<Menu.RadioItem value="0" />, () => ({
    render: (node) => {
      return render(
        <FloatingTree>
          <MenuRootContext.Provider value={testRootContext}>
            <MenuRadioGroupContext.Provider value={testRadioGroupContext}>
              {node}
            </MenuRadioGroupContext.Provider>
          </MenuRootContext.Provider>
        </FloatingTree>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  it('perf: does not rerender menu items unnecessarily', async function test() {
    if (/jsdom/.test(window.navigator.userAgent)) {
      this.skip();
    }

    const renderItem1Spy = spy();
    const renderItem2Spy = spy();
    const renderItem3Spy = spy();
    const renderItem4Spy = spy();

    const LoggingRoot = React.forwardRef(function LoggingRoot(
      props: any & { renderSpy: () => void },
      ref: React.ForwardedRef<HTMLLIElement>,
    ) {
      const { renderSpy, ownerState, ...other } = props;
      renderSpy();
      return <li {...other} ref={ref} />;
    });

    const { getAllByRole } = await render(
      <Menu.Root open animated={false}>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.RadioGroup>
              <Menu.RadioItem
                value={1}
                render={<LoggingRoot renderSpy={renderItem1Spy} />}
                id="item-1"
              >
                1
              </Menu.RadioItem>
              <Menu.RadioItem
                value={2}
                render={<LoggingRoot renderSpy={renderItem2Spy} />}
                id="item-2"
              >
                2
              </Menu.RadioItem>
              <Menu.RadioItem
                value={3}
                render={<LoggingRoot renderSpy={renderItem3Spy} />}
                id="item-3"
              >
                3
              </Menu.RadioItem>
              <Menu.RadioItem
                value={4}
                render={<LoggingRoot renderSpy={renderItem4Spy} />}
                id="item-4"
              >
                4
              </Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Root>,
    );

    const menuItems = getAllByRole('menuitemradio');
    await act(() => {
      menuItems[0].focus();
    });

    renderItem1Spy.resetHistory();
    renderItem2Spy.resetHistory();
    renderItem3Spy.resetHistory();
    renderItem4Spy.resetHistory();

    expect(renderItem1Spy.callCount).to.equal(0);

    fireEvent.keyDown(menuItems[0], { key: 'ArrowDown' }); // highlights '2'

    // React renders twice in strict mode, so we expect twice the number of spy calls
    // Also, useButton's focusVisible polyfill causes an extra render when focus is gained/lost.

    await waitFor(
      () => {
        expect(renderItem1Spy.callCount).to.equal(4); // '1' rerenders as it loses highlight
      },
      { timeout: 1000 },
    );

    await waitFor(
      () => {
        expect(renderItem2Spy.callCount).to.equal(4); // '2' rerenders as it receives highlight
      },
      { timeout: 1000 },
    );

    // neither the highlighted nor the selected state of these options changed,
    // so they don't need to rerender:
    expect(renderItem3Spy.callCount).to.equal(0);
    expect(renderItem4Spy.callCount).to.equal(0);
  });

  describe('state management', () => {
    it('adds the state and ARIA attributes when selected', async () => {
      const { getByRole } = await render(
        <Menu.Root animated={false}>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.RadioGroup defaultValue={0}>
                <Menu.RadioItem value={1}>Item</Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitemradio');
      await user.click(item);

      expect(item).to.have.attribute('aria-checked', 'true');
      expect(item).to.have.attribute('data-state', 'checked');
    });

    ['Space', 'Enter'].forEach((key) => {
      it(`selects the item when ${key} is pressed`, async () => {
        const { getByRole } = await render(
          <Menu.Root animated={false}>
            <Menu.Trigger>Open</Menu.Trigger>
            <Menu.Positioner>
              <Menu.RadioGroup defaultValue={0}>
                <Menu.RadioItem value={1}>Item</Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Positioner>
          </Menu.Root>,
        );

        const trigger = getByRole('button', { name: 'Open' });
        await act(() => {
          trigger.focus();
        });
        await user.keyboard('[ArrowDown]');
        const item = getByRole('menuitemradio');

        await waitFor(() => {
          expect(item).toHaveFocus();
        });

        await user.keyboard(`[${key}]`);
        expect(item).to.have.attribute('data-state', 'checked');
      });
    });

    it('calls `onValueChange` when the item is clicked', async () => {
      const onValueChange = spy();
      const { getByRole } = await render(
        <Menu.Root animated={false}>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.RadioGroup defaultValue={0} onValueChange={onValueChange}>
                <Menu.RadioItem value={1}>Item</Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitemradio');
      await user.click(item);

      expect(onValueChange.callCount).to.equal(1);
      expect(onValueChange.lastCall.args[0]).to.equal(1);
    });

    it('keeps the state when closed and reopened', async () => {
      const { getByRole } = await render(
        <Menu.Root animated={false}>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner keepMounted>
            <Menu.Popup>
              <Menu.RadioGroup defaultValue={0}>
                <Menu.RadioItem value={1}>Item</Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitemradio');
      await user.click(item);

      await user.click(trigger);

      await user.click(trigger);

      const itemAfterReopen = getByRole('menuitemradio');
      expect(itemAfterReopen).to.have.attribute('aria-checked', 'true');
      expect(itemAfterReopen).to.have.attribute('data-state', 'checked');
    });
  });

  describe('prop: closeOnClick', () => {
    it('when `closeOnClick=true`, closes the menu when the item is clicked', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root animated={false}>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.RadioGroup defaultValue={0}>
                <Menu.RadioItem closeOnClick value={1}>
                  Item
                </Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitemradio');
      await user.click(item);

      expect(queryByRole('menu')).to.equal(null);
    });

    it('does not close the menu when the item is clicked by default', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root animated={false}>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.RadioGroup defaultValue={0}>
                <Menu.RadioItem value={1}>Item</Menu.RadioItem>
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitemradio');
      await user.click(item);

      expect(queryByRole('menu')).not.to.equal(null);
    });
  });
});
