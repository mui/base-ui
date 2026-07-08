import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Menu } from '@base-ui/react/menu';
import { Dialog } from '@base-ui/react/dialog';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import styles from './menu.module.css';
import {
  CaretDownIcon,
  CaretRightIcon,
  CheckIcon,
  EllipsisIcon,
  BoltIcon,
  ExternalLinkIcon,
} from './icons';
import { RowActionsExample } from './recreations/RowActionsExample';
import { SettingsMenuExample } from './recreations/SettingsMenuExample';
import { ShadowPortalExample } from './recreations/ShadowPortalExample';

/**
 * Stories follow research/c-components/menu (Tier 1): the kept docs demos
 * (hero, checkbox/radio items, group labels, submenu, arrow, hover, detached
 * triggers, viewport transitions), one story per documented use case with the
 * required open→navigate→activate→close interaction coverage, and three
 * real-world recreations picked from the code-ok entries in
 * research/d-real-world-usage/menu/ranked.json.
 */
const meta = {
  title: 'Overlays/Menu',
  component: Menu.Root,
  subcomponents: {
    'Menu.Trigger': Menu.Trigger,
    'Menu.Portal': Menu.Portal,
    'Menu.Positioner': Menu.Positioner,
    'Menu.Popup': Menu.Popup,
    'Menu.Item': Menu.Item,
    'Menu.SubmenuRoot': Menu.SubmenuRoot,
    'Menu.SubmenuTrigger': Menu.SubmenuTrigger,
    'Menu.CheckboxItem': Menu.CheckboxItem,
    'Menu.RadioGroup': Menu.RadioGroup,
    'Menu.RadioItem': Menu.RadioItem,
    'Menu.Group': Menu.Group,
    'Menu.GroupLabel': Menu.GroupLabel,
    'Menu.Separator': Menu.Separator,
  },
} satisfies Meta<typeof Menu.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Kept docs demos                                                     */
/* ------------------------------------------------------------------ */

/** The docs hero demo: a Song action menu — trigger, portal, positioner, popup, items, and separators. Use as the starting point for any list of commands behind a button. */
export const Hero: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        Song <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.Item className={styles.Item}>Add to Library</Menu.Item>
            <Menu.Item className={styles.Item}>Add to Playlist</Menu.Item>
            <Menu.Separator className={styles.Separator} />
            <Menu.Item className={styles.Item}>Play Next</Menu.Item>
            <Menu.Item className={styles.Item}>Play Last</Menu.Item>
            <Menu.Separator className={styles.Separator} />
            <Menu.Item className={styles.Item}>Favorite</Menu.Item>
            <Menu.Item className={styles.Item}>Share</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
};

/** Set `openOnHover` on the Trigger (with an optional `delay`, default 100ms) for hover menus. Hover-opened menus are never modal, and impatient clicks within 500ms of a hover-open won't toggle the menu shut. */
export const OpenOnHover: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <Menu.Root>
      <Menu.Trigger openOnHover delay={100} className={styles.Button}>
        Add to playlist <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.Item className={styles.Item}>Get Up!</Menu.Item>
            <Menu.Item className={styles.Item}>Inside Out</Menu.Item>
            <Menu.Item className={styles.Item}>Night Beats</Menu.Item>
            <Menu.Separator className={styles.Separator} />
            <Menu.Item className={styles.Item}>New playlist…</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Add to playlist' });

    await userEvent.hover(trigger);
    // The popup mounts at `[data-starting-style]` (opacity 0), so visibility
    // needs a waitFor while the enter transition runs.
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Simulated unhover cannot exercise the safe-polygon close path reliably;
    // dismiss with Escape instead.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  },
};

function CheckboxItemsExample() {
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [showSearch, setShowSearch] = React.useState(true);
  const [showSidebar, setShowSidebar] = React.useState(false);
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        Workspace <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.CheckboxItem
              checked={showMinimap}
              onCheckedChange={setShowMinimap}
              className={styles.CheckboxItem}
            >
              <Menu.CheckboxItemIndicator className={styles.CheckboxItemIndicator}>
                <CheckIcon />
              </Menu.CheckboxItemIndicator>
              <span className={styles.CheckboxItemText}>Minimap</span>
            </Menu.CheckboxItem>
            <Menu.CheckboxItem
              checked={showSearch}
              onCheckedChange={setShowSearch}
              className={styles.CheckboxItem}
            >
              <Menu.CheckboxItemIndicator className={styles.CheckboxItemIndicator}>
                <CheckIcon />
              </Menu.CheckboxItemIndicator>
              <span className={styles.CheckboxItemText}>Search</span>
            </Menu.CheckboxItem>
            <Menu.CheckboxItem
              checked={showSidebar}
              onCheckedChange={setShowSidebar}
              className={styles.CheckboxItem}
            >
              <Menu.CheckboxItemIndicator className={styles.CheckboxItemIndicator}>
                <CheckIcon />
              </Menu.CheckboxItemIndicator>
              <span className={styles.CheckboxItemText}>Sidebar</span>
            </Menu.CheckboxItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Use `CheckboxItem` (`role="menuitemcheckbox"`) for toggleable settings. `closeOnClick` defaults to `false` on checkbox items, so several can be toggled without the menu closing each time. */
export const CheckboxItems: Story = {
  render: () => <CheckboxItemsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Workspace' }));
    const minimap = await body.findByRole('menuitemcheckbox', { name: 'Minimap' });
    await expect(minimap).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(minimap);
    await waitFor(() => expect(minimap).toHaveAttribute('aria-checked', 'false'));

    const sidebar = body.getByRole('menuitemcheckbox', { name: 'Sidebar' });
    await userEvent.click(sidebar);
    await waitFor(() => expect(sidebar).toHaveAttribute('aria-checked', 'true'));

    // Checkbox items don't close the menu by default (closeOnClick=false).
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
  },
};

