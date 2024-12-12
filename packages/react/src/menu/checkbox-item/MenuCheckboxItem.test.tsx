import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';
import { fireEvent, act, waitFor } from '@mui/internal-test-utils';
import { FloatingRootContext, FloatingTree } from '@floating-ui/react';
import { Menu } from '@base-ui-components/react/menu';
import { describeConformance, createRenderer } from '../../../test';
import { MenuRootContext } from '../root/MenuRootContext';

const testRootContext: MenuRootContext = {
  floatingRootContext: {} as FloatingRootContext,
  getPopupProps: (p) => ({ ...p }),
  getTriggerProps: (p) => ({ ...p }),
  getItemProps: (p) => ({ ...p }),
  parentContext: undefined,
  nested: false,
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

describe('<Menu.CheckboxItem />', () => {
  const { render } = createRenderer();
  const user = userEvent.setup();

  describeConformance(<Menu.CheckboxItem />, () => ({
    render: (node) => {
      return render(
        <FloatingTree>
          <MenuRootContext.Provider value={testRootContext}>{node}</MenuRootContext.Provider>
        </FloatingTree>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  it('perf: does not rerender menu items unnecessarily', async function test(t = {}) {
    if (/jsdom/.test(window.navigator.userAgent)) {
      // @ts-expect-error to support mocha and vitest
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this?.skip?.() || t?.skip();
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

    const { getAllByRole } = await render(
      <Menu.Root open>
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
      </Menu.Root>,
    );

    const menuItems = getAllByRole('menuitemcheckbox');
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
        const { getByRole } = await render(
          <Menu.Root>
            <Menu.Trigger>Open</Menu.Trigger>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.CheckboxItem checked={checked}>Item</Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Root>,
        );

        const trigger = getByRole('button', { name: 'Open' });
        await user.click(trigger);

        const item = getByRole('menuitemcheckbox');
        expect(item).to.have.attribute('aria-checked', ariaChecked);
        expect(item).to.have.attribute(`data-${dataState}`, '');
      }),
    );

    it('toggles the checked state when clicked', async () => {
      const { getByRole } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.CheckboxItem>Item</Menu.CheckboxItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitemcheckbox');
      await user.click(item);

      expect(item).to.have.attribute('aria-checked', 'true');
      expect(item).to.have.attribute('data-checked', '');

      await user.click(item);

      expect(item).to.have.attribute('aria-checked', 'false');
      expect(item).to.have.attribute('data-unchecked', '');
    });

    it(`toggles the checked state when Space is pressed`, async () => {
      const { getByRole } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.CheckboxItem>Item</Menu.CheckboxItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('[ArrowDown]');
      const item = getByRole('menuitemcheckbox');

      await waitFor(() => {
        expect(item).toHaveFocus();
      });

      await user.keyboard(`[Space]`);
      expect(item).to.have.attribute('data-checked', '');

      await user.keyboard(`[Space]`);
      expect(item).to.have.attribute('data-unchecked', '');
    });

    it(`toggles the checked state and closes the menu when Enter is pressed`, async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner keepMounted>
            <Menu.Popup>
              <Menu.CheckboxItem>Item</Menu.CheckboxItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('[ArrowDown]');
      const item = getByRole('menuitemcheckbox');

      await waitFor(() => {
        expect(item).toHaveFocus();
      });

      await user.keyboard(`[Enter]`);

      expect(queryByRole('menu', { hidden: false })).to.equal(null);
      await user.click(trigger);
      expect(item).to.have.attribute('data-checked', '');
    });

    it('calls `onCheckedChange` when the item is clicked', async () => {
      const onCheckedChange = spy();
      const { getByRole } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.CheckboxItem onCheckedChange={onCheckedChange}>Item</Menu.CheckboxItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitemcheckbox');
      await user.click(item);

      expect(onCheckedChange.callCount).to.equal(1);
      expect(onCheckedChange.lastCall.args[0]).to.equal(true);

      await user.click(item);

      expect(onCheckedChange.callCount).to.equal(2);
      expect(onCheckedChange.lastCall.args[0]).to.equal(false);
    });

    it('keeps the state when closed and reopened', async () => {
      const { getByRole } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner keepMounted>
            <Menu.Popup>
              <Menu.CheckboxItem>Item</Menu.CheckboxItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitemcheckbox');
      await user.click(item);

      await user.click(trigger);

      await user.click(trigger);

      const itemAfterReopen = getByRole('menuitemcheckbox');
      expect(itemAfterReopen).to.have.attribute('aria-checked', 'true');
      expect(itemAfterReopen).to.have.attribute('data-checked');
    });
  });

  describe('prop: closeOnClick', () => {
    it('when `closeOnClick=true`, closes the menu when the item is clicked', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.CheckboxItem closeOnClick>Item</Menu.CheckboxItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitemcheckbox');
      await user.click(item);

      expect(queryByRole('menu')).to.equal(null);
    });

    it('does not close the menu when the item is clicked by default', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.CheckboxItem>Item</Menu.CheckboxItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitemcheckbox');
      await user.click(item);

      expect(queryByRole('menu')).not.to.equal(null);
    });
  });
});
