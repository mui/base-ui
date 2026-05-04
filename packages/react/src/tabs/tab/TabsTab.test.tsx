import { expect } from 'vitest';
import { Tabs } from '@base-ui/react/tabs';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tabs.Tab />', () => {
  const { render } = createRenderer();

  describeConformance(<Tabs.Tab value="1" />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render: (node) =>
      render(
        <Tabs.Root>
          <Tabs.List>{node}</Tabs.List>
        </Tabs.Root>,
      ),
  }));

  it('continues to support anchors through render and nativeButton=false', async () => {
    const { user } = await render(
      <Tabs.Root defaultValue="overview">
        <Tabs.List>
          <Tabs.Tab nativeButton={false} render={<a href="#overview" />} value="overview">
            Overview
          </Tabs.Tab>
          <Tabs.Tab nativeButton={false} render={<a href="#settings" />} value="settings">
            Settings
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview" keepMounted>
          Overview panel
        </Tabs.Panel>
        <Tabs.Panel value="settings" keepMounted>
          Settings panel
        </Tabs.Panel>
      </Tabs.Root>,
    );

    const settingsTab = screen.getByRole('tab', { name: 'Settings' });

    expect(settingsTab).toBeInstanceOf(HTMLAnchorElement);
    expect(settingsTab).toHaveAttribute('href', '#settings');

    await user.click(settingsTab);

    const panels = screen.getAllByRole('tabpanel', { hidden: true });

    expect(panels[0]).toHaveAttribute('hidden');
    expect(panels[1]).not.toHaveAttribute('hidden');
  });

  it('activates custom non-native tabs with the keyboard', async () => {
    const { user } = await render(
      <Tabs.Root defaultValue="overview">
        <Tabs.List activateOnFocus={false}>
          <Tabs.Tab nativeButton={false} render={<div />} value="overview">
            Overview
          </Tabs.Tab>
          <Tabs.Tab nativeButton={false} render={<div />} value="settings">
            Settings
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview" keepMounted>
          Overview panel
        </Tabs.Panel>
        <Tabs.Panel value="settings" keepMounted>
          Settings panel
        </Tabs.Panel>
      </Tabs.Root>,
    );

    const overviewTab = screen.getByRole('tab', { name: 'Overview' });
    const settingsTab = screen.getByRole('tab', { name: 'Settings' });

    act(() => {
      settingsTab.focus();
    });

    await waitFor(() => {
      expect(settingsTab).toHaveFocus();
    });

    await user.keyboard('[Enter]');

    let panels = screen.getAllByRole('tabpanel', { hidden: true });

    expect(panels[0]).toHaveAttribute('hidden');
    expect(panels[1]).not.toHaveAttribute('hidden');

    act(() => {
      overviewTab.focus();
    });

    await waitFor(() => {
      expect(overviewTab).toHaveFocus();
    });

    await user.keyboard('[Space]');

    panels = screen.getAllByRole('tabpanel', { hidden: true });

    expect(panels[0]).not.toHaveAttribute('hidden');
    expect(panels[1]).toHaveAttribute('hidden');
  });
});
