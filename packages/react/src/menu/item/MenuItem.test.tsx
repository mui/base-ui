import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { FloatingRootContext, FloatingTree } from '@floating-ui/react';
import { Menu } from '@base-ui-components/react/menu';
import { describeConformance, createRenderer } from '#test-utils';
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
  popupRef: { current: null },
  mounted: true,
  transitionStatus: undefined,
  typingRef: { current: false },
  modal: false,
  positionerRef: { current: null },
  allowMouseUpTriggerRef: { current: false },
};

describe('<Menu.Item />', () => {
  const { render } = createRenderer();
  const user = userEvent.setup();

  describeConformance(<Menu.Item />, () => ({
    render: (node) => {
      return render(
        <FloatingTree>
          <MenuRootContext.Provider value={testRootContext}>{node}</MenuRootContext.Provider>
        </FloatingTree>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  it('calls the onClick handler when clicked', async () => {
    const onClick = spy();
    await render(
      <Menu.Root open>
        <Menu.Positioner>
          <Menu.Popup>
            <Menu.Item onClick={onClick} id="item">
              Item
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Root>,
    );

    const item = screen.getByRole('menuitem');
    await user.click(item);

    expect(onClick.callCount).to.equal(1);
  });

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
            <Menu.Item render={<LoggingRoot renderSpy={renderItem1Spy} />} id="item-1">
              1
            </Menu.Item>
            <Menu.Item render={<LoggingRoot renderSpy={renderItem2Spy} />} id="item-2">
              2
            </Menu.Item>
            <Menu.Item render={<LoggingRoot renderSpy={renderItem3Spy} />} id="item-3">
              3
            </Menu.Item>
            <Menu.Item render={<LoggingRoot renderSpy={renderItem4Spy} />} id="item-4">
              4
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Root>,
    );

    const menuItems = getAllByRole('menuitem');
    await act(async () => {
      menuItems[0].focus();
    });

    renderItem1Spy.resetHistory();
    renderItem2Spy.resetHistory();
    renderItem3Spy.resetHistory();
    renderItem4Spy.resetHistory();

    expect(renderItem1Spy.callCount).to.equal(0);

    await user.keyboard('{ArrowDown}'); // highlights '2'

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

  describe('prop: closeOnClick', () => {
    it('closes the menu when the item is clicked by default', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>Item</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitem');
      await user.click(item);

      expect(queryByRole('menu')).to.equal(null);
    });

    it('when `closeOnClick=false` does not close the menu when the item is clicked', async () => {
      const { getByRole, queryByRole } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item closeOnClick={false}>Item</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitem');
      await user.click(item);

      expect(queryByRole('menu')).not.to.equal(null);
    });
  });
});
