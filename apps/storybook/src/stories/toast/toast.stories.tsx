import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Toast } from '@base-ui/react/toast';
import styles from './toast.module.css';

/**
 * Stories follow research/c-components/toast (Tier 1): the eight kept docs demos
 * plus one story per documented use case (stacking/expand, limit overflow, timers,
 * global manager, manager methods, priority announcements, keyboard flow,
 * lifecycle callbacks, type styling).
 *
 * Toast has no Trigger part and no `open` prop — state is an app-managed queue fed
 * imperatively through `Toast.useToastManager()` / `Toast.createToastManager()`.
 * Every story therefore wraps its content in the same `ToastDemoShell`:
 * `Toast.Provider` > `Toast.Portal` > `Toast.Viewport` > a user-owned render loop
 * over `useToastManager().toasts` (there is no automatic renderer).
 */
const meta = {
  title: 'Overlays/Toast',
  component: Toast.Root,
  subcomponents: {
    'Toast.Provider': Toast.Provider,
    'Toast.Viewport': Toast.Viewport,
    'Toast.Title': Toast.Title,
    'Toast.Description': Toast.Description,
    'Toast.Action': Toast.Action,
    'Toast.Close': Toast.Close,
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof Toast.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Shared scaffold                                                     */
/* ------------------------------------------------------------------ */

interface ToastDemoShellProps extends Omit<Toast.Provider.Props, 'children'> {
  /** Page content rendered inside the provider (buttons that call `useToastManager()`). */
  children?: React.ReactNode;
  /** Renders one toast. Defaults to the docs hero renderer (Title + Description + Close). */
  renderToast?: (toast: Toast.Root.ToastObject) => React.ReactElement;
  viewportClassName?: string;
}

/**
 * The manager-pattern scaffold every toast composition needs: Provider owns the
 * store (timers, stack order, hover/focus state), Portal appends the viewport to
 * `document.body`, Viewport is the polite live region and F6 target, and the
 * mapped render loop over `useToastManager().toasts` is user-owned.
 */
function ToastDemoShell({
  children,
  renderToast = renderStackedToast,
  viewportClassName = styles.Viewport,
  ...providerProps
}: ToastDemoShellProps) {
  return (
    <Toast.Provider {...providerProps}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className={viewportClassName}>
          <ToastStack renderToast={renderToast} />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastStack({
  renderToast,
}: {
  renderToast: (toast: Toast.Root.ToastObject) => React.ReactElement;
}) {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <React.Fragment key={toast.id}>{renderToast(toast)}</React.Fragment>
  ));
}

function StackedToastContent() {
  return (
    <Toast.Content className={styles.Content}>
      <div className={styles.Text}>
        <Toast.Title className={styles.Title} />
        <Toast.Description className={styles.Description} />
      </div>
      <Toast.Close className={styles.Close}>Dismiss</Toast.Close>
    </Toast.Content>
  );
}

function renderStackedToast(toast: Toast.Root.ToastObject) {
  return (
    <Toast.Root toast={toast} className={styles.Toast}>
      <StackedToastContent />
    </Toast.Root>
  );
}

/** Adds `Message N` toasts; reused by the stacking, keyboard, and close-all stories. */
function AddMessageButton({ timeout }: { timeout?: number }) {
  const toastManager = Toast.useToastManager();
  const [count, setCount] = React.useState(0);

  function addToast() {
    setCount((prev) => prev + 1);
    toastManager.add({
      title: `Message ${count + 1}`,
      description: 'A stacked notification.',
      timeout,
    });
  }

  return (
    <button type="button" className={styles.Button} onClick={addToast}>
      Add toast
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Kept docs demos + core behavior                                     */
/* ------------------------------------------------------------------ */

function HeroExample() {
  return (
    <ToastDemoShell>
      <CreateToastButton />
    </ToastDemoShell>
  );
}

function CreateToastButton() {
  const toastManager = Toast.useToastManager();
  const [count, setCount] = React.useState(0);

  function createToast() {
    setCount((prev) => prev + 1);
    toastManager.add({
      title: `Toast ${count + 1} created`,
      description: 'This is a toast notification.',
    });
  }

  return (
    <button type="button" className={styles.Button} onClick={createToast}>
      Create toast
    </button>
  );
}

/** The docs hero demo: toasts are created imperatively — `useToastManager().add({ title, description })` — and render into a bottom-right stacked viewport. There is no Trigger part and no `open` prop. */
export const Hero: Story = {
  render: () => <HeroExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Create toast' }));
    // The viewport portals to document.body and is the polite live region.
    const viewport = body.getByRole('region', { name: 'Notifications' });
    const toast = await within(viewport).findByRole('dialog');
    await waitFor(() => expect(within(toast).getByText('Toast 1 created')).toBeVisible());
  },
};

function StackingExample() {
  return (
    <ToastDemoShell>
      <AddMessageButton />
    </ToastDemoShell>
  );
}

/** Newest toast is index 0 (front); older toasts peek behind at reduced scale via `--toast-index`. Hovering or focusing the viewport sets `data-expanded` and fans the stack out along `--toast-offset-y` — all layout is user CSS on these hooks. */
export const StackingAndExpand: Story = {
  render: () => <StackingExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const add = canvas.getByRole('button', { name: 'Add toast' });
    await userEvent.click(add);
    await userEvent.click(add);
    await userEvent.click(add);
    await waitFor(() => expect(body.getAllByRole('dialog')).toHaveLength(3));

    // Each root carries its stack position as an inline --toast-index variable.
    const roots = body.getAllByRole('dialog');
    const indexes = roots.map((root) => root.style.getPropertyValue('--toast-index'));
    await expect(new Set(indexes).size).toBe(3);
    // DOM order is newest-first: the front toast is the last one created.
    await waitFor(() => expect(within(roots[0]).getByText('Message 3')).toBeVisible());

    // Hovering the viewport expands the stack.
    const viewport = body.getByRole('region', { name: 'Notifications' });
    await userEvent.hover(viewport);
    await waitFor(() => expect(viewport).toHaveAttribute('data-expanded'));
    await waitFor(() => expect(roots[0]).toHaveAttribute('data-expanded'));

    await userEvent.unhover(viewport);
    await waitFor(() => expect(viewport).not.toHaveAttribute('data-expanded'));
  },
};

function VaryingHeightsExample() {
  return (
    <ToastDemoShell>
      <VaryingHeightsButton />
    </ToastDemoShell>
  );
}

const VARYING_TEXTS = [
  'Short message.',
  'A bit longer message that spans two lines.',
  'This is a longer description that intentionally takes more vertical space to demonstrate stacking with varying heights.',
  'An even longer description that should span multiple lines so we can verify the clamped collapsed height and smooth expansion animation when hovering or focusing the viewport.',
];

function VaryingHeightsButton() {
  const toastManager = Toast.useToastManager();
  const [count, setCount] = React.useState(0);

  function createToast() {
    setCount((prev) => prev + 1);
    const description = VARYING_TEXTS[count % VARYING_TEXTS.length];
    toastManager.add({
      title: `Toast ${count + 1} created`,
      description,
    });
  }

  return (
    <button type="button" className={styles.Button} onClick={createToast}>
      Create varying height toast
    </button>
  );
}

/** The docs `varying-heights` demo: `Toast.Content` measures each toast's natural height, collapsed toasts clamp to `--toast-frontmost-height`, and `[data-behind]` hides overflowing content until the stack expands ([#2742](https://github.com/mui/base-ui/pull/2742)). */
export const VaryingHeights: Story = {
  render: () => <VaryingHeightsExample />,
};

/* ------------------------------------------------------------------ */
/* Limits and timers                                                   */
/* ------------------------------------------------------------------ */

function LimitExample() {
  return (
    <ToastDemoShell limit={2}>
      <AddMessageButton timeout={0} />
    </ToastDemoShell>
  );
}

/** `limit` caps the visible stack. Overflowing older toasts are not removed: they get `data-limited` + HTML `inert` and return into view when newer ones close ([#1953](https://github.com/mui/base-ui/pull/1953)). Style the overflow (here `opacity: 0`) instead of expecting unmounts. */
export const LimitOverflow: Story = {
  render: () => <LimitExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);
    const add = canvas.getByRole('button', { name: 'Add toast' });
    await userEvent.click(add);
    await userEvent.click(add);
    await userEvent.click(add);

    // The third toast pushes the oldest over the limit: still mounted, but inert.
    await waitFor(() => expect(doc.querySelectorAll('[data-limited]')).toHaveLength(1));
    const limited = doc.querySelector('[data-limited]') as HTMLElement;
    await expect(limited).toHaveAttribute('inert');
    await expect(within(limited).getByText('Message 1')).toBeInTheDocument();

    // Closing the front toast lets the limited toast return into view.
    const viewport = body.getByRole('region', { name: 'Notifications' });
    await userEvent.hover(viewport);
    const front = body.getByRole('dialog', { name: 'Message 3' });
    await userEvent.click(within(front).getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(doc.querySelector('[data-limited]')).toBeNull(), {
      timeout: 3000,
    });
  },
};

