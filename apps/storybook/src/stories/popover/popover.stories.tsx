import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Popover } from '@base-ui/react/popover';
import { Checkbox } from '@base-ui/react/checkbox';
import styles from './popover.module.css';
import { QueuePopoverExample } from './recreations/QueuePopoverExample';
import { LinkEditorToolbarExample } from './recreations/LinkEditorToolbarExample';
import { MentionAutocompleteExample } from './recreations/MentionAutocompleteExample';

/**
 * Stories follow research/c-components/popover (Tier 1): the five kept docs demos,
 * the mandatory full open/close interaction, the modal-vs-non-modal pair, the
 * detached-trigger/createHandle stories with a typed payload, the dismissal-control
 * recipe, one story per evidenced use case, and three real-world recreations from
 * the code-ok entries in research/d-real-world-usage/popover/ranked.json.
 */
const meta = {
  title: 'Overlays/Popover',
  component: Popover.Root,
  subcomponents: {
    'Popover.Trigger': Popover.Trigger,
    'Popover.Portal': Popover.Portal,
    'Popover.Positioner': Popover.Positioner,
    'Popover.Popup': Popover.Popup,
    'Popover.Arrow': Popover.Arrow,
    'Popover.Title': Popover.Title,
    'Popover.Description': Popover.Description,
    'Popover.Close': Popover.Close,
  },
} satisfies Meta<typeof Popover.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Kept docs demos                                                     */
/* ------------------------------------------------------------------ */

/** The docs hero demo: a notifications panel built from the canonical part tree — Trigger, Portal, Positioner, Popup, Arrow, Title, Description. Use as the starting point for any anchored panel of essential content. */
export const Hero: Story = {
  render: () => (
    <Popover.Root>
      <Popover.Trigger className={styles.Button}>Notifications</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={styles.Popup}>
            <Popover.Arrow className={styles.Arrow} />
            <Popover.Title className={styles.Title}>Notifications</Popover.Title>
            <Popover.Description className={styles.Description}>
              You are all caught up. Good job!
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
};

/** Dark-theme variant of Hero (Chromatic coverage of the dark semantic layer). */
export const Dark: Story = {
  ...Hero,
  globals: { theme: 'dark' },
};

/** `openOnHover` on the Trigger (not the Root) makes the popover a hybrid: hover opens it after `delay` (default 300ms of rest), and click still works for touch and keyboard users. Hover-open never moves focus. */
export const OpenOnHover: Story = {
  render: () => (
    <Popover.Root>
      <Popover.Trigger openOnHover className={styles.Button}>
        Notifications
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={styles.Popup}>
            <Popover.Arrow className={styles.Arrow} />
            <Popover.Title className={styles.Title}>Notifications</Popover.Title>
            <Popover.Description className={styles.Description}>
              You are all caught up. Good job!
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
};

const simpleHandle = Popover.createHandle();

/** A trigger rendered outside `Popover.Root`, connected through `Popover.createHandle()` — the modern answer to "open a popover from anywhere" (#2336). */
export const DetachedTriggersSimple: Story = {
  render: () => (
    <React.Fragment>
      <Popover.Trigger className={styles.Button} handle={simpleHandle}>
        Notifications
      </Popover.Trigger>
      <Popover.Root handle={simpleHandle}>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Arrow className={styles.Arrow} />
              <Popover.Title className={styles.Title}>Notifications</Popover.Title>
              <Popover.Description className={styles.Description}>
                You are all caught up. Good job!
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </React.Fragment>
  ),
};

const controlledHandle = Popover.createHandle();

function DetachedTriggersControlledExample() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean, eventDetails: Popover.Root.ChangeEventDetails) => {
    setOpen(isOpen);
    setTriggerId(eventDetails.trigger?.id ?? null);
  };

  return (
    <React.Fragment>
      <div className={styles.Container}>
        <Popover.Trigger className={styles.Button} handle={controlledHandle} id="dtc-trigger-1">
          Trigger 1
        </Popover.Trigger>
        <Popover.Trigger className={styles.Button} handle={controlledHandle} id="dtc-trigger-2">
          Trigger 2
        </Popover.Trigger>
        <button
          type="button"
          className={styles.Button}
          onClick={() => {
            setTriggerId('dtc-trigger-2');
            setOpen(true);
          }}
        >
          Open programmatically
        </button>
      </div>
      <Popover.Root
        handle={controlledHandle}
        open={open}
        onOpenChange={handleOpenChange}
        triggerId={triggerId}
      >
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Arrow className={styles.Arrow} />
              <Popover.Title className={styles.Title}>Notifications</Popover.Title>
              <Popover.Description className={styles.Description}>
                You are all caught up. Good job!
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </React.Fragment>
  );
}

