import * as React from 'react';
import { expect, vi } from 'vitest';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { HashRouter, Route, Routes, Link, useLocation } from 'react-router';
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

  function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
  }

  async function renderRouterLinkTabs(options: { disabledLink2?: boolean } = {}) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);

    return render(
      <HashRouter>
        <Routes>
          <Route path="/" element={<div>page one</div>} />
          <Route path="/two" element={<div>page two</div>} />
        </Routes>

        <LocationDisplay />

        <Tabs.Root defaultValue="/">
          <Tabs.List>
            <Tabs.LinkTab render={<Link to="/" />} value="/">
              link 1
            </Tabs.LinkTab>
            <Tabs.LinkTab disabled={options.disabledLink2} render={<Link to="/two" />} value="/two">
              link 2
            </Tabs.LinkTab>
          </Tabs.List>
        </Tabs.Root>
      </HashRouter>,
    );
  }

  it('renders an anchor tab with state attributes', async () => {
    await render(
      <Tabs.Root defaultValue="overview" orientation="vertical">
        <Tabs.List>
          <Tabs.LinkTab href="/overview" value="overview">
            Overview
          </Tabs.LinkTab>
          <Tabs.LinkTab disabled href="/settings" value="settings">
            Settings
          </Tabs.LinkTab>
        </Tabs.List>
      </Tabs.Root>,
    );

    const tab = screen.getByRole('tab', { name: 'Overview' });
    const disabledTab = screen.getByRole('tab', { name: 'Settings' });

    expect(tab).toBeInstanceOf(HTMLAnchorElement);
    expect(tab).toHaveAttribute('href', '/overview');
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab).toHaveAttribute('data-active');
    expect(tab).toHaveAttribute('data-orientation', 'vertical');
    expect(tab).toHaveAttribute('data-activation-direction', 'none');

    expect(disabledTab).toHaveAttribute('aria-disabled', 'true');
    expect(disabledTab).toHaveAttribute('data-disabled');
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

  it('does not select or navigate when disabled', async () => {
    await renderRouterLinkTabs({ disabledLink2: true });

    const disabledTab = screen.getByRole('tab', { name: 'link 2' });

    expect(disabledTab).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(disabledTab);

    expect(screen.getByTestId('location')).toHaveTextContent('/');
    expect(screen.getByRole('tab', { name: 'link 1' })).toHaveAttribute('aria-selected', 'true');
    expect(disabledTab).toHaveAttribute('aria-selected', 'false');
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

  it.skipIf(isJSDOM)('does not activate or navigate on modified link clicks', async () => {
    await renderRouterLinkTabs();

    const link1 = screen.getByRole('tab', { name: 'link 1' });
    const link2 = screen.getByRole('tab', { name: 'link 2' });
    const locationDisplay = screen.getByTestId('location');

    for (const eventInit of [
      { ctrlKey: true },
      { metaKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
    ]) {
      fireEvent.click(link2, eventInit);

      expect(locationDisplay).toHaveTextContent('/');
      expect(link1).toHaveAttribute('aria-selected', 'true');
      expect(link2).toHaveAttribute('aria-selected', 'false');
    }
  });

  it('supports keyboard navigation across link tabs', async () => {
    await render(
      <Tabs.Root defaultValue="overview">
        <Tabs.List activateOnFocus={false}>
          <Tabs.LinkTab href="#overview" value="overview">
            Overview
          </Tabs.LinkTab>
          <Tabs.LinkTab href="#projects" value="projects">
            Projects
          </Tabs.LinkTab>
          <Tabs.LinkTab href="#account" value="account">
            Account
          </Tabs.LinkTab>
        </Tabs.List>
      </Tabs.Root>,
    );

    const [overviewTab, projectsTab, accountTab] = screen.getAllByRole('tab');

    await act(async () => {
      overviewTab.focus();
    });

    fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });
    await flushMicrotasks();

    expect(projectsTab).toHaveFocus();
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    expect(projectsTab).toHaveAttribute('aria-selected', 'false');

    fireEvent.keyDown(projectsTab, { key: 'End' });
    await flushMicrotasks();

    expect(accountTab).toHaveFocus();

    fireEvent.keyDown(accountTab, { key: 'Home' });
    await flushMicrotasks();

    expect(overviewTab).toHaveFocus();
  });

  it('calls onValueChange in controlled mode without changing the selected link tab', async () => {
    const handleChange = vi.fn();

    await render(
      <Tabs.Root value="overview" onValueChange={handleChange}>
        <Tabs.List>
          <Tabs.LinkTab href="#overview" value="overview">
            Overview
          </Tabs.LinkTab>
          <Tabs.LinkTab href="#projects" value="projects">
            Projects
          </Tabs.LinkTab>
        </Tabs.List>
      </Tabs.Root>,
    );

    const overviewTab = screen.getByRole('tab', { name: 'Overview' });
    const projectsTab = screen.getByRole('tab', { name: 'Projects' });

    fireEvent.click(projectsTab);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0]).toBe('projects');
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    expect(projectsTab).toHaveAttribute('aria-selected', 'false');
  });

  it('sets aria-controls and aria-labelledby between link tabs and panels', async () => {
    await render(
      <Tabs.Root defaultValue="overview">
        <Tabs.List>
          <Tabs.LinkTab id="overview-tab" href="#overview" value="overview">
            Overview
          </Tabs.LinkTab>
          <Tabs.LinkTab id="projects-tab" href="#projects" value="projects">
            Projects
          </Tabs.LinkTab>
        </Tabs.List>
        <Tabs.Panel value="overview" keepMounted>
          Overview panel
        </Tabs.Panel>
        <Tabs.Panel value="projects" keepMounted>
          Projects panel
        </Tabs.Panel>
      </Tabs.Root>,
    );

    const overviewTab = screen.getByRole('tab', { name: 'Overview' });
    const projectsTab = screen.getByRole('tab', { name: 'Projects' });
    const [overviewPanel, projectsPanel] = screen.getAllByRole('tabpanel', { hidden: true });

    expect(overviewTab).toHaveAttribute('aria-controls', overviewPanel.id);
    expect(projectsTab).toHaveAttribute('aria-controls', projectsPanel.id);
    expect(overviewPanel).toHaveAttribute('aria-labelledby', overviewTab.id);
    expect(projectsPanel).toHaveAttribute('aria-labelledby', projectsTab.id);
  });

  it('works when mixed with regular tabs', async () => {
    const { user } = await render(
      <Tabs.Root defaultValue="overview">
        <Tabs.List>
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.LinkTab href="#projects" value="projects">
            Projects
          </Tabs.LinkTab>
          <Tabs.Tab value="account">Account</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview" keepMounted>
          Overview panel
        </Tabs.Panel>
        <Tabs.Panel value="projects" keepMounted>
          Projects panel
        </Tabs.Panel>
        <Tabs.Panel value="account" keepMounted>
          Account panel
        </Tabs.Panel>
      </Tabs.Root>,
    );

    await user.click(screen.getByRole('tab', { name: 'Projects' }));

    const panels = screen.getAllByRole('tabpanel', { hidden: true });

    expect(panels[0]).toHaveAttribute('hidden');
    expect(panels[1]).not.toHaveAttribute('hidden');
    expect(panels[2]).toHaveAttribute('hidden');
  });

  it('resets pointer press state after non-primary pointer interactions', async () => {
    await render(
      <Tabs.Root defaultValue="overview">
        <Tabs.List activateOnFocus>
          <Tabs.LinkTab href="#overview" value="overview">
            Overview
          </Tabs.LinkTab>
          <Tabs.LinkTab href="#projects" value="projects">
            Projects
          </Tabs.LinkTab>
          <Tabs.LinkTab href="#account" value="account">
            Account
          </Tabs.LinkTab>
        </Tabs.List>
      </Tabs.Root>,
    );

    const projectsTab = screen.getByRole('tab', { name: 'Projects' });
    const accountTab = screen.getByRole('tab', { name: 'Account' });

    fireEvent.pointerDown(accountTab, { button: 1 });
    fireEvent.pointerUp(document.body, { button: 1 });

    act(() => {
      projectsTab.focus();
    });

    await waitFor(() => {
      expect(projectsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('selects a link tab with Space', async () => {
    const { user } = await render(
      <Tabs.Root defaultValue="overview">
        <Tabs.List>
          <Tabs.LinkTab href="#overview" value="overview">
            Overview
          </Tabs.LinkTab>
          <Tabs.LinkTab href="#projects" value="projects">
            Projects
          </Tabs.LinkTab>
        </Tabs.List>
        <Tabs.Panel value="overview" keepMounted>
          Overview panel
        </Tabs.Panel>
        <Tabs.Panel value="projects" keepMounted>
          Projects panel
        </Tabs.Panel>
      </Tabs.Root>,
    );

    const projectsTab = screen.getByRole('tab', { name: 'Projects' });

    act(() => {
      projectsTab.focus();
    });

    await waitFor(() => {
      expect(projectsTab).toHaveFocus();
    });

    await user.keyboard('[Space]');

    const panels = screen.getAllByRole('tabpanel', { hidden: true });

    expect(panels[0]).toHaveAttribute('hidden');
    expect(panels[1]).not.toHaveAttribute('hidden');
  });

  it.skipIf(isJSDOM)('react-router <Link> activates with Enter', async () => {
    const { user } = await renderRouterLinkTabs();

    const link2 = screen.getByRole('tab', { name: 'link 2' });
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
  });

  it.skipIf(isJSDOM)('react-router <Link> activates with Space', async () => {
    const { user } = await renderRouterLinkTabs();

    const link2 = screen.getByRole('tab', { name: 'link 2' });
    const locationDisplay = screen.getByTestId('location');

    expect(screen.getByText(/page one/i)).not.toBe(null);
    expect(locationDisplay).toHaveTextContent('/');

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

  it.skipIf(isJSDOM)('react-router <Link> can return with Enter', async () => {
    const { user } = await renderRouterLinkTabs();

    const link1 = screen.getByRole('tab', { name: 'link 1' });
    const link2 = screen.getByRole('tab', { name: 'link 2' });
    const locationDisplay = screen.getByTestId('location');

    act(() => {
      link2.focus();
    });

    await waitFor(() => {
      expect(link2).toHaveFocus();
    });

    await user.keyboard('[Enter]');

    expect(locationDisplay).toHaveTextContent('/two');

    act(() => {
      link1.focus();
    });

    await waitFor(() => {
      expect(link1).toHaveFocus();
    });

    await user.keyboard('[Enter]');

    expect(locationDisplay).toHaveTextContent('/');
    expect(screen.getByText(/page one/i)).not.toBe(null);
  });
});