function DurationExample() {
  return (
    <ToastDemoShell>
      <DurationButtons />
    </ToastDemoShell>
  );
}

function DurationButtons() {
  const toastManager = Toast.useToastManager();
  return (
    <div className={styles.Row}>
      <button
        type="button"
        className={styles.Button}
        onClick={() => toastManager.add({ title: 'Quick toast', timeout: 1000 })}
      >
        Add 1s toast
      </button>
      <button
        type="button"
        className={styles.Button}
        onClick={() => toastManager.add({ title: 'Long-lived toast', timeout: 8000 })}
      >
        Add 8s toast
      </button>
    </div>
  );
}

/** Per-toast `timeout` in `add()` overrides the provider default (5000ms). Use long timeouts (≥10s) when a toast carries an action the user must reach ([#4975](https://github.com/mui/base-ui/pull/4975)). */
export const CustomDuration: Story = {
  render: () => <DurationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Add 8s toast' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Add 1s toast' }));
    await waitFor(() => expect(body.getByText('Quick toast')).toBeVisible());
    await expect(body.getByText('Long-lived toast')).toBeInTheDocument();

    // The 1s toast dismisses itself; the 8s toast outlives it.
    await waitFor(() => expect(body.queryByText('Quick toast')).not.toBeInTheDocument(), {
      timeout: 4000,
    });
    await waitFor(() => expect(body.getByText('Long-lived toast')).toBeVisible());
  },
};