function RadioItemsExample() {
  const [value, setValue] = React.useState('date');
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        Sort <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.RadioGroup value={value} onValueChange={setValue}>
              {['date', 'name', 'type'].map((option) => (
                <Menu.RadioItem key={option} className={styles.RadioItem} value={option}>
                  <Menu.RadioItemIndicator className={styles.RadioItemIndicator}>
                    <CheckIcon />
                  </Menu.RadioItemIndicator>
                  <span className={styles.RadioItemText}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </span>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Use `RadioGroup` + `RadioItem` (`role="menuitemradio"`) for an exclusive option set inside the menu — a setting, not a form value (use Select for form data). */
export const RadioItems: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => <RadioItemsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Sort' });

    // Keyboard open focuses the first item.
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const date = await body.findByRole('menuitemradio', { name: 'Date' });
    await expect(date).toHaveAttribute('aria-checked', 'true');
    await waitFor(() => expect(date).toHaveFocus());

    await userEvent.keyboard('{ArrowDown}');
    const name = body.getByRole('menuitemradio', { name: 'Name' });
    await waitFor(() => expect(name).toHaveFocus());

    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(name).toHaveAttribute('aria-checked', 'true'));
    await expect(date).toHaveAttribute('aria-checked', 'false');

    // Radio items keep the menu open by default (closeOnClick=false).
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
  },
};

function GroupLabelsExample() {
  const [sort, setSort] = React.useState('date');
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [showSearch, setShowSearch] = React.useState(true);
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        View <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.RadioGroup value={sort} onValueChange={setSort}>
              <Menu.GroupLabel className={styles.GroupLabel}>Sort</Menu.GroupLabel>
              {['date', 'name'].map((option) => (
                <Menu.RadioItem key={option} className={styles.RadioItem} value={option}>
                  <Menu.RadioItemIndicator className={styles.RadioItemIndicator}>
                    <CheckIcon />
                  </Menu.RadioItemIndicator>
                  <span className={styles.RadioItemText}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </span>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
            <Menu.Separator className={styles.Separator} />
            <Menu.Group>
              <Menu.GroupLabel className={styles.GroupLabel}>Workspace</Menu.GroupLabel>
              <Menu.CheckboxItem
                checked={showMinimap}
                onCheckedChange={setShowMinimap}
                className={styles.CheckboxItem}
              >
                <Menu.CheckboxItemIndicator className={styles.CheckboxItemIndicator}>
                  <CheckIcon />
                </Menu.CheckboxItemIndicator>
                <span className={styles.CheckboxItemText}>Minimap</span>
              </Menu.CheckboxItem>
              <Menu.CheckboxItem
                checked={showSearch}
                onCheckedChange={setShowSearch}
                className={styles.CheckboxItem}
              >
                <Menu.CheckboxItemIndicator className={styles.CheckboxItemIndicator}>
                  <CheckIcon />
                </Menu.CheckboxItemIndicator>
                <span className={styles.CheckboxItemText}>Search</span>
              </Menu.CheckboxItem>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Use `Group` + `GroupLabel` to label related items: the label is auto-wired via `aria-labelledby` and works inside `RadioGroup` too (#4826). */
export const GroupLabels: Story = {
  render: () => <GroupLabelsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'View' }));
    await body.findByRole('menu');

    // GroupLabel wires role="group" + aria-labelledby automatically.
    await waitFor(() => expect(body.getByRole('group', { name: 'Sort' })).toBeVisible());
    await expect(body.getByRole('group', { name: 'Workspace' })).toBeVisible();
  },
};

function SubmenuExample() {
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        Song <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.Item className={styles.Item}>Add to Library</Menu.Item>
            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger className={styles.SubmenuTrigger}>
                Add to Playlist
                <CaretRightIcon />
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner
                  className={styles.Positioner}
                  sideOffset={getSubmenuOffset}
                  alignOffset={getSubmenuOffset}
                >
                  <Menu.Popup className={styles.Popup}>
                    <Menu.Item className={styles.Item}>Get Up!</Menu.Item>
                    <Menu.Item className={styles.Item}>Inside Out</Menu.Item>
                    <Menu.Item className={styles.Item}>Night Beats</Menu.Item>
                    <Menu.Separator className={styles.Separator} />
                    <Menu.Item className={styles.Item}>New playlist…</Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>
            <Menu.Separator className={styles.Separator} />
            <Menu.Item className={styles.Item}>Play Next</Menu.Item>
            <Menu.Item className={styles.Item}>Play Last</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function getSubmenuOffset({ side }: { side: Menu.Positioner.Props['side'] }) {
  return side === 'top' || side === 'bottom' ? 4 : -4;
}

/** Nest menus with `SubmenuRoot` + `SubmenuTrigger` (never a nested `Root` — #2042). Submenus open on hover by default and position to the inline-end side. */
export const Submenu: Story = {
  render: () => <SubmenuExample />,
};

/** Keyboard contract for submenus: `ArrowRight` opens and focuses the first child item, `ArrowLeft` closes and refocuses the submenu trigger, and `Escape` closes only one level (`closeParentOnEsc` defaults to `false`, per ARIA/MDN — #2493). */
export const SubmenuKeyboard: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => <SubmenuExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Song' });

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const rootMenu = await body.findByRole('menu', { name: 'Song' });
    await waitFor(() =>
      expect(body.getByRole('menuitem', { name: 'Add to Library' })).toHaveFocus(),
    );

    await userEvent.keyboard('{ArrowDown}');
    const submenuTrigger = body.getByRole('menuitem', { name: 'Add to Playlist' });
    await waitFor(() => expect(submenuTrigger).toHaveFocus());

    // ArrowRight opens the submenu and focuses its first item (LTR).
    await userEvent.keyboard('{ArrowRight}');
    const submenu = await body.findByRole('menu', { name: 'Add to Playlist' });
    await waitFor(() =>
      expect(within(submenu).getByRole('menuitem', { name: 'Get Up!' })).toHaveFocus(),
    );

    // Escape closes only the submenu level; the root menu stays open.
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(body.queryByRole('menu', { name: 'Add to Playlist' })).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(rootMenu).toBeVisible());
    await waitFor(() => expect(submenuTrigger).toHaveFocus());

    // ArrowLeft also closes the submenu and refocuses its trigger.
    await userEvent.keyboard('{ArrowRight}');
    const reopened = await body.findByRole('menu', { name: 'Add to Playlist' });
    await waitFor(() =>
      expect(within(reopened).getByRole('menuitem', { name: 'Get Up!' })).toHaveFocus(),
    );
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() =>
      expect(body.queryByRole('menu', { name: 'Add to Playlist' })).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(submenuTrigger).toHaveFocus());
  },
};

