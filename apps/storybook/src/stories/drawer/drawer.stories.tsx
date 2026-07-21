import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Drawer } from '@base-ui/react/drawer';
import { Dialog } from '@base-ui/react/dialog';
import styles from './drawer.module.css';

/**
 * Stories follow research/c-components/drawer (Tier 1): the kept docs demos (hero,
 * position, snap points, indent provider, nested, swipe area, virtual keyboard,
 * mobile nav), the required full open→close interaction story, the four-sides
 * `swipeDirection` matrix, and the swipe styling contract.
 *
 * Drawer runs Dialog's root engine (`useRenderDialogRoot` mode `'drawer'`), so focus,
 * dismissal, and portal behavior are inherited — plays re-prove them on Drawer where
 * cheap and link to the Dialog page otherwise.
 *
 * GESTURE HONESTY: swipe-to-dismiss, swipe-to-open, and drag-to-snap are pointer
 * gestures driven natively outside React ([#4980](https://github.com/mui/base-ui/pull/4980)).
 * Synthetic pointer sequences do not reliably reach that engine in CI, so no play
 * function here performs a drag. Gesture stories render the full styling contract
 * (`--drawer-swipe-*` vars, `data-swiping`/`data-swipe-dismiss`) for manual testing
 * and assert only gesture-free state.
 *
 * Every story renders the complete `Portal > Backdrop > Viewport > Popup` subtree:
 * Viewport is REQUIRED for Drawer (dev warning without it,
 * [#4495](https://github.com/mui/base-ui/pull/4495)) — unlike Dialog, where it is optional.
 */
const meta = {
  title: 'Overlays/Drawer',
  component: Drawer.Root,
  subcomponents: {
    'Drawer.Trigger': Drawer.Trigger,
    'Drawer.Portal': Drawer.Portal,
    'Drawer.Backdrop': Drawer.Backdrop,
    'Drawer.Viewport': Drawer.Viewport,
    'Drawer.Popup': Drawer.Popup,
    'Drawer.Content': Drawer.Content,
    'Drawer.Title': Drawer.Title,
    'Drawer.Description': Drawer.Description,
    'Drawer.Close': Drawer.Close,
    'Drawer.SwipeArea': Drawer.SwipeArea,
    'Drawer.Provider': Drawer.Provider,
    'Drawer.Indent': Drawer.Indent,
    'Drawer.IndentBackground': Drawer.IndentBackground,
    'Drawer.VirtualKeyboardProvider': Drawer.VirtualKeyboardProvider,
  },
} satisfies Meta<typeof Drawer.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Kept docs demos + core behavior                                     */
/* ------------------------------------------------------------------ */

