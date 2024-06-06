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
import {
  MenuRootContext,
  MenuRootContextValue,
  MenuPopupProvider,
  useMenuPopup,
} from '@base_ui/react/Menu';
import { Popper } from '@base_ui/react/Popper';
import { describeConformanceUnstyled } from '../../../test/describeConformanceUnstyled';

function createAnchor() {
  const anchor = document.createElement('div');
  document.body.appendChild(anchor);
  return anchor;
}

const testContext: MenuRootContextValue = {
  dispatch: () => {},
  popupId: 'menu-popup',
  registerPopup: () => {},
  registerTrigger: () => {},
  state: { open: true, changeReason: null },
  triggerElement: null,
};

describe('<Menu />', () => {
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

  describeConformanceUnstyled(<Menu.Popup />, () => ({
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
    skip: ['reactTestRenderer', 'componentProp', 'slotsProp'],
  }));

  describe('after initialization', () => {
    function Test() {
      return (
        <MenuRootContext.Provider value={testContext}>
          <Menu.Popup>
            <Menu.Item>1</Menu.Item>
            <Menu.Item>2</Menu.Item>
            <Menu.Item>3</Menu.Item>
          </Menu.Popup>
        </MenuRootContext.Provider>
      );
    }

    it('highlights the first item when the menu is opened', async () => {
      const { getAllByRole } = await render(<Test />);
      const [firstItem, ...otherItems] = getAllByRole('menuitem');

      expect(firstItem.tabIndex).to.equal(0);
      otherItems.forEach((item) => {
        expect(item.tabIndex).to.equal(-1);
      });
    });

    it('highlights first item when down arrow key opens the menu', async () => {
      const context: MenuRootContextValue = {
        ...testContext,
        state: {
          ...testContext.state,
          open: true,
          changeReason: {
            type: 'keydown',
            key: 'ArrowDown',
          } as React.KeyboardEvent,
        },
      };
      const { getAllByRole } = await render(
        <MenuRootContext.Provider value={context}>
          <Menu.Popup>
            <Menu.Item>1</Menu.Item>
            <Menu.Item>2</Menu.Item>
            <Menu.Item>3</Menu.Item>
          </Menu.Popup>
        </MenuRootContext.Provider>,
      );
      const [firstItem, ...otherItems] = getAllByRole('menuitem');

      expect(firstItem.tabIndex).to.equal(0);
      otherItems.forEach((item) => {
        expect(item.tabIndex).to.equal(-1);
      });
    });

    it('highlights last item when up arrow key opens the menu', async () => {
      const context: MenuRootContextValue = {
        ...testContext,
        state: {
          ...testContext.state,
          open: true,
          changeReason: {
            key: 'ArrowUp',
            type: 'keydown',
          } as React.KeyboardEvent,
        },
      };
      const { getAllByRole } = await render(
        <MenuRootContext.Provider value={context}>
          <Menu.Popup>
            <Menu.Item>1</Menu.Item>
            <Menu.Item>2</Menu.Item>
            <Menu.Item>3</Menu.Item>
          </Menu.Popup>
        </MenuRootContext.Provider>,
      );

      const [firstItem, secondItem, lastItem] = getAllByRole('menuitem');

      expect(lastItem.tabIndex).to.equal(0);
      [firstItem, secondItem].forEach((item) => {
        expect(item.tabIndex).to.equal(-1);
      });
    });

    it('highlights last non-disabled item when disabledItemsFocusable is set to false', async () => {
      const CustomMenu = React.forwardRef(function CustomMenu(
        props: React.ComponentPropsWithoutRef<'ul'>,
        ref: React.Ref<HTMLUListElement>,
      ) {
        const { children, ...other } = props;

        const { open, triggerElement, contextValue, getListboxProps } = useMenuPopup({
          listboxRef: ref,
          disabledItemsFocusable: false,
        });

        const anchorEl = triggerElement ?? createAnchor();

        return (
          <Popper open={open} anchorEl={anchorEl}>
            <ul className="menu-root" {...other} {...getListboxProps()}>
              <MenuPopupProvider value={contextValue}>{children}</MenuPopupProvider>
            </ul>
          </Popper>
        );
      });

      const context: MenuRootContextValue = {
        ...testContext,
        state: {
          ...testContext.state,
          open: true,
          changeReason: {
            key: 'ArrowUp',
            type: 'keydown',
          } as React.KeyboardEvent,
        },
      };
      const { getAllByRole } = await render(
        <MenuRootContext.Provider value={context}>
          <CustomMenu>
            <Menu.Item>1</Menu.Item>
            <Menu.Item>2</Menu.Item>
            <Menu.Item disabled>3</Menu.Item>
          </CustomMenu>
        </MenuRootContext.Provider>,
      );
      const [firstItem, secondItem, lastItem] = getAllByRole('menuitem');

      expect(secondItem.tabIndex).to.equal(0);
      [firstItem, lastItem].forEach((item) => {
        expect(item.tabIndex).to.equal(-1);
      });
    });
  });

  describe('keyboard navigation', () => {
    it('changes the highlighted item using the arrow keys', async () => {
      const { getByTestId } = await render(
        <MenuRootContext.Provider value={testContext}>
          <Menu.Popup>
            <Menu.Item data-testid="item-1">1</Menu.Item>
            <Menu.Item data-testid="item-2">2</Menu.Item>
            <Menu.Item data-testid="item-3">3</Menu.Item>
          </Menu.Popup>
        </MenuRootContext.Provider>,
      );

      const item1 = getByTestId('item-1');
      const item2 = getByTestId('item-2');
      const item3 = getByTestId('item-3');

      act(() => {
        item1.focus();
      });

      fireEvent.keyDown(item1, { key: 'ArrowDown' });
      expect(document.activeElement).to.equal(item2);

      fireEvent.keyDown(item2, { key: 'ArrowDown' });
      expect(document.activeElement).to.equal(item3);

      fireEvent.keyDown(item3, { key: 'ArrowUp' });
      expect(document.activeElement).to.equal(item2);
    });

    it('changes the highlighted item using the Home and End keys', async () => {
      const { getByTestId } = await render(
        <MenuRootContext.Provider value={testContext}>
          <Menu.Popup>
            <Menu.Item data-testid="item-1">1</Menu.Item>
            <Menu.Item data-testid="item-2">2</Menu.Item>
            <Menu.Item data-testid="item-3">3</Menu.Item>
          </Menu.Popup>
        </MenuRootContext.Provider>,
      );

      const item1 = getByTestId('item-1');
      const item3 = getByTestId('item-3');

      act(() => {
        item1.focus();
      });

      fireEvent.keyDown(item1, { key: 'End' });
      expect(document.activeElement).to.equal(getByTestId('item-3'));

      fireEvent.keyDown(item3, { key: 'Home' });
      expect(document.activeElement).to.equal(getByTestId('item-1'));
    });

    it('includes disabled items during keyboard navigation', async () => {
      const { getByTestId } = await render(
        <MenuRootContext.Provider value={testContext}>
          <Menu.Popup>
            <Menu.Item data-testid="item-1">1</Menu.Item>
            <Menu.Item disabled data-testid="item-2">
              2
            </Menu.Item>
          </Menu.Popup>
        </MenuRootContext.Provider>,
      );

      const item1 = getByTestId('item-1');
      const item2 = getByTestId('item-2');

      act(() => {
        item1.focus();
      });

      fireEvent.keyDown(item1, { key: 'ArrowDown' });
      expect(document.activeElement).to.equal(item2);

      expect(item2).to.have.attribute('aria-disabled', 'true');
    });

    describe('text navigation', () => {
      it('changes the highlighted item', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <MenuRootContext.Provider value={testContext}>
            <Menu.Popup>
              <Menu.Item>Aa</Menu.Item>
              <Menu.Item>Ba</Menu.Item>
              <Menu.Item>Bb</Menu.Item>
              <Menu.Item>Ca</Menu.Item>
              <Menu.Item>Cb</Menu.Item>
              <Menu.Item>Cd</Menu.Item>
            </Menu.Popup>
          </MenuRootContext.Provider>,
        );

        const items = getAllByRole('menuitem');

        act(() => {
          items[0].focus();
        });

        fireEvent.keyDown(items[0], { key: 'c' });
        expect(document.activeElement).to.equal(getByText('Ca'));
        expect(getByText('Ca')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[3], { key: 'd' });
        expect(document.activeElement).to.equal(getByText('Cd'));
        expect(getByText('Cd')).to.have.attribute('tabindex', '0');
      });

      it('repeated keys circulate all items starting with that letter', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <MenuRootContext.Provider value={testContext}>
            <Menu.Popup>
              <Menu.Item>Aa</Menu.Item>
              <Menu.Item>Ba</Menu.Item>
              <Menu.Item>Bb</Menu.Item>
              <Menu.Item>Ca</Menu.Item>
            </Menu.Popup>
          </MenuRootContext.Provider>,
        );

        const items = getAllByRole('menuitem');

        act(() => {
          items[0].focus();
        });

        fireEvent.keyDown(items[0], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Ba'));
        expect(getByText('Ba')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[1], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Bb'));
        expect(getByText('Bb')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[2], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Ba'));
        expect(getByText('Ba')).to.have.attribute('tabindex', '0');
      });

      it('changes the highlighted item using text navigation on label prop', async () => {
        const { getAllByRole } = await render(
          <MenuRootContext.Provider value={testContext}>
            <Menu.Popup>
              <Menu.Item label="Aa">1</Menu.Item>
              <Menu.Item label="Ba">2</Menu.Item>
              <Menu.Item label="Bb">3</Menu.Item>
              <Menu.Item label="Ca">4</Menu.Item>
            </Menu.Popup>
          </MenuRootContext.Provider>,
        );

        const items = getAllByRole('menuitem');

        act(() => {
          items[0].focus();
        });

        fireEvent.keyDown(items[0], { key: 'b' });
        expect(document.activeElement).to.equal(items[1]);
        expect(items[1]).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[1], { key: 'b' });
        expect(document.activeElement).to.equal(items[2]);
        expect(items[2]).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[2], { key: 'b' });
        expect(document.activeElement).to.equal(items[1]);
        expect(items[1]).to.have.attribute('tabindex', '0');
      });

      it('skips the non-stringifiable items', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <MenuRootContext.Provider value={testContext}>
            <Menu.Popup>
              <Menu.Item>Aa</Menu.Item>
              <Menu.Item>Ba</Menu.Item>
              <Menu.Item />
              <Menu.Item>
                <div>Nested Content</div>
              </Menu.Item>
              <Menu.Item>{undefined}</Menu.Item>
              <Menu.Item>{null}</Menu.Item>
              <Menu.Item>Bc</Menu.Item>
            </Menu.Popup>
          </MenuRootContext.Provider>,
        );

        const items = getAllByRole('menuitem');

        act(() => {
          items[0].focus();
        });

        fireEvent.keyDown(items[0], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Ba'));
        expect(getByText('Ba')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[1], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Bc'));
        expect(getByText('Bc')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[6], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Ba'));
        expect(getByText('Ba')).to.have.attribute('tabindex', '0');
      });

      it('navigate to options with diacritic characters', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <MenuRootContext.Provider value={testContext}>
            <Menu.Popup>
              <Menu.Item>Aa</Menu.Item>
              <Menu.Item>Ba</Menu.Item>
              <Menu.Item>Bb</Menu.Item>
              <Menu.Item>Bą</Menu.Item>
            </Menu.Popup>
          </MenuRootContext.Provider>,
        );

        const items = getAllByRole('menuitem');

        act(() => {
          items[0].focus();
        });

        fireEvent.keyDown(items[0], { key: 'b' });
        expect(document.activeElement).to.equal(getByText('Ba'));
        expect(getByText('Ba')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[1], { key: 'Control' });
        fireEvent.keyDown(items[1], { key: 'Alt' });
        fireEvent.keyDown(items[1], { key: 'ą' });
        expect(document.activeElement).to.equal(getByText('Bą'));
        expect(getByText('Bą')).to.have.attribute('tabindex', '0');
      });

      it('navigate to next options with beginning diacritic characters', async function test() {
        if (/jsdom/.test(window.navigator.userAgent)) {
          // useMenuPopup Text navigation match menu items using HTMLElement.innerText
          // innerText is not supported by JsDom
          this.skip();
        }

        const { getByText, getAllByRole } = await render(
          <MenuRootContext.Provider value={testContext}>
            <Menu.Popup>
              <Menu.Item>Aa</Menu.Item>
              <Menu.Item>ąa</Menu.Item>
              <Menu.Item>ąb</Menu.Item>
              <Menu.Item>ąc</Menu.Item>
            </Menu.Popup>
          </MenuRootContext.Provider>,
        );

        const items = getAllByRole('menuitem');

        act(() => {
          items[0].focus();
        });

        fireEvent.keyDown(items[0], { key: 'Control' });
        fireEvent.keyDown(items[0], { key: 'Alt' });
        fireEvent.keyDown(items[0], { key: 'ą' });
        expect(document.activeElement).to.equal(getByText('ąa'));
        expect(getByText('ąa')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[1], { key: 'Alt' });
        fireEvent.keyDown(items[1], { key: 'Control' });
        fireEvent.keyDown(items[1], { key: 'ą' });
        expect(document.activeElement).to.equal(getByText('ąb'));
        expect(getByText('ąb')).to.have.attribute('tabindex', '0');

        fireEvent.keyDown(items[2], { key: 'Control' });
        fireEvent.keyDown(items[2], { key: 'AltGraph' });
        fireEvent.keyDown(items[2], { key: 'ą' });
        expect(document.activeElement).to.equal(getByText('ąc'));
        expect(getByText('ąc')).to.have.attribute('tabindex', '0');
      });
    });
  });

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
              <Menu.Popup
                anchor={anchor}
                slotProps={{ root: { 'data-testid': 'popup', placement: 'bottom-start' } as any }}
              >
                <Menu.Item>1</Menu.Item>
                <Menu.Item>2</Menu.Item>
              </Menu.Popup>
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
          <Menu.Popup
            anchor={virtualElement}
            slotProps={{ root: { 'data-testid': 'popup', placement: 'bottom-start' } as any }}
          >
            <Menu.Item>1</Menu.Item>
            <Menu.Item>2</Menu.Item>
          </Menu.Popup>
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