/** Add `Menu.Arrow` inside the Popup for a visual pointer to the trigger; style each side via `data-side`. */
export const Arrow: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        Song <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          className={styles.Positioner}
          sideOffset={({ side }) => (side === 'top' ? 12 : 8)}
        >
          <Menu.Popup className={styles.Popup}>
            <Menu.Arrow className={styles.Arrow} />
            <Menu.Item className={styles.Item}>Add to Library</Menu.Item>
            <Menu.Item className={styles.Item}>Add to Playlist</Menu.Item>
            <Menu.Separator className={styles.Separator} />
            <Menu.Item className={styles.Item}>Favorite</Menu.Item>
            <Menu.Item className={styles.Item}>Share</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
};

/** Use `LinkItem` for navigation entries inside an action menu — a real `<a href>` with `role="menuitem"` (v1.2.0, #3400). Like checkbox/radio items, `closeOnClick` defaults to `false`. */
export const LinkItems: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        Help <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.LinkItem className={styles.LinkItem} href="#documentation">
              Documentation <ExternalLinkIcon />
            </Menu.LinkItem>
            <Menu.LinkItem className={styles.LinkItem} href="#shortcuts">
              Keyboard shortcuts
            </Menu.LinkItem>
            <Menu.LinkItem className={styles.LinkItem} href="#release-notes">
              Release notes
            </Menu.LinkItem>
            <Menu.Separator className={styles.Separator} />
            <Menu.Item className={styles.Item}>Contact support…</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Help' }));
    const docsLink = await body.findByRole('menuitem', { name: 'Documentation' });

    // LinkItem renders a real anchor while keeping menu semantics.
    await expect(docsLink.tagName).toBe('A');
    await expect(docsLink).toHaveAttribute('href', '#documentation');
  },
};

const detachedMenuHandle = Menu.createHandle();