/** Controlled mode with multiple triggers: `open` + `triggerId` on the Root, with the active trigger delivered in `eventDetails.trigger`. Forgetting `triggerId` positions the popup at the viewport origin (#3577). */
export const DetachedTriggersControlled: Story = {
  render: () => <DetachedTriggersControlledExample />,
};

const morphHandle = Popover.createHandle<React.ComponentType>();

function NotificationsPanel() {
  return (
    <div className={styles.Stack}>
      <Popover.Title className={styles.Title}>Notifications</Popover.Title>
      <Popover.Description className={styles.Description}>
        You are all caught up. Good job!
      </Popover.Description>
    </div>
  );
}

function ActivityPanel() {
  return (
    <div className={styles.Stack}>
      <Popover.Title className={styles.Title}>Activity</Popover.Title>
      <Popover.Description className={styles.Description}>
        Nothing interesting happened recently.
      </Popover.Description>
    </div>
  );
}

function ProfilePanel() {
  return (
    <div className={styles.ProfilePanel}>
      <Popover.Title className={styles.Title}>Jason Eventon</Popover.Title>
      <span className={styles.Avatar} aria-hidden>
        JE
      </span>
      <span className={styles.Plan}>Pro plan</span>
      <div className={styles.ProfileActions}>
        <a href="#profile-settings">Profile settings</a>
        <a href="#log-out">Log out</a>
      </div>
    </div>
  );
}