function PersistentExample() {
  return (
    <ToastDemoShell timeout={1500}>
      <PersistentButtons />
    </ToastDemoShell>
  );
}

function PersistentButtons() {
  const toastManager = Toast.useToastManager();
  return (
    <div className={styles.Row}>
      <button
        type="button"
        className={styles.Button}
        onClick={() =>
          toastManager.add({
            title: 'Backup running',
            description: 'Stays until you dismiss it.',
            timeout: 0,
          })
        }
      >
        Start backup (persistent)
      </button>
      <button
        type="button"
        className={styles.Button}
        onClick={() => toastManager.add({ title: 'Autosaved' })}
      >
        Autosave (default timeout)
      </button>
    </div>
  );
}

/** `timeout: 0` disables auto-dismiss — the WCAG 2.2.1 (Timing Adjustable) mitigation for content the user must not miss ([#4253](https://github.com/mui/base-ui/issues/4253)). Persistent toasts need an explicit `Toast.Close` affordance. The provider here uses `timeout={1500}` so the control toast expires quickly. */
export const PersistentToast: Story = {
  render: () => <PersistentExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Start backup (persistent)' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Autosave (default timeout)' }));
    await waitFor(() => expect(body.getByText('Autosaved')).toBeVisible());

    // The default-timeout control expires; the timeout: 0 toast survives it.
    await waitFor(() => expect(body.queryByText('Autosaved')).not.toBeInTheDocument(), {
      timeout: 4000,
    });
    await expect(body.getByText('Backup running')).toBeInTheDocument();

    // Hovering expands the viewport, which un-hides the Close button
    // (Toast.Close is aria-hidden while the stack is neither expanded nor focused).
    const viewport = body.getByRole('region', { name: 'Notifications' });
    await userEvent.hover(viewport);
    const root = body.getByRole('dialog', { name: 'Backup running' });
    await userEvent.click(within(root).getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(body.queryByText('Backup running')).not.toBeInTheDocument(), {
      timeout: 3000,
    });
  },
};

function HoverPauseExample() {
  return (
    <ToastDemoShell timeout={1200}>
      <HoverPauseButton />
    </ToastDemoShell>
  );
}

function HoverPauseButton() {
  const toastManager = Toast.useToastManager();
  return (
    <button
      type="button"
      className={styles.Button}
      onClick={() =>
        toastManager.add({
          title: 'Report ready',
          description: 'Hover the stack to keep it around.',
        })
      }
    >
      Notify
    </button>
  );
}

/** Timers pause while the viewport is hovered, focus-visibly focused, or the window is blurred, and resume with the remaining time afterwards ([#4438](https://github.com/mui/base-ui/pull/4438)). The toast here has a 1.2s timeout but survives much longer under the pointer. */
export const HoverPausesTimers: Story = {
  render: () => <HoverPauseExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Notify' }));
    const viewport = body.getByRole('region', { name: 'Notifications' });
    await userEvent.hover(viewport);
    await waitFor(() => expect(viewport).toHaveAttribute('data-expanded'));

    // Ride out well past the 1200ms timeout while hovered: the timer is paused.
    // (Real elapsed time via waitFor polling — the plan forbids mocked clocks.)
    const start = Date.now();
    await waitFor(() => expect(Date.now() - start).toBeGreaterThan(1800), { timeout: 5000 });
    await expect(body.getByText('Report ready')).toBeVisible();

    // Once the pointer leaves, the remaining time elapses and the toast dismisses.
    await userEvent.unhover(viewport);
    await waitFor(() => expect(body.queryByText('Report ready')).not.toBeInTheDocument(), {
      timeout: 5000,
    });
  },
};

