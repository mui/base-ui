import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Dialog } from '@base-ui/react/dialog';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Menu } from '@base-ui/react/menu';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import styles from './dialog.module.css';

/**
 * Stories follow research/c-components/dialog (Tier 1): the eight kept docs demos,
 * one story per documented use case (the modal spectrum, dismissal reasons, focus
 * props, animation, nesting, handles/payloads, forms), the required full open→close
 * interaction story, and two real-world recreations picked from the top code-ok
 * entries in research/d-real-world-usage/dialog/ranked.json.
 *
 * Every story renders the complete `Portal > Backdrop > Popup` subtree and controls
 * visibility through the Root — conditionally rendering only the Popup breaks
 * unmount detection (#2186).
 */
const meta = {
  title: 'Overlays/Dialog',
  component: Dialog.Root,
  subcomponents: {
    'Dialog.Trigger': Dialog.Trigger,
    'Dialog.Portal': Dialog.Portal,
    'Dialog.Backdrop': Dialog.Backdrop,
    'Dialog.Popup': Dialog.Popup,
    'Dialog.Title': Dialog.Title,
    'Dialog.Description': Dialog.Description,
    'Dialog.Close': Dialog.Close,
  },
} satisfies Meta<typeof Dialog.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Kept docs demos + core behavior                                     */
/* ------------------------------------------------------------------ */

/** The docs hero demo: Trigger → Portal → Backdrop → Popup with Title, Description, and Close. Use as the starting point for any self-contained task or message layered over the whole page. */
export const Hero: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger className={styles.Button}>View notifications</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.Popup}>
          <div className={styles.Intro}>
            <Dialog.Title className={styles.Title}>Notifications</Dialog.Title>
            <Dialog.Description className={styles.Description}>
              You are all caught up. Good job!
            </Dialog.Description>
          </div>
          <div className={styles.Actions}>
            <Dialog.Close className={styles.Button}>Close</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
};

/** The full interaction contract in one story: open on click (popup portals to `document.body`), focus moves inside the popup, the trigger reflects state, and closing returns focus to the trigger. */
export const OpenCloseInteraction: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger className={styles.Button}>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.Popup}>
          <div className={styles.Intro}>
            <Dialog.Title className={styles.Title}>Session details</Dialog.Title>
            <Dialog.Description className={styles.Description}>
              A dialog interrupts the page on purpose — it owns focus until dismissed.
            </Dialog.Description>
          </div>
          <div className={styles.Actions}>
            <Dialog.Close className={styles.Button}>Close</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const doc = canvasElement.ownerDocument;
    const trigger = canvas.getByRole('button', { name: 'Open dialog' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');

    await userEvent.click(trigger);
    const dialog = await body.findByRole('dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('data-popup-open');
    // Focus moves to the first tabbable element inside the popup.
    await waitFor(() => expect(dialog).toContainElement(doc.activeElement as HTMLElement));

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    // Focus returns to the trigger after close.
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** Dialogs nest without extra APIs: the parent tracks descendants and exposes `[data-nested-dialog-open]` + `--nested-dialogs` so it can recede behind the child (docs `nested` demo). Esc closes only the topmost dialog. */
export const NestedDialogs: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger className={styles.Button}>View notifications</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.NestedPopup}>
          <div className={styles.Intro}>
            <Dialog.Title className={styles.Title}>Notifications</Dialog.Title>
            <Dialog.Description className={styles.Description}>
              You are all caught up. Good job!
            </Dialog.Description>
          </div>
          <div className={styles.Actions}>
            <Dialog.Root>
              <Dialog.Trigger className={styles.Button}>Customize</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Popup className={styles.NestedPopup}>
                  <div className={styles.Intro}>
                    <Dialog.Title className={styles.Title}>Customize notifications</Dialog.Title>
                    <Dialog.Description className={styles.Description}>
                      Review your settings here.
                    </Dialog.Description>
                  </div>
                  <div className={styles.EndActions}>
                    <Dialog.Close className={styles.Button}>Close</Dialog.Close>
                  </div>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'View notifications' }));
    const parent = await body.findByRole('dialog', { name: 'Notifications' });

    await userEvent.click(within(parent).getByRole('button', { name: 'Customize' }));
    const child = await body.findByRole('dialog', { name: 'Customize notifications' });
    await waitFor(() => expect(parent).toHaveAttribute('data-nested-dialog-open'));

    // Esc closes only the topmost (child) dialog.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(child).not.toBeInTheDocument());
    await expect(parent).toBeVisible();
    await waitFor(() => expect(parent).not.toHaveAttribute('data-nested-dialog-open'));
  },
};

