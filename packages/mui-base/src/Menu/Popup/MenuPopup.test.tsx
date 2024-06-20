import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import {
  createMount,
  createRenderer,
  fireEvent,
  act,
  MuiRenderResult,
  RenderOptions,
  flushMicrotasks,
} from '@mui/internal-test-utils';
import * as Menu from '@base_ui/react/Menu';
import { MenuRootContext, MenuRootContextValue } from '@base_ui/react/Menu';
import { describeConformance } from '../../../test/describeConformance';
import { IndexableMap } from '../../utils/IndexableMap';

const testContext: MenuRootContextValue = {
  dispatch: () => {},
  popupId: 'menu-popup',
  registerPopup: () => {},
  registerTrigger: () => {},
  state: {
    open: true,
    changeReason: null,
    items: new IndexableMap(),
    highlightedValue: null,
    selectedValues: [],
    listboxRef: { current: null },
    settings: {
      disabledItemsFocusable: true,
      disableListWrap: false,
      focusManagement: 'DOM',
      orientation: 'vertical',
      pageSize: 1,
      selectionMode: 'none',
    },
  },
  triggerElement: null,
};

describe('<Menu.Popup />', () => {
  const mount = createMount();
  const { render: internalRender } = createRenderer();

  async function render(
    element: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    options?: RenderOptions,
  ): Promise<MuiRenderResult> {
    const rendered = internalRender(element, options);
    await flushMicrotasks();
    return rendered;
  }

  describeConformance(<Menu.Popup />, () => ({
    inheritComponent: 'div',
    render: (node) => {
      return render(
        <MenuRootContext.Provider value={testContext}>{node}</MenuRootContext.Provider>,
      );
    },
    mount: (node: React.ReactNode) => {
      const wrapper = mount(
        <MenuRootContext.Provider value={testContext}>{node}</MenuRootContext.Provider>,
      );
      return wrapper.childAt(0);
    },
    refInstanceof: window.HTMLDivElement,
    skip: ['reactTestRenderer'],
  }));

  describe('prop: onItemsChange', () => {
    it('should be called when the menu items change', async () => {
      const handleItemsChange = spy();

      const { setProps } = await render(
        <MenuRootContext.Provider value={testContext}>
          <Menu.Popup onItemsChange={handleItemsChange}>
            <Menu.Item key="1">1</Menu.Item>
            <Menu.Item key="2">2</Menu.Item>
          </Menu.Popup>
        </MenuRootContext.Provider>,
      );

      // The first call is the initial render.
      expect(handleItemsChange.callCount).to.equal(1);

      setProps({
        children: (
          <Menu.Popup onItemsChange={handleItemsChange}>
            <Menu.Item key="1">1</Menu.Item>
            <Menu.Item key="3">3</Menu.Item>
          </Menu.Popup>
        ),
      });

      expect(handleItemsChange.callCount).to.equal(2);
    });
  });

  describe('prop: anchor', () => {
    it('should be placed near the specified element', async function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }

      function TestComponent() {
        const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

        return (
          <div>
            <MenuRootContext.Provider value={testContext}>
              <Menu.Positioner side="bottom" alignment="start" anchor={anchor}>
                <Menu.Popup>
                  <Menu.Item>1</Menu.Item>
                  <Menu.Item>2</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </MenuRootContext.Provider>
            <div data-testid="anchor" style={{ marginTop: '100px' }} ref={setAnchor} />
          </div>
        );
      }

      const { getByTestId } = await render(<TestComponent />);

      const popup = getByTestId('popup');
      const anchor = getByTestId('anchor');

      const anchorPosition = anchor.getBoundingClientRect();

      await new Promise<void>((resolve) => {
        // position gets updated in the next frame
        requestAnimationFrame(() => {
          expect(popup.style.getPropertyValue('transform')).to.equal(
            `translate(${anchorPosition.left}px, ${anchorPosition.bottom}px)`,
          );
          resolve();
        });
      });
    });

    it('should be placed at the specified position', async function test() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }

      const boundingRect = {
        x: 200,
        y: 100,
        top: 100,
        left: 200,
        bottom: 100,
        right: 200,
        height: 0,
        width: 0,
        toJSON: () => {},
      };

      const virtualElement = { getBoundingClientRect: () => boundingRect };

      const { getByTestId } = await render(
        <MenuRootContext.Provider value={testContext}>
          <Menu.Positioner side="bottom" alignment="start" anchor={virtualElement}>
            <Menu.Popup>
              <Menu.Item>1</Menu.Item>
              <Menu.Item>2</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </MenuRootContext.Provider>,
      );
      const popup = getByTestId('popup');

      await new Promise<void>((resolve) => {
        // position gets updated in the next frame
        requestAnimationFrame(() => {
          expect(popup.style.getPropertyValue('transform')).to.equal(`translate(200px, 100px)`);
          resolve();
        });
      });
    });
  });

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
      <MenuRootContext.Provider value={testContext}>
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
      </MenuRootContext.Provider>,
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
