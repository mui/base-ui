import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Menubar } from '@base-ui/react/menubar';
import { Menu } from '@base-ui/react/menu';
import { Toolbar } from '@base-ui/react/toolbar';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import styles from './menubar.module.css';

/**
 * Not covered below: a dedicated "detached trigger inside a menubar" story.
 * `Menubar.test.tsx`'s `describe.for` suite runs its assertions against
 * multiple trigger topologies (`ContainedTrigger`/`MultipleContainedTriggers`/
 * `DetachedTrigger`, the last depending on Menu's detached-triggers feature,
 * #3170) purely as internal test-infrastructure variation — not a
 * documented, user-facing composition recipe (research/c-components/menubar/
 * brief.md §9's "Load-bearing non-[menubar]-scoped dependency" note is
 * explicit that this is test-topology coverage, not a public pattern).
 * Skipped here per the source-verified absence of a consumer-facing recipe.
 */

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

/* ------------------------------------------------------------------ */
/* Vertical orientation                                                 */
/* ------------------------------------------------------------------ */

function VerticalOrientationExample() {
  return (
    <Menubar className={styles.Menubar} orientation="vertical">
      <Menu.Root>
        <Menu.Trigger className={styles.MenuTrigger}>File</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={styles.MenuPopup} data-testid="file-popup">
              <Menu.Item className={styles.MenuItem}>New</Menu.Item>
              <Menu.Item className={styles.MenuItem}>Open</Menu.Item>
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
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menubar>
  );
}

/**
 * `orientation="vertical"` switches the roving-focus axis to `ArrowUp`/
 * `ArrowDown` and, since [#4922](https://github.com/mui/base-ui/pull/4922),
 * defaults hosted popups to open on the `inline-end` side instead of
 * `bottom` — before that fix, a vertical bar's popups still opened downward,
 * awkwardly overlapping the bar's own next item.
 */
export const VerticalOrientation: Story = {
  render: () => <VerticalOrientationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('menuitem', { name: 'File' }));
    const popup = await body.findByTestId('file-popup');
    await waitFor(() => expect(popup).toBeVisible());
    // #4922: vertical menubars default their popups to the inline-end side.
    await waitFor(() => expect(popup).toHaveAttribute('data-side', 'inline-end'));
  },
};

/* ------------------------------------------------------------------ */
/* loopFocus toggle                                                     */
/* ------------------------------------------------------------------ */

function LoopFocusToggleExample() {
  return (
    <div className={styles.Row}>
      <div className={styles.Stack}>
        <span className={styles.Output}>loopFocus (default true)</span>
        <Menubar className={styles.Menubar} data-testid="loop-bar">
          <Menu.Root>
            <Menu.Trigger className={styles.MenuTrigger}>File</Menu.Trigger>
          </Menu.Root>
          <Menu.Root>
            <Menu.Trigger className={styles.MenuTrigger}>Edit</Menu.Trigger>
          </Menu.Root>
        </Menubar>
      </div>
      <div className={styles.Stack}>
        <span className={styles.Output}>loopFocus=false</span>
        <Menubar className={styles.Menubar} loopFocus={false} data-testid="no-loop-bar">
          <Menu.Root>
            <Menu.Trigger className={styles.MenuTrigger}>File</Menu.Trigger>
          </Menu.Root>
          <Menu.Root>
            <Menu.Trigger className={styles.MenuTrigger}>Edit</Menu.Trigger>
          </Menu.Root>
        </Menubar>
      </div>
    </div>
  );
}

/**
 * `loopFocus` (default `true`) decides whether reaching the last (or first)
 * top-level trigger with arrow keys wraps back around. Both bars here have
 * no popup content — they only exercise the roving-focus wrap behavior.
 */