/** Connect a trigger and a root rendered in different parts of the tree with `Menu.createHandle()` — no shared React state needed (#3170). */
export const DetachedTriggersSimple: Story = {
  render: () => (
    <React.Fragment>
      <Menu.Trigger
        className={styles.IconButton}
        handle={detachedMenuHandle}
        aria-label="Project actions"
      >
        <EllipsisIcon />
      </Menu.Trigger>
      <Menu.Root handle={detachedMenuHandle}>
        <Menu.Portal>
          <Menu.Positioner className={styles.Positioner} sideOffset={8}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Item className={styles.Item}>Rename</Menu.Item>
              <Menu.Item className={styles.Item}>Duplicate</Menu.Item>
              <Menu.Item className={styles.Item}>Move to folder</Menu.Item>
              <Menu.Separator className={styles.Separator} />
              <Menu.Item className={styles.Item}>Archive</Menu.Item>
              <Menu.Item className={styles.Item}>Delete</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </React.Fragment>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Project actions' }));
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
    await expect(body.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
  },
};

const documentMenuHandle = Menu.createHandle<{ name: string }>();

/** Give each detached trigger a `payload`; the Root's function child renders content for whichever trigger opened the menu — one menu instance serving many launch points. */
export const DetachedTriggersPayload: Story = {
  render: () => (
    <div className={styles.Row}>
      <Menu.Trigger
        className={styles.Button}
        handle={documentMenuHandle}
        payload={{ name: 'Q1 report' }}
      >
        Q1 report
      </Menu.Trigger>
      <Menu.Trigger
        className={styles.Button}
        handle={documentMenuHandle}
        payload={{ name: 'Q2 forecast' }}
      >
        Q2 forecast
      </Menu.Trigger>
      <Menu.Root handle={documentMenuHandle}>
        {({ payload }) => (
          <Menu.Portal>
            <Menu.Positioner className={styles.Positioner} sideOffset={8}>
              <Menu.Popup className={styles.Popup}>
                <Menu.Group>
                  <Menu.GroupLabel className={styles.PlainGroupLabel}>
                    {payload?.name}
                  </Menu.GroupLabel>
                  <Menu.Item className={styles.Item}>Rename</Menu.Item>
                  <Menu.Item className={styles.Item}>Share</Menu.Item>
                  <Menu.Item className={styles.Item}>Delete</Menu.Item>
                </Menu.Group>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        )}
      </Menu.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Q1 report' }));
    await waitFor(() => expect(body.getByRole('group', { name: 'Q1 report' })).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());

    await userEvent.click(canvas.getByRole('button', { name: 'Q2 forecast' }));
    await waitFor(() => expect(body.getByRole('group', { name: 'Q2 forecast' })).toBeVisible());
  },
};

const controlledItemGroups = {
  library: ['Add to library', 'Add to favorites'],
  playback: ['Play now', 'Add to queue'],
  share: ['Copy link', 'Share to contacts'],
} as const;

type ControlledMenuKey = keyof typeof controlledItemGroups;

const controlledMenuHandle = Menu.createHandle<ControlledMenuKey>();

function ControlledMultiTriggerExample() {
  const [open, setOpen] = React.useState(false);
  const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean, eventDetails: Menu.Root.ChangeEventDetails) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setActiveTrigger(eventDetails.trigger?.id ?? null);
    }
  };

  return (
    <div className={styles.Stack}>
      <div className={styles.Row}>
        <Menu.Trigger
          className={styles.Button}
          handle={controlledMenuHandle}
          id="library-trigger"
          payload="library"
        >
          Library
        </Menu.Trigger>
        <Menu.Trigger
          className={styles.Button}
          handle={controlledMenuHandle}
          id="share-trigger"
          payload="share"
        >
          Share
        </Menu.Trigger>
        <button
          type="button"
          className={styles.PlainButton}
          onClick={() => {
            setActiveTrigger('share-trigger');
            setOpen(true);
          }}
        >
          Open share menu programmatically
        </button>
      </div>
      <Menu.Root
        handle={controlledMenuHandle}
        open={open}
        triggerId={activeTrigger}
        onOpenChange={handleOpenChange}
      >
        {({ payload }) => (
          <Menu.Portal>
            <Menu.Positioner className={styles.Positioner} sideOffset={8}>
              <Menu.Popup className={styles.Popup}>
                {payload
                  ? controlledItemGroups[payload].map((label) => (
                      <Menu.Item key={label} className={styles.Item}>
                        {label}
                      </Menu.Item>
                    ))
                  : null}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        )}
      </Menu.Root>
      <output className={styles.Output}>active trigger: {activeTrigger ?? 'none'}</output>
    </div>
  );
}

/** Controlled mode with several triggers: pair `open` with `triggerId`, and read `eventDetails.trigger` in `onOpenChange` to track which trigger asked to open. */
export const ControlledMultiTrigger: Story = {
  render: () => <ControlledMultiTriggerExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Library' }));
    await waitFor(() =>
      expect(body.getByRole('menuitem', { name: 'Add to library' })).toBeVisible(),
    );
    await expect(canvas.getByText('active trigger: library-trigger')).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());

    // Programmatic open against a specific trigger id anchors the popup to it.
    await userEvent.click(canvas.getByRole('button', { name: 'Open share menu programmatically' }));
    await waitFor(() => expect(body.getByRole('menuitem', { name: 'Copy link' })).toBeVisible());
    await expect(canvas.getByText('active trigger: share-trigger')).toBeVisible();
  },
};

const viewportMenus = {
  library: {
    heading: 'Library',
    groups: [
      ['Add to library', 'Add to favorites'],
      ['Create playlist', 'Create station'],
    ],
  },
  playback: {
    heading: 'Playback',
    groups: [
      ['Play now', 'Add to queue'],
      ['Play next', 'Play last', 'Sleep timer'],
    ],
  },
  share: {
    heading: 'Share',
    groups: [
      ['Copy link', 'Copy embed code'],
      ['Share to contacts', 'Share to social'],
    ],
  },
} as const;

type ViewportMenuKey = keyof typeof viewportMenus;

const viewportMenuHandle = Menu.createHandle<ViewportMenuKey>();

