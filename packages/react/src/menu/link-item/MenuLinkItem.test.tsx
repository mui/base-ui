import * as React from 'react';
import { expect } from 'chai';
import { MemoryRouter, Route, Routes, Link, useLocation } from 'react-router';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { Menu } from '@base-ui/react/menu';
import { describeConformance, createRenderer, isJSDOM } from '#test-utils';

describe('<Menu.LinkItem />', () => {
  const { render } = createRenderer();

  describeConformance(<Menu.LinkItem />, () => ({
    refInstanceof: window.HTMLAnchorElement,
    render: (node) => {
      return render(<Menu.Root open>{node}</Menu.Root>);
    },
  }));

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

    it.skipIf(isJSDOM)('react-router <Link>', async () => {
      const { user } = await render(
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
                  <Menu.LinkItem render={<Link to="/" />}>link 1</Menu.LinkItem>
                  <Menu.LinkItem render={<Link to="/two" />}>link 2</Menu.LinkItem>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </MemoryRouter>,
      );

      const [link1, link2] = screen.getAllByRole('menuitem');

      const locationDisplay = screen.getByTestId('location');

      expect(screen.getByText(/page one/i)).not.to.equal(null);

      expect(locationDisplay).to.have.text('/');

      act(() => {
        link2.focus();
      });

      await waitFor(() => {
        expect(link2).toHaveFocus();
      });

      await user.keyboard('[Enter]');

      expect(locationDisplay).to.have.text('/two');

      expect(screen.getByText(/page two/i)).not.to.equal(null);

      act(() => {
        link1.focus();
      });

      await waitFor(() => {
        expect(link1).toHaveFocus();
      });

      await user.keyboard('[Enter]');

      expect(screen.getByText(/page one/i)).not.to.equal(null);

      expect(locationDisplay).to.have.text('/');
    });
  });
});