/* ------------------------------------------------------------------ */
/* Dismissal gestures and placement                                    */
/* ------------------------------------------------------------------ */

function SwipeExample() {
  return (
    <ToastDemoShell
      renderToast={(toast) => (
        <Toast.Root toast={toast} swipeDirection={['down', 'right']} className={styles.Toast}>
          <StackedToastContent />
        </Toast.Root>
      )}
    >
      <SwipeButton />
    </ToastDemoShell>
  );
}

function SwipeButton() {
  const toastManager = Toast.useToastManager();
  return (
    <button
      type="button"
      className={styles.Button}
      onClick={() =>
        toastManager.add({
          title: 'Swipe me away',
          description: 'Drag down or right past 40px to dismiss.',
          timeout: 0,
        })
      }
    >
      Create swipeable toast
    </button>
  );
}

/** Drag a toast past the 40px threshold in an allowed `swipeDirection` (default `['down', 'right']` — match your viewport corner) to dismiss it. While swiping, `data-swiping` and `--toast-swipe-movement-x/-y` track the pointer; on release, `data-swipe-direction` plus the frozen movement variables let the exit animation continue from the release point ([#2769](https://github.com/mui/base-ui/pull/2769)). `user-select: none` on the root is load-bearing — swipe feels sticky without it ([#1467](https://github.com/mui/base-ui/pull/1467) review). Gesture-only behavior: try it by hand, there is no simulated-pointer play. */
export const SwipeToDismiss: Story = {
  render: () => <SwipeExample />,
};

function TopCenterExample() {
  return (
    <ToastDemoShell
      viewportClassName={styles.TopViewport}
      renderToast={(toast) => (
        <Toast.Root toast={toast} swipeDirection="up" className={styles.TopToast}>
          <StackedToastContent />
        </Toast.Root>
      )}
    >
      <TopCenterButton />
    </ToastDemoShell>
  );
}

function TopCenterButton() {
  const toastManager = Toast.useToastManager();
  const [count, setCount] = React.useState(0);

  function createToast() {
    setCount((prev) => prev + 1);
    toastManager.add({
      title: `Toast ${count + 1} created`,
      description: 'This is a toast notification.',
    });
  }

  return (
    <button type="button" className={styles.Button} onClick={createToast}>
      Create toast
    </button>
  );
}

/** The docs `position` demo: position is pure CSS on the viewport (top-center here), with the stack offsets and enter/exit transforms mirrored. Match `swipeDirection` to the placement — a top stack swipes `"up"`. */
export const CustomPosition: Story = {
  render: () => <TopCenterExample />,
};

function AnchoredExample() {
  return (
    <ToastDemoShell viewportClassName={styles.AnchoredViewport} renderToast={renderAnchoredToast}>
      <CopyButton />
    </ToastDemoShell>
  );
}

function renderAnchoredToast(toast: Toast.Root.ToastObject) {
  return (
    <Toast.Positioner toast={toast} className={styles.AnchoredPositioner}>
      <Toast.Root toast={toast} className={styles.AnchoredToast}>
        <Toast.Arrow className={styles.Arrow} />
        <Toast.Content>
          <Toast.Description className={styles.AnchoredDescription} />
        </Toast.Content>
      </Toast.Root>
    </Toast.Positioner>
  );
}

function CopyButton() {
  const toastManager = Toast.useToastManager();
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  function handleCopy() {
    toastManager.add({
      description: 'Copied',
      timeout: 1500,
      positionerProps: {
        anchor: buttonRef.current,
        sideOffset: 10,
      },
    });
  }

  return (
    <button type="button" ref={buttonRef} className={styles.Button} onClick={handleCopy}>
      Copy npm install command
    </button>
  );
}

/** Anchored toasts (docs `anchored` demo, simplified — the docs version adds a Tooltip): pass `positionerProps: { anchor }` in `add()` and wrap the Root in `Toast.Positioner` + `Toast.Arrow` ([#3096](https://github.com/mui/base-ui/pull/3096)). Preferred over a tooltip for "Copied"-style feedback because toasts are announced to screen readers. Keep anchored timeouts short, render them in a separate provider from stacked toasts, and note that swiping is disabled for anchored toasts. */
export const AnchoredToast: Story = {
  render: () => <AnchoredExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: /Copy npm install/ }));
    const toastText = await body.findByText('Copied');
    await waitFor(() => expect(toastText).toBeVisible());
    // The positioner resolves a side against the anchor button.
    await expect(toastText.closest('[data-side]')).not.toBeNull();
    // Short-lived by design: it dismisses itself.
    await waitFor(() => expect(body.queryByText('Copied')).not.toBeInTheDocument(), {
      timeout: 4000,
    });
  },
};