/** The docs detached-triggers demo with `Menu.Viewport`: switching triggers morphs the popup — the Positioner freezes to `var(--positioner-*)`, the Popup transitions `width`/`height`, and the Viewport cross-fades old/new content via `data-previous`/`data-current`. */
export const ViewportContentTransition: Story = {
  render: () => (
    <div className={styles.Row}>
      {(Object.keys(viewportMenus) as ViewportMenuKey[]).map((key) => (
        <Menu.Trigger key={key} className={styles.Button} handle={viewportMenuHandle} payload={key}>
          {viewportMenus[key].heading}
        </Menu.Trigger>
      ))}
      <Menu.Root handle={viewportMenuHandle} modal={false}>
        {({ payload }) => (
          <Menu.Portal>
            <Menu.Positioner
              sideOffset={8}
              className={`${styles.Positioner} ${styles.TransitionPositioner}`}
            >
              <Menu.Popup className={`${styles.Popup} ${styles.TransitionPopup}`}>
                <Menu.Viewport className={styles.Viewport}>
                  {payload
                    ? viewportMenus[payload].groups.map((group, groupIndex) => (
                        <React.Fragment key={groupIndex}>
                          <Menu.Group>
                            {groupIndex === 0 && (
                              <Menu.GroupLabel className={styles.PlainGroupLabel}>
                                {viewportMenus[payload].heading}
                              </Menu.GroupLabel>
                            )}
                            {group.map((item) => (
                              <Menu.Item key={item} className={styles.Item}>
                                {item}
                              </Menu.Item>
                            ))}
                          </Menu.Group>
                          {groupIndex < viewportMenus[payload].groups.length - 1 && (
                            <Menu.Separator className={styles.Separator} />
                          )}
                        </React.Fragment>
                      ))
                    : null}
                </Menu.Viewport>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        )}
      </Menu.Root>
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Behavior stories (one per documented use case)                      */
/* ------------------------------------------------------------------ */

/** The full open/close contract: click toggles the menu, the trigger reflects state via `aria-expanded` + `data-popup-open`, Escape closes and refocuses the trigger, and pressing outside dismisses. */
export const OpenClose: Story = {
  render: () => (
    <div className={styles.Stack}>
      <Menu.Root>
        <Menu.Trigger className={styles.Button}>
          Song <CaretDownIcon />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.Positioner} sideOffset={8}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Item className={styles.Item}>Add to Library</Menu.Item>
              <Menu.Item className={styles.Item}>Play Next</Menu.Item>
              <Menu.Item className={styles.Item}>Share</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <p className={styles.Output}>Outside content</p>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Song' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    // Click open: the popup portals to document.body.
    await userEvent.click(trigger);
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('data-popup-open');

    // Escape closes and returns focus to the trigger.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Outside press closes too.
    await userEvent.click(trigger);
    await body.findByRole('menu');
    await userEvent.click(canvas.getByText('Outside content'));
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};

/** Arrow keys rove one tab stop through the items; `Home`/`End` jump, and navigation loops while `loopFocus` (default `true`). Keyboard open focuses the first item — pointer open deliberately does not (#4818). */
export const KeyboardNavigation: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        File <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.Item className={styles.Item}>New file</Menu.Item>
            <Menu.Item className={styles.Item}>New window</Menu.Item>
            <Menu.Item className={styles.Item} disabled>
              Open recent
            </Menu.Item>
            <Menu.Item className={styles.Item}>Save</Menu.Item>
            <Menu.Item className={styles.Item}>Exit</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'File' });

    // ArrowDown on the closed trigger opens and focuses the first item.
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await body.findByRole('menu');
    const newFile = body.getByRole('menuitem', { name: 'New file' });
    const exitItem = body.getByRole('menuitem', { name: 'Exit' });
    await waitFor(() => expect(newFile).toHaveFocus());

    await userEvent.keyboard('{End}');
    await waitFor(() => expect(exitItem).toHaveFocus());

    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(newFile).toHaveFocus());

    // loopFocus defaults to true: ArrowUp from the first item wraps to the last.
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(exitItem).toHaveFocus());
  },
};

/** Typing highlights the next matching item (typeahead). Use the `label` prop to control matching for items whose content is an icon or complex markup — inference can otherwise pick up stray SVG text (#3256). */
export const Typeahead: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        Commands <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.Item className={styles.Item}>Aa</Menu.Item>
            <Menu.Item className={styles.Item}>Ba</Menu.Item>
            <Menu.Item className={styles.Item}>Bb</Menu.Item>
            <Menu.Item className={styles.Item}>Ca</Menu.Item>
            <Menu.Item className={styles.Item}>Cd</Menu.Item>
            <Menu.Separator className={styles.Separator} />
            <Menu.Item className={styles.Item} label="Quick actions" aria-label="Quick actions">
              <BoltIcon />
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Commands' });

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await body.findByRole('menu');
    await waitFor(() => expect(body.getByRole('menuitem', { name: 'Aa' })).toHaveFocus());

    // Consecutive characters build one search string: "c" → Ca, "cd" → Cd.
    await userEvent.keyboard('c');
    await waitFor(() => expect(body.getByRole('menuitem', { name: 'Ca' })).toHaveFocus());
    await userEvent.keyboard('d');
    await waitFor(() => expect(body.getByRole('menuitem', { name: 'Cd' })).toHaveFocus());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());

    // The `label` prop drives matching for the icon-only item.
    await userEvent.keyboard('{ArrowDown}');
    await body.findByRole('menu');
    await waitFor(() => expect(body.getByRole('menuitem', { name: 'Aa' })).toHaveFocus());
    await userEvent.keyboard('q');
    await waitFor(() =>
      expect(body.getByRole('menuitem', { name: 'Quick actions' })).toHaveFocus(),
    );
  },
};

