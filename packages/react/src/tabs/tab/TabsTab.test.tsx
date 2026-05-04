import { expect } from 'vitest';
import { Tabs } from '@base-ui/react/tabs';
import { screen } from '@mui/internal-test-utils';
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
});