/* ------------------------------------------------------------------ */
/* Manager API                                                         */
/* ------------------------------------------------------------------ */

const globalToastManager = Toast.createToastManager();

// A plain function — no hook, no component. Callable from API clients,
// websocket handlers, route loaders, or anywhere else outside React.
function notifyFromOutsideReact() {
  globalToastManager.add({
    title: 'Nightly export finished',
    description: 'Queued from a plain function outside the React tree.',
  });
}

/** `Toast.createToastManager()` at module scope + `<Toast.Provider toastManager>` drives toasts from outside React. The button here lives outside the provider subtree and calls a plain function. Caveat: toasts fired before the provider mounts are dropped ([#4986](https://github.com/mui/base-ui/issues/4986), open). */
export const GlobalManager: Story = {
  render: () => (
    <div className={styles.Stack}>
      {/* This button is NOT inside the Toast.Provider subtree. */}
      <button type="button" className={styles.Button} onClick={() => notifyFromOutsideReact()}>
        Notify from outside React
      </button>
      <ToastDemoShell toastManager={globalToastManager} />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Notify from outside React' }));
    const toast = await body.findByText('Nightly export finished');
    await waitFor(() => expect(toast).toBeVisible());
  },
};

function UpdateExample() {
  return (
    <ToastDemoShell>
      <UpdateButtons />
    </ToastDemoShell>
  );
}

function UpdateButtons() {
  const toastManager = Toast.useToastManager();
  const toastIdRef = React.useRef<string | null>(null);

  function startExport() {
    toastIdRef.current = toastManager.add({
      title: 'Exporting workspace',
      description: 'Starting export…',
      timeout: 0,
    });
  }

  function reportProgress() {
    if (toastIdRef.current) {
      toastManager.update(toastIdRef.current, { description: 'Export 80% complete' });
    }
  }

  return (
    <div className={styles.Row}>
      <button type="button" className={styles.Button} onClick={startExport}>
        Start export
      </button>
      <button type="button" className={styles.Button} onClick={reportProgress}>
        Report progress
      </button>
    </div>
  );
}

/** `add()` returns the toast id; `update(id, options)` edits it in place. Updating `timeout` (or upserting) also reschedules the timer ([#3564](https://github.com/mui/base-ui/pull/3564)). */
export const UpdateToast: Story = {
  render: () => <UpdateExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Start export' }));
    await waitFor(() => expect(body.getByText('Starting export…')).toBeVisible());

    await userEvent.click(canvas.getByRole('button', { name: 'Report progress' }));
    await waitFor(() => expect(body.getByText('Export 80% complete')).toBeVisible());
    await expect(body.queryByText('Starting export…')).not.toBeInTheDocument();
  },
};

function CloseAllExample() {
  return (
    <ToastDemoShell>
      <CloseAllButtons />
    </ToastDemoShell>
  );
}

function CloseAllButtons() {
  const toastManager = Toast.useToastManager();
  return (
    <div className={styles.Row}>
      <AddMessageButton timeout={0} />
      <button type="button" className={styles.Button} onClick={() => toastManager.close()}>
        Dismiss all
      </button>
    </div>
  );
}

/** `close(id)` closes one toast; `close()` with no id closes all — the same single-`dismiss` shape Sonner and Chakra expose ([#3979](https://github.com/mui/base-ui/pull/3979)). */
export const CloseAllToasts: Story = {
  render: () => <CloseAllExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const add = canvas.getByRole('button', { name: 'Add toast' });
    await userEvent.click(add);
    await userEvent.click(add);
    await userEvent.click(add);
    await waitFor(() => expect(body.getAllByRole('dialog')).toHaveLength(3));

    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss all' }));
    await waitFor(() => expect(body.queryAllByRole('dialog')).toHaveLength(0), {
      timeout: 3000,
    });
  },
};

function DeduplicateExample() {
  return (
    <ToastDemoShell renderToast={(toast) => <PulseToastItem toast={toast} />}>
      <SaveDraftButton />
    </ToastDemoShell>
  );
}

function SaveDraftButton() {
  const toastManager = Toast.useToastManager();

  function saveDraft() {
    toastManager.add({
      id: 'save-status',
      title: 'Draft saved',
      description: 'Click again while it is visible to replay the pulse.',
    });
  }

  return (
    <button type="button" className={styles.Button} onClick={saveDraft}>
      Save draft
    </button>
  );
}