function CloseConfirmationExample() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [textareaValue, setTextareaValue] = React.useState('');
  const titleId = React.useId();

  return (
    <Dialog.Root
      open={dialogOpen}
      onOpenChange={(open) => {
        // Show the close confirmation if there is text in the textarea.
        if (!open && textareaValue) {
          setConfirmationOpen(true);
        } else {
          setTextareaValue('');
          setDialogOpen(open);
        }
      }}
    >
      <Dialog.Trigger className={styles.Button}>Tweet</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.Popup}>
          <Dialog.Title id={titleId} className={styles.Title}>
            New tweet
          </Dialog.Title>
          <form
            className={styles.TextareaContainer}
            onSubmit={(event) => {
              event.preventDefault();
              setDialogOpen(false);
            }}
          >
            <textarea
              aria-labelledby={titleId}
              required
              className={styles.Textarea}
              placeholder="What’s on your mind?"
              value={textareaValue}
              onChange={(event) => setTextareaValue(event.target.value)}
            />
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Cancel</Dialog.Close>
              <button type="submit" className={styles.Button}>
                Tweet
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>

      {/* Confirmation dialog */}
      <AlertDialog.Root open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Popup className={styles.Popup}>
            <div className={styles.Intro}>
              <AlertDialog.Title className={styles.Title}>Discard tweet?</AlertDialog.Title>
              <AlertDialog.Description className={styles.Description}>
                Your tweet will be lost.
              </AlertDialog.Description>
            </div>
            <div className={styles.Actions}>
              <AlertDialog.Close className={styles.Button}>Go back</AlertDialog.Close>
              <button
                type="button"
                className={styles.Button}
                onClick={() => {
                  setConfirmationOpen(false);
                  setDialogOpen(false);
                  setTextareaValue('');
                }}
              >
                Discard
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </Dialog.Root>
  );
}