export const LoopFocusToggle: Story = {
  render: () => <LoopFocusToggleExample />,
  play: async ({ canvas, userEvent }) => {
    const loopBar = canvas.getByTestId('loop-bar');
    const loopTriggers = within(loopBar).getAllByRole('menuitem');
    loopTriggers[loopTriggers.length - 1].focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(loopTriggers[0]).toHaveFocus());

    const noLoopBar = canvas.getByTestId('no-loop-bar');
    const noLoopTriggers = within(noLoopBar).getAllByRole('menuitem');
    noLoopTriggers[noLoopTriggers.length - 1].focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(noLoopTriggers[noLoopTriggers.length - 1]).toHaveFocus());
  },
};

/* ------------------------------------------------------------------ */
/* Submenu within a menubar-hosted menu                                 */
/* ------------------------------------------------------------------ */

function SubmenuWithinMenubarExample() {
  return (
    <Menubar className={styles.Menubar}>
      <Menu.Root>
        <Menu.Trigger className={styles.MenuTrigger}>File</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={styles.MenuPopup}>
              <Menu.Item className={styles.MenuItem}>New</Menu.Item>
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className={styles.SubmenuTrigger}>
                  Export
                  <CaretRightIcon />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner
                    className={styles.MenuPositioner}
                    alignOffset={-4}
                    sideOffset={-4}
                  >
                    <Menu.Popup className={styles.MenuPopup}>
                      <Menu.Item className={styles.MenuItem}>PDF</Menu.Item>
                      <Menu.Item className={styles.MenuItem}>PNG</Menu.Item>
                      <Menu.Item className={styles.MenuItem}>SVG</Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>
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
  );
}

/**
 * `SubmenuRoot`/`SubmenuTrigger` compose exactly as they would standalone —
 * menubar parentage changes nothing about nested-menu composition.
 */
export const SubmenuWithinMenubar: Story = {
  render: () => <SubmenuWithinMenubarExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('menuitem', { name: 'File' }));
    const fileMenu = await body.findByRole('menu', { name: 'File' });
    await waitFor(() => expect(fileMenu).toBeVisible());

    const exportTrigger = within(fileMenu).getByRole('menuitem', { name: 'Export' });
    await userEvent.click(exportTrigger);
    const exportMenu = await body.findByRole('menu', { name: 'Export' });
    await waitFor(() =>
      expect(within(exportMenu).getByRole('menuitem', { name: 'PNG' })).toBeVisible(),
    );

    await userEvent.click(within(exportMenu).getByRole('menuitem', { name: 'PNG' }));
    await waitFor(() => expect(fileMenu).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Checkbox and radio items inside a menubar-hosted menu                */
/* ------------------------------------------------------------------ */

function CheckboxAndRadioItemsInMenubarExample() {
  const [showRulers, setShowRulers] = React.useState(false);
  const [zoom, setZoom] = React.useState('100');
  return (
    <Menubar className={styles.Menubar}>
      <Menu.Root>
        <Menu.Trigger className={styles.MenuTrigger}>View</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.MenuPositioner} sideOffset={4}>
            <Menu.Popup className={styles.MenuPopup}>
              <Menu.CheckboxItem
                checked={showRulers}
                onCheckedChange={setShowRulers}
                className={styles.CheckboxItem}
              >
                <Menu.CheckboxItemIndicator className={styles.CheckboxItemIndicator}>
                  <CheckIcon />
                </Menu.CheckboxItemIndicator>
                <span className={styles.CheckboxItemText}>Show Rulers</span>
              </Menu.CheckboxItem>
              <Menu.Separator className={styles.MenuSeparator} />
              <Menu.RadioGroup value={zoom} onValueChange={setZoom}>
                {['50', '100', '150'].map((level) => (
                  <Menu.RadioItem key={level} className={styles.RadioItem} value={level}>
                    <Menu.RadioItemIndicator className={styles.RadioItemIndicator}>
                      <CheckIcon />
                    </Menu.RadioItemIndicator>
                    <span className={styles.RadioItemText}>{level}%</span>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Menubar>
  );
}

/**
 * `CheckboxItem`/`RadioGroup`/`RadioItem` work unchanged inside a
 * menubar-hosted menu — proof Menu's full item vocabulary carries over,
 * not just plain `Item`.
 */
export const CheckboxAndRadioItemsInMenubar: Story = {
  render: () => <CheckboxAndRadioItemsInMenubarExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('menuitem', { name: 'View' }));
    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());

    const rulers = within(menu).getByRole('menuitemcheckbox', { name: 'Show Rulers' });
    await expect(rulers).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(rulers);
    await waitFor(() => expect(rulers).toHaveAttribute('aria-checked', 'true'));
    // Checkbox items don't close the menu by default (closeOnClick=false).
    await waitFor(() => expect(menu).toBeVisible());

    const zoom150 = within(menu).getByRole('menuitemradio', { name: '150%' });
    await userEvent.click(zoom150);
    await waitFor(() => expect(zoom150).toHaveAttribute('aria-checked', 'true'));
    const zoom100 = within(menu).getByRole('menuitemradio', { name: '100%' });
    await expect(zoom100).toHaveAttribute('aria-checked', 'false');
  },
};