function PulseToastItem({ toast }: { toast: Toast.Root.ToastObject }) {
  let pulseClassName: string | null = null;

  // New toasts start with `updateKey: 0`, so the first add skips the replay pulse.
  if (toast.updateKey) {
    pulseClassName = toast.updateKey % 2 === 0 ? styles.PulseEven : styles.PulseOdd;
  }

  const className = [styles.Toast, pulseClassName].filter(Boolean).join(' ');

  return (
    <Toast.Root toast={toast} className={className}>
      <StackedToastContent />
    </Toast.Root>
  );
}

/** The docs `deduplicate` demo: `add({ id })` with an existing id upserts instead of stacking a duplicate, refreshes the timer, and increments `toast.updateKey` — alternate two animation classes on its parity to replay a pulse ([#4440](https://github.com/mui/base-ui/pull/4440)). */
export const DeduplicateToast: Story = {
  render: () => <DeduplicateExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const save = canvas.getByRole('button', { name: 'Save draft' });
    await userEvent.click(save);
    await userEvent.click(save);

    // Upsert: two adds with the same id yield exactly one toast.
    await waitFor(() => expect(body.getAllByRole('dialog')).toHaveLength(1));
    const root = body.getByRole('dialog');
    await waitFor(() => expect(within(root).getByText('Draft saved')).toBeVisible());
    // One update happened, so the odd pulse class is applied.
    await expect(root.className).toMatch(/Pulse/);
  },
};

function CustomDataExample() {
  return (
    <ToastDemoShell renderToast={renderCustomDataToast}>
      <CustomDataButton />
    </ToastDemoShell>
  );
}

interface CustomToastData {
  userId: string;
}

function isCustomToast(
  toast: Toast.Root.ToastObject,
): toast is Toast.Root.ToastObject<CustomToastData> {
  return toast.data?.userId !== undefined;
}

function renderCustomDataToast(toast: Toast.Root.ToastObject) {
  return (
    <Toast.Root toast={toast} className={styles.Toast}>
      <Toast.Content className={styles.Content}>
        <div className={styles.Text}>
          <Toast.Title className={styles.Title}>{toast.title}</Toast.Title>
          {isCustomToast(toast) && toast.data ? (
            <Toast.Description className={styles.Description}>
              data.userId is {toast.data.userId}
            </Toast.Description>
          ) : (
            <Toast.Description className={styles.Description} />
          )}
        </div>
        <Toast.Close className={styles.Close}>Dismiss</Toast.Close>
      </Toast.Content>
    </Toast.Root>
  );
}

function CustomDataButton() {
  const toastManager = Toast.useToastManager();

  function createToast() {
    const data: CustomToastData = {
      userId: '123',
    };

    toastManager.add({
      title: 'Toast with custom data',
      data,
    });
  }

  return (
    <button type="button" className={styles.Button} onClick={createToast}>
      Create custom toast
    </button>
  );
}

/** The docs `custom` demo: `add({ data })` carries an arbitrary typed payload to your renderer; narrow per-toast with a type guard, or type the whole manager with `useToastManager<Data>()` ([#3882](https://github.com/mui/base-ui/pull/3882)). */
export const CustomDataToast: Story = {
  render: () => <CustomDataExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Create custom toast' }));
    const description = await body.findByText('data.userId is 123');
    await waitFor(() => expect(description).toBeVisible());
  },
};

/* ------------------------------------------------------------------ */
/* Async flows and actions                                             */
/* ------------------------------------------------------------------ */

function PromiseExample() {
  return (
    <ToastDemoShell>
      <RunPromiseButton />
    </ToastDemoShell>
  );
}

function RunPromiseButton() {
  const toastManager = Toast.useToastManager();

  function runPromise() {
    toastManager.promise(
      // Deterministic stand-in for an API request (the docs demo rolls dice).
      new Promise<string>((resolve) => {
        setTimeout(() => resolve('120 records imported'), 1200);
      }),
      {
        loading: 'Importing records…',
        success: (data: string) => `Import finished: ${data}`,
        error: (error: Error) => `Import failed: ${error.message}`,
      },
    );
  }

  return (
    <button type="button" className={styles.Button} onClick={runPromise}>
      Import data
    </button>
  );
}

/** `promise()` models loading → success/error as one updating toast: `type: 'loading'` never auto-dismisses, then the settled type takes normal timers. It returns the chained promise, not an id — pass your own `id` if you need to address the toast later ([#2833](https://github.com/mui/base-ui/issues/2833)). Style states via `[data-type]`. */
export const PromiseToast: Story = {
  render: () => <PromiseExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Import data' }));

    await waitFor(() => expect(body.getByText('Importing records…')).toBeVisible());
    const root = body.getByRole('dialog');
    await expect(root).toHaveAttribute('data-type', 'loading');

    // The same toast updates in place when the promise resolves.
    await waitFor(
      () => expect(body.getByText('Import finished: 120 records imported')).toBeVisible(),
      { timeout: 4000 },
    );
    await expect(root).toHaveAttribute('data-type', 'success');
  },
};

