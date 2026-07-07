import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import styles from './alert-dialog.module.css';

/**
 * Stories follow research/c-components/alert-dialog (Tier 2): AlertDialog is
 * Dialog with three axes hard-coded (`role="alertdialog"`, `modal` forced
 * `true`, `disablePointerDismissal` forced `true`) — the `modal` and
 * `disablePointerDismissal` props are `Omit`ted from its type entirely, not
 * merely defaulted. Floor coverage: the destructive-confirm flow (the
 * canonical reason AlertDialog exists), the no-outside-press contract
 * (Esc still closes it — only outside-press is blocked), and a
 * required-acknowledgment form composition.
 *
 * Every story renders the complete `Portal > Backdrop > Popup` subtree,
 * identical to Dialog (AlertDialog re-exports Dialog's parts verbatim).
 */
const meta = {
  title: 'Overlays/Alert Dialog',
  component: AlertDialog.Root,
  subcomponents: {
    'AlertDialog.Trigger': AlertDialog.Trigger,
    'AlertDialog.Portal': AlertDialog.Portal,
    'AlertDialog.Backdrop': AlertDialog.Backdrop,
    'AlertDialog.Popup': AlertDialog.Popup,
    'AlertDialog.Title': AlertDialog.Title,
    'AlertDialog.Description': AlertDialog.Description,
    'AlertDialog.Close': AlertDialog.Close,
  },
} satisfies Meta<typeof AlertDialog.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Hero: the destructive-confirm flow                                  */
/* ------------------------------------------------------------------ */

function HeroExample() {
  const [status, setStatus] = React.useState('idle');
  return (
    <div className={styles.Stack}>
      <AlertDialog.Root>
        <AlertDialog.Trigger className={styles.Button}>Discard draft</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={styles.Backdrop} />
          <AlertDialog.Popup className={styles.Popup}>
            <div className={styles.Intro}>
              <AlertDialog.Title className={styles.Title}>Discard draft?</AlertDialog.Title>
              <AlertDialog.Description className={styles.Description}>
                You can&apos;t undo this action.
              </AlertDialog.Description>
            </div>
            <div className={styles.Actions}>
              <AlertDialog.Close className={styles.Button}>Cancel</AlertDialog.Close>
              <AlertDialog.Close
                data-color="red"
                className={styles.Button}
                onClick={() => setStatus('discarded')}
              >
                Discard
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <output className={styles.Output}>status: {status}</output>
    </div>
  );
}

/**
 * The docs hero demo, made interactive: "Discard draft?" is the canonical
 * reason AlertDialog exists — a decision the user cannot escape by clicking
 * outside. `role="alertdialog"` and `aria-labelledby`/`aria-describedby` are
 * wired automatically from Title/Description.
 */