/** The full detached-triggers demo: three triggers share one popup through a typed handle, passing a component as `payload`. The Positioner/Popup transition `top/left` and `--popup-width/height`, and `Popover.Viewport` slides content by `data-activation-direction`. */
export const DetachedTriggersFull: Story = {
  render: () => (
    <div className={styles.Container}>
      <Popover.Trigger className={styles.Button} handle={morphHandle} payload={NotificationsPanel}>
        Notifications
      </Popover.Trigger>
      <Popover.Trigger className={styles.Button} handle={morphHandle} payload={ActivityPanel}>
        Activity
      </Popover.Trigger>
      <Popover.Trigger className={styles.Button} handle={morphHandle} payload={ProfilePanel}>
        Profile
      </Popover.Trigger>
      <Popover.Root handle={morphHandle}>
        {({ payload: Payload }) => (
          <Popover.Portal>
            <Popover.Positioner className={styles.AnimatedPositioner} sideOffset={8}>
              <Popover.Popup className={styles.AnimatedPopup}>
                <Popover.Arrow className={styles.Arrow} />
                <Popover.Viewport className={styles.Viewport}>
                  {Payload !== undefined && <Payload />}
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Interaction stories (behavior + a11y pinning)                       */
/* ------------------------------------------------------------------ */

/** The full interaction contract in one story: click opens a `role="dialog"` popup portalled to `document.body`, Escape closes and restores focus to the trigger, and pressing outside dismisses. */
export const OpenCloseInteraction: Story = {
  render: () => (
    <div className={styles.Row}>
      <Popover.Root>
        <Popover.Trigger className={styles.Button}>Notifications</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Arrow className={styles.Arrow} />
              <Popover.Title className={styles.Title}>Notifications</Popover.Title>
              <Popover.Description className={styles.Description}>
                You are all caught up. Good job!
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <button type="button" className={styles.Button}>
        Outside area
      </button>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Notifications' });

    // Open: the popup portals to <body> and the trigger reflects the state.
    await userEvent.click(trigger);
    const popup = await body.findByRole('dialog');
    // The popup fades in via [data-starting-style], so wait out the transition.
    await waitFor(() => expect(popup).toBeVisible());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('data-popup-open');

    // Escape closes and returns focus to the trigger.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Reopen, then an outside press dismisses it.
    await userEvent.click(trigger);
    await body.findByRole('dialog');
    await userEvent.click(canvas.getByRole('button', { name: 'Outside area' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

/** Non-modal focus contract: opening moves focus to the first tabbable element, and tabbing past the last element closes the popup and continues the document tab order after the trigger. */
export const KeyboardTabThrough: Story = {
  render: () => (
    <div className={styles.Row}>
      <Popover.Root>
        <Popover.Trigger className={styles.Button}>Quick actions</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Title className={styles.Title}>Quick actions</Popover.Title>
              <div className={styles.Row}>
                <button type="button" className={styles.Button}>
                  Archive
                </button>
                <button type="button" className={styles.Button}>
                  Snooze
                </button>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <button type="button" className={styles.Button}>
        Next in tab order
      </button>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Quick actions' });

    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const popup = await body.findByRole('dialog');

    // Focus moves to the first tabbable element inside the popup.
    const archive = within(popup).getByRole('button', { name: 'Archive' });
    await waitFor(() => expect(archive).toHaveFocus());

    await userEvent.tab();
    await expect(within(popup).getByRole('button', { name: 'Snooze' })).toHaveFocus();

    // Tabbing past the last element closes the popup and moves on.
    await userEvent.tab();
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Next in tab order' })).toHaveFocus(),
    );
  },
};

/** `modal` locks scroll and disables outside pointer interaction via an internal backdrop. Focus trapping only activates because a `Popover.Close` is rendered — visually hidden here — so assistive tech always has an escape hatch (#4084). */
export const ModalTrue: Story = {
  render: () => (
    <div className={styles.Row}>
      <Popover.Root modal>
        <Popover.Trigger className={styles.Button}>Display settings</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Title className={styles.Title}>Display settings</Popover.Title>
              <div className={styles.Row}>
                <button type="button" className={styles.Button}>
                  Reset
                </button>
                <button type="button" className={styles.Button}>
                  Apply
                </button>
              </div>
              {/* #4084: modal focus trapping requires a rendered Close. */}
              <Popover.Close className={styles.SrOnly}>Close</Popover.Close>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <button type="button" className={styles.Button}>
        Outside button
      </button>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Display settings' }));
    const popup = await body.findByRole('dialog');

    // The internal backdrop disables pointer interaction with the page.
    await waitFor(() =>
      expect(doc.querySelector('[role="presentation"][data-base-ui-inert]')).not.toBeNull(),
    );

    // Focus is trapped: Reset → Apply → (hidden) Close → wraps back to Reset.
    const reset = within(popup).getByRole('button', { name: 'Reset' });
    await waitFor(() => expect(reset).toHaveFocus());
    await userEvent.tab();
    await expect(within(popup).getByRole('button', { name: 'Apply' })).toHaveFocus();
    await userEvent.tab();
    await expect(within(popup).getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(reset).toHaveFocus());
  },
};

/** The default is non-modal: the rest of the page stays interactive, so clicking an outside field closes the popover and the field receives the interaction in the same gesture. */
export const NonModalDefault: Story = {
  render: () => (
    <div className={styles.Row}>
      <Popover.Root>
        <Popover.Trigger className={styles.Button}>Display settings</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Title className={styles.Title}>Display settings</Popover.Title>
              <div className={styles.Row}>
                <button type="button" className={styles.Button}>
                  Reset
                </button>
                <button type="button" className={styles.Button}>
                  Apply
                </button>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <input className={styles.Input} aria-label="Outside input" placeholder="Outside input" />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Display settings' }));
    await body.findByRole('dialog');

    // The page is not blocked: one click closes the popover and lands in the input.
    const input = canvas.getByRole('textbox', { name: 'Outside input' });
    await userEvent.click(input);
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(input).toHaveFocus();
    await userEvent.type(input, 'still interactive');
    await expect(input).toHaveValue('still interactive');
  },
};

/** `modal="trap-focus"` loops keyboard focus without locking scroll or outside pointers (#1571): there is no internal backdrop, and an outside press still dismisses. */
export const TrapFocusMode: Story = {
  render: () => (
    <div className={styles.Row}>
      <Popover.Root modal="trap-focus">
        <Popover.Trigger className={styles.Button}>Insert variable</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Title className={styles.Title}>Insert variable</Popover.Title>
              <div className={styles.Row}>
                <button type="button" className={styles.Button}>
                  Insert name
                </button>
                <button type="button" className={styles.Button}>
                  Insert email
                </button>
              </div>
              <Popover.Close className={styles.Button}>Cancel</Popover.Close>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <button type="button" className={styles.Button}>
        Outside button
      </button>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Insert variable' }));
    const popup = await body.findByRole('dialog');

    // Unlike `modal`, no internal backdrop is rendered — pointers stay unlocked.
    await expect(doc.querySelector('[role="presentation"][data-base-ui-inert]')).toBeNull();

    // Keyboard focus still loops inside the popup.
    const first = within(popup).getByRole('button', { name: 'Insert name' });
    await waitFor(() => expect(first).toHaveFocus());
    await userEvent.tab();
    await userEvent.tab();
    await expect(within(popup).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(first).toHaveFocus());

    // While focus is trapped, outside content is aria-hidden for assistive
    // tech (so role queries no longer see it), but pointers stay unlocked —
    // an outside press still closes the popover.
    await userEvent.click(canvas.getByText('Outside button'));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

const imperativeHandle = Popover.createHandle();

/** The handle's imperative methods: `handle.open(triggerId)` opens the popup anchored to the registered trigger from anywhere in the app, and `handle.close()` dismisses it. Calls are ignored while no Root is mounted. */
export const DetachedHandleImperative: Story = {
  render: () => (
    <div className={styles.Stack}>
      <Popover.Trigger className={styles.Button} handle={imperativeHandle} id="saved-searches">
        Saved searches
      </Popover.Trigger>
      <div className={styles.Row}>
        <button
          type="button"
          className={styles.Button}
          onClick={() => imperativeHandle.open('saved-searches')}
        >
          Open via handle.open()
        </button>
        <button type="button" className={styles.Button} onClick={() => imperativeHandle.close()}>
          Close via handle.close()
        </button>
      </div>
      <Popover.Root handle={imperativeHandle}>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Arrow className={styles.Arrow} />
              <Popover.Title className={styles.Title}>Saved searches</Popover.Title>
              <Popover.Description className={styles.Description}>
                Anchored to the registered trigger, wherever the call came from.
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Saved searches' });

    await userEvent.click(canvas.getByRole('button', { name: 'Open via handle.open()' }));
    const popup = await body.findByRole('dialog');
    await waitFor(() => expect(popup).toBeVisible());
    // The popup is associated with (and anchored to) the registered trigger.
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));

    await userEvent.click(canvas.getByRole('button', { name: 'Close via handle.close()' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

interface PlanDetails {
  name: string;
  price: string;
  blurb: string;
}

const planHandle = Popover.createHandle<PlanDetails>();

const plans: PlanDetails[] = [
  { name: 'Free', price: '$0', blurb: 'For personal projects.' },
  { name: 'Pro', price: '$16', blurb: 'For growing teams.' },
  { name: 'Enterprise', price: 'Custom', blurb: 'For large organizations.' },
];

/** Multiple triggers share one popup through a typed handle (`createHandle<PlanDetails>()`); each trigger carries a `payload` and the Root's function child renders it. Clicking another trigger moves the popup instead of closing it, reusing the same DOM node. */
export const MultipleTriggersPayload: Story = {
  render: () => (
    <div className={styles.Container}>
      {plans.map((plan) => (
        <Popover.Trigger
          key={plan.name}
          className={styles.Button}
          handle={planHandle}
          payload={plan}
        >
          {plan.name}
        </Popover.Trigger>
      ))}
      <Popover.Root handle={planHandle}>
        {({ payload }) => (
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup className={styles.Popup}>
                <Popover.Arrow className={styles.Arrow} />
                <Popover.Title className={styles.Title}>{payload?.name} plan</Popover.Title>
                <Popover.Description className={styles.Description}>
                  {payload?.price} per month — {payload?.blurb}
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Pro' }));
    const popup = await body.findByRole('dialog');
    await waitFor(() => expect(within(popup).getByText(/\$16 per month/)).toBeVisible());

    // Switching triggers swaps the payload in the same popup node.
    await userEvent.click(canvas.getByRole('button', { name: 'Enterprise' }));
    await expect(await within(popup).findByText(/Custom per month/)).toBeVisible();
    await expect(body.getByRole('dialog')).toBe(popup);
  },
};

function DismissalControlExample() {
  const [open, setOpen] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);

  return (
    <div className={styles.Stack}>
      <div className={styles.Row}>
        <Popover.Root
          open={open}
          onOpenChange={(nextOpen, eventDetails) => {
            // Veto outside interactions. An outside click arrives as `focus-out`
            // (focus leaves the popup) followed by `outside-press` — both must be
            // filtered, or the first one still closes the popover.
            if (eventDetails.reason === 'outside-press' || eventDetails.reason === 'focus-out') {
              eventDetails.cancel();
              setLog((entries) => [...entries, `${eventDetails.reason} (canceled)`]);
              return;
            }
            setOpen(nextOpen);
            setLog((entries) => [...entries, eventDetails.reason]);
          }}
        >
          <Popover.Trigger className={styles.Button}>Edit widget</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup className={styles.Popup}>
                <Popover.Title className={styles.Title}>Widget settings</Popover.Title>
                <Popover.Description className={styles.Description}>
                  Clicking outside will not close this popover.
                </Popover.Description>
                <Popover.Close className={styles.Button}>Done</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
        <button type="button" className={styles.Button}>
          Outside area
        </button>
      </div>
      <output className={styles.Output}>reasons: {log.length > 0 ? log.join(', ') : 'none'}</output>
    </div>
  );
}

/** The dismissal-control recipe: there is no `disablePointerDismissal` on Popover — filter `eventDetails.reason` and call `eventDetails.cancel()` instead (#2314, #3716, #4466). An outside click arrives as `focus-out` then `outside-press`, so both are vetoed; the Close button (`close-press`) still works. */
export const CancelCloseOnOutsidePress: Story = {
  render: () => <DismissalControlExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Edit widget' }));
    const popup = await body.findByRole('dialog');
    await expect(canvas.getByText(/trigger-press/)).toBeVisible();

    // Both dismissal reasons are canceled, so the popover stays open.
    await userEvent.click(canvas.getByRole('button', { name: 'Outside area' }));
    await expect(await canvas.findByText(/outside-press \(canceled\)/)).toBeVisible();
    await waitFor(() => expect(popup).toBeVisible());

    // Explicit close actions still go through.
    await userEvent.click(within(popup).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(canvas.getByText(/close-press/)).toBeVisible();
  },
};

/** The hover trigger is hybrid by design (#2623): clicking it also opens the popover and "sticks" it, so touch and keyboard users are never locked out. Clicking again closes it. */
export const HoverStickOnClick: Story = {
  render: () => (
    <Popover.Root>
      <Popover.Trigger openOnHover className={styles.Button}>
        Shortcuts
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={styles.Popup}>
            <Popover.Arrow className={styles.Arrow} />
            <Popover.Description className={styles.Description}>
              Press ? anywhere to open the shortcut list.
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Shortcuts' });

    // Click works even though the trigger also opens on hover.
    await userEvent.click(trigger);
    const popup = await body.findByRole('dialog');
    await waitFor(() => expect(popup).toBeVisible());
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // A second click closes the stuck-open popover.
    await userEvent.click(trigger);
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Use-case stories                                                    */
/* ------------------------------------------------------------------ */

/** The infotip pattern — the documented alternative to a tooltip on an info icon (#3530): the content is essential, so it must be reachable by touch and screen readers. `openOnHover` keeps the hover convenience for mouse users. */
export const Infotip: Story = {
  render: () => (
    <div className={styles.Row}>
      <span className={styles.Label}>Estimated tax</span>
      <Popover.Root>
        <Popover.Trigger
          openOnHover
          className={styles.IconButton}
          aria-label="More information about estimated tax"
        >
          i
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="top" sideOffset={8}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Arrow className={styles.Arrow} />
              <Popover.Description className={styles.Description}>
                Calculated from your delivery address at checkout.
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  ),
};

function FilterPanelExample() {
  const [applied, setApplied] = React.useState('none');
  return (
    <div className={styles.Stack}>
      <Popover.Root>
        <Popover.Trigger className={styles.Button}>Filter results</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Title className={styles.Title}>Filters</Popover.Title>
              <form
                className={styles.Form}
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  setApplied([...data.keys()].join(', ') || 'none');
                }}
              >
                <label className={styles.Label}>
                  <Checkbox.Root name="in-stock" defaultChecked className={styles.Checkbox}>
                    <Checkbox.Indicator className={styles.CheckboxIndicator}>
                      <CheckIcon />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  In stock
                </label>
                <label className={styles.Label}>
                  <Checkbox.Root name="on-sale" className={styles.Checkbox}>
                    <Checkbox.Indicator className={styles.CheckboxIndicator}>
                      <CheckIcon />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  On sale
                </label>
                <Popover.Close className={styles.Button} type="submit">
                  Apply
                </Popover.Close>
              </form>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <output className={styles.Output}>Applied: {applied}</output>
    </div>
  );
}

/** Interactive content is what separates popovers from tooltips: a small filter form with checkboxes, applied by a `Popover.Close` that doubles as the submit button. */
export const FilterPanelForm: Story = {
  render: () => <FilterPanelExample />,
};

interface OrderRow {
  id: string;
  customer: string;
  total: string;
  status: string;
}

const orderHandle = Popover.createHandle<OrderRow>();

const orderCustomers = [
  'Ada',
  'Grace',
  'Alan',
  'Edsger',
  'Barbara',
  'Donald',
  'Radia',
  'Vint',
  'Tim',
  'Margaret',
];

const orders: OrderRow[] = orderCustomers.map((customer, index) => ({
  id: `#10${String(index + 1).padStart(2, '0')}`,
  customer,
  total: `$${(index + 1) * 12}.00`,
  status: index % 3 === 0 ? 'Refunded' : 'Paid',
}));

/** The #3577 archetype: ten table rows share a single `Popover.Root` through a typed handle, so the tree contains one popup instead of ten. Each row's trigger passes the row as `payload`. */
export const TableRowSharedPopover: Story = {
  render: () => (
    <React.Fragment>
      <table className={styles.Table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer}</td>
              <td>
                <Popover.Trigger className={styles.Button} handle={orderHandle} payload={order}>
                  Details
                </Popover.Trigger>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Popover.Root handle={orderHandle}>
        {({ payload }) => (
          <Popover.Portal>
            <Popover.Positioner side="right" sideOffset={8}>
              <Popover.Popup className={styles.Popup}>
                <Popover.Arrow className={styles.Arrow} />
                <Popover.Title className={styles.Title}>Order {payload?.id}</Popover.Title>
                <Popover.Description className={styles.Description}>
                  {payload?.customer} — {payload?.total} ({payload?.status})
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </React.Fragment>
  ),
};

/** An explicit `Popover.Backdrop` dims the page behind a modal popover. Recomposes the optional-backdrop idea from WordPress Gutenberg's `@wordpress/ui` popover (GPL, link-only — described, not copied). */
export const WithBackdrop: Story = {
  render: () => (
    <Popover.Root modal>
      <Popover.Trigger className={styles.Button}>Review changes</Popover.Trigger>
      <Popover.Portal>
        <Popover.Backdrop className={styles.Backdrop} />
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={styles.Popup}>
            <Popover.Title className={styles.Title}>Review changes</Popover.Title>
            <Popover.Description className={styles.Description}>
              The dimmed backdrop focuses attention while this popover is open.
            </Popover.Description>
            <Popover.Close className={styles.Button}>Got it</Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
};

function CustomAnchorExample() {
  const previewRef = React.useRef<HTMLElement>(null);
  return (
    <div className={styles.Row}>
      <Popover.Root>
        <Popover.Trigger className={styles.Button}>Explain expression</Popover.Trigger>
        <code className={styles.AnchorTarget} ref={previewRef}>
          subtotal * 1.21
        </code>
        <Popover.Portal>
          <Popover.Positioner anchor={previewRef} side="bottom" align="start" sideOffset={8}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Arrow className={styles.Arrow} />
              <Popover.Description className={styles.Description}>
                21% VAT is applied to the subtotal.
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

/** The Positioner `anchor` prop positions the popup against an element other than the trigger — the sanctioned answer to "attach to an arbitrary DOM node" (#2157, #3577; LyteNyte Grid anchors cell popovers this way). */
export const CustomAnchor: Story = {
  render: () => <CustomAnchorExample />,
};

/** All positioning lives on the Positioner: `side`, `align`, `sideOffset`, `alignOffset`, `collisionPadding`. Tweak them via controls; design systems often compress these into one `placement` prop (dify-ui), but the primitives keep the axes separate. */
export const PositionerPlayground: StoryObj<typeof Popover.Positioner> = {
  args: {
    side: 'bottom',
    align: 'center',
    sideOffset: 8,
    alignOffset: 0,
    collisionPadding: 5,
  },
  argTypes: {
    side: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left', 'inline-start', 'inline-end'],
    },
    align: { control: 'select', options: ['start', 'center', 'end'] },
    sideOffset: { control: 'number' },
    alignOffset: { control: 'number' },
    collisionPadding: { control: 'number' },
  },
  render: (args) => (
    <Popover.Root defaultOpen>
      <Popover.Trigger className={styles.Button}>Anchor</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner {...args}>
          <Popover.Popup className={styles.Popup}>
            <Popover.Arrow className={styles.Arrow} />
            <Popover.Title className={styles.Title}>Anchor</Popover.Title>
            <Popover.Description className={styles.Description}>
              Positioned with side, align, and offsets.
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
};

/** Inside sticky or fixed-positioned ancestors, the default `absolute` positioning can lag while scrolling — `positionMethod="fixed"` on the Positioner is the documented fix (#3653). */
export const PositionMethodFixedInSticky: Story = {
  render: () => (
    <div className={styles.ScrollArea}>
      <div className={styles.StickyHeader}>
        <span className={styles.Label}>Inbox</span>
        <Popover.Root>
          <Popover.Trigger className={styles.Button}>Sort</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner positionMethod="fixed" sideOffset={8}>
              <Popover.Popup className={styles.Popup}>
                <Popover.Description className={styles.Description}>
                  positionMethod="fixed" keeps this popup steady while the list scrolls under the
                  sticky header.
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
      {Array.from({ length: 12 }, (_, index) => (
        <p key={index} className={styles.Filler}>
          Conversation {index + 1}
        </p>
      ))}
    </div>
  ),
};

/** The CSS animation contract: transition `[data-starting-style]`/`[data-ending-style]` and scale from `var(--transform-origin)` so the popup grows out of its anchor point. */
export const TransitionStartingEndingStyle: Story = {
  render: () => (
    <Popover.Root>
      <Popover.Trigger className={styles.Button}>Toggle panel</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={`${styles.Popup} ${styles.TransitionPopup}`}>
            <Popover.Arrow className={styles.Arrow} />
            <Popover.Title className={styles.Title}>Animated</Popover.Title>
            <Popover.Description className={styles.Description}>
              Scales in from the transform origin, and back out on close.
            </Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
};

function KeepMountedExample() {
  const [settled, setSettled] = React.useState('closed');
  return (
    <div className={styles.Stack}>
      <Popover.Root onOpenChangeComplete={(open) => setSettled(open ? 'open' : 'closed')}>
        <Popover.Trigger className={styles.Button}>Toggle panel</Popover.Trigger>
        <Popover.Portal keepMounted>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={`${styles.Popup} ${styles.TransitionPopup}`}>
              <Popover.Description className={styles.Description}>
                This popup stays mounted while closed.
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <output className={styles.Output}>transition settled: {settled}</output>
    </div>
  );
}

/** `keepMounted` on the Portal keeps the closed popup in the DOM (hidden), and `onOpenChangeComplete` fires once enter/exit transitions settle — pair with `actionsRef.unmount()` when driving exit animations from JavaScript. */
export const KeepMountedExitAnimation: Story = {
  render: () => <KeepMountedExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    // keepMounted: the popup exists in the DOM (hidden) before ever opening.
    await expect(body.getByRole('dialog', { hidden: true })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Toggle panel' }));
    await expect(await canvas.findByText('transition settled: open')).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect(await canvas.findByText('transition settled: closed')).toBeVisible();
    await expect(body.getByRole('dialog', { hidden: true })).toBeInTheDocument();
  },
};

/** Nested popovers just work: a child Root joins the parent's floating tree, and its portal automatically nests inside the parent's. If you use a custom portal `container`, set it only on the root Portal (#1930). */
export const NestedPopovers: Story = {
  render: () => (
    <Popover.Root>
      <Popover.Trigger className={styles.Button}>Share</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={styles.Popup}>
            <Popover.Title className={styles.Title}>Share</Popover.Title>
            <Popover.Description className={styles.Description}>
              Share this document with your team.
            </Popover.Description>
            <Popover.Root>
              <Popover.Trigger className={styles.Button}>Permissions</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner side="right" sideOffset={8}>
                  <Popover.Popup className={styles.Popup}>
                    <Popover.Arrow className={styles.Arrow} />
                    <Popover.Description className={styles.Description}>
                      Viewers can read, editors can write.
                    </Popover.Description>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  ),
};

function InitialFinalFocusExample() {
  const urlInputRef = React.useRef<HTMLInputElement>(null);
  const summaryRef = React.useRef<HTMLButtonElement>(null);
  return (
    <div className={styles.Stack}>
      <Popover.Root>
        <Popover.Trigger className={styles.Button}>Add bookmark</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup
              className={styles.Popup}
              initialFocus={urlInputRef}
              finalFocus={summaryRef}
            >
              <Popover.Title className={styles.Title}>Add bookmark</Popover.Title>
              <label className={styles.Label}>
                Name
                <input className={styles.Input} defaultValue="Base UI" />
              </label>
              <label className={styles.Label}>
                URL
                <input
                  ref={urlInputRef}
                  className={styles.Input}
                  defaultValue="https://base-ui.com"
                />
              </label>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <button type="button" ref={summaryRef} className={styles.Button}>
        Focus lands here on close
      </button>
    </div>
  );
}

/** `initialFocus` routes opening focus to a specific element (here the second input) and `finalFocus` overrides where focus returns on close — the preferred way to restore focus when the trigger itself may disappear (#4084). */
export const InitialFinalFocus: Story = {
  render: () => <InitialFinalFocusExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Add bookmark' }));
    const popup = await body.findByRole('dialog');

    // initialFocus skips the first input and lands on the URL field.
    const urlInput = within(popup).getByRole('textbox', { name: 'URL' });
    await waitFor(() => expect(urlInput).toHaveFocus());

    // finalFocus sends focus to the designated element instead of the trigger.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Focus lands here on close' })).toHaveFocus(),
    );
  },
};

const directionHandle = Popover.createHandle<string>();

/** A minimal `Popover.Viewport` setup: two triggers swap string payloads, and the old/new content slide according to `data-activation-direction`. Freeze the Positioner to `--positioner-width/height` during transitions so the popup cannot thrash. */
export const ViewportContentDirection: Story = {
  render: () => (
    <div className={styles.Container}>
      <Popover.Trigger
        className={styles.Button}
        handle={directionHandle}
        payload="This panel opened from the left trigger."
      >
        Left
      </Popover.Trigger>
      <Popover.Trigger
        className={styles.Button}
        handle={directionHandle}
        payload="This panel opened from the right trigger."
      >
        Right
      </Popover.Trigger>
      <Popover.Root handle={directionHandle}>
        {({ payload }) => (
          <Popover.Portal>
            <Popover.Positioner className={styles.AnimatedPositioner} sideOffset={8}>
              <Popover.Popup className={styles.AnimatedPopup}>
                <Popover.Viewport className={styles.Viewport}>
                  <Popover.Description className={styles.Description}>
                    {payload}
                  </Popover.Description>
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </div>
  ),
};

const arrowSides = ['top', 'right', 'bottom', 'left'] as const;

/** `Popover.Arrow` tracks the anchor on every side; its `data-side` attribute drives the rotation so one SVG-free CSS arrow serves all four placements. */
export const ArrowSides: Story = {
  render: () => (
    <div className={styles.ArrowGrid}>
      {arrowSides.map((side) => (
        <Popover.Root key={side} defaultOpen>
          <Popover.Trigger className={styles.Button}>{side}</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side={side} sideOffset={8}>
              <Popover.Popup className={styles.Popup}>
                <Popover.Arrow className={styles.Arrow} />
                <Popover.Title className={styles.Title}>Arrow demo</Popover.Title>
                <Popover.Description className={styles.Description}>
                  {`side="${side}"`}
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ))}
    </div>
  ),
};

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/popover)        */
/* ------------------------------------------------------------------ */

/**
 * Recreation of the play-queue popover in the museeks music player's title bar:
 * the Trigger composes a custom icon button via `render`, while the Positioner's
 * `anchor` points at the whole header wrapper so the panel aligns with the bar,
 * not the small button. Recomposed from martpie/museeks `Header.tsx` (MIT,
 * code-ok, research/d-real-world-usage/popover/ranked.json #2).
 */
export const RealWorldQueuePopover: Story = {
  tags: ['recreation'],
  render: () => <QueuePopoverExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Open the queue' });
    const header = trigger.parentElement as HTMLElement;

    await userEvent.click(trigger);
    const popup = await body.findByRole('dialog');
    await waitFor(() => expect(within(popup).getByText('Glass Harbor — Undertow')).toBeVisible());

    // The popup is end-aligned to the header wrapper, not to the icon button.
    await waitFor(() =>
      expect(
        Math.abs(popup.getBoundingClientRect().right - header.getBoundingClientRect().right),
      ).toBeLessThanOrEqual(1),
    );
  },
};

/**
 * Recreation of the link editor in the flashtype markdown editor's formatting
 * toolbar: `Toolbar.Button` composes `Popover.Trigger` via `render` inside a
 * roving-tabindex toolbar, and `initialFocus` routes focus straight to the URL
 * input, past the "Remove link" button (the same idea as Gutenberg's
 * deprioritized-initial-focus hook). Recomposed from opral/flashtype
 * `formatting-toolbar.tsx` (MIT, code-ok,
 * research/d-real-world-usage/popover/ranked.json #3).
 */
export const RealWorldLinkEditorToolbar: Story = {
  tags: ['recreation'],
  render: () => <LinkEditorToolbarExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const editLink = canvas.getByRole('button', { name: 'Edit link' });

    await userEvent.click(editLink);
    const popup = await body.findByRole('dialog');

    // initialFocus skips the "Remove link" button and focuses the URL input.
    const urlInput = within(popup).getByRole('textbox', { name: 'URL' });
    await waitFor(() => expect(urlInput).toHaveFocus());

    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, 'https://base-ui.com');
    await userEvent.click(within(popup).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(canvas.getByText('href: https://base-ui.com')).toBeVisible();
    // Focus returns to the composed toolbar trigger.
    await waitFor(() => expect(editLink).toHaveFocus());
  },
};

/**
 * Recreation of the @-mention file autocomplete in takopi (a personal AI
 * assistant): a triggerless, fully controlled popover anchored to the textarea
 * with `anchor={textareaRef}` and `side="top"`, plus `initialFocus={false}` and
 * `finalFocus={false}` so keyboard focus never leaves the textarea. Recomposed
 * from egoist/takopi `mention-popover.tsx` (Apache-2.0, code-ok,
 * research/d-real-world-usage/popover/ranked.json #5).
 */
export const RealWorldMentionAutocomplete: Story = {
  tags: ['recreation'],
  render: () => <MentionAutocompleteExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const textarea = canvas.getByRole('textbox', { name: 'Message' });

    await userEvent.click(textarea);
    await userEvent.type(textarea, 'Check @');
    const popup = await body.findByRole('dialog');

    // initialFocus={false}: focus never leaves the textarea while open.
    await expect(textarea).toHaveFocus();

    await userEvent.click(within(popup).getByRole('button', { name: 'README.md' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(textarea).toHaveValue('Check @README.md ');
    await expect(textarea).toHaveFocus();
  },
};

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
/* ------------------------------------------------------------------ */

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 5.5 4 8l4.5-6" />
    </svg>
  );
}