/* ------------------------------------------------------------------ */
/* Hover-switch only after the first click                             */
/* ------------------------------------------------------------------ */

function HoverSwitchAfterFirstClickExample() {
  const [log, setLog] = React.useState<string[]>([]);
  return (
    <div className={styles.Stack}>
      <Menubar className={styles.Menubar}>
        <Menu.Root
          onOpenChange={(open, eventDetails) => {
            if (open) {
              setLog((entries) => [
                ...entries,
                eventDetails.reason === 'trigger-hover' ? 'File switched via hover' : 'File opened',
              ]);
            }
          }}
        >
          <Menu.Trigger className={styles.MenuTrigger}>File</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner className={styles.MenuPositioner} sideOffset={4}>
              <Menu.Popup className={styles.MenuPopup}>
                <Menu.Item className={styles.MenuItem}>New</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
        <Menu.Root
          onOpenChange={(open, eventDetails) => {
            if (open) {
              setLog((entries) => [
                ...entries,
                eventDetails.reason === 'trigger-hover' ? 'Edit switched via hover' : 'Edit opened',
              ]);
            }
          }}
        >
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
      <output className={styles.Output}>
        {log.length > 0 ? log.join(', ') : 'no popup opened yet'}
      </output>
    </div>
  );
}

/**
 * A trigger's effective `openOnHover` is `false` until *some* sibling
 * submenu is already open — hovering does nothing pre-click, but once one
 * trigger has been clicked open, hovering the others switches the open
 * submenu without another click (`parentMenubarHasSubmenuOpen` gate; the
 * exact scenario named by the test `should open submenus on hover when
 * another submenu is already open`).
 */
export const HoverSwitchAfterFirstClick: Story = {
  render: () => <HoverSwitchAfterFirstClickExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const fileTrigger = canvas.getByRole('menuitem', { name: 'File' });
    const editTrigger = canvas.getByRole('menuitem', { name: 'Edit' });

    // Hover before anything is open: a documented no-op.
    await userEvent.hover(editTrigger);
    await expect(canvas.getByText('no popup opened yet')).toBeVisible();
    await expect(body.queryByRole('menu')).not.toBeInTheDocument();

    // Click File to open it.
    await userEvent.click(fileTrigger);
    const fileMenu = await body.findByRole('menu', { name: 'File' });
    await waitFor(() => expect(fileMenu).toBeVisible());

    // Now hover Edit — it switches without another click.
    await userEvent.hover(editTrigger);
    const editMenu = await body.findByRole('menu', { name: 'Edit' });
    await waitFor(() => expect(editMenu).toBeVisible());
    await waitFor(() => expect(body.queryByRole('menu', { name: 'File' })).not.toBeInTheDocument());
    await waitFor(() => expect(canvas.getByText('Edit switched via hover')).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* Home/End navigation                                                  */
/* ------------------------------------------------------------------ */

/**
 * `Home`/`End` jump focus to the first/last top-level trigger
 * ([#4922](https://github.com/mui/base-ui/pull/4922)), reusing the Hero
 * fixture's File/Edit/View/Help bar.
 */
export const HomeAndEndNavigation: Story = {
  render: () => <HeroExample />,
  play: async ({ canvas, userEvent }) => {
    const fileTrigger = canvas.getByRole('menuitem', { name: 'File' });
    const helpTrigger = canvas.getByRole('menuitem', { name: 'Help' });

    fileTrigger.focus();
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(helpTrigger).toHaveFocus());

    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(fileTrigger).toHaveFocus());
  },
};

