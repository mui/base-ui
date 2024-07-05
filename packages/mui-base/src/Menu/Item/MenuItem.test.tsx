import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { fireEvent, act } from '@mui/internal-test-utils';
import { FloatingRootContext, FloatingTree } from '@floating-ui/react';
import * as Menu from '@base_ui/react/Menu';
import { MenuRootContext } from '@base_ui/react/Menu';
import { describeConformance, createRenderer } from '../../../test';

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
};

describe('<Menu.Item />', () => {
  const { render } = createRenderer();

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

  it('perf: does not rerender menu items unnecessarily', async () => {
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
    act(() => {
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

    expect(renderItem1Spy.callCount).to.equal(4); // '1' rerenders as it loses highlight
    expect(renderItem2Spy.callCount).to.equal(4); // '2' rerenders as it receives highlight

    // neither the highlighted nor the selected state of these options changed,
    // so they don't need to rerender:
    expect(renderItem3Spy.callCount).to.equal(0);
    expect(renderItem4Spy.callCount).to.equal(0);
  });
});