/** `closeOnClick` defaults are deliberately asymmetric: plain `Item` closes the menu, checkbox/radio/link items don't. Override per item to keep an action menu open or make a toggle dismiss. */
export const CloseOnClickConfig: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        Feed <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.Item className={styles.Item} closeOnClick={false}>
              Refresh now (stays open)
            </Menu.Item>
            <Menu.Item className={styles.Item}>Mark all as read (closes)</Menu.Item>
            <Menu.Separator className={styles.Separator} />
            <Menu.CheckboxItem className={styles.CheckboxItem} defaultChecked closeOnClick>
              <Menu.CheckboxItemIndicator className={styles.CheckboxItemIndicator}>
                <CheckIcon />
              </Menu.CheckboxItemIndicator>
              <span className={styles.CheckboxItemText}>Auto-refresh (closes)</span>
            </Menu.CheckboxItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Feed' }));
    const stayOpenItem = await body.findByRole('menuitem', { name: 'Refresh now (stays open)' });

    // closeOnClick={false} keeps the menu open after activating an Item.
    await userEvent.click(stayOpenItem);
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());

    // closeOnClick on a CheckboxItem makes the toggle dismiss the menu.
    await userEvent.click(body.getByRole('menuitemcheckbox', { name: 'Auto-refresh (closes)' }));
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};

function DisabledItemsExample() {
  const [lastAction, setLastAction] = React.useState('none');
  return (
    <div className={styles.Stack}>
      <Menu.Root>
        <Menu.Trigger className={styles.Button}>
          Edit <CaretDownIcon />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.Positioner} sideOffset={8}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Item className={styles.Item} onClick={() => setLastAction('Undo')}>
                Undo
              </Menu.Item>
              <Menu.Item className={styles.Item} disabled onClick={() => setLastAction('Redo')}>
                Redo
              </Menu.Item>
              <Menu.Separator className={styles.Separator} />
              <Menu.CheckboxItem className={styles.CheckboxItem} disabled>
                <Menu.CheckboxItemIndicator className={styles.CheckboxItemIndicator}>
                  <CheckIcon />
                </Menu.CheckboxItemIndicator>
                <span className={styles.CheckboxItemText}>Track changes</span>
              </Menu.CheckboxItem>
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className={styles.SubmenuTrigger} disabled>
                  Export as
                  <CaretRightIcon />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner className={styles.Positioner}>
                    <Menu.Popup className={styles.Popup}>
                      <Menu.Item className={styles.Item}>PDF</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <output className={styles.Output}>last action: {lastAction}</output>
    </div>
  );
}

/** Disabled items stay focusable and highlightable by design (ARIA APG; VoiceOver does not skip disabled items — #1733, #4881) but cannot be activated. Style them via `data-disabled`. */
export const DisabledItems: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => <DisabledItemsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Edit' });

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await body.findByRole('menu');
    await waitFor(() => expect(body.getByRole('menuitem', { name: 'Undo' })).toHaveFocus());

    // The disabled item is reachable by keyboard (not skipped)…
    await userEvent.keyboard('{ArrowDown}');
    const redo = body.getByRole('menuitem', { name: 'Redo' });
    await expect(redo).toHaveAttribute('aria-disabled', 'true');
    await waitFor(() => expect(redo).toHaveFocus());

    // …but cannot be activated.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
    await expect(canvas.getByText('last action: none')).toBeVisible();
  },
};

function NonModalExample() {
  const [count, setCount] = React.useState(0);
  return (
    <div className={styles.Row}>
      <Menu.Root modal={false}>
        <Menu.Trigger className={styles.Button}>
          Filters <CaretDownIcon />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.Positioner} sideOffset={8}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Item className={styles.Item}>Only unread</Menu.Item>
              <Menu.Item className={styles.Item}>Only mentions</Menu.Item>
              <Menu.Item className={styles.Item}>Clear filters</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <button type="button" className={styles.PlainButton} onClick={() => setCount(count + 1)}>
        Clicks: {count}
      </button>
    </div>
  );
}

/** `modal` defaults to `true` (scroll locked, outside pointers blocked). Use `modal={false}` when the page must stay interactive while the menu is open — dense toolbars, row actions. */
export const NonModal: Story = {
  render: () => <NonModalExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Filters' }));
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());

    // Non-modal: the outside button still receives the click (which also dismisses).
    await userEvent.click(canvas.getByRole('button', { name: 'Clicks: 0' }));
    await expect(await canvas.findByRole('button', { name: 'Clicks: 1' })).toBeVisible();
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};

function EventDetailsExample() {
  const [open, setOpen] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);

  const handleOpenChange = (nextOpen: boolean, eventDetails: Menu.Root.ChangeEventDetails) => {
    // Veto light dismissal: only explicit actions may close the menu. An
    // outside click fires `outside-press`, and the outside element taking
    // focus then fires `focus-out` — cancel both, or the second one closes it.
    if (eventDetails.reason === 'outside-press' || eventDetails.reason === 'focus-out') {
      eventDetails.cancel();
      setLog((entries) => [...entries, `${eventDetails.reason} (canceled)`]);
      return;
    }
    setOpen(nextOpen);
    setLog((entries) => [...entries, eventDetails.reason]);
  };

  return (
    <div className={styles.Stack}>
      <div className={styles.Row}>
        <Menu.Root open={open} onOpenChange={handleOpenChange} modal={false}>
          <Menu.Trigger className={styles.Button}>
            Notifications <CaretDownIcon />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className={styles.Positioner} sideOffset={8}>
              <Menu.Popup className={styles.Popup}>
                <Menu.Item className={styles.Item}>Mark all as read</Menu.Item>
                <Menu.Item className={styles.Item}>Mute for 1 hour</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
        <button type="button" className={styles.PlainButton}>
          Outside area
        </button>
      </div>
      <output className={styles.Output}>reasons: {log.length > 0 ? log.join(', ') : 'none'}</output>
    </div>
  );
}

