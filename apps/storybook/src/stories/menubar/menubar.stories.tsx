import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Menubar } from '@base-ui/react/menubar';
import { Menu } from '@base-ui/react/menu';
import styles from './menubar.module.css';

/**
 * Stories follow research/c-components/menubar (Tier 2): Menubar is a
 * single-part host — no namespace, no `index.parts.ts`. It renders one
 * `<div role="menubar">` and coordinates ordinary `Menu.Root` instances placed
 * inside it: each hosted `Menu.Trigger` detects menubar parentage via context
 * and converts from a standalone button into a roving `role="menuitem"`.
 * Floor coverage: the roving-arrows sibling-switch flow (open File →
 * ArrowRight → Edit opens) and the disabled cascade (bar-level and
 * per-menu).
 *
 * Portal note: each hosted Menu's popup mounts on document.body — plays query
 * via `within(canvasElement.ownerDocument.body)`.
 */
const meta = {
  title: 'Navigation/Menubar',
  component: Menubar,
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Hero: multi-menu bar with roving-arrows sibling switch               */
/* ------------------------------------------------------------------ */

function HeroExample() {
  return (
    <Menubar className={styles.Menubar}>
      <Menu.Root>
        <Menu.Trigger className={styles.MenuTrigger}>File</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={styles.MenuPopup}>
              <Menu.Item className={styles.MenuItem}>New</Menu.Item>
              <Menu.Item className={styles.MenuItem}>Open</Menu.Item>
              <Menu.Item className={styles.MenuItem}>Save</Menu.Item>
              <Menu.Separator className={styles.MenuSeparator} />
              <Menu.Item className={styles.MenuItem}>Print</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger className={styles.MenuTrigger}>Edit</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={styles.MenuPopup}>
              <Menu.Item className={styles.MenuItem}>Cut</Menu.Item>
              <Menu.Item className={styles.MenuItem}>Copy</Menu.Item>
              <Menu.Item className={styles.MenuItem}>Paste</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root>
        <Menu.Trigger className={styles.MenuTrigger}>View</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={styles.MenuPopup}>
              <Menu.Item className={styles.MenuItem}>Zoom In</Menu.Item>
              <Menu.Item className={styles.MenuItem}>Zoom Out</Menu.Item>
              <Menu.Separator className={styles.MenuSeparator} />
              <Menu.Item className={styles.MenuItem}>Full Screen</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Menu.Root disabled>
        <Menu.Trigger className={styles.MenuTrigger}>Help</Menu.Trigger>
      </Menu.Root>
    </Menubar>
  );
}

/**
 * The docs hero demo's File/Edit/View/Help shape. Clicking a trigger opens
 * its menu; `ArrowRight` closes the current submenu and opens the adjacent
 * top-level trigger's submenu in one step — the "browse across the whole bar
 * without leaving keyboard-driven submenu mode" pattern.
 */
export const Hero: Story = {
  render: () => <HeroExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const fileTrigger = canvas.getByRole('menuitem', { name: 'File' });
    await expect(fileTrigger).toHaveAttribute('aria-haspopup', 'menu');

    await userEvent.click(fileTrigger);
    const fileMenu = await body.findByRole('menu', { name: 'File' });
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() => expect(fileMenu).toBeVisible());

    // ArrowRight switches to the adjacent top-level menu in one step.
    await userEvent.keyboard('{ArrowRight}');
    const editMenu = await body.findByRole('menu', { name: 'Edit' });
    await waitFor(() => expect(editMenu).toBeVisible());
    await waitFor(() => expect(body.queryByRole('menu', { name: 'File' })).not.toBeInTheDocument());

    await userEvent.keyboard('{ArrowRight}');
    const viewMenu = await body.findByRole('menu', { name: 'View' });
    await waitFor(() => expect(viewMenu).toBeVisible());

    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(body.getByRole('menu', { name: 'Edit' })).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* Disabled cascade                                                     */
/* ------------------------------------------------------------------ */

function DisabledCascadeExample() {
  return (
    <div className={styles.Row}>
      <div className={styles.Stack}>
        <span className={styles.Output}>Whole bar disabled</span>
        <Menubar className={styles.Menubar} disabled>
          <Menu.Root>
            <Menu.Trigger className={styles.MenuTrigger}>File</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className={styles.MenuPositioner} sideOffset={4}>
                <Menu.Popup className={styles.MenuPopup}>
                  <Menu.Item className={styles.MenuItem}>New</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <Menu.Root>
            <Menu.Trigger className={styles.MenuTrigger}>Edit</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className={styles.MenuPositioner} sideOffset={4}>
                <Menu.Popup className={styles.MenuPopup}>
                  <Menu.Item className={styles.MenuItem}>Cut</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menubar>
      </div>

      <div className={styles.Stack}>
        <span className={styles.Output}>Single menu disabled (&quot;Help&quot;)</span>
        <Menubar className={styles.Menubar}>
          <Menu.Root>
            <Menu.Trigger className={styles.MenuTrigger}>File</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className={styles.MenuPositioner} sideOffset={4}>
                <Menu.Popup className={styles.MenuPopup}>
                  <Menu.Item className={styles.MenuItem}>New</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <Menu.Root disabled>
            <Menu.Trigger className={styles.MenuTrigger}>Help</Menu.Trigger>
          </Menu.Root>
        </Menubar>
      </div>
    </div>
  );
}

/**
 * `disabled` on `<Menubar>` cascades to every hosted `Menu.Root` at once (they
 * OR their own `disabled` with the bar's); disabling a single `Menu.Root`
 * instead only takes out that one menu, leaving its siblings enabled.
 */
export const DisabledCascade: Story = {
  render: () => <DisabledCascadeExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    // Variant (a): the whole bar is disabled — File opens nothing.
    const disabledBarFile = canvas.getAllByRole('menuitem', { name: 'File' })[0];
    await expect(disabledBarFile).toHaveAttribute('data-disabled');
    await userEvent.click(disabledBarFile);
    await expect(body.queryByRole('menu', { name: 'File' })).not.toBeInTheDocument();

    // Variant (b): only "Help" is disabled — File in the same bar still works.
    const enabledBarFile = canvas.getAllByRole('menuitem', { name: 'File' })[1];
    await userEvent.click(enabledBarFile);
    const fileMenu = await body.findByRole('menu', { name: 'File' });
    await waitFor(() => expect(fileMenu).toBeVisible());

    const help = canvas.getByRole('menuitem', { name: 'Help' });
    await expect(help).toHaveAttribute('data-disabled');
  },
};