/** Guard unsaved input by branching in `onOpenChange`: a close request with text present opens a nested AlertDialog instead of closing (docs `close-confirmation` demo). */
export const CloseConfirmation: Story = {
  render: () => <CloseConfirmationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Tweet' }));
    const dialog = await body.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox'), 'Draft in progress');

    // Esc while there is text: the confirmation opens instead of closing.
    await userEvent.keyboard('{Escape}');
    const confirmation = await body.findByRole('alertdialog');
    // waitFor: popups are briefly at opacity 0 during their entrance transition.
    await waitFor(() => expect(confirmation).toBeVisible());
    await expect(dialog).toBeInTheDocument();

    await userEvent.click(within(confirmation).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(confirmation).not.toBeInTheDocument());
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

const CONTENT_SECTIONS = [
  {
    title: 'What a dialog is for',
    body: 'Use a dialog when the user must complete a focused task or read something important without navigating away.',
  },
  {
    title: 'Anatomy at a glance',
    body: 'Root, Trigger, Portal, Backdrop, Viewport, Popup, Title, Description, Close. Keep the title short and specific.',
  },
  {
    title: 'Opening and closing',
    body: 'Control it with the `open` and `onOpenChange` props, or let it manage state internally.',
  },
  {
    title: 'Keyboard and focus behavior',
    body: 'Focus moves inside the dialog when it opens. Tab and Shift+Tab loop within, and Esc requests close.',
  },
  {
    title: 'Accessible labeling',
    body: 'Set an explicit title and description using the Dialog.Title and Dialog.Description parts.',
  },
  {
    title: 'Backdrop and page scrolling',
    body: 'The backdrop separates layers while background content is inert. Keep copy clear and buttons obvious.',
  },
  {
    title: 'Portals and stacking',
    body: 'Dialogs render in a portal so they sit above the app content and avoid local z-index wars.',
  },
  {
    title: 'Close affordances',
    body: 'Always offer a visible close button. Touch screen-reader users need a targetable control to escape.',
  },
];

function OutsideScrollExample() {
  const popupRef = React.useRef<HTMLDivElement>(null);
  return (
    <Dialog.Root>
      <Dialog.Trigger className={styles.Button}>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Viewport className={styles.Viewport}>
          <ScrollArea.Root style={{ position: undefined }} className={styles.ScrollViewport}>
            <ScrollArea.Viewport className={styles.ScrollViewport}>
              <ScrollArea.Content className={styles.ScrollContent}>
                <Dialog.Popup ref={popupRef} className={styles.FlowPopup} initialFocus={popupRef}>
                  <div className={styles.PopupHeader}>
                    <Dialog.Title className={styles.Title}>Dialog</Dialog.Title>
                    <Dialog.Description className={styles.Description}>
                      This layout keeps an outer container scrollable while the dialog can extend
                      past the bottom edge.
                    </Dialog.Description>
                    <Dialog.Close className={styles.IconClose} aria-label="Close">
                      <XIcon />
                    </Dialog.Close>
                  </div>
                  {CONTENT_SECTIONS.map((item) => (
                    <section className={styles.Section} key={item.title}>
                      <h3 className={styles.SectionTitle}>{item.title}</h3>
                      <p className={styles.SectionBody}>{item.body}</p>
                    </section>
                  ))}
                </Dialog.Popup>
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className={styles.Scrollbar}>
              <ScrollArea.Thumb className={styles.ScrollbarThumb} />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The outside-scroll layout (docs `outside-scroll` demo): `Dialog.Viewport` wraps a Scroll Area so the page container scrolls and the popup may extend past the bottom edge ([#2808](https://github.com/mui/base-ui/pull/2808)). */
export const OutsideScroll: Story = {
  render: () => <OutsideScrollExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    // Portal smoke: the Viewport > ScrollArea > Popup tree mounts on document.body.
    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    const dialog = await body.findByRole('dialog');
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/** The inside-scroll layout (docs `inside-scroll` demo): the popup stays fully on screen and its body region scrolls via a nested Scroll Area. */
export const InsideScroll: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger className={styles.Button}>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Viewport className={styles.CenteredViewport}>
          <Dialog.Popup className={styles.InsidePopup}>
            <div className={styles.InsideHeader}>
              <Dialog.Title className={styles.Title}>Dialog</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                This layout keeps the popup fully on screen while allowing its content to scroll.
              </Dialog.Description>
            </div>
            <ScrollArea.Root className={styles.InsideBody}>
              <ScrollArea.Viewport className={styles.InsideBodyViewport}>
                <ScrollArea.Content className={styles.InsideBodyContent}>
                  {CONTENT_SECTIONS.map((item) => (
                    <section className={styles.Section} key={item.title}>
                      <h3 className={styles.SectionTitle}>{item.title}</h3>
                      <p className={styles.SectionBody}>{item.body}</p>
                    </section>
                  ))}
                </ScrollArea.Content>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar className={styles.Scrollbar}>
                <ScrollArea.Thumb className={styles.ScrollbarThumb} />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
            <div className={styles.InsideActions}>
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    const dialog = await body.findByRole('dialog');
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/** Elements that look detached (a floating close button) must stay inside `Dialog.Popup` for tab order and screen readers: the popup gets `pointer-events: none` and the inner surface restores `pointer-events: auto` (docs `uncontained` demo). */
export const UncontainedContent: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger className={styles.Button}>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Viewport className={styles.UncontainedViewport}>
          <Dialog.Popup className={styles.UncontainedPopup}>
            <Dialog.Close className={styles.FloatingClose} aria-label="Close">
              <XIcon />
            </Dialog.Close>
            <div className={styles.UncontainedSurface}>
              <div className={styles.Intro}>
                <Dialog.Title className={styles.Title}>Media preview</Dialog.Title>
                <Dialog.Description className={styles.Description}>
                  The close button floats above this surface but remains inside the popup subtree.
                </Dialog.Description>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    const dialog = await body.findByRole('dialog');
    // The visually detached close button is still inside the dialog for a11y.
    const close = within(dialog).getByRole('button', { name: 'Close' });
    await userEvent.click(close);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Detached triggers & handles                                         */
/* ------------------------------------------------------------------ */

const notificationsDialog = Dialog.createHandle();

/** `Dialog.createHandle()` associates a `Dialog.Trigger` rendered anywhere in the app with its `Dialog.Root` — no shared React state needed (docs `detached-triggers-simple` demo, [#2974](https://github.com/mui/base-ui/pull/2974)). */
export const DetachedTriggerSimple: Story = {
  render: () => (
    <React.Fragment>
      <Dialog.Trigger className={styles.Button} handle={notificationsDialog}>
        View notifications
      </Dialog.Trigger>

      <Dialog.Root handle={notificationsDialog}>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.Popup}>
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Notifications</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                You are all caught up. Good job!
              </Dialog.Description>
            </div>
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </React.Fragment>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'View notifications' }));
    const dialog = await body.findByRole('dialog');
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() =>
      expect(within(dialog).getByText('You are all caught up. Good job!')).toBeVisible(),
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

const detachedDialog = Dialog.createHandle<number>();

function DetachedTriggersControlledExample() {
  const [open, setOpen] = React.useState(false);
  const [triggerId, setTriggerId] = React.useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setOpen(isOpen);
    setTriggerId(eventDetails.trigger?.id ?? null);
  };

  return (
    <React.Fragment>
      <div className={styles.Container}>
        <Dialog.Trigger
          className={styles.Button}
          handle={detachedDialog}
          id="detached-trigger-1"
          payload={1}
        >
          Open 1
        </Dialog.Trigger>
        <Dialog.Trigger
          className={styles.Button}
          handle={detachedDialog}
          id="detached-trigger-2"
          payload={2}
        >
          Open 2
        </Dialog.Trigger>
        <button
          className={styles.Button}
          type="button"
          onClick={() => {
            setTriggerId('detached-trigger-2');
            setOpen(true);
          }}
        >
          Open programmatically
        </button>
      </div>

      <Dialog.Root
        handle={detachedDialog}
        open={open}
        onOpenChange={handleOpenChange}
        triggerId={triggerId}
      >
        {({ payload }) => (
          <Dialog.Portal>
            <Dialog.Backdrop className={styles.Backdrop} />
            <Dialog.Popup className={styles.Popup}>
              {payload !== undefined && (
                <Dialog.Title className={styles.Title}>Dialog {payload}</Dialog.Title>
              )}
              <div className={styles.Actions}>
                <Dialog.Close className={styles.Button}>Close</Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </React.Fragment>
  );
}

/** Controlled mode with multiple detached triggers: manage `open` + `triggerId` (read `eventDetails.trigger` — there is no separate `onTriggerIdChange`), and each trigger's `payload` reaches the Root's render-prop children (docs `detached-triggers-controlled` demo). */
export const DetachedTriggersControlled: Story = {
  render: () => <DetachedTriggersControlledExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger1 = canvas.getByRole('button', { name: 'Open 1' });
    const trigger2 = canvas.getByRole('button', { name: 'Open 2' });

    await userEvent.click(trigger1);
    const dialog = await body.findByRole('dialog', { name: 'Dialog 1' });
    // ARIA state is synchronized on the active trigger only.
    await expect(trigger1).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger2).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());

    await userEvent.click(canvas.getByRole('button', { name: 'Open programmatically' }));
    const dialog2 = await body.findByRole('dialog', { name: 'Dialog 2' });
    await waitFor(() => expect(trigger2).toHaveAttribute('aria-expanded', 'true'));
    await userEvent.click(within(dialog2).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog2).not.toBeInTheDocument());
  },
};

interface ReleasePayload {
  name: string;
  version: string;
}

const releaseDialog = Dialog.createHandle<ReleasePayload>();

function HandleImperativePayloadExample() {
  return (
    <div className={styles.Stack}>
      <div className={styles.Row}>
        <Dialog.Trigger
          className={styles.Button}
          handle={releaseDialog}
          payload={{ name: 'Aurora', version: '1.2.0' }}
        >
          Aurora details
        </Dialog.Trigger>
        <Dialog.Trigger
          className={styles.Button}
          handle={releaseDialog}
          payload={{ name: 'Borealis', version: '2.0.0-beta.1' }}
        >
          Borealis details
        </Dialog.Trigger>
        <button
          type="button"
          className={styles.Button}
          onClick={() => releaseDialog.openWithPayload({ name: 'Cascade', version: '0.9.4' })}
        >
          Open imperatively (Cascade)
        </button>
      </div>

      <Dialog.Root handle={releaseDialog}>
        {({ payload }) => (
          <Dialog.Portal>
            <Dialog.Backdrop className={styles.Backdrop} />
            <Dialog.Popup className={styles.Popup}>
              <div className={styles.Intro}>
                <Dialog.Title className={styles.Title}>
                  {payload ? `${payload.name} release` : 'Release'}
                </Dialog.Title>
                <Dialog.Description className={styles.Description}>
                  {payload ? `Version ${payload.version}` : 'No payload provided.'}
                </Dialog.Description>
              </div>
              <div className={styles.Actions}>
                <Dialog.Close className={styles.Button}>Close</Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </div>
  );
}

/** `createHandle<Payload>()` types per-trigger payloads and adds imperative `open`/`openWithPayload`/`close` — Base UI's answer to `dialogManager.confirm()` requests ([#2802](https://github.com/mui/base-ui/issues/2802) was declined in favor of this). */
export const HandleImperativePayload: Story = {
  render: () => <HandleImperativePayloadExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Aurora details' }));
    const dialog = await body.findByRole('dialog', { name: 'Aurora release' });
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() => expect(within(dialog).getByText('Version 1.2.0')).toBeVisible());
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());

    await userEvent.click(canvas.getByRole('button', { name: 'Open imperatively (Cascade)' }));
    const dialog2 = await body.findByRole('dialog', { name: 'Cascade release' });
    await waitFor(() => expect(within(dialog2).getByText('Version 0.9.4')).toBeVisible());
    await userEvent.click(within(dialog2).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog2).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Modality spectrum                                                   */
/* ------------------------------------------------------------------ */

function ModalVsNonModalExample() {
  const [outsideClicks, setOutsideClicks] = React.useState(0);
  return (
    <div className={styles.Stack}>
      <div className={styles.Row}>
        <Dialog.Root>
          <Dialog.Trigger className={styles.Button}>Open modal</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className={styles.Backdrop} data-testid="modal-backdrop" />
            <Dialog.Popup className={styles.Popup}>
              <div className={styles.Intro}>
                <Dialog.Title className={styles.Title}>Modal dialog</Dialog.Title>
                <Dialog.Description className={styles.Description}>
                  Focus is trapped, page scroll is locked, and outside pointer interactions are
                  blocked by an invisible internal backdrop.
                </Dialog.Description>
              </div>
              <div className={styles.Actions}>
                <Dialog.Close className={styles.Button}>Close</Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>

        <Dialog.Root modal={false}>
          <Dialog.Trigger className={styles.Button}>Open non-modal</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup className={styles.PanelPopup}>
              <div className={styles.Intro}>
                <Dialog.Title className={styles.Title}>Non-modal panel</Dialog.Title>
                <Dialog.Description className={styles.Description}>
                  The rest of the page stays scrollable and interactive.
                </Dialog.Description>
              </div>
              <div className={styles.Actions}>
                <Dialog.Close className={styles.Button}>Close</Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>

        <button
          type="button"
          className={styles.Button}
          onClick={() => setOutsideClicks((count) => count + 1)}
        >
          Outside area
        </button>
      </div>
      <output className={styles.Output}>outside clicks: {outsideClicks}</output>
    </div>
  );
}

/** The `modal` prop decides pointer/scroll/focus modality ([#623](https://github.com/mui/base-ui/issues/623)): the default `true` blocks the page behind an invisible internal backdrop, while `modal={false}` keeps it fully interactive. */
export const ModalVsNonModal: Story = {
  render: () => <ModalVsNonModalExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const doc = canvasElement.ownerDocument;
    const outside = canvas.getByRole('button', { name: 'Outside area' });
    const outsideRect = outside.getBoundingClientRect();
    const outsideX = outsideRect.left + outsideRect.width / 2;
    const outsideY = outsideRect.top + outsideRect.height / 2;

    // Modal: real hit-testing shows the outside button is covered by the backdrop.
    await userEvent.click(canvas.getByRole('button', { name: 'Open modal' }));
    const modalDialog = await body.findByRole('dialog');
    await waitFor(() => expect(doc.elementFromPoint(outsideX, outsideY)).not.toBe(outside));
    await userEvent.click(body.getByTestId('modal-backdrop'));
    await waitFor(() => expect(modalDialog).not.toBeInTheDocument());

    // Non-modal: the outside button is hittable; clicking it works AND closes the
    // dialog (outside-press dismissal stays on by default).
    await userEvent.click(canvas.getByRole('button', { name: 'Open non-modal' }));
    const panel = await body.findByRole('dialog');
    await waitFor(() => expect(doc.elementFromPoint(outsideX, outsideY)).toBe(outside));
    await userEvent.click(outside);
    await expect(canvas.getByText('outside clicks: 1')).toBeVisible();
    await waitFor(() => expect(panel).not.toBeInTheDocument());
  },
};

/** `modal="trap-focus"` traps only focus: Tab loops inside the popup while page scroll and outside pointer interactions remain enabled ([#1571](https://github.com/mui/base-ui/pull/1571)). */
export const TrapFocusMode: Story = {
  render: () => (
    <div className={styles.Row}>
      <Dialog.Root modal="trap-focus">
        <Dialog.Trigger className={styles.Button}>Open inspector</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Popup className={styles.PanelPopup}>
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Layers inspector</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                Keyboard focus stays inside, but the page is not blocked.
              </Dialog.Description>
            </div>
            <div className={styles.Actions}>
              <button type="button" className={styles.Button}>
                Re-scan
              </button>
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <button type="button" className={styles.Button}>
        Outside area
      </button>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const doc = canvasElement.ownerDocument;
    const outside = canvas.getByRole('button', { name: 'Outside area' });

    await userEvent.click(canvas.getByRole('button', { name: 'Open inspector' }));
    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toContainElement(doc.activeElement as HTMLElement));

    // Two tabbable elements inside; three Tab presses prove the focus loop.
    // waitFor: tabbing momentarily lands on a hidden focus guard before the
    // trap redirects focus back inside the popup.
    await userEvent.tab();
    await waitFor(() => expect(dialog).toContainElement(doc.activeElement as HTMLElement));
    await userEvent.tab();
    await waitFor(() => expect(dialog).toContainElement(doc.activeElement as HTMLElement));
    await userEvent.tab();
    await waitFor(() => expect(dialog).toContainElement(doc.activeElement as HTMLElement));

    // Pointer interactions outside are NOT blocked (no internal backdrop).
    const rect = outside.getBoundingClientRect();
    await waitFor(() =>
      expect(doc.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)).toBe(
        outside,
      ),
    );
  },
};