/** Every `onOpenChange` call carries `eventDetails`: a typed `reason` (`trigger-press`, `outside-press`, `focus-out`, `escape-key`, `item-press`…) plus `.cancel()` to veto the change while staying uncontrolled-friendly. */
export const EventDetailsReasons: Story = {
  render: () => <EventDetailsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Notifications' }));
    const menu = await body.findByRole('menu');
    await expect(canvas.getByText(/trigger-press/)).toBeVisible();

    // Outside press (and the follow-up focus-out) is canceled by the handler,
    // so the menu stays open.
    await userEvent.click(canvas.getByRole('button', { name: 'Outside area' }));
    await expect(canvas.getByText(/outside-press \(canceled\)/)).toBeVisible();
    await waitFor(() => expect(menu).toBeVisible());

    // Escape is not canceled and closes the menu.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
    await expect(canvas.getByText(/escape-key/)).toBeVisible();
  },
};

function OpenDialogExample() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  return (
    <React.Fragment>
      <Menu.Root>
        <Menu.Trigger className={styles.Button}>
          Project <CaretDownIcon />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.Positioner} sideOffset={8}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Item className={styles.Item}>Rename</Menu.Item>
              <Menu.Item className={styles.Item}>Duplicate</Menu.Item>
              <Menu.Separator className={styles.Separator} />
              <Menu.Item
                className={`${styles.Item} ${styles.DangerItem}`}
                onClick={() => setDialogOpen(true)}
              >
                Delete…
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.DialogPopup}>
            <Dialog.Title className={styles.DialogTitle}>Delete project</Dialog.Title>
            <Dialog.Description className={styles.DialogDescription}>
              This action cannot be undone.
            </Dialog.Description>
            <div className={styles.DialogActions}>
              <Dialog.Close className={styles.PlainButton}>Cancel</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </React.Fragment>
  );
}

/** The docs "Open a dialog" recipe: a controlled Dialog lives outside the menu, and a `Menu.Item` `onClick` opens it — the item press closes the menu, then the dialog takes focus. */
export const OpenDialogFromMenu: Story = {
  render: () => <OpenDialogExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Project' }));
    await userEvent.click(await body.findByRole('menuitem', { name: 'Delete…' }));

    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible());
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};

/** CSS transitions via `[data-starting-style]`/`[data-ending-style]` with `transform-origin: var(--transform-origin)`; `[data-instant]` marks moments (keyboard close, menubar switching) where the transition should be skipped. */
export const TransitionAnimation: Story = {
  render: () => (
    <Menu.Root>
      <Menu.Trigger className={styles.Button}>
        Song <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.AnimatedPopup}>
            <Menu.Item className={styles.Item}>Add to Library</Menu.Item>
            <Menu.Item className={styles.Item}>Play Next</Menu.Item>
            <Menu.Item className={styles.Item}>Favorite</Menu.Item>
            <Menu.Item className={styles.Item}>Share</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
};

/** With `DirectionProvider direction="rtl"` the submenu keys mirror: `ArrowLeft` opens a submenu and `ArrowRight` closes it. */
export const RTLSubmenu: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  render: () => (
    <div dir="rtl">
      <DirectionProvider direction="rtl">
        <Menu.Root>
          <Menu.Trigger className={styles.Button}>
            Song <CaretDownIcon />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className={styles.Positioner} sideOffset={8}>
              <Menu.Popup className={styles.Popup}>
                <Menu.Item className={styles.Item}>Add to Library</Menu.Item>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger className={styles.SubmenuTrigger}>
                    Add to Playlist
                    <CaretRightIcon style={{ transform: 'scaleX(-1)' }} />
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner className={styles.Positioner}>
                      <Menu.Popup className={styles.Popup}>
                        <Menu.Item className={styles.Item}>Get Up!</Menu.Item>
                        <Menu.Item className={styles.Item}>Inside Out</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
                <Menu.Item className={styles.Item}>Share</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </DirectionProvider>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Song' });

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await body.findByRole('menu', { name: 'Song' });
    await waitFor(() =>
      expect(body.getByRole('menuitem', { name: 'Add to Library' })).toHaveFocus(),
    );

    await userEvent.keyboard('{ArrowDown}');
    const submenuTrigger = body.getByRole('menuitem', { name: 'Add to Playlist' });
    await waitFor(() => expect(submenuTrigger).toHaveFocus());

    // RTL: ArrowLeft opens the submenu…
    await userEvent.keyboard('{ArrowLeft}');
    const submenu = await body.findByRole('menu', { name: 'Add to Playlist' });
    await waitFor(() =>
      expect(within(submenu).getByRole('menuitem', { name: 'Get Up!' })).toHaveFocus(),
    );

    // …and ArrowRight closes it, refocusing the trigger.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(body.queryByRole('menu', { name: 'Add to Playlist' })).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(submenuTrigger).toHaveFocus());
  },
};

