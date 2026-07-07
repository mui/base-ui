import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { ContextMenu } from '@base-ui/react/context-menu';
import styles from './context-menu.module.css';

/**
 * Stories follow research/c-components/context-menu (Tier 2): Context Menu is
 * a thin wrapper (only `Root`/`Trigger` are original; the other 17 parts are
 * verbatim re-exports of the corresponding Menu parts — "all the context menu
 * parts are direct reexports of regular menu parts so they are interchangeable"
 * (atomiks, #3365)). Floor coverage: the right-click-open interaction (the
 * exact `fireEvent.contextMenu(trigger, { clientX, clientY, button: 2 })`
 * pattern the source test suite uses), a nested submenu, and checkbox/radio
 * items — since every popup part is a direct Menu re-export, styling matches
 * ../menu/menu.module.css closely.
 *
 * Portal note: the popup subtree mounts on document.body — plays query via
 * `within(canvasElement.ownerDocument.body)`.
 */
const meta = {
  title: 'Overlays/Context Menu',
  component: ContextMenu.Root,
  subcomponents: {
    'ContextMenu.Trigger': ContextMenu.Trigger,
    'ContextMenu.Portal': ContextMenu.Portal,
    'ContextMenu.Positioner': ContextMenu.Positioner,
    'ContextMenu.Popup': ContextMenu.Popup,
    'ContextMenu.Item': ContextMenu.Item,
    'ContextMenu.SubmenuRoot': ContextMenu.SubmenuRoot,
    'ContextMenu.SubmenuTrigger': ContextMenu.SubmenuTrigger,
    'ContextMenu.CheckboxItem': ContextMenu.CheckboxItem,
    'ContextMenu.RadioGroup': ContextMenu.RadioGroup,
    'ContextMenu.RadioItem': ContextMenu.RadioItem,
  },
} satisfies Meta<typeof ContextMenu.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Hero: right-click-open interaction                                  */
/* ------------------------------------------------------------------ */

function HeroExample() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={styles.Trigger} data-testid="trigger">
        Right-click this card
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={styles.Positioner}>
          <ContextMenu.Popup className={styles.Popup}>
            <ContextMenu.Item className={styles.Item}>Add to Library</ContextMenu.Item>
            <ContextMenu.Item className={styles.Item}>Add to Playlist</ContextMenu.Item>
            <ContextMenu.Separator className={styles.Separator} />
            <ContextMenu.Item className={styles.Item}>Play Next</ContextMenu.Item>
            <ContextMenu.Item className={styles.Item}>Favorite</ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

/**
 * The docs hero demo, driven by the exact `fireEvent.contextMenu` pattern the
 * source test suite uses: the popup opens at the pointer position (a virtual
 * anchor, not a DOM ref) and suppresses the native OS context menu.
 */