/* ------------------------------------------------------------------ */
/* State, dismissal, and event details                                 */
/* ------------------------------------------------------------------ */

function ControlledExample() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={styles.Stack}>
      <div className={styles.Row}>
        <button type="button" className={styles.Button} onClick={() => setOpen(true)}>
          Open from outside
        </button>
        <button type="button" className={styles.Button} onClick={() => setOpen(false)}>
          Close from outside
        </button>
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.Popup}>
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Controlled dialog</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                External state owns this dialog — no Trigger required.
              </Dialog.Description>
            </div>
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <output className={styles.Output}>state: {open ? 'open' : 'closed'}</output>
    </div>
  );
}

/** Use `open` + `onOpenChange` when external state (a route, a store, another widget) drives the dialog. Built-in behaviors like Esc still request changes through `onOpenChange`. */
export const Controlled: Story = {
  render: () => <ControlledExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open from outside' }));
    const dialog = await body.findByRole('dialog');
    await expect(canvas.getByText('state: open')).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(canvas.getByText('state: closed')).toBeVisible();
  },
};

/** `disablePointerDismissal` keeps the dialog open on outside press — use it for forms where a stray backdrop click would destroy input; Esc and the Close button still work ([#3190](https://github.com/mui/base-ui/pull/3190) renamed it from `dismissible`). */
export const DisablePointerDismissal: Story = {
  render: () => (
    <Dialog.Root disablePointerDismissal>
      <Dialog.Trigger className={styles.Button}>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} data-testid="backdrop" />
        <Dialog.Popup className={styles.Popup}>
          <div className={styles.Intro}>
            <Dialog.Title className={styles.Title}>Careful edits</Dialog.Title>
            <Dialog.Description className={styles.Description}>
              Clicking outside does not close this dialog. Use the button below.
            </Dialog.Description>
          </div>
          <div className={styles.Actions}>
            <Dialog.Close className={styles.Button}>Close</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    const dialog = await body.findByRole('dialog');

    // Outside press is ignored: the dialog stays open (waitFor rides out the
    // entrance transition, where the popup is briefly at opacity 0).
    await userEvent.click(body.getByTestId('backdrop'));
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveAttribute('data-open');

    // Explicit close still works.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

function ChangeReasonExample() {
  const [open, setOpen] = React.useState(false);
  const [log, setLog] = React.useState<string[]>([]);
  return (
    <div className={styles.Stack}>
      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setLog((entries) => [...entries, eventDetails.reason]);
          }
        }}
      >
        <Dialog.Trigger className={styles.Button}>Open dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} data-testid="reason-backdrop" />
          <Dialog.Popup className={styles.Popup}>
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Reason inspector</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                Close me with Esc, the backdrop, or the button — each reports its reason.
              </Dialog.Description>
            </div>
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <output className={styles.Output}>
        close reasons: {log.length > 0 ? log.join(', ') : 'none yet'}
      </output>
    </div>
  );
}