export const Hero: Story = {
  render: () => <HeroExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Discard draft' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');

    await userEvent.click(trigger);
    const dialog = await body.findByRole('alertdialog');
    await expect(dialog).toHaveAttribute('aria-labelledby');
    await expect(dialog).toHaveAttribute('aria-describedby');
    // waitFor: popups are briefly at opacity 0 during their entrance transition.
    await waitFor(() => expect(dialog).toBeVisible());

    await userEvent.click(within(dialog).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(canvas.getByText('status: discarded')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* No-outside-press dismissal (hard-coded contract)                    */
/* ------------------------------------------------------------------ */

function NoOutsidePressExample() {
  const [log, setLog] = React.useState<string[]>([]);
  return (
    <div className={styles.Stack}>
      <AlertDialog.Root
        onOpenChange={(open, eventDetails) => {
          if (!open) {
            setLog((entries) => [...entries, `closed via ${eventDetails.reason}`]);
          }
        }}
      >
        <AlertDialog.Trigger className={styles.Button}>Delete project</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={styles.Backdrop} data-testid="backdrop" />
          <AlertDialog.Popup className={styles.Popup}>
            <div className={styles.Intro}>
              <AlertDialog.Title className={styles.Title}>Delete project?</AlertDialog.Title>
              <AlertDialog.Description className={styles.Description}>
                Clicking outside does not close this dialog — only an explicit choice or Esc does.
              </AlertDialog.Description>
            </div>
            <div className={styles.Actions}>
              <AlertDialog.Close className={styles.Button}>Cancel</AlertDialog.Close>
              <AlertDialog.Close data-color="red" className={styles.Button}>
                Delete
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <output className={styles.Output}>
        {log.length > 0 ? log.join(', ') : 'no dismissal attempt yet'}
      </output>
    </div>
  );
}

/**
 * `disablePointerDismissal` is permanently `true` for AlertDialog — it cannot
 * be overridden, since the prop is `Omit`ted from the type entirely. Clicking
 * the backdrop is a documented no-op; only `AlertDialog.Close` or Esc leave
 * the dialog (Esc is deliberately *not* part of the lockdown — see
 * `useDialogRoot.ts`'s `escapeKey: isTopmost` gate, which has no
 * `disablePointerDismissal` check).
 */
export const NoOutsidePressDismissal: Story = {
  render: () => <NoOutsidePressExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Delete project' }));
    const dialog = await body.findByRole('alertdialog');
    // waitFor: the popup is briefly at opacity 0 during its entrance transition.
    await waitFor(() => expect(dialog).toBeVisible());

    // Outside press via the backdrop is ignored — the hard-coded contract.
    await userEvent.click(body.getByTestId('backdrop'));
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveAttribute('data-open');
    await expect(canvas.getByText('no dismissal attempt yet')).toBeVisible();

    // Esc is NOT blocked by the pointer-dismissal lockdown — it still closes.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(await canvas.findByText('closed via escape-key')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* Required-acknowledgment form composition                            */
/* ------------------------------------------------------------------ */

const CONFIRM_PHRASE = 'delete my account';

function FormWithConfirmationExample() {
  const [phrase, setPhrase] = React.useState('');
  const [deleted, setDeleted] = React.useState(false);
  const confirmed = phrase === CONFIRM_PHRASE;

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className={styles.Button}>Delete account</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={styles.Backdrop} />
        <AlertDialog.Popup className={styles.Popup}>
          <div className={styles.Intro}>
            <AlertDialog.Title className={styles.Title}>Delete account?</AlertDialog.Title>
            <AlertDialog.Description className={styles.Description}>
              Type &quot;{CONFIRM_PHRASE}&quot; to confirm. This cannot be undone.
            </AlertDialog.Description>
          </div>
          <div className={styles.Form}>
            <div className={styles.Field}>
              <label className={styles.Label} htmlFor="confirm-phrase">
                Confirmation phrase
              </label>
              <input
                id="confirm-phrase"
                className={styles.Input}
                value={phrase}
                onChange={(event) => setPhrase(event.target.value)}
              />
            </div>
          </div>
          <div className={styles.Actions}>
            <AlertDialog.Close className={styles.Button}>Cancel</AlertDialog.Close>
            <AlertDialog.Close
              data-color="red"
              className={styles.Button}
              disabled={!confirmed}
              onClick={() => setDeleted(true)}
            >
              Delete account
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
      {deleted ? <output className={styles.Output}>account deleted</output> : null}
    </AlertDialog.Root>
  );
}

/**
 * A required-acknowledgment prompt: the destructive `AlertDialog.Close` stays
 * disabled until the user types an exact confirmation phrase — validation is
 * composed in userland, AlertDialog has no built-in equivalent.
 */
export const FormWithConfirmation: Story = {
  render: () => <FormWithConfirmationExample />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Delete account' }));
    const dialog = await body.findByRole('alertdialog');
    const input = within(dialog).getByLabelText('Confirmation phrase');
    const deleteButton = within(dialog).getByRole('button', { name: 'Delete account' });
    await waitFor(() => expect(deleteButton).toBeDisabled());

    await userEvent.type(input, 'wrong phrase');
    await expect(deleteButton).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, CONFIRM_PHRASE);
    await waitFor(() => expect(deleteButton).toBeEnabled());

    await userEvent.click(deleteButton);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(await canvas.findByText('account deleted')).toBeVisible();
  },
};