export const Hero: Story = {
  render: () => <HeroExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByTestId('trigger');

    fireEvent.contextMenu(trigger, { clientX: 30, clientY: 30, button: 2 });
    const menu = await body.findByRole('menu');
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() => expect(menu).toBeVisible());

    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Favorite' }));
    await waitFor(() => expect(menu).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Nested submenu                                                      */
/* ------------------------------------------------------------------ */

function NestedSubmenuExample() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={styles.Trigger} data-testid="trigger">
        Right-click this song row
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={styles.Positioner}>
          <ContextMenu.Popup className={styles.Popup}>
            <ContextMenu.Item className={styles.Item}>Add to Library</ContextMenu.Item>
            <ContextMenu.SubmenuRoot>
              <ContextMenu.SubmenuTrigger className={styles.SubmenuTrigger}>
                Add to Playlist
                <CaretRightIcon />
              </ContextMenu.SubmenuTrigger>
              <ContextMenu.Portal>
                <ContextMenu.Positioner
                  className={styles.Positioner}
                  alignOffset={-4}
                  sideOffset={-4}
                >
                  <ContextMenu.Popup className={styles.Popup}>
                    <ContextMenu.Item className={styles.Item}>Get Up!</ContextMenu.Item>
                    <ContextMenu.Item className={styles.Item}>Inside Out</ContextMenu.Item>
                    <ContextMenu.Item className={styles.Item}>Night Beats</ContextMenu.Item>
                  </ContextMenu.Popup>
                </ContextMenu.Positioner>
              </ContextMenu.Portal>
            </ContextMenu.SubmenuRoot>
            <ContextMenu.Separator className={styles.Separator} />
            <ContextMenu.Item className={styles.Item}>Play Next</ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

/**
 * Nest menus with `SubmenuRoot` + `SubmenuTrigger` — the identical composition
 * rule Menu documents for itself; Context Menu adds no rules of its own beyond
 * the Root/Trigger pointer-anchor mechanics.
 */
export const NestedSubmenu: Story = {
  render: () => <NestedSubmenuExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByTestId('trigger');

    fireEvent.contextMenu(trigger, { clientX: 40, clientY: 40, button: 2 });
    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());

    const submenuTrigger = within(menu).getByRole('menuitem', { name: 'Add to Playlist' });
    await userEvent.click(submenuTrigger);
    const submenu = await body.findByRole('menu', { name: 'Add to Playlist' });
    await waitFor(() =>
      expect(within(submenu).getByRole('menuitem', { name: 'Get Up!' })).toBeVisible(),
    );

    // fireEvent.click (not userEvent.click): the submenu briefly overlaps the
    // parent popup's invisible internal backdrop, which real pointer hit-testing
    // would otherwise flag as blocking the click.
    fireEvent.click(within(submenu).getByRole('menuitem', { name: 'Get Up!' }));
    await waitFor(() => expect(menu).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Checkbox and radio items                                            */
/* ------------------------------------------------------------------ */

function CheckboxAndRadioItemsExample() {
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [sort, setSort] = React.useState('date');
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={styles.Trigger} data-testid="trigger">
        Right-click this document
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={styles.Positioner}>
          <ContextMenu.Popup className={styles.Popup}>
            <ContextMenu.CheckboxItem
              checked={showMinimap}
              onCheckedChange={setShowMinimap}
              className={styles.CheckboxItem}
            >
              <ContextMenu.CheckboxItemIndicator className={styles.CheckboxItemIndicator}>
                <CheckIcon />
              </ContextMenu.CheckboxItemIndicator>
              <span className={styles.CheckboxItemText}>Show Minimap</span>
            </ContextMenu.CheckboxItem>
            <ContextMenu.Separator className={styles.Separator} />
            <ContextMenu.RadioGroup value={sort} onValueChange={setSort}>
              {['date', 'name', 'type'].map((option) => (
                <ContextMenu.RadioItem key={option} className={styles.RadioItem} value={option}>
                  <ContextMenu.RadioItemIndicator className={styles.RadioItemIndicator}>
                    <CheckIcon />
                  </ContextMenu.RadioItemIndicator>
                  <span className={styles.RadioItemText}>
                    Sort by {option[0].toUpperCase() + option.slice(1)}
                  </span>
                </ContextMenu.RadioItem>
              ))}
            </ContextMenu.RadioGroup>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

/**
 * `CheckboxItem`/`RadioItem` are direct re-exports of the Menu parts —
 * identical `role="menuitemcheckbox"`/`"menuitemradio"` semantics and
 * `closeOnClick={false}` default, so several can be toggled without the menu
 * closing each time.
 */
export const CheckboxAndRadioItems: Story = {
  render: () => <CheckboxAndRadioItemsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByTestId('trigger');

    fireEvent.contextMenu(trigger, { clientX: 30, clientY: 30, button: 2 });
    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());

    const minimap = within(menu).getByRole('menuitemcheckbox', { name: 'Show Minimap' });
    await expect(minimap).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(minimap);
    await waitFor(() => expect(minimap).toHaveAttribute('aria-checked', 'false'));
    // Checkbox items don't close the menu by default (closeOnClick=false).
    await waitFor(() => expect(menu).toBeVisible());

    const nameOption = within(menu).getByRole('menuitemradio', { name: 'Sort by Name' });
    await userEvent.click(nameOption);
    await waitFor(() => expect(nameOption).toHaveAttribute('aria-checked', 'true'));
    const dateOption = within(menu).getByRole('menuitemradio', { name: 'Sort by Date' });
    await expect(dateOption).toHaveAttribute('aria-checked', 'false');
  },
};

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M6 12V4l4.5 4z" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M13.5 4.5L6 12l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