/** Set `highlightItemOnHover={false}` (Root) to decouple CSS `:hover` (dashed outline here) from the keyboard-driven `[data-highlighted]` state (solid fill) — the same split users asked for in Combobox (#2731, synced in #3377). */
export const HighlightItemOnHoverDisabled: Story = {
  render: () => (
    <Menu.Root highlightItemOnHover={false}>
      <Menu.Trigger className={styles.Button}>
        Song <CaretDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.Positioner} sideOffset={8}>
          <Menu.Popup className={styles.Popup}>
            <Menu.Item className={styles.ItemHoverDemo}>Add to Library</Menu.Item>
            <Menu.Item className={styles.ItemHoverDemo}>Play Next</Menu.Item>
            <Menu.Item className={styles.ItemHoverDemo}>Favorite</Menu.Item>
            <Menu.Item className={styles.ItemHoverDemo}>Share</Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  ),
};

const imperativeMenuHandle = Menu.createHandle();

function ImperativeHandleExample() {
  const [state, setState] = React.useState('closed');
  return (
    <div className={styles.Stack}>
      <div className={styles.Row}>
        <button
          type="button"
          className={styles.PlainButton}
          onClick={() => imperativeMenuHandle.open('imperative-menu-trigger')}
        >
          handle.open()
        </button>
        <button
          type="button"
          className={styles.PlainButton}
          onClick={() => imperativeMenuHandle.close()}
        >
          handle.close()
        </button>
        <Menu.Trigger
          handle={imperativeMenuHandle}
          id="imperative-menu-trigger"
          className={styles.Button}
        >
          Alerts <CaretDownIcon />
        </Menu.Trigger>
      </div>
      <Menu.Root
        handle={imperativeMenuHandle}
        modal={false}
        onOpenChange={(nextOpen) => setState(nextOpen ? 'open' : 'closed')}
      >
        <Menu.Portal>
          <Menu.Positioner className={styles.Positioner} sideOffset={8}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Item className={styles.Item}>Mark all read</Menu.Item>
              <Menu.Item className={styles.Item}>Mute for 1 hour</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <output className={styles.Output}>menu is {state}</output>
    </div>
  );
}

/** Handles double as an imperative API: `handle.open(triggerId)` / `handle.close()` from any event handler. Calls are ignored unless a Root using the handle is mounted — no replay, no carry-over. */
export const ImperativeHandle: Story = {
  render: () => <ImperativeHandleExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'handle.open()' }));
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());
    await expect(canvas.getByText('menu is open')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'handle.close()' }));
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
    await expect(canvas.getByText('menu is closed')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/menu)           */
/* ------------------------------------------------------------------ */

/**
 * Recreation of a data-table row-actions menu: kebab trigger per row,
 * `modal={false}` so the page never locks scroll (the wrapper's own stated
 * reason), `align="end"` positioning, and a destructive item. Recomposed from
 * oxidecomputer/console `DropdownMenu.tsx` (MPL-2.0, code-ok,
 * research/d-real-world-usage/menu/ranked.json #4).
 */
export const RealWorldRowActions: Story = {
  tags: ['recreation'],
  render: () => <RowActionsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Row actions for db-replica' }));
    await userEvent.click(await body.findByRole('menuitem', { name: 'Delete' }));

    await expect(await canvas.findByText('last action: Delete db-replica')).toBeVisible();
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};

/**
 * Recreation of an editor settings menu that stays open while toggling:
 * checkbox items for frame visibility, a radio group for the theme (both keep
 * the menu open — `closeOnClick` defaults to `false`), and
 * `onOpenChangeComplete` to run cleanup only after the exit animation.
 * Recomposed from seek-oss/playroom `Menu.tsx` (MIT, code-ok,
 * research/d-real-world-usage/menu/ranked.json #3).
 */
export const RealWorldSettingsMenu: Story = {
  tags: ['recreation'],
  render: () => <SettingsMenuExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Settings' }));
    const tablet = await body.findByRole('menuitemcheckbox', { name: 'Tablet' });

    // Toggle two settings; the menu must stay open between toggles.
    await userEvent.click(tablet);
    await expect(await canvas.findByText(/3 frames visible/)).toBeVisible();
    await userEvent.click(body.getByRole('menuitemcheckbox', { name: 'Phone' }));
    await expect(await canvas.findByText(/2 frames visible/)).toBeVisible();
    await waitFor(() => expect(body.getByRole('menu')).toBeVisible());

    // onOpenChangeComplete fires only after the exit transition settles.
    await userEvent.keyboard('{Escape}');
    await expect(await canvas.findByText(/close settled/)).toBeVisible();
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};

/**
 * Recreation of a devtools-overlay menu living inside a shadow root:
 * `Menu.Portal container={shadowRoot}` keeps the popup inside the overlay's
 * isolation boundary, and `modal={false}` keeps the host page interactive.
 * Recomposed from vercel/next.js dev-overlay `segment-boundary-trigger.tsx`
 * (MIT, code-ok, research/d-real-world-usage/menu/ranked.json #2).
 */
export const RealWorldShadowDomPortal: Story = {
  tags: ['recreation'],
  render: () => <ShadowPortalExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const host = canvas.getByTestId('shadow-host');

    await userEvent.click(canvas.getByRole('button', { name: 'Route segment' }));

    // The popup renders inside the shadow root, not in the light DOM…
    await waitFor(() => expect(host.shadowRoot!.querySelector('[role="menu"]')).not.toBeNull());
    // …so document-level role queries (which don't pierce shadow roots) find nothing.
    await expect(body.queryByRole('menu')).not.toBeInTheDocument();
  },
};