/* ------------------------------------------------------------------ */
/* Menubar vs Toolbar boundary                                          */
/* ------------------------------------------------------------------ */

function ToolbarContrastSideBySideExample() {
  return (
    <div className={styles.Row}>
      <div className={styles.Stack}>
        <span className={styles.Output}>Menubar — persistent, always-visible menu triggers</span>
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
        <span className={styles.Output}>Toolbar — ordinary buttons, one embeds a Menu</span>
        <Toolbar.Root aria-label="Document actions" className={styles.ToolbarRoot}>
          <Toolbar.Button className={styles.ToolbarButton}>Bold</Toolbar.Button>
          <Toolbar.Button className={styles.ToolbarButton}>Italic</Toolbar.Button>
          <Menu.Root>
            <Toolbar.Button render={<Menu.Trigger />} className={styles.ToolbarButton}>
              More actions
            </Toolbar.Button>
            <Menu.Portal>
              <Menu.Positioner className={styles.MenuPositioner} sideOffset={4}>
                <Menu.Popup className={styles.MenuPopup}>
                  <Menu.Item className={styles.MenuItem}>Duplicate</Menu.Item>
                  <Menu.Item className={styles.MenuItem}>Delete</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Toolbar.Root>
      </div>
    </div>
  );
}

/**
 * `isInMenubar` and `insideToolbar` are two independent context checks, not
 * a shared "am I in some kind of bar" flag — a Toolbar may embed a single
 * menu-triggered button without ever becoming a Menubar. Reach for Menubar
 * when the bar's primary content is persistent menu triggers; reach for
 * Toolbar (with an occasional `render={<Menu.Trigger />}` button) for a
 * mixed row of buttons/toggles/inputs.
 */
export const ToolbarContrastSideBySide: Story = {
  render: () => <ToolbarContrastSideBySideExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await expect(canvas.getByRole('menubar')).toBeVisible();
    await expect(canvas.getByRole('toolbar', { name: 'Document actions' })).toBeVisible();

    const moreActions = canvas.getByRole('button', { name: 'More actions' });
    await userEvent.click(moreActions);
    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* RTL — honest gap, no play                                            */
/* ------------------------------------------------------------------ */

function RTLGapHonestyNoteExample() {
  return (
    <div className={styles.Stack}>
      <p className={styles.Output}>
        Honest gap: `Menubar.test.tsx` (1,343 lines) has no `dir=&quot;rtl&quot;` coverage for
        horizontal-orientation arrow-key direction. Treat RTL correctness here as an unverified
        unknown, not a guarantee inherited automatically from `DirectionProvider`/Composite
        internals.
      </p>
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <HeroExample />
        </div>
      </DirectionProvider>
    </div>
  );
}

/**
 * No play function here, deliberately — this configuration's correctness is
 * explicitly unverified upstream (no RTL-specific tests exist for Menubar),
 * so asserting behavior here would fabricate confidence the source doesn't
 * back up.
 */
export const RTLGapHonestyNote: Story = {
  render: () => <RTLGapHonestyNoteExample />,
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