function UndoExample() {
  return (
    <ToastDemoShell renderToast={renderActionToast}>
      <PerformActionButton />
    </ToastDemoShell>
  );
}

function renderActionToast(toast: Toast.Root.ToastObject) {
  return (
    <Toast.Root toast={toast} className={styles.Toast}>
      <Toast.Content className={styles.Content}>
        <div className={styles.ActionText}>
          <div className={styles.Message}>
            <Toast.Title className={styles.Title} />
            <Toast.Description className={styles.Description} />
          </div>
          <Toast.Action className={styles.ActionButton} />
        </div>
      </Toast.Content>
    </Toast.Root>
  );
}

function PerformActionButton() {
  const toastManager = Toast.useToastManager();

  function performAction() {
    const id = toastManager.add({
      title: 'Message archived',
      description: 'You can undo this action.',
      type: 'success',
      // Long timeout so keyboard and screen-reader users can reach the action (#4975).
      timeout: 10000,
      actionProps: {
        children: 'Undo',
        onClick() {
          toastManager.close(id);
          toastManager.add({
            title: 'Action undone',
          });
        },
      },
    });
  }

  return (
    <button type="button" className={styles.Button} onClick={performAction}>
      Archive message
    </button>
  );
}

/** The docs `undo` demo: `actionProps` (full button props incl. `children`) renders through `Toast.Action`; the handler closes this toast and confirms with another. Pair actions with long timeouts — the docs raised this demo to 10s after a11y review ([#4975](https://github.com/mui/base-ui/pull/4975); [#4253](https://github.com/mui/base-ui/issues/4253) tracks the reachability gap). */
export const UndoAction: Story = {
  render: () => <UndoExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Archive message' }));
    const undo = await body.findByRole('button', { name: 'Undo' });
    await userEvent.click(undo);

    await waitFor(() => expect(body.getByText('Action undone')).toBeVisible());
    await waitFor(() => expect(body.queryByText('Message archived')).not.toBeInTheDocument(), {
      timeout: 3000,
    });
  },
};

function LifecycleExample() {
  const [log, setLog] = React.useState<string[]>([]);
  return (
    <div className={styles.Stack}>
      <ToastDemoShell>
        <LifecycleButton onLog={(entry) => setLog((prev) => [...prev, entry])} />
      </ToastDemoShell>
      <output className={styles.Output}>
        lifecycle: {log.length > 0 ? log.join(' → ') : 'none yet'}
      </output>
    </div>
  );
}

function LifecycleButton({ onLog }: { onLog: (entry: string) => void }) {
  const toastManager = Toast.useToastManager();

  function upload() {
    toastManager.add({
      title: 'Upload complete',
      timeout: 0,
      onClose: () => onLog('onClose'),
      onRemove: () => onLog('onRemove'),
    });
  }

  return (
    <button type="button" className={styles.Button} onClick={upload}>
      Upload file
    </button>
  );
}

/** `onClose` fires when closing starts; `onRemove` fires only after exit animations complete and the toast leaves the array — react at close-start (analytics) vs after-exit (releasing resources). */
export const OnCloseVsOnRemove: Story = {
  render: () => <LifecycleExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Upload file' }));
    const root = await body.findByRole('dialog');

    const viewport = body.getByRole('region', { name: 'Notifications' });
    await userEvent.hover(viewport);
    await userEvent.click(within(root).getByRole('button', { name: 'Dismiss' }));

    // The joined order proves the sequence: close-start first, removal after
    // the 0.5s exit transition settles.
    await waitFor(() => expect(canvas.getByText('lifecycle: onClose → onRemove')).toBeVisible(), {
      timeout: 3000,
    });
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Accessibility                                                       */
/* ------------------------------------------------------------------ */

function PriorityExample() {
  return (
    <ToastDemoShell>
      <PriorityButtons />
    </ToastDemoShell>
  );
}

function PriorityButtons() {
  const toastManager = Toast.useToastManager();
  return (
    <div className={styles.Row}>
      <button
        type="button"
        className={styles.Button}
        onClick={() => toastManager.add({ title: 'Draft saved', priority: 'low' })}
      >
        Polite (low)
      </button>
      <button
        type="button"
        className={styles.Button}
        onClick={() =>
          toastManager.add({
            title: 'Session expired',
            description: 'Sign in again to continue.',
            priority: 'high',
            timeout: 0,
          })
        }
      >
        Assertive (high)
      </button>
    </div>
  );
}

/** The two announcement paths ([#2246](https://github.com/mui/base-ui/pull/2246)): low priority announces politely through the viewport live region and renders `role="dialog"`; high priority renders `role="alertdialog"` plus a separate visually hidden `role="alert"` container carrying the title/description strings (the root itself is aria-hidden while unfocused to avoid double announcement). Reserve `'high'` for urgent, actionable failures. */
export const PriorityAnnouncements: Story = {
  render: () => <PriorityExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Polite (low)' }));
    const politeRoot = await body.findByRole('dialog');
    await expect(politeRoot).not.toHaveAttribute('aria-hidden');

    await userEvent.click(canvas.getByRole('button', { name: 'Assertive (high)' }));
    // The high-priority root is aria-hidden while unfocused, so query the DOM directly.
    await waitFor(() => expect(doc.querySelector('[role="alertdialog"]')).not.toBeNull());
    // The hidden alert container announces the strings assertively.
    const alert = await body.findByRole('alert');
    await expect(alert).toHaveTextContent('Session expired');
    await expect(alert).toHaveTextContent('Sign in again to continue.');
  },
};

