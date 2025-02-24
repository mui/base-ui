import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { MemoryRouter, Route, Routes, Link, useLocation } from 'react-router-dom';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Menu } from '@base-ui-components/react/menu';
import { describeConformance, createRenderer, isJSDOM } from '#test-utils';

describe('<Menu.Item />', () => {
  const { render, clock } = createRenderer({
    clockOptions: {
      shouldAdvanceTime: true,
    },
  });

  clock.withFakeTimers();

  describeConformance(<Menu.Item />, () => ({
    render: (node) => {
      return render(<Menu.Root open>{node}</Menu.Root>);
    },
    refInstanceof: window.HTMLDivElement,
  }));

  it('calls the onClick handler when clicked', async () => {
    const onClick = spy();
    const { user } = await render(
      <Menu.Root open>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item onClick={onClick} id="item">
                Item
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    const item = screen.getByRole('menuitem');
    await user.click(item);

    expect(onClick.callCount).to.equal(1);
  });

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

    const { getAllByRole, user } = await render(
      <Menu.Root open>
        <Menu.Portal>
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
        </Menu.Portal>
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
      const { getByRole, queryByRole, user } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>Item</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitem');
      await user.click(item);

      expect(queryByRole('menu')).to.equal(null);
    });

    it('when `closeOnClick=false` does not close the menu when the item is clicked', async () => {
      const { getByRole, queryByRole, user } = await render(
        <Menu.Root>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item closeOnClick={false}>Item</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = getByRole('button', { name: 'Open' });
      await user.click(trigger);

      const item = getByRole('menuitem');
      await user.click(item);

      expect(queryByRole('menu')).not.to.equal(null);
    });
  });

  describe('rendering links', () => {
    function One() {
      return <div>page one</div>;
    }
    function Two() {
      return <div>page two</div>;
    }
    function LocationDisplay() {
      const location = useLocation();
      return <div data-testid="location">{location.pathname}</div>;
    }

    it('react-router <Link>', async () => {
      const { getAllByRole, getByTestId, user } = await render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<One />} />
            <Route path="/two" element={<Two />} />
          </Routes>

          <LocationDisplay />

          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item render={<Link to="/" />}>link 1</Menu.Item>
                  <Menu.Item render={<Link to="/two" />}>link 2</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </MemoryRouter>,
      );

      const [link1, link2] = getAllByRole('menuitem');

      const locationDisplay = getByTestId('location');

      expect(screen.getByText(/page one/i)).not.to.equal(null);

      expect(locationDisplay).to.have.text('/');

      await act(async () => {
        link2.focus();
      });

      await waitFor(() => {
        expect(link2).toHaveFocus();
      });

      await user.keyboard('[Enter]');

      expect(locationDisplay).to.have.text('/two');

      expect(screen.getByText(/page two/i)).not.to.equal(null);

      await act(async () => {
        link1.focus();
      });

      await user.keyboard('[Enter]');

      expect(screen.getByText(/page one/i)).not.to.equal(null);

      expect(locationDisplay).to.have.text('/');
    });
  });

  describe('disabled state', () => {
    it('can be focused but not interacted with when disabled', async () => {
      const handleClick = spy();
      const handleKeyDown = spy();
      const handleKeyUp = spy();

      const { getByRole } = await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item
                  disabled
                  onClick={handleClick}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                >
                  Item
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const item = getByRole('menuitem');
      await act(() => item.focus());
      expect(item).toHaveFocus();

      fireEvent.keyDown(item, { key: 'Enter' });
      expect(handleKeyDown.callCount).to.equal(0);
      expect(handleClick.callCount).to.equal(0);

      fireEvent.keyUp(item, { key: 'Space' });
      expect(handleKeyUp.callCount).to.equal(0);
      expect(handleClick.callCount).to.equal(0);

      fireEvent.click(item);
      expect(handleKeyDown.callCount).to.equal(0);
      expect(handleKeyUp.callCount).to.equal(0);
      expect(handleClick.callCount).to.equal(0);
    });
  });
});
