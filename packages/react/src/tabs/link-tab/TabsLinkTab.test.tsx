import { expect } from 'vitest';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { MemoryRouter, Route, Routes, Link, useLocation } from 'react-router';
import { Tabs } from '@base-ui/react/tabs';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Tabs.LinkTab />', () => {
  const { render } = createRenderer();

  describeConformance(<Tabs.LinkTab value="1" />, () => ({
    refInstanceof: window.HTMLAnchorElement,
    render: (node) =>
      render(
        <Tabs.Root>
          <Tabs.List>{node}</Tabs.List>
        </Tabs.Root>,
      ),
  }));

  it('renders an anchor tab', async () => {
    await render(
      <Tabs.Root defaultValue="overview">
        <Tabs.List>
          <Tabs.LinkTab href="/overview" value="overview">
            Overview
          </Tabs.LinkTab>
        </Tabs.List>
      </Tabs.Root>,
    );

    const tab = screen.getByRole('tab', { name: 'Overview' });

    expect(tab).toBeInstanceOf(HTMLAnchorElement);
    expect(tab).toHaveAttribute('href', '/overview');
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab).toHaveAttribute('data-activation-direction', 'none');
  });

  it('selects the corresponding panel when clicked', async () => {
    const { user } = await render(
      <Tabs.Root defaultValue="overview">
        <Tabs.List>
          <Tabs.LinkTab href="#overview" value="overview">
            Overview
          </Tabs.LinkTab>
          <Tabs.LinkTab href="#settings" value="settings">
            Settings
          </Tabs.LinkTab>
        </Tabs.List>
        <Tabs.Panel value="overview" keepMounted>
          Overview panel
        </Tabs.Panel>
        <Tabs.Panel value="settings" keepMounted>
          Settings panel
        </Tabs.Panel>
      </Tabs.Root>,
    );

    await user.click(screen.getByRole('tab', { name: 'Settings' }));

    const panels = screen.getAllByRole('tabpanel', { hidden: true });

    expect(panels[0]).toHaveAttribute('hidden');
    expect(panels[1]).not.toHaveAttribute('hidden');
  });

  it('does not select the corresponding panel when disabled', async () => {
    const { user } = await render(
      <Tabs.Root defaultValue="overview">
        <Tabs.List>
          <Tabs.LinkTab href="#overview" value="overview">
            Overview
          </Tabs.LinkTab>
          <Tabs.LinkTab disabled href="#settings" value="settings">
            Settings
          </Tabs.LinkTab>
        </Tabs.List>
        <Tabs.Panel value="overview" keepMounted>
          Overview panel
        </Tabs.Panel>
        <Tabs.Panel value="settings" keepMounted>
          Settings panel
        </Tabs.Panel>
      </Tabs.Root>,
    );

    const disabledTab = screen.getByRole('tab', { name: 'Settings' });

    expect(disabledTab).toHaveAttribute('aria-disabled', 'true');

    await user.click(disabledTab);

    const panels = screen.getAllByRole('tabpanel', { hidden: true });

    expect(panels[0]).not.toHaveAttribute('hidden');
    expect(panels[1]).toHaveAttribute('hidden');
  });

  it.skipIf(isJSDOM)('react-router <Link> activates with Enter and Space', async () => {
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

    const { user } = await render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<One />} />
          <Route path="/two" element={<Two />} />
        </Routes>

        <LocationDisplay />

        <Tabs.Root defaultValue="/">
          <Tabs.List>
            <Tabs.LinkTab render={<Link to="/" />} value="/">
              link 1
            </Tabs.LinkTab>
            <Tabs.LinkTab render={<Link to="/two" />} value="/two">
              link 2
            </Tabs.LinkTab>
          </Tabs.List>
        </Tabs.Root>
      </MemoryRouter>,
    );

    const [link1, link2] = screen.getAllByRole('tab');
    const locationDisplay = screen.getByTestId('location');

    expect(screen.getByText(/page one/i)).not.toBe(null);
    expect(locationDisplay).toHaveTextContent('/');

    act(() => {
      link2.focus();
    });

    await waitFor(() => {
      expect(link2).toHaveFocus();
    });

    await user.keyboard('[Enter]');

    expect(locationDisplay).toHaveTextContent('/two');
    expect(screen.getByText(/page two/i)).not.toBe(null);

    act(() => {
      link1.focus();
    });

    await waitFor(() => {
      expect(link1).toHaveFocus();
    });

    await user.keyboard('[Enter]');

    expect(locationDisplay).toHaveTextContent('/');
    expect(screen.getByText(/page one/i)).not.toBe(null);

    act(() => {
      link2.focus();
    });

    await waitFor(() => {
      expect(link2).toHaveFocus();
    });

    await user.keyboard('[Space]');

    expect(locationDisplay).toHaveTextContent('/two');
    expect(screen.getByText(/page two/i)).not.toBe(null);
  });
});