/** Every `onOpenChange` call carries `eventDetails.reason` (`trigger-press`, `escape-key`, `outside-press`, `close-press`, `focus-out`, …) — branch on it instead of guessing from the event object. */
export const ChangeReasonInspector: Story = {
  render: () => <ChangeReasonExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Open dialog' });

    await userEvent.click(trigger);
    await body.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());

    await userEvent.click(trigger);
    await body.findByRole('dialog');
    await userEvent.click(body.getByTestId('reason-backdrop'));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());

    await userEvent.click(trigger);
    const dialog = await body.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());

    await expect(
      canvas.getByText('close reasons: escape-key, outside-press, close-press'),
    ).toBeVisible();
  },
};

function CancelCloseExample() {
  const [canceled, setCanceled] = React.useState(0);
  return (
    <div className={styles.Stack}>
      <Dialog.Root
        onOpenChange={(nextOpen, eventDetails) => {
          // Veto light dismissal while staying uncontrolled.
          if (!nextOpen && eventDetails.reason === 'outside-press') {
            eventDetails.cancel();
            setCanceled((count) => count + 1);
          }
        }}
      >
        <Dialog.Trigger className={styles.Button}>Open dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} data-testid="cancel-backdrop" />
          <Dialog.Popup className={styles.Popup}>
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Sticky dialog</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                Outside presses are vetoed with eventDetails.cancel().
              </Dialog.Description>
            </div>
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <output className={styles.Output}>canceled closes: {canceled}</output>
    </div>
  );
}

