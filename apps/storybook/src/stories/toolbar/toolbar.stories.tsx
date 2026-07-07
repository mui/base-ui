import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Toolbar } from '@base-ui/react/toolbar';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '@base-ui/react/toggle';
import { Menu } from '@base-ui/react/menu';
import styles from './toolbar.module.css';

/**
 * Stories follow research/c-components/toolbar (Tier 3): the kept docs hero
 * demo (mixed children sharing one composite tab stop) plus the required
 * composite-keyboard coverage, and the `Toolbar.Button render={<Menu.Trigger />}`
 * composition recipe from the docs "Using with Menu" example. Toolbar never
 * enables Home/End (`enableHomeAndEndKeys` is not passed to its CompositeRoot)
 * — only Tab (single stop) and orientation-appropriate arrows are wired; a
 * ToggleGroup nested here defers entirely to this CompositeRoot, so it loses
 * the Home/End support it has when used standalone (see the toggle-group
 * stories/MDX).
 */
const meta = {
  title: 'Actions/Toolbar',
  component: Toolbar.Root,
  subcomponents: {
    'Toolbar.Button': Toolbar.Button,
    'Toolbar.Separator': Toolbar.Separator,
    'Toolbar.Group': Toolbar.Group,
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof Toolbar.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Mixed content sharing one composite tab stop: an alignment ToggleGroup,
 * a separator, and a plain Toolbar.Group of format buttons.
 */
export const Hero: Story = {
  render: () => (
    <Toolbar.Root aria-label="Formatting" className={styles.Toolbar}>
      <ToggleGroup aria-label="Alignment" defaultValue={['align-left']} className={styles.Group}>
        <Toolbar.Button
          render={<Toggle />}
          value="align-left"
          className={styles.Button}
        >
          Align Left
        </Toolbar.Button>
        <Toolbar.Button
          render={<Toggle />}
          value="align-right"
          className={styles.Button}
        >
          Align Right
        </Toolbar.Button>
      </ToggleGroup>
      <Toolbar.Separator className={styles.Separator} />
      <Toolbar.Group aria-label="Numerical format" className={styles.Group}>
        <Toolbar.Button aria-label="Format as currency" className={styles.Button}>
          $
        </Toolbar.Button>
        <Toolbar.Button aria-label="Format as percent" className={styles.Button}>
          %
        </Toolbar.Button>
      </Toolbar.Group>
    </Toolbar.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const alignLeft = canvas.getByRole('button', { name: 'Align Left' });
    const alignRight = canvas.getByRole('button', { name: 'Align Right' });
    const currency = canvas.getByRole('button', { name: 'Format as currency' });

    // Single composite tab stop: only the first item is in the tab sequence up front.
    await expect(alignLeft).toHaveAttribute('tabindex', '0');
    await expect(alignRight).toHaveAttribute('tabindex', '-1');

    await userEvent.tab();
    await expect(alignLeft).toHaveFocus();

    // Arrow keys rove focus in one continuous sequence, spanning the nested
    // ToggleGroup and the plain Toolbar.Group as if they were flat siblings.
    await userEvent.keyboard('{ArrowRight}');
    await expect(alignRight).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    await expect(currency).toHaveFocus();
  },
};

function ToolbarWithMenuExample() {
  return (
    <Toolbar.Root aria-label="Document actions" className={styles.Toolbar}>
      <Toolbar.Button aria-label="Bold" className={styles.Button}>
        B
      </Toolbar.Button>
      <Toolbar.Separator className={styles.Separator} />
      <Menu.Root>
        <Toolbar.Button render={<Menu.Trigger />} className={styles.Button}>
          More actions
        </Toolbar.Button>
        <Menu.Portal>
          <Menu.Positioner className={styles.Positioner} sideOffset={4}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Item className={styles.Item}>Duplicate</Menu.Item>
              <Menu.Item className={styles.Item}>Delete</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Toolbar.Root>
  );
}

/**
 * Composing a popup trigger into the toolbar: `Toolbar.Button render={<Menu.Trigger />}`
 * keeps `Toolbar.Button` as the composite-registered DOM node while `Menu.Trigger`
 * supplies its own ARIA (`aria-haspopup`, `aria-expanded`). The menu content
 * portals to `document.body`, so it must be queried there.
 */
export const ToolbarButtonAsMenuTrigger: Story = {
  render: () => <ToolbarWithMenuExample />,
  play: async ({ canvas, userEvent, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'More actions' });

    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    await userEvent.click(trigger);
    const menu = await body.findByRole('menu');
    await expect(menu).toBeVisible();
    await waitFor(async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await userEvent.click(await body.findByRole('menuitem', { name: 'Duplicate' }));
    await waitFor(async () => {
      await expect(body.queryByRole('menu')).not.toBeInTheDocument();
    });
  },
};