function KeyboardExample() {
  return (
    <ToastDemoShell>
      <AddMessageButton timeout={0} />
    </ToastDemoShell>
  );
}

/** The keyboard contract: F6 jumps to the viewport from anywhere (recording the previously focused element and pausing timers), Tab enters the stack at the newest toast, Escape closes the focused toast and moves focus to the next one, and Shift+Tab hands focus back to where you were. Toasts never steal focus on open ([#4533](https://github.com/mui/base-ui/pull/4533) rejected a `focus` option). */
export const KeyboardNavigation: Story = {
  render: () => <KeyboardExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const add = canvas.getByRole('button', { name: 'Add toast' });
    await userEvent.click(add);
    await userEvent.click(add);
    await waitFor(() => expect(body.getAllByRole('dialog')).toHaveLength(2));

    // F6 focuses the viewport landmark from anywhere in the window.
    await userEvent.keyboard('{F6}');
    const viewport = body.getByRole('region', { name: 'Notifications' });
    await waitFor(() => expect(viewport).toHaveFocus());

    // Tab enters the stack at the newest (frontmost) toast.
    await userEvent.tab();
    const front = body.getByRole('dialog', { name: 'Message 2' });
    await waitFor(() => expect(front).toHaveFocus());

    // Escape closes the focused toast; focus moves to the surviving toast.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByText('Message 2')).not.toBeInTheDocument(), {
      timeout: 3000,
    });
    const remaining = body.getByRole('dialog', { name: 'Message 1' });
    await waitFor(() => expect(remaining).toHaveFocus());

    // Shift+Tab returns focus to the previously focused element.
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(add).toHaveFocus());
  },
};

/* ------------------------------------------------------------------ */
/* Styling contract                                                    */
/* ------------------------------------------------------------------ */

function TypeStylingExample() {
  return (
    <ToastDemoShell>
      <TypeStylingButtons />
    </ToastDemoShell>
  );
}

function TypeStylingButtons() {
  const toastManager = Toast.useToastManager();
  return (
    <div className={styles.Row}>
      <button
        type="button"
        className={styles.Button}
        onClick={() => toastManager.add({ title: 'Deploy succeeded', type: 'success', timeout: 0 })}
      >
        Success
      </button>
      <button
        type="button"
        className={styles.Button}
        onClick={() => toastManager.add({ title: 'Deploy failed', type: 'error', timeout: 0 })}
      >
        Error
      </button>
      <button
        type="button"
        className={styles.Button}
        onClick={() => toastManager.add({ title: 'Deploy queued', type: 'info', timeout: 0 })}
      >
        Info
      </button>
    </div>
  );
}

/** `type` is a free-form styling/behavior discriminator surfaced as `data-type` on Root, Title, Description, Action, and Close — key your CSS on it (`'loading'` is special: no auto-dismiss). Literal-union typing was declined in favor of a future typed manager ([#3952](https://github.com/mui/base-ui/issues/3952)). */
export const TypeStyling: Story = {
  render: () => <TypeStylingExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Success' }));
    const successRoot = await body.findByRole('dialog', { name: 'Deploy succeeded' });
    await expect(successRoot).toHaveAttribute('data-type', 'success');

    await userEvent.click(canvas.getByRole('button', { name: 'Error' }));
    const errorRoot = await body.findByRole('dialog', { name: 'Deploy failed' });
    await expect(errorRoot).toHaveAttribute('data-type', 'error');

    await userEvent.click(canvas.getByRole('button', { name: 'Info' }));
    const infoRoot = await body.findByRole('dialog', { name: 'Deploy queued' });
    await expect(infoRoot).toHaveAttribute('data-type', 'info');
  },
};