/** `eventDetails.cancel()` vetoes a single change request without taking over the state — a lighter tool than `disablePointerDismissal` when only some reasons should be blocked. */
export const CancelClose: Story = {
  render: () => <CancelCloseExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    const dialog = await body.findByRole('dialog');

    await userEvent.click(body.getByTestId('cancel-backdrop'));
    await expect(await canvas.findByText('canceled closes: 1')).toBeVisible();
    // The canceled request left the dialog open.
    await waitFor(() => expect(dialog).toBeVisible());

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Focus management                                                    */
/* ------------------------------------------------------------------ */

function InitialAndFinalFocusExample() {
  const emailRef = React.useRef<HTMLInputElement>(null);
  const auditRef = React.useRef<HTMLButtonElement>(null);
  const nameId = React.useId();
  const emailId = React.useId();
  return (
    <div className={styles.Stack}>
      <Dialog.Root>
        <Dialog.Trigger className={styles.Button}>Invite teammate</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.Popup} initialFocus={emailRef} finalFocus={auditRef}>
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Invite teammate</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                Email gets initial focus; closing sends focus to the audit-log button.
              </Dialog.Description>
            </div>
            <div className={styles.Form}>
              <div className={styles.Field}>
                <label className={styles.Label} htmlFor={nameId}>
                  Name
                </label>
                <input id={nameId} className={styles.Input} />
              </div>
              <div className={styles.Field}>
                <label className={styles.Label} htmlFor={emailId}>
                  Email
                </label>
                <input id={emailId} ref={emailRef} type="email" className={styles.Input} />
              </div>
            </div>
            <div className={styles.EndActions}>
              <Dialog.Close className={styles.Button}>Cancel</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <button type="button" ref={auditRef} className={styles.Button}>
        View audit log
      </button>
    </div>
  );
}

/** `initialFocus` / `finalFocus` on the Popup steer where focus lands on open and close; both also accept functions of the interaction type (`mouse`/`touch`/`keyboard`) ([#2536](https://github.com/mui/base-ui/pull/2536), [#2599](https://github.com/mui/base-ui/pull/2599)). */
export const InitialAndFinalFocus: Story = {
  render: () => <InitialAndFinalFocusExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Invite teammate' }));
    const dialog = await body.findByRole('dialog');
    // initialFocus points at the email input, not the first tabbable.
    const email = within(dialog).getByLabelText('Email');
    await waitFor(() => expect(email).toHaveFocus());

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    // finalFocus redirects close-focus away from the trigger.
    await waitFor(() => expect(canvas.getByRole('button', { name: 'View audit log' })).toHaveFocus());
  },
};

/* ------------------------------------------------------------------ */
/* Forms & composition                                                 */
/* ------------------------------------------------------------------ */

function FormInDialogExample() {
  const [open, setOpen] = React.useState(false);
  const [savedName, setSavedName] = React.useState<string | null>(null);
  return (
    <div className={styles.Stack}>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className={styles.Button}>Rename project</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.Popup}>
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Rename project</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                The dialog closes only when the form submits successfully.
              </Dialog.Description>
            </div>
            <Form
              className={styles.Form}
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                setSavedName(String(data.get('project')));
                setOpen(false);
              }}
            >
              <Field.Root name="project" className={styles.Field}>
                <Field.Label className={styles.Label}>Project name</Field.Label>
                <Field.Control required placeholder="Untitled" className={styles.Input} />
              </Field.Root>
              <div className={styles.EndActions}>
                <Dialog.Close className={styles.GhostButton}>Cancel</Dialog.Close>
                <button type="submit" className={styles.Button}>
                  Save
                </button>
              </div>
            </Form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      {savedName !== null ? <output className={styles.Output}>Saved: {savedName}</output> : null}
    </div>
  );
}

