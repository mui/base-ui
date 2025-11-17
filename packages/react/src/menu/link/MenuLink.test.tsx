import * as React from 'react';
import { expect } from 'chai';
import { MemoryRouter, Route, Routes, Link, useLocation } from 'react-router';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { Menu } from '@base-ui-components/react/menu';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Menu.Link />', () => {
  const { render, clock } = createRenderer({
    clockOptions: {
      shouldAdvanceTime: true,
    },
  });

  clock.withFakeTimers();

  describeConformance(<Menu.Link />, () => ({
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

    it('react-router <Link>', async () => {
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
                  <Menu.Link render={<Link to="/" />}>link 1</Menu.Link>
                  <Menu.Link render={<Link to="/two" />}>link 2</Menu.Link>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </MemoryRouter>,
      );

      const [link1, link2] = screen.getAllByRole('link');

      const locationDisplay = screen.getByTestId('location');

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
});