/** The docs hero demo: a side drawer (`swipeDirection="right"`) with Title, Description, and Close, whose backdrop fades with `--drawer-swipe-progress` while dragging. The `--bleed` margin lets the panel overshoot its edge during spring-back without showing a gap. */
export const Hero: Story = {
  render: () => (
    <Drawer.Root swipeDirection="right">
      <Drawer.Trigger className={styles.Button}>Open drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Viewport className={styles.HeroViewport}>
          <Drawer.Popup className={styles.HeroPopup}>
            <Drawer.Content className={styles.Content}>
              <Drawer.Title className={styles.Title}>Drawer</Drawer.Title>
              <Drawer.Description className={styles.Description}>
                This is a drawer that slides in from the side. You can swipe to dismiss it.
              </Drawer.Description>
              <div className={styles.Actions}>
                <Drawer.Close className={styles.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const doc = canvasElement.ownerDocument;
    const trigger = canvas.getByRole('button', { name: 'Open drawer' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');

    // Open: the popup portals to document.body with role="dialog".
    await userEvent.click(trigger);
    const drawer = await body.findByRole('dialog');
    await waitFor(() => expect(drawer).toBeVisible());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // Focus moves inside the popup (inherited Dialog behavior).
    await waitFor(() => expect(drawer).toContainElement(doc.activeElement as HTMLElement));

    // Close via the visible Close button — the required alternative to gestures.
    await userEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** Dark-theme variant of Hero (visual only — the interaction assertions stay on the light story). */
export const Dark: Story = {
  render: Hero.render,
  globals: { theme: 'dark' },
};

function OpenCloseReasonsExample() {
  const [log, setLog] = React.useState<string[]>([]);
  return (
    <div className={styles.Stack}>
      <Drawer.Root
        onOpenChange={(nextOpen, eventDetails) => {
          if (!nextOpen) {
            setLog((entries) => [...entries, eventDetails.reason]);
          }
        }}
      >
        <Drawer.Trigger className={styles.Button}>Open sheet</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className={styles.Backdrop} data-testid="reason-backdrop" />
          <Drawer.Viewport className={styles.SheetViewport}>
            <Drawer.Popup className={styles.SheetPopup}>
              <div className={styles.Grabber} />
              <Drawer.Content className={styles.Content}>
                <Drawer.Title className={styles.SheetTitle}>Reason inspector</Drawer.Title>
                <Drawer.Description className={styles.SheetDescription}>
                  Close me with Esc, the backdrop, or the button — each reports its reason.
                </Drawer.Description>
                <div className={styles.SheetActions}>
                  <Drawer.Close className={styles.Button}>Close</Drawer.Close>
                </div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
      <output className={styles.Output}>
        close reasons: {log.length > 0 ? log.join(', ') : 'none yet'}
      </output>
    </div>
  );
}

/**
 * Dialog's typed dismissal reasons, re-proven on Drawer: `escape-key`, `outside-press`,
 * and `close-press` fire through `onOpenChange`. Drawer adds two reasons no play can
 * synthesize: `swipe` (gesture dismissal) and `close-watcher` (the Android back
 * gesture — Drawer wires a Chromium `CloseWatcher` while topmost, which Dialog itself
 * does not do yet, [#3905](https://github.com/mui/base-ui/issues/3905)).
 */
export const OpenCloseReasons: Story = {
  render: () => <OpenCloseReasonsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Open sheet' });

    await userEvent.click(trigger);
    await body.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());

    await userEvent.click(trigger);
    await body.findByRole('dialog');
    await userEvent.click(body.getByTestId('reason-backdrop'));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());

    await userEvent.click(trigger);
    const drawer = await body.findByRole('dialog');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(drawer).not.toBeInTheDocument());

    await expect(
      canvas.getByText('close reasons: escape-key, outside-press, close-press'),
    ).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* The four-sides matrix (`swipeDirection`)                            */
/* ------------------------------------------------------------------ */

type SwipeSide = 'up' | 'down' | 'left' | 'right';

const SIDE_COPY: Record<SwipeSide, { trigger: string; title: string; hint: string }> = {
  up: { trigger: 'Open top sheet', title: 'Top sheet', hint: 'Swipe up to dismiss.' },
  down: { trigger: 'Open bottom sheet', title: 'Bottom sheet', hint: 'Swipe down to dismiss.' },
  left: { trigger: 'Open left drawer', title: 'Left drawer', hint: 'Swipe left to dismiss.' },
  right: { trigger: 'Open right drawer', title: 'Right drawer', hint: 'Swipe right to dismiss.' },
};

const SIDE_VIEWPORT_CLASS: Record<SwipeSide, string> = {
  up: styles.EdgeViewportUp,
  down: styles.EdgeViewportDown,
  left: styles.EdgeViewportLeft,
  right: styles.EdgeViewportRight,
};

/**
 * One render function for all four sides: `swipeDirection` sets the dismissal gesture
 * axis and stamps `data-swipe-direction` on the popup — your CSS does the actual
 * placement (there is no Positioner part). The shared `.EdgePopup` class keys size,
 * borders, and enter/exit transforms off `[data-swipe-direction]`.
 */
function EdgeDrawerExample({ side }: { side: SwipeSide }) {
  const copy = SIDE_COPY[side];
  return (
    <Drawer.Root swipeDirection={side}>
      <Drawer.Trigger className={styles.Button}>{copy.trigger}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Viewport className={`${styles.EdgeViewport} ${SIDE_VIEWPORT_CLASS[side]}`}>
          <Drawer.Popup className={styles.EdgePopup}>
            <Drawer.Content className={styles.Content}>
              <Drawer.Title className={styles.Title}>{copy.title}</Drawer.Title>
              <Drawer.Description className={styles.Description}>
                {copy.hint} Positioning is plain CSS — only the gesture axis is configured.
              </Drawer.Description>
              <div className={styles.Actions}>
                <Drawer.Close className={styles.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function playEdgeDrawer(side: SwipeSide): Story['play'] {
  return async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: SIDE_COPY[side].trigger }));
    const drawer = await body.findByRole('dialog');
    await waitFor(() => expect(drawer).toHaveAttribute('data-swipe-direction', side));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
  };
}

/** `swipeDirection="up"`: a sheet attached to the top edge, dismissed by swiping up. */
export const SideTop: Story = {
  render: () => <EdgeDrawerExample side="up" />,
  play: playEdgeDrawer('up'),
};

/** `swipeDirection="down"` — the default: the canonical mobile bottom sheet. */
export const SideBottom: Story = {
  render: () => <EdgeDrawerExample side="down" />,
  play: playEdgeDrawer('down'),
};

/** `swipeDirection="left"`: a navigation-style panel on the left edge. */
export const SideLeft: Story = {
  render: () => <EdgeDrawerExample side="left" />,
  play: playEdgeDrawer('left'),
};

/** `swipeDirection="right"`: a detail/settings panel on the right edge. */
export const SideRight: Story = {
  render: () => <EdgeDrawerExample side="right" />,
  play: playEdgeDrawer('right'),
};

/* ------------------------------------------------------------------ */
/* Snap points                                                         */
/* ------------------------------------------------------------------ */

const SNAP_POINTS: Drawer.Root.SnapPoint[] = ['148px', 1];

function SnapPointsExample() {
  const [snapPoint, setSnapPoint] = React.useState<Drawer.Root.SnapPoint | null>(SNAP_POINTS[0]);
  return (
    <Drawer.Root snapPoints={SNAP_POINTS} snapPoint={snapPoint} onSnapPointChange={setSnapPoint}>
      <Drawer.Trigger className={styles.Button}>Open snap drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Viewport className={styles.SheetViewport}>
          <Drawer.Popup className={styles.SnapPopup} data-testid="snap-popup">
            <div className={styles.DragArea}>
              <div className={styles.Grabber} />
              <Drawer.Title className={styles.SheetTitle}>Snap points</Drawer.Title>
              <div className={styles.SheetActions}>
                <button type="button" className={styles.Button} onClick={() => setSnapPoint(1)}>
                  Expand
                </button>
                <button
                  type="button"
                  className={styles.Button}
                  onClick={() => setSnapPoint(SNAP_POINTS[0])}
                >
                  Peek
                </button>
                <Drawer.Close className={styles.Button}>Close</Drawer.Close>
              </div>
            </div>
            <Drawer.Content className={styles.SnapScroll}>
              <Drawer.Description className={styles.SheetDescription}>
                Drag the sheet between the compact peek and the full-height detent — or drive the
                controlled `snapPoint` with the buttons above.
              </Drawer.Description>
              <div className={styles.Cards} aria-hidden>
                {Array.from({ length: 12 }, (_, index) => (
                  <div className={styles.Card} key={index} />
                ))}
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/**
 * `snapPoints={['148px', 1]}` (docs values): strings are `px`/`rem` lengths, numbers
 * 0–1 are viewport-height fractions, numbers above 1 are pixels. The popup transform
 * composes `--drawer-snap-point-offset` with `--drawer-swipe-movement-y`, and
 * `data-expanded` marks the full-height detent. The play drives the controlled
 * `snapPoint` prop instead of dragging; `snapToSequentialPoints` (not set here)
 * disables velocity-based point skipping for tall multi-detent sheets.
 */
export const SnapPoints: Story = {
  render: () => <SnapPointsExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open snap drawer' }));
    const popup = await body.findByTestId('snap-popup');
    // Initial detent is the 148px peek — not the expanded snap point.
    await waitFor(() => expect(popup).not.toHaveAttribute('data-expanded'));

    await userEvent.click(within(popup).getByRole('button', { name: 'Expand' }));
    await waitFor(() => expect(popup).toHaveAttribute('data-expanded'));

    await userEvent.click(within(popup).getByRole('button', { name: 'Peek' }));
    await waitFor(() => expect(popup).not.toHaveAttribute('data-expanded'));

    await userEvent.click(within(popup).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(popup).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* The swipe styling contract                                          */
/* ------------------------------------------------------------------ */

/**
 * THE styling-contract story. During a drag the engine drives CSS variables natively
 * ([#4980](https://github.com/mui/base-ui/pull/4980)) so your styles animate on the
 * compositor: the backdrop fades with `opacity: calc(0.7 * (1 - var(--drawer-swipe-progress)))`,
 * the popup follows the pointer via `translateY(var(--drawer-swipe-movement-y))`,
 * `[data-swiping]` gates transitions off so the sheet tracks the finger, and
 * `[data-ending-style]` scales the release duration by `--drawer-swipe-strength`.
 * NO gesture play — drag the sheet manually to see the vars animate; the play only
 * verifies the resting state of the contract.
 */
export const SwipeProgressStyling: Story = {
  render: () => (
    <Drawer.Root>
      <Drawer.Trigger className={styles.Button}>Open styled sheet</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.ProgressBackdrop} data-testid="progress-backdrop" />
        <Drawer.Viewport className={styles.SheetViewport}>
          <Drawer.Popup className={styles.SheetPopup}>
            <div className={styles.Grabber} />
            <Drawer.Content className={styles.Content}>
              <Drawer.Title className={styles.SheetTitle}>Swipe styling</Drawer.Title>
              <Drawer.Description className={styles.SheetDescription}>
                Drag me down slowly: the backdrop fades in proportion to the drag distance because
                its opacity is bound to the swipe progress variable.
              </Drawer.Description>
              <div className={styles.SheetActions}>
                <Drawer.Close className={styles.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Open styled sheet' }));
    const drawer = await body.findByRole('dialog');
    await waitFor(() => expect(drawer).toBeVisible());
    // At rest (no drag) the popup is not in the swiping state.
    await expect(drawer).not.toHaveAttribute('data-swiping');
    await expect(body.getByTestId('progress-backdrop')).toHaveAttribute('data-open');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Swipe to open                                                       */
/* ------------------------------------------------------------------ */

/**
 * `Drawer.SwipeArea` is an invisible strip at the closed drawer's edge that listens
 * for swipe gestures to OPEN it (removed during preview, restored in
 * [#4102](https://github.com/mui/base-ui/pull/4102); reliability reworked in
 * [#5105](https://github.com/mui/base-ui/pull/5105)). It is tinted here for
 * demonstration. It is pointer-only, so it must never be the sole way in — this story
 * pairs it with a regular Trigger, and the play uses the trigger, not a gesture.
 */
export const SwipeAreaOpen: Story = {
  render: () => (
    <Drawer.Root swipeDirection="right">
      <Drawer.SwipeArea className={styles.SwipeAreaStrip} data-testid="swipe-area">
        <span className={styles.SwipeAreaLabel}>Swipe here</span>
      </Drawer.SwipeArea>
      <Drawer.Trigger className={styles.Button}>Open library</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Viewport className={styles.HeroViewport}>
          <Drawer.Popup className={styles.HeroPopup}>
            <Drawer.Content className={styles.Content}>
              <Drawer.Title className={styles.Title}>Library</Drawer.Title>
              <Drawer.Description className={styles.Description}>
                Swipe from the tinted right-edge strip whenever you want to jump back into your
                playlists — or use the button.
              </Drawer.Description>
              <div className={styles.Actions}>
                <Drawer.Close className={styles.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const swipeArea = body.getByTestId('swipe-area');
    // The strip renders while closed, reflecting state + gesture axis. SwipeArea's
    // own swipeDirection prop is unset, so it resolves to the OPPOSITE of Root's
    // dismiss direction ('right') — i.e. 'left' opens a drawer that dismisses right.
    await expect(swipeArea).toHaveAttribute('data-closed');
    await expect(swipeArea).toHaveAttribute('data-swipe-direction', 'left');

    await userEvent.click(canvas.getByRole('button', { name: 'Open library' }));
    const drawer = await body.findByRole('dialog');
    await waitFor(() => expect(swipeArea).toHaveAttribute('data-open'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Indent provider (app-shell effect)                                  */
/* ------------------------------------------------------------------ */

function IndentProviderExample() {
  const [portalContainer, setPortalContainer] = React.useState<HTMLDivElement | null>(null);
  return (
    <Drawer.Provider>
      <div className={styles.IndentRoot} ref={setPortalContainer}>
        <Drawer.IndentBackground className={styles.IndentBackground} />
        <Drawer.Indent className={styles.Indent} data-testid="indent">
          <div className={styles.IndentCenter}>
            <Drawer.Root modal={false}>
              <Drawer.Trigger className={styles.Button}>Open drawer</Drawer.Trigger>
              <Drawer.Portal container={portalContainer}>
                <Drawer.Backdrop className={styles.ContainedBackdrop} />
                <Drawer.Viewport className={styles.ContainedViewport}>
                  <Drawer.Popup className={styles.SheetPopup}>
                    <div className={styles.Grabber} />
                    <Drawer.Content className={styles.Content}>
                      <Drawer.Title className={styles.SheetTitle}>Notifications</Drawer.Title>
                      <Drawer.Description className={styles.SheetDescription}>
                        You are all caught up. Good job!
                      </Drawer.Description>
                      <div className={styles.SheetActions}>
                        <Drawer.Close className={styles.Button}>Close</Drawer.Close>
                      </div>
                    </Drawer.Content>
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.Root>
          </div>
        </Drawer.Indent>
      </div>
    </Drawer.Provider>
  );
}

/**
 * The vaul-style app-shell effect (a #3680 launch-checklist item): `Drawer.Provider`
 * coordinates globally, `Drawer.Indent` wraps your app's main UI and gets
 * `[data-active]` while any drawer inside the provider is open (scale/inset it in
 * CSS), and `Drawer.IndentBackground` sits behind it as a styleable backdrop layer.
 * Note the Root nests INSIDE the Indent. This demo portals into the shell container
 * so the effect stays contained; the scale eases back as you drag, via
 * `--drawer-swipe-progress` on the Indent.
 */
export const IndentProvider: Story = {
  render: () => <IndentProviderExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const indent = canvas.getByTestId('indent');
    await expect(indent).not.toHaveAttribute('data-active');

    await userEvent.click(canvas.getByRole('button', { name: 'Open drawer' }));
    const drawer = await body.findByRole('dialog');
    // The app shell wrapper reflects the open drawer.
    await waitFor(() => expect(indent).toHaveAttribute('data-active'));

    await userEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(indent).not.toHaveAttribute('data-active'));
  },
};

/* ------------------------------------------------------------------ */
/* Nesting                                                             */
/* ------------------------------------------------------------------ */

/**
 * Nested drawers stack like cards (docs `nested` demo): the parent popup gets
 * `[data-nested-drawer-open]` / `[data-nested-drawer-swiping]` plus the
 * `--nested-drawers` count and `--drawer-frontmost-height` (border-inclusive since
 * [#4202](https://github.com/mui/base-ui/pull/4202)) to scale itself behind the child.
 * Each drawer remains independently focus-managed.
 */
export const NestedDrawers: Story = {
  render: () => (
    <Drawer.Root>
      <Drawer.Trigger className={styles.Button}>Open drawer stack</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Viewport className={styles.SheetViewport}>
          <Drawer.Popup className={styles.StackPopup}>
            <div className={styles.Grabber} />
            <Drawer.Content className={styles.StackContent}>
              <Drawer.Title className={styles.SheetTitle}>Account</Drawer.Title>
              <Drawer.Description className={styles.SheetDescription}>
                Nested drawers can be styled to stack, while each drawer remains independently focus
                managed.
              </Drawer.Description>
              <div className={styles.SheetActions}>
                <Drawer.Root>
                  <Drawer.Trigger className={styles.Button}>Security settings</Drawer.Trigger>
                  <Drawer.Portal>
                    <Drawer.Viewport className={styles.SheetViewport}>
                      <Drawer.Popup className={styles.StackPopup}>
                        <div className={styles.Grabber} />
                        <Drawer.Content className={styles.StackContent}>
                          <Drawer.Title className={styles.SheetTitle}>Security</Drawer.Title>
                          <Drawer.Description className={styles.SheetDescription}>
                            Review sign-in activity and update your security preferences.
                          </Drawer.Description>
                          <div className={styles.SheetActions}>
                            <Drawer.Close className={styles.Button}>Done</Drawer.Close>
                          </div>
                        </Drawer.Content>
                      </Drawer.Popup>
                    </Drawer.Viewport>
                  </Drawer.Portal>
                </Drawer.Root>
                <Drawer.Close className={styles.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open drawer stack' }));
    const parent = await body.findByRole('dialog', { name: 'Account' });

    await userEvent.click(within(parent).getByRole('button', { name: 'Security settings' }));
    const child = await body.findByRole('dialog', { name: 'Security' });
    // The parent recedes behind the child via its nested-drawer attribute.
    await waitFor(() => expect(parent).toHaveAttribute('data-nested-drawer-open'));

    await userEvent.click(within(child).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(child).not.toBeInTheDocument());
    await waitFor(() => expect(parent).not.toHaveAttribute('data-nested-drawer-open'));
    await expect(parent).toBeVisible();
  },
};

/**
 * Dialogs opened inside a drawer deliberately do NOT join the nested-drawer stack
 * ([#4493](https://github.com/mui/base-ui/pull/4493)): the drawer keeps its size
 * (no `data-nested-drawer-open`) while the dialog layers on top, and Esc closes only
 * the topmost popup (the dialog), leaving the drawer open.
 */
export const DialogInsideDrawer: Story = {
  render: () => (
    <Drawer.Root>
      <Drawer.Trigger className={styles.Button}>Open cart</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Viewport className={styles.SheetViewport}>
          <Drawer.Popup className={styles.SheetPopup}>
            <div className={styles.Grabber} />
            <Drawer.Content className={styles.Content}>
              <Drawer.Title className={styles.SheetTitle}>Cart</Drawer.Title>
              <Drawer.Description className={styles.SheetDescription}>
                2 items · Removing an item asks for confirmation in a dialog.
              </Drawer.Description>
              <div className={styles.SheetActions}>
                <Dialog.Root>
                  <Dialog.Trigger className={styles.Button}>Remove item…</Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Backdrop className={styles.DialogBackdrop} />
                    <Dialog.Popup className={styles.DialogPopup}>
                      <Dialog.Title className={styles.Title}>Remove item?</Dialog.Title>
                      <Dialog.Description className={styles.Description}>
                        This only removes it from your cart.
                      </Dialog.Description>
                      <div className={styles.Actions}>
                        <Dialog.Close className={styles.Button}>Cancel</Dialog.Close>
                      </div>
                    </Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
                <Drawer.Close className={styles.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open cart' }));
    const drawer = await body.findByRole('dialog', { name: 'Cart' });

    await userEvent.click(within(drawer).getByRole('button', { name: 'Remove item…' }));
    const dialog = await body.findByRole('dialog', { name: 'Remove item?' });
    await waitFor(() => expect(dialog).toBeVisible());
    // The dialog does not count toward the drawer's nested-drawer stack.
    await expect(drawer).not.toHaveAttribute('data-nested-drawer-open');

    // Esc closes only the topmost popup: the dialog, not the drawer.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(drawer).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

function DrawerWithFormExample() {
  const [open, setOpen] = React.useState(false);
  const [saved, setSaved] = React.useState<string | null>(null);
  const nameId = React.useId();
  const noteId = React.useId();
  return (
    <div className={styles.Stack}>
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger className={styles.Button}>Edit delivery details</Drawer.Trigger>
        <Drawer.VirtualKeyboardProvider>
          <Drawer.Portal>
            <Drawer.Backdrop className={styles.Backdrop} />
            <Drawer.Viewport className={styles.KeyboardViewport}>
              <Drawer.Popup className={styles.SheetPopup}>
                <div className={styles.Grabber} />
                <Drawer.Content className={styles.Content}>
                  <Drawer.Title className={styles.SheetTitle}>Delivery details</Drawer.Title>
                  <Drawer.Description className={styles.SheetDescription}>
                    The sheet closes only when the form submits successfully.
                  </Drawer.Description>
                  <form
                    className={styles.Form}
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      setSaved(String(data.get('name')));
                      setOpen(false);
                    }}
                  >
                    <div className={styles.Field}>
                      <label className={styles.Label} htmlFor={nameId}>
                        Name
                      </label>
                      <input id={nameId} name="name" required className={styles.Input} />
                    </div>
                    <div className={styles.Field}>
                      <label className={styles.Label} htmlFor={noteId}>
                        Delivery note
                      </label>
                      <input
                        id={noteId}
                        name="note"
                        placeholder="Gate code, drop-off spot…"
                        className={styles.Input}
                      />
                    </div>
                    <div className={styles.SheetActions}>
                      <Drawer.Close className={styles.Button}>Cancel</Drawer.Close>
                      <button type="submit" className={styles.Button}>
                        Save
                      </button>
                    </div>
                  </form>
                </Drawer.Content>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.VirtualKeyboardProvider>
      </Drawer.Root>
      {saved !== null ? <output className={styles.Output}>Saved: {saved}</output> : null}
    </div>
  );
}

/**
 * A bottom sheet with form fields, wrapped in `Drawer.VirtualKeyboardProvider`
 * ([#4353](https://github.com/mui/base-ui/pull/4353)): on devices with a software
 * keyboard the Viewport gets `--drawer-keyboard-inset` so the sheet can rise above
 * it — always write `var(--drawer-keyboard-inset, 0px)` because the variable exists
 * only while the keyboard is aligned. The inset itself is device-dependent (manual
 * test on mobile); the play verifies the form flow: submit closes, cancel preserves
 * the controlled-close contract.
 */
export const DrawerWithForm: Story = {
  render: () => <DrawerWithFormExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Edit delivery details' }));
    const drawer = await body.findByRole('dialog');

    await userEvent.type(within(drawer).getByLabelText('Name'), 'Ada Lovelace');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(drawer).not.toBeInTheDocument());
    await expect(await canvas.findByText('Saved: Ada Lovelace')).toBeVisible();
  },
};

function CloseConfirmationExample() {
  const [blocked, setBlocked] = React.useState(0);
  const [draft, setDraft] = React.useState('');
  const titleId = React.useId();
  return (
    <div className={styles.Stack}>
      <Drawer.Root
        onOpenChange={(nextOpen, eventDetails) => {
          // Any light dismissal (swipe, Esc, outside press) with unsaved input is
          // vetoed; only the explicit buttons may discard the draft.
          if (!nextOpen && draft.length > 0 && eventDetails.reason !== 'close-press') {
            eventDetails.cancel();
            setBlocked((count) => count + 1);
          }
        }}
      >
        <Drawer.Trigger className={styles.Button}>Write feedback</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className={styles.Backdrop} data-testid="confirm-backdrop" />
          <Drawer.Viewport className={styles.SheetViewport}>
            <Drawer.Popup className={styles.SheetPopup}>
              <div className={styles.Grabber} />
              <Drawer.Content className={styles.Content}>
                <Drawer.Title id={titleId} className={styles.SheetTitle}>
                  Feedback
                </Drawer.Title>
                <Drawer.Description className={styles.SheetDescription}>
                  With text in the box, swiping, Esc, and outside presses are all vetoed.
                </Drawer.Description>
                <textarea
                  aria-labelledby={titleId}
                  className={styles.Textarea}
                  placeholder="What’s on your mind?"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <div className={styles.SheetActions}>
                  <Drawer.Close className={styles.Button}>Discard</Drawer.Close>
                </div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
      <output className={styles.Output}>blocked closes: {blocked}</output>
    </div>
  );
}

/**
 * Vetoing dismissal: there is NO `disableSwipeDismissal` prop — cancel the change
 * request in `onOpenChange` instead. `eventDetails.reason === 'swipe'` identifies
 * gesture dismissal, and `eventDetails.cancel()` keeps the drawer open and cleans up
 * the swipe-dismiss styles (root tests). The same veto covers Esc and outside press
 * here (docs `close-confirmation` pattern, [#4600](https://github.com/mui/base-ui/pull/4600));
 * relatedly, swiping can never force-close a controlled drawer the owner didn't close
 * ([#4133](https://github.com/mui/base-ui/pull/4133)). The play vetoes via Esc — the
 * swipe path needs a real pointer drag.
 */
export const CloseConfirmation: Story = {
  render: () => <CloseConfirmationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Write feedback' }));
    const drawer = await body.findByRole('dialog');
    await userEvent.type(within(drawer).getByRole('textbox'), 'Draft in progress');

    // Esc with a dirty draft: the close request is canceled.
    await userEvent.keyboard('{Escape}');
    await expect(await canvas.findByText('blocked closes: 1')).toBeVisible();
    await waitFor(() => expect(drawer).toBeVisible());

    // The explicit Discard button (reason `close-press`) still closes.
    await userEvent.click(within(drawer).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Animation                                                           */
/* ------------------------------------------------------------------ */

function ExitAnimationExample() {
  const [settled, setSettled] = React.useState('none yet');
  return (
    <div className={styles.Stack}>
      <Drawer.Root onOpenChangeComplete={(open) => setSettled(open ? 'open' : 'closed')}>
        <Drawer.Trigger className={styles.Button}>Open sheet</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className={styles.Backdrop} />
          <Drawer.Viewport className={styles.SheetViewport}>
            <Drawer.Popup className={styles.SheetPopup}>
              <div className={styles.Grabber} />
              <Drawer.Content className={styles.Content}>
                <Drawer.Title className={styles.SheetTitle}>Animated sheet</Drawer.Title>
                <Drawer.Description className={styles.SheetDescription}>
                  CSS transitions drive both entry and exit via data attributes.
                </Drawer.Description>
                <div className={styles.SheetActions}>
                  <Drawer.Close className={styles.Button}>Close</Drawer.Close>
                </div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
      <output className={styles.Output}>animation settled: {settled}</output>
    </div>
  );
}

/**
 * The inherited animation contract on Drawer: transitions hang off
 * `[data-starting-style]`/`[data-ending-style]`, the popup stays mounted until the
 * exit settles, then `onOpenChangeComplete(false)` fires. Drawer adds two exit-only
 * hooks no play can trigger: `[data-swipe-dismiss]` (present when closed by swiping —
 * style a faster, directional exit) and `--drawer-swipe-strength` (0.1–1, scales the
 * release duration so a hard fling exits faster) — both wired in this story's CSS.
 */
export const ExitAnimation: Story = {
  render: () => <ExitAnimationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open sheet' }));
    const drawer = await body.findByRole('dialog');
    await expect(await canvas.findByText('animation settled: open')).toBeVisible();

    await userEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
    // Mid-transition the popup is still mounted, marked with data-ending-style.
    await waitFor(() => expect(drawer).toHaveAttribute('data-ending-style'));
    await expect(await canvas.findByText('animation settled: closed')).toBeVisible();
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Keyboard & focus                                                    */
/* ------------------------------------------------------------------ */

/**
 * Gestures add no keyboard surface — the a11y contract is Dialog's, inherited whole:
 * focus moves inside on open, Tab loops while modal, Esc closes the topmost drawer,
 * and focus returns to the trigger. That is exactly why a visible `Drawer.Close`
 * must stay inside the popup: swipe-to-dismiss is pointer-only, and snap-point
 * changes make no announcement.
 */
export const KeyboardAndFocus: Story = {
  render: () => (
    <Drawer.Root>
      <Drawer.Trigger className={styles.Button}>Open filters</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Viewport className={styles.SheetViewport}>
          <Drawer.Popup className={styles.SheetPopup}>
            <div className={styles.Grabber} />
            <Drawer.Content className={styles.Content}>
              <Drawer.Title className={styles.SheetTitle}>Filters</Drawer.Title>
              <Drawer.Description className={styles.SheetDescription}>
                Two buttons and a close — three tab stops that loop while modal.
              </Drawer.Description>
              <div className={styles.SheetActions}>
                <button type="button" className={styles.Button}>
                  Reset
                </button>
                <button type="button" className={styles.Button}>
                  Apply
                </button>
                <Drawer.Close className={styles.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const doc = canvasElement.ownerDocument;
    const trigger = canvas.getByRole('button', { name: 'Open filters' });

    await userEvent.click(trigger);
    const drawer = await body.findByRole('dialog');
    // Focus moves inside the popup on open.
    await waitFor(() => expect(drawer).toContainElement(doc.activeElement as HTMLElement));

    // Three tab stops; four Tab presses prove the loop stays inside.
    // waitFor: tabbing momentarily lands on a hidden focus guard before the
    // trap redirects focus back inside the popup.
    await userEvent.tab();
    await waitFor(() => expect(drawer).toContainElement(doc.activeElement as HTMLElement));
    await userEvent.tab();
    await waitFor(() => expect(drawer).toContainElement(doc.activeElement as HTMLElement));
    await userEvent.tab();
    await waitFor(() => expect(drawer).toContainElement(doc.activeElement as HTMLElement));
    await userEvent.tab();
    await waitFor(() => expect(drawer).toContainElement(doc.activeElement as HTMLElement));

    // Esc closes and returns focus to the trigger.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/* ------------------------------------------------------------------ */
/* Real-world archetype                                                */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = ['Overview', 'Components', 'Utilities', 'Releases'] as const;

function MobileNavigationExample() {
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState<string>('Overview');
  return (
    <div className={styles.Stack}>
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger className={styles.Button} aria-label="Open menu">
          <MenuIcon />
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className={styles.Backdrop} />
          <Drawer.Viewport className={styles.SheetViewport}>
            <Drawer.Popup className={styles.SheetPopup}>
              <div className={styles.Grabber} />
              <Drawer.Content className={styles.Content}>
                <Drawer.Title className={styles.SheetTitle}>Menu</Drawer.Title>
                <nav aria-label="Site">
                  <ul className={styles.NavList}>
                    {NAV_ITEMS.map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          className={styles.NavLink}
                          aria-current={page === item ? 'page' : undefined}
                          onClick={() => {
                            setPage(item);
                            setOpen(false);
                          }}
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className={styles.SheetActions}>
                  <Drawer.Close className={styles.Button}>Close</Drawer.Close>
                </div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
      <output className={styles.Output}>current page: {page}</output>
    </div>
  );
}

/**
 * The mobile-navigation archetype (docs `mobile-nav` demo shape): a hamburger trigger
 * opens a bottom sheet of navigation items; choosing one navigates and closes the
 * controlled drawer. Phase D real-world mining returned only lean, unverified drawer
 * candidates (research/d-real-world-usage/drawer/candidates.json), so this recreates
 * the documented archetype rather than a specific production repo [G].
 */
export const MobileNavigation: Story = {
  render: () => <MobileNavigationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    const drawer = await body.findByRole('dialog');
    // Choosing a destination navigates and dismisses the sheet.
    await userEvent.click(within(drawer).getByRole('button', { name: 'Components' }));
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
    await expect(canvas.getByText('current page: Components')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/drawer)         */
/* ------------------------------------------------------------------ */

const handleDrawerHandle = Drawer.createHandle();

function ProfileEditorExample() {
  const [profileName, setProfileName] = React.useState('Ada Lovelace');
  const [draftName, setDraftName] = React.useState(profileName);

  return (
    <div className={styles.Stack}>
      <div className={styles.Row}>
        <output className={styles.Output}>Name: {profileName}</output>
        <Drawer.Trigger handle={handleDrawerHandle} className={styles.Button}>
          Edit profile
        </Drawer.Trigger>
      </div>
      <Drawer.Root
        handle={handleDrawerHandle}
        onOpenChange={(open) => {
          if (open) {
            // Reset the draft to the latest committed snapshot every time the
            // drawer reopens, the same onOpenChange-driven reset Julchu/pricey
            // wires its react-hook-form to.
            setDraftName(profileName);
          }
        }}
      >
        <Drawer.Portal>
          <Drawer.Backdrop className={styles.Backdrop} />
          <Drawer.Viewport className={styles.HeroViewport}>
            <Drawer.Popup className={styles.HeroPopup}>
              <Drawer.Content className={styles.Content}>
                <Drawer.Title className={styles.Title}>Edit profile</Drawer.Title>
                <div className={styles.Field}>
                  <label className={styles.Label} htmlFor="profile-draft-name">
                    Name
                  </label>
                  <input
                    id="profile-draft-name"
                    className={styles.Input}
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                  />
                </div>
                <div className={styles.Actions}>
                  <Drawer.Close className={styles.Button}>Cancel</Drawer.Close>
                  <button
                    type="button"
                    className={styles.Button}
                    onClick={() => {
                      setProfileName(draftName);
                      handleDrawerHandle.close();
                    }}
                  >
                    Save
                  </button>
                </div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

/**
 * Recreation of the `createHandle` + form-reset pattern from Julchu/pricey
 * `pantry-drawer.tsx` (MIT, code-ok, research/d-real-world-usage/drawer/ranked.json #3)
 * — `Drawer.createHandle()` decouples "who owns the open state" (a detached
 * `Drawer.Trigger`) from "who renders the popup" (a `Drawer.Root` declared
 * elsewhere), and `onOpenChange` resets the draft to the latest committed value
 * every time the drawer reopens, so an abandoned edit never leaks into the next
 * open.
 */
export const RealWorldHandleFormReset: Story = {
  tags: ['recreation'],
  render: () => <ProfileEditorExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Edit profile' }));
    const drawer = await body.findByRole('dialog');
    const nameInput = within(drawer).getByLabelText('Name');
    await waitFor(() => expect(nameInput).toHaveValue('Ada Lovelace'));

    // Edit without saving, then cancel.
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Grace Hopper');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(drawer).not.toBeInTheDocument());
    await expect(canvas.getByText('Name: Ada Lovelace')).toBeVisible();

    // Reopening resets the draft — the abandoned edit does not survive.
    await userEvent.click(canvas.getByRole('button', { name: 'Edit profile' }));
    const reopened = await body.findByRole('dialog');
    await waitFor(() =>
      expect(within(reopened).getByLabelText('Name')).toHaveValue('Ada Lovelace'),
    );

    // Edit again and save this time.
    const reopenedInput = within(reopened).getByLabelText('Name');
    await userEvent.clear(reopenedInput);
    await userEvent.type(reopenedInput, 'Grace Hopper');
    await userEvent.click(within(reopened).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(reopened).not.toBeInTheDocument());
    await expect(await canvas.findByText('Name: Grace Hopper')).toBeVisible();
  },
};

const POSITION_TO_SWIPE_DIRECTION: Record<'left' | 'right' | 'top' | 'bottom', SwipeSide> = {
  left: 'left',
  right: 'right',
  top: 'up',
  bottom: 'down',
};

/**
 * A `position`-aware compound wrapper (ironbyte0x/buckethub's archetype): callers
 * pick `position` without knowing about `swipeDirection` at all — the wrapper
 * maps `position` to the matching `swipeDirection` and per-edge Viewport class in
 * one place, the same recipe a design system reaches for when packaging Drawer as
 * its own component.
 */
function PositionedDrawer({
  position,
  triggerLabel,
  title,
  children,
}: {
  position: 'left' | 'right' | 'top' | 'bottom';
  triggerLabel: string;
  title: string;
  children: React.ReactNode;
}) {
  const side = POSITION_TO_SWIPE_DIRECTION[position];
  return (
    <Drawer.Root swipeDirection={side}>
      <Drawer.Trigger className={styles.Button}>{triggerLabel}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Viewport className={`${styles.EdgeViewport} ${SIDE_VIEWPORT_CLASS[side]}`}>
          <Drawer.Popup className={styles.EdgePopup}>
            <Drawer.Content className={styles.Content}>
              <Drawer.Title className={styles.Title}>{title}</Drawer.Title>
              {children}
              <div className={styles.Actions}>
                <Drawer.Close className={styles.Button}>Close</Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function PositionAwareExample() {
  return (
    <div className={styles.Row}>
      <PositionedDrawer position="left" triggerLabel="Open menu" title="Menu">
        <Drawer.Description className={styles.Description}>
          Navigation lives on the left edge — the wrapper resolved{' '}
          <code>position=&quot;left&quot;</code> to <code>swipeDirection=&quot;left&quot;</code>.
        </Drawer.Description>
      </PositionedDrawer>
      <PositionedDrawer position="bottom" triggerLabel="Open filters" title="Filters">
        <Drawer.Description className={styles.Description}>
          Filters live on the bottom edge — the same wrapper resolved{' '}
          <code>position=&quot;bottom&quot;</code> to <code>swipeDirection=&quot;down&quot;</code>.
        </Drawer.Description>
      </PositionedDrawer>
    </div>
  );
}

/**
 * Recreation of the position-aware compound Drawer wrapper from
 * ironbyte0x/buckethub `drawer.tsx` (MIT, code-ok,
 * research/d-real-world-usage/drawer/ranked.json #4) — a peer project's own UI
 * library (which notably ships its own `drawer.stories.tsx`) maps a single
 * `position` prop (left/right/top/bottom) to the matching `swipeDirection`, so
 * consumers never author `swipeDirection` themselves.
 */
export const RealWorldPositionAwareWrapper: Story = {
  tags: ['recreation'],
  render: () => <PositionAwareExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    const menuDrawer = await body.findByRole('dialog', { name: 'Menu' });
    await waitFor(() => expect(menuDrawer).toHaveAttribute('data-swipe-direction', 'left'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(menuDrawer).not.toBeInTheDocument());

    await userEvent.click(canvas.getByRole('button', { name: 'Open filters' }));
    const filtersDrawer = await body.findByRole('dialog', { name: 'Filters' });
    await waitFor(() => expect(filtersDrawer).toHaveAttribute('data-swipe-direction', 'down'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(filtersDrawer).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
/* ------------------------------------------------------------------ */

function MenuIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  );
}