/** The forms-in-dialog recipe (docs "Controlled dialog" example): control the dialog, submit the `Form`, and close from the submit handler so validation failures keep it open. */
export const FormInDialog: Story = {
  render: () => <FormInDialogExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Rename project' }));
    const dialog = await body.findByRole('dialog');

    await userEvent.type(within(dialog).getByLabelText('Project name'), 'Base UI docs');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(await canvas.findByText('Saved: Base UI docs')).toBeVisible();
  },
};

function OpenFromMenuExample() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  return (
    <React.Fragment>
      <Menu.Root>
        <Menu.Trigger className={styles.Button}>Project options</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={8}>
            <Menu.Popup className={styles.MenuPopup}>
              {/* Open the dialog when the menu item is clicked */}
              <Menu.Item className={styles.MenuItem} onClick={() => setDialogOpen(true)}>
                Rename project…
              </Menu.Item>
              <Menu.Item className={styles.MenuItem}>Duplicate</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.Popup}>
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Rename project</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                Opened from a menu item via controlled state.
              </Dialog.Description>
            </div>
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </React.Fragment>
  );
}

/** The docs "Open from a menu" pattern: control the dialog and set state in `Menu.Item`'s `onClick` — the menu closes itself, then the dialog opens. */
export const OpenFromMenu: Story = {
  render: () => <OpenFromMenuExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Project options' }));
    const menu = await body.findByRole('menu');
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Rename project…' }));

    const dialog = await body.findByRole('dialog');
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() => expect(dialog).toBeVisible());
    await waitFor(() => expect(menu).not.toBeInTheDocument());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

function NestedAlertDialogGuardExample() {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={styles.Button}>Manage project</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={styles.NestedPopup}>
          <div className={styles.Intro}>
            <Dialog.Title className={styles.Title}>Manage project</Dialog.Title>
            <Dialog.Description className={styles.Description}>
              Destructive actions are guarded by an alert dialog that requires a response.
            </Dialog.Description>
          </div>
          <div className={styles.EndActions}>
            <Dialog.Close className={styles.GhostButton}>Close</Dialog.Close>
            <AlertDialog.Root>
              <AlertDialog.Trigger className={styles.Button}>Delete project…</AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Popup className={styles.Popup}>
                  <div className={styles.Intro}>
                    <AlertDialog.Title className={styles.Title}>Delete project?</AlertDialog.Title>
                    <AlertDialog.Description className={styles.Description}>
                      This cannot be undone. The alert dialog cannot be dismissed by clicking
                      outside.
                    </AlertDialog.Description>
                  </div>
                  <div className={styles.EndActions}>
                    <AlertDialog.Close className={styles.GhostButton}>Cancel</AlertDialog.Close>
                    <button type="button" className={styles.Button} onClick={() => setOpen(false)}>
                      Delete
                    </button>
                  </div>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Cross-type nesting: an AlertDialog inside a Dialog still counts toward the parent's `[data-nested-dialog-open]` — use AlertDialog for the destructive confirmation because it forces `modal` and disables pointer dismissal. */
export const NestedAlertDialogGuard: Story = {
  render: () => <NestedAlertDialogGuardExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Manage project' }));
    const parent = await body.findByRole('dialog', { name: 'Manage project' });

    await userEvent.click(within(parent).getByRole('button', { name: 'Delete project…' }));
    const alert = await body.findByRole('alertdialog');
    // Cross-type nesting still marks the parent dialog.
    await waitFor(() => expect(parent).toHaveAttribute('data-nested-dialog-open'));

    await userEvent.click(within(alert).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(alert).not.toBeInTheDocument());
    await expect(parent).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Animation & mounting                                                */
/* ------------------------------------------------------------------ */

function ExitAnimationExample() {
  const [settled, setSettled] = React.useState('none yet');
  return (
    <div className={styles.Stack}>
      <Dialog.Root onOpenChangeComplete={(open) => setSettled(open ? 'open' : 'closed')}>
        <Dialog.Trigger className={styles.Button}>Open dialog</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.AnimatedBackdrop} />
          <Dialog.Popup className={styles.AnimatedPopup}>
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Animated dialog</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                CSS transitions drive both entry and exit via data attributes.
              </Dialog.Description>
            </div>
            <div className={styles.Actions}>
              <Dialog.Close className={styles.Button}>Close</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <output className={styles.Output}>animation settled: {settled}</output>
    </div>
  );
}

/** Animate with plain CSS transitions on `[data-starting-style]`/`[data-ending-style]`; the popup stays mounted until the exit transition finishes, then `onOpenChangeComplete(false)` fires. */
export const ExitAnimation: Story = {
  render: () => <ExitAnimationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    const dialog = await body.findByRole('dialog');
    await expect(await canvas.findByText('animation settled: open')).toBeVisible();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    // Mid-transition the popup is still mounted, marked with data-ending-style.
    await waitFor(() => expect(dialog).toHaveAttribute('data-ending-style'));
    await expect(await canvas.findByText('animation settled: closed')).toBeVisible();
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/**
 * `keepMounted` on the Portal keeps the popup in the DOM while closed (hidden) — the
 * hook for JS animation libraries and expensive subtrees. The story plan's Motion
 * variant is adapted to CSS here because `motion` is not a dependency of this
 * Storybook; see the Motion recipe in the animation handbook for the render-prop version.
 */
export const KeepMounted: Story = {
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger className={styles.Button}>Open dialog</Dialog.Trigger>
      <Dialog.Portal keepMounted>
        <Dialog.Backdrop className={styles.AnimatedBackdrop} />
        <Dialog.Popup className={styles.AnimatedPopup} data-testid="keep-mounted-popup">
          <div className={styles.Intro}>
            <Dialog.Title className={styles.Title}>Persistent subtree</Dialog.Title>
            <Dialog.Description className={styles.Description}>
              This popup stays in the DOM while closed.
            </Dialog.Description>
          </div>
          <div className={styles.Actions}>
            <Dialog.Close className={styles.Button}>Close</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    // Closed but mounted: the popup is already in the DOM, hidden.
    const popup = body.getByTestId('keep-mounted-popup');
    await expect(popup).toBeInTheDocument();
    await expect(popup).not.toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    await waitFor(() => expect(popup).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(popup).not.toBeVisible());
    await expect(popup).toBeInTheDocument();
  },
};

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/dialog)         */
/* ------------------------------------------------------------------ */

