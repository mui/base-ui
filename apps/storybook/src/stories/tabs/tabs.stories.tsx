import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Tabs } from '@base-ui/react/tabs';
import styles from './tabs.module.css';

/**
 * Stories follow research/c-components/tabs (Tier 2): the hero Overview/
 * Projects/Account demo with the animated Indicator, the click-vs-focus
 * activation-timing policy (mui/base-ui#3176), and vertical orientation.
 *
 * Tabs activates on CLICK by default — focus alone (arrow-keying through the
 * tablist, or a programmatic `.focus()`) never changes which panel is
 * visible unless `activateOnFocus` is explicitly set on `Tabs.List`. This is
 * the deliberate outcome of #3176 ("Change `activateOnFocus` to false"),
 * argued on WCAG 2.5.2 pointer-cancellation grounds. These stories assert
 * that split explicitly rather than assuming "focus follows selection."
 */
const meta = {
  title: 'Navigation/Tabs',
  component: Tabs.Root,
  subcomponents: {
    'Tabs.List': Tabs.List,
    'Tabs.Tab': Tabs.Tab,
    'Tabs.Indicator': Tabs.Indicator,
    'Tabs.Panel': Tabs.Panel,
  },
} satisfies Meta<typeof Tabs.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

const panelCopy = {
  overview: 'Workspace stats and activity.',
  projects: 'Milestones and deadlines.',
  account: 'Profile and preferences.',
};

function TabsDemo({
  activateOnFocus,
  orientation,
}: {
  activateOnFocus?: boolean;
  orientation?: 'horizontal' | 'vertical';
}) {
  return (
    <Tabs.Root className={styles.Root} defaultValue="overview" orientation={orientation}>
      <Tabs.List className={styles.List} activateOnFocus={activateOnFocus}>
        <Tabs.Tab className={styles.Tab} value="overview">
          Overview
        </Tabs.Tab>
        <Tabs.Tab className={styles.Tab} value="projects">
          Projects
        </Tabs.Tab>
        <Tabs.Tab className={styles.Tab} value="account">
          Account
        </Tabs.Tab>
        <Tabs.Indicator className={styles.Indicator} />
      </Tabs.List>
      <div className={styles.PanelViewport}>
        <Tabs.Panel className={styles.Panel} value="overview">
          <p className={styles.Paragraph}>{panelCopy.overview}</p>
        </Tabs.Panel>
        <Tabs.Panel className={styles.Panel} value="projects">
          <p className={styles.Paragraph}>{panelCopy.projects}</p>
        </Tabs.Panel>
        <Tabs.Panel className={styles.Panel} value="account">
          <p className={styles.Paragraph}>{panelCopy.account}</p>
        </Tabs.Panel>
      </div>
    </Tabs.Root>
  );
}

/** The docs hero demo: 3 tabs with an animated Indicator tracking the active tab. */
export const Hero: Story = {
  render: () => <TabsDemo />,
  play: async ({ canvas, userEvent }) => {
    const tab1 = canvas.getByRole('tab', { name: 'Overview' });
    const tab2 = canvas.getByRole('tab', { name: 'Projects' });
    await expect(tab1).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByText(panelCopy.overview)).toBeVisible();

    await userEvent.click(tab2);

    await waitFor(() => expect(tab2).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() => expect(tab1).toHaveAttribute('aria-selected', 'false'));
    await waitFor(() => expect(canvas.getByText(panelCopy.projects)).toBeVisible());
  },
};

/**
 * Default activation semantics (`activateOnFocus={false}` on `Tabs.List`,
 * the default): arrow keys move roving focus between tabs, but the panel
 * selection does not change until the focused tab is explicitly activated
 * (click, or Enter/Space).
 */
export const KeyboardFocusDoesNotActivate: Story = {
  render: () => <TabsDemo />,
  play: async ({ canvas, userEvent }) => {
    const tab1 = canvas.getByRole('tab', { name: 'Overview' });
    const tab2 = canvas.getByRole('tab', { name: 'Projects' });

    tab1.focus();
    await expect(tab1).toHaveFocus();
    await expect(tab1).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{ArrowRight}');

    // Focus moves to the next tab...
    await waitFor(() => expect(tab2).toHaveFocus());
    // ...but activation does NOT follow focus by default (#3176).
    await expect(tab2).toHaveAttribute('aria-selected', 'false');
    await expect(tab1).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByText(panelCopy.overview)).toBeVisible();

    // An explicit click still activates the focused tab.
    await userEvent.click(tab2);
    await waitFor(() => expect(tab2).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() => expect(canvas.getByText(panelCopy.projects)).toBeVisible());
  },
};

/**
 * Contrast story: `activateOnFocus` opts into "focus follows selection" —
 * arrow-keying to a tab immediately activates its panel, restoring the
 * behavior #3176 turned off by default.
 */
export const ActivateOnFocus: Story = {
  render: () => <TabsDemo activateOnFocus />,
  play: async ({ canvas, userEvent }) => {
    const tab1 = canvas.getByRole('tab', { name: 'Overview' });
    const tab2 = canvas.getByRole('tab', { name: 'Projects' });

    tab1.focus();
    await expect(tab1).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');

    await waitFor(() => expect(tab2).toHaveFocus());
    // With activateOnFocus, moving focus also activates the tab.
    await waitFor(() => expect(tab2).toHaveAttribute('aria-selected', 'true'));
    await waitFor(() => expect(canvas.getByText(panelCopy.projects)).toBeVisible());
  },
};

/**
 * `orientation="vertical"` flips the arrow-key axis to ArrowUp/ArrowDown and
 * emits `aria-orientation="vertical"` on the tablist.
 */
export const VerticalOrientation: Story = {
  render: () => <TabsDemo orientation="vertical" />,
  play: async ({ canvas, userEvent }) => {
    const tablist = canvas.getByRole('tablist');
    await expect(tablist).toHaveAttribute('aria-orientation', 'vertical');
    await expect(tablist).toHaveAttribute('data-orientation', 'vertical');

    const tab1 = canvas.getByRole('tab', { name: 'Overview' });
    const tab2 = canvas.getByRole('tab', { name: 'Projects' });

    tab1.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(tab2).toHaveFocus());
    // Default activateOnFocus=false still applies regardless of orientation.
    await expect(tab2).toHaveAttribute('aria-selected', 'false');
  },
};