function SidePanelExample() {
  const [open, setOpen] = React.useState(false);
  const [saved, setSaved] = React.useState<string | null>(null);
  const nameId = React.useId();
  return (
    <div className={styles.Stack}>
      {/* No Dialog.Trigger: app state opens the panel, oxide-console style. */}
      <button type="button" className={styles.Button} onClick={() => setOpen(true)}>
        Edit instance
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.Backdrop} />
          <Dialog.Popup className={styles.SheetPopup}>
            <div className={styles.Intro}>
              <Dialog.Title className={styles.Title}>Edit instance</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                db-primary · us-east-1
              </Dialog.Description>
            </div>
            <form
              className={styles.SheetForm}
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                setSaved(String(data.get('name')));
                setOpen(false);
              }}
            >
              <div className={styles.Field}>
                <label className={styles.Label} htmlFor={nameId}>
                  Instance name
                </label>
                <input
                  id={nameId}
                  name="name"
                  defaultValue="db-primary"
                  className={styles.Input}
                />
              </div>
              <div className={styles.SheetFooter}>
                <Dialog.Close className={styles.GhostButton}>Cancel</Dialog.Close>
                <button type="submit" className={styles.Button}>
                  Save changes
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      {saved !== null ? <output className={styles.Output}>Saved: {saved}</output> : null}
    </div>
  );
}

/**
 * Recreation of an edge-docked side panel: a fully controlled Dialog with no Trigger
 * (routes/app state open it), positioned against the viewport edge with a slide
 * transition and a form + footer actions. Recomposed from oxidecomputer/console
 * `SideModal.tsx`/`Modal.tsx` (MPL-2.0, code-ok,
 * research/d-real-world-usage/dialog/ranked.json #4).
 */
export const RecreationSidePanel: Story = {
  tags: ['recreation'],
  render: () => <SidePanelExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Edit instance' }));
    const panel = await body.findByRole('dialog');

    const nameInput = within(panel).getByLabelText('Instance name');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'db-replica');
    await userEvent.click(within(panel).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(panel).not.toBeInTheDocument());
    await expect(await canvas.findByText('Saved: db-replica')).toBeVisible();
  },
};

/**
 * Wrapper layer in the shadcn/ui style: one component hides the
 * `Portal > Backdrop > Popup` plumbing and always renders a corner X close button.
 */
function AppDialogContent({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className={styles.Backdrop} />
      <Dialog.Popup className={styles.Popup}>
        <div className={styles.Intro}>
          <Dialog.Title className={styles.Title}>{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className={styles.Description}>{description}</Dialog.Description>
          ) : null}
        </div>
        {children}
        <Dialog.Close className={styles.CornerClose} aria-label="Close">
          <XIcon />
        </Dialog.Close>
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

/**
 * Recreation of the canonical copy-paste wrapper: a `DialogContent`-style component
 * (Popup→Content, Backdrop→Overlay vocabulary) used here as a settings dialog with
 * sections. Recomposed from shadcn-ui/ui `apps/v4/registry/bases/base/ui/dialog.tsx`
 * (MIT, code-ok, research/d-real-world-usage/dialog/ranked.json #1).
 */
export const RecreationSettingsModal: Story = {
  tags: ['recreation'],
  render: () => (
    <Dialog.Root>
      <Dialog.Trigger className={styles.Button}>Open settings</Dialog.Trigger>
      <AppDialogContent title="Workspace settings" description="Changes apply immediately.">
        <div className={styles.Section}>
          <h3 className={styles.SectionTitle}>Appearance</h3>
          <p className={styles.SectionBody}>Theme, density, and accent color.</p>
        </div>
        <div className={styles.Section}>
          <h3 className={styles.SectionTitle}>Notifications</h3>
          <p className={styles.SectionBody}>Mentions, replies, and weekly digests.</p>
        </div>
        <div className={styles.EndActions}>
          <Dialog.Close className={styles.Button}>Done</Dialog.Close>
        </div>
      </AppDialogContent>
    </Dialog.Root>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open settings' }));
    const dialog = await body.findByRole('dialog', { name: 'Workspace settings' });
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() => expect(within(dialog).getByText('Appearance')).toBeVisible());

    // The wrapper's corner X close button.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

/* ------------------------------------------------------------------ */
/* Icons (inlined — stories must not import docs assets)               */
/* ------------------------------------------------------------------ */

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 2.5 11 11m-11 0 11-11" />
    </svg>
  );
}
