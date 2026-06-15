import { expect, vi } from 'vitest';
import * as React from 'react';
import type { UserEvent } from '@testing-library/user-event';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui/react/dialog';
import { createRenderer, isJSDOM } from '#test-utils';

describe('<Dialog.Root />', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  describe.skipIf(isJSDOM)('multiple triggers within Root', () => {
    type NumberPayload = { payload: number | undefined };

    it('opens the dialog with any trigger', async () => {
      const { user } = await render(
        <Dialog.Root>
          <Dialog.Trigger>Trigger 1</Dialog.Trigger>
          <Dialog.Trigger>Trigger 2</Dialog.Trigger>
          <Dialog.Trigger>Trigger 3</Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Popup>
              Dialog Content
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Dialog Content')).toBe(null);

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.toBe(null);
      });

      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).toBe(null);
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.toBe(null);
      });

      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).toBe(null);
      });

      await user.click(trigger3);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.toBe(null);
      });
    });

    it('sets the payload and renders content based on its value', async () => {
      const { user } = await render(
        <Dialog.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Dialog.Trigger payload={1}>Trigger 1</Dialog.Trigger>
              <Dialog.Trigger payload={2}>Trigger 2</Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Popup>
                  <span data-testid="content">{payload}</span>
                  <Dialog.Close>Close</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </React.Fragment>
          )}
        </Dialog.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('1');
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('2');
      });
    });

    it('reuses the popup DOM node when switching triggers', async () => {
      const { user } = await render(
        <Dialog.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Dialog.Trigger payload={1}>Trigger 1</Dialog.Trigger>
              <Dialog.Trigger payload={2}>Trigger 2</Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Popup data-testid="dialog-popup">
                  <span>{payload}</span>
                </Dialog.Popup>
              </Dialog.Portal>
            </React.Fragment>
          )}
        </Dialog.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      const popupElement = screen.getByTestId('dialog-popup');

      await user.click(trigger2);
      expect(screen.getByTestId('dialog-popup')).toBe(popupElement);
    });

    it('synchronizes ARIA attributes on the active trigger', async () => {
      const { user } = await render(
        <Dialog.Root>
          <Dialog.Trigger>Trigger 1</Dialog.Trigger>
          <Dialog.Trigger>Trigger 2</Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Popup data-testid="dialog-popup">Dialog Content</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      expect(trigger1).toHaveAttribute('aria-expanded', 'false');
      expect(trigger2).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger1);

      const dialog = await screen.findByRole('dialog');
      const trigger1Controls = trigger1.getAttribute('aria-controls');
      expect(trigger1Controls).not.toBe(null);
      expect(dialog.getAttribute('id')).toBe(trigger1Controls);
      await waitFor(() => {
        expect(trigger1).toHaveAttribute('aria-expanded', 'true');
      });
      expect(trigger2).toHaveAttribute('aria-expanded', 'false');
    });

    it('synchronizes ARIA attributes in controlled mode', async () => {
      await render(
        <Dialog.Root open triggerId="trigger-2">
          <Dialog.Trigger id="trigger-1">Trigger 1</Dialog.Trigger>
          <Dialog.Trigger id="trigger-2">Trigger 2</Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Popup>Dialog Content</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const trigger1 = screen.getByText('Trigger 1');
      const trigger2 = screen.getByText('Trigger 2');
      const dialog = await screen.findByRole('dialog');

      expect(trigger1).toHaveAttribute('aria-expanded', 'false');
      expect(trigger1).not.toHaveAttribute('aria-controls');
      expect(trigger2).toHaveAttribute('aria-expanded', 'true');
      expect(trigger2.getAttribute('aria-controls')).toBe(dialog.getAttribute('id'));
    });

    it('sets the payload when opening programmatically with a controlled triggerId', async () => {
      function App() {
        const [open, setOpen] = React.useState(false);
        const [triggerId, setTriggerId] = React.useState<string | null>(null);

        return (
          <div>
            <Dialog.Root open={open} triggerId={triggerId} onOpenChange={setOpen}>
              {({ payload }: NumberPayload) => (
                <React.Fragment>
                  <Dialog.Trigger id="trigger-1" payload={1}>
                    One
                  </Dialog.Trigger>
                  <Dialog.Trigger id="trigger-2" payload={2}>
                    Two
                  </Dialog.Trigger>

                  <Dialog.Portal>
                    <Dialog.Popup>
                      <span data-testid="content">{payload}</span>
                      <Dialog.Close>Close</Dialog.Close>
                    </Dialog.Popup>
                  </Dialog.Portal>
                </React.Fragment>
              )}
            </Dialog.Root>

            <button
              type="button"
              onClick={() => {
                setTriggerId('trigger-2');
                setOpen(true);
              }}
            >
              Open programmatically
            </button>
          </div>
        );
      }

      const { user } = await render(<App />);

      const openButton = screen.getByRole('button', { name: 'Open programmatically' });
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('2');
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));

      await waitFor(() => {
        expect(screen.queryByTestId('content')).toBe(null);
      });
      expect(openButton).toHaveFocus();
    });

    it('keeps the payload reactive', async () => {
      function App() {
        const [payloads, setPayloads] = React.useState([1, 2]);

        return (
          <div>
            <Dialog.Root>
              {({ payload }: NumberPayload) => (
                <React.Fragment>
                  <Dialog.Trigger id="trigger-1" payload={payloads[0]}>
                    Dialog 1
                  </Dialog.Trigger>
                  <Dialog.Trigger id="trigger-2" payload={payloads[1]}>
                    Dialog 2
                  </Dialog.Trigger>

                  <Dialog.Portal>
                    <Dialog.Popup>
                      <span data-testid="content">{payload}</span>
                      <button type="button" onClick={() => setPayloads([8, 16])}>
                        Update payloads
                      </button>
                    </Dialog.Popup>
                  </Dialog.Portal>
                </React.Fragment>
              )}
            </Dialog.Root>
          </div>
        );
      }

      const { user } = await render(<App />);

      const trigger1 = screen.getByRole('button', { name: 'Dialog 1' });
      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('1');
      });

      const updateButton = screen.getByRole('button', { name: 'Update payloads' });
      await user.click(updateButton);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('8');
      });
    });
  });

  describe.skipIf(isJSDOM)('multiple detached triggers', () => {
    type NumberPayload = { payload: number | undefined };

    function TriggerWithNesting({
      handle,
      nesting,
    }: {
      handle: ReturnType<typeof Dialog.createHandle>;
      nesting: 0 | 1 | 2 | 3;
    }) {
      const trigger = <Dialog.Trigger handle={handle}>Trigger</Dialog.Trigger>;

      if (nesting === 0) {
        return trigger;
      }

      if (nesting === 1) {
        return <div>{trigger}</div>;
      }

      if (nesting === 2) {
        return (
          <div>
            <div>{trigger}</div>
          </div>
        );
      }

      return (
        <div>
          <div>
            <div>{trigger}</div>
          </div>
        </div>
      );
    }

    function DetachedTriggerReparentingTest({
      handle,
      nesting,
    }: {
      handle: ReturnType<typeof Dialog.createHandle>;
      nesting: 0 | 1 | 2 | 3;
    }) {
      return (
        <React.Fragment>
          <TriggerWithNesting handle={handle} nesting={nesting} />
          <Dialog.Root handle={handle}>
            <Dialog.Portal>
              <Dialog.Popup>
                Dialog Content
                <Dialog.Close>Close</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </React.Fragment>
      );
    }

    async function openAndCloseDialog(user: UserEvent) {
      await user.click(screen.getByRole('button', { name: 'Trigger' }));
      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).toBe(null);
      });
    }

    it('opens the dialog with any trigger', async () => {
      const testDialog = Dialog.createHandle();
      const { user } = await render(
        <div>
          <Dialog.Trigger handle={testDialog}>Trigger 1</Dialog.Trigger>
          <Dialog.Trigger handle={testDialog}>Trigger 2</Dialog.Trigger>
          <Dialog.Trigger handle={testDialog}>Trigger 3</Dialog.Trigger>

          <Dialog.Root handle={testDialog}>
            <Dialog.Portal>
              <Dialog.Popup>
                Dialog Content
                <Dialog.Close>Close</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Dialog Content')).toBe(null);

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.toBe(null);
      });
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).toBe(null);
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.toBe(null);
      });
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).toBe(null);
      });

      await user.click(trigger3);
      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).not.toBe(null);
      });
    });

    it('keeps detached triggers clickable when reparented (remove wrappers)', async () => {
      const testDialog = Dialog.createHandle();
      const { user, setProps } = await render(
        <DetachedTriggerReparentingTest handle={testDialog} nesting={3} />,
      );

      await openAndCloseDialog(user);

      await setProps({ nesting: 2 });
      await openAndCloseDialog(user);

      await setProps({ nesting: 1 });
      await openAndCloseDialog(user);

      await setProps({ nesting: 0 });
      await openAndCloseDialog(user);
    });

    it('keeps detached triggers clickable when reparented (add wrappers)', async () => {
      const testDialog = Dialog.createHandle();
      const { user, setProps } = await render(
        <DetachedTriggerReparentingTest handle={testDialog} nesting={0} />,
      );

      await openAndCloseDialog(user);

      await setProps({ nesting: 1 });
      await openAndCloseDialog(user);

      await setProps({ nesting: 2 });
      await openAndCloseDialog(user);

      await setProps({ nesting: 3 });
      await openAndCloseDialog(user);
    });

    it('keeps detached triggers clickable during Fast Refresh-like handle recreation', async () => {
      function DetachedTriggerTest({ handle }: { handle: ReturnType<typeof Dialog.createHandle> }) {
        return (
          <React.Fragment>
            <Dialog.Trigger handle={handle}>Trigger</Dialog.Trigger>
            <Dialog.Root handle={handle}>
              <Dialog.Portal>
                <Dialog.Popup>
                  Dialog Content
                  <Dialog.Close>Close</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </React.Fragment>
        );
      }

      const handleA = Dialog.createHandle();
      const { user, setProps } = await render(<DetachedTriggerTest handle={handleA} />);

      await openAndCloseDialog(user);

      await setProps({ handle: Dialog.createHandle() });
      await openAndCloseDialog(user);

      await setProps({ handle: Dialog.createHandle() });
      await openAndCloseDialog(user);
    });

    it('keeps ARIA controls in sync when a detached handle is recreated while open', async () => {
      function DetachedTriggerTest({ handle }: { handle: ReturnType<typeof Dialog.createHandle> }) {
        return (
          <React.Fragment>
            <Dialog.Trigger id="trigger" handle={handle}>
              Trigger
            </Dialog.Trigger>
            <Dialog.Root handle={handle} open triggerId="trigger" modal={false}>
              <Dialog.Portal>
                <Dialog.Popup data-testid="popup">Dialog Content</Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </React.Fragment>
        );
      }

      const { setProps } = await render(<DetachedTriggerTest handle={Dialog.createHandle()} />);

      let trigger = screen.getByRole('button', { name: 'Trigger' });
      let popup = await screen.findByTestId('popup');

      await waitFor(() => {
        expect(trigger.getAttribute('aria-controls')).toBe(popup.getAttribute('id'));
      });

      await setProps({ handle: Dialog.createHandle() });

      trigger = screen.getByRole('button', { name: 'Trigger' });
      popup = await screen.findByTestId('popup');

      await waitFor(() => {
        expect(trigger.getAttribute('aria-controls')).toBe(popup.getAttribute('id'));
      });
    });

    it('keeps detached triggers clickable when reparented during Fast Refresh-like handle recreation', async () => {
      const handleA = Dialog.createHandle();
      const { user, setProps } = await render(
        <DetachedTriggerReparentingTest handle={handleA} nesting={3} />,
      );

      await openAndCloseDialog(user);

      await setProps({ handle: Dialog.createHandle(), nesting: 2 });
      await openAndCloseDialog(user);

      await setProps({ handle: Dialog.createHandle(), nesting: 1 });
      await openAndCloseDialog(user);

      await setProps({ handle: Dialog.createHandle(), nesting: 0 });
      await openAndCloseDialog(user);
    });

    it('sets the payload and renders content based on its value', async () => {
      const testDialog = Dialog.createHandle<number>();
      const { user } = await render(
        <div>
          <Dialog.Trigger handle={testDialog} payload={1}>
            Trigger 1
          </Dialog.Trigger>
          <Dialog.Trigger handle={testDialog} payload={2}>
            Trigger 2
          </Dialog.Trigger>

          <Dialog.Root handle={testDialog}>
            {({ payload }: NumberPayload) => (
              <Dialog.Portal>
                <Dialog.Popup>
                  <span data-testid="content">{payload}</span>
                  <Dialog.Close>Close</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            )}
          </Dialog.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('1');
      });

      await user.click(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('2');
      });
    });

    it('reuses the popup DOM node when switching triggers', async () => {
      const testDialog = Dialog.createHandle<number>();
      const { user } = await render(
        <React.Fragment>
          <Dialog.Trigger handle={testDialog} payload={1}>
            Trigger 1
          </Dialog.Trigger>
          <Dialog.Trigger handle={testDialog} payload={2}>
            Trigger 2
          </Dialog.Trigger>

          <Dialog.Root handle={testDialog}>
            {({ payload }: NumberPayload) => (
              <Dialog.Portal>
                <Dialog.Popup data-testid="dialog-popup">
                  <span>{payload}</span>
                </Dialog.Popup>
              </Dialog.Portal>
            )}
          </Dialog.Root>
        </React.Fragment>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      const popupElement = screen.getByTestId('dialog-popup');

      await user.click(trigger2);
      expect(screen.getByTestId('dialog-popup')).toBe(popupElement);
    });

    it('keeps the payload reactive', async () => {
      type NumberAccessorPayload = { payload: (() => number) | undefined };
      const testDialog = Dialog.createHandle<() => number>();
      function Triggers() {
        // Setting up triggers in a separate component so payload is in their local state
        // and updating it does not cause the Dialog.Root to re-render automatically.
        // This verifies that the payload is reactive and not only set on mount or on trigger click.
        const [payloads, setPayloads] = React.useState([1, 2]);

        return (
          <div>
            <Dialog.Trigger id="trigger-1" payload={() => payloads[0]} handle={testDialog}>
              Dialog 1
            </Dialog.Trigger>
            <Dialog.Trigger id="trigger-2" payload={() => payloads[1]} handle={testDialog}>
              Dialog 2
            </Dialog.Trigger>
            <button type="button" onClick={() => setPayloads([8, 16])}>
              Update payloads
            </button>
          </div>
        );
      }

      function App() {
        return (
          <div>
            <Triggers />
            <Dialog.Root modal={false} disablePointerDismissal={true} handle={testDialog}>
              {({ payload }: NumberAccessorPayload) => (
                <Dialog.Portal>
                  <Dialog.Popup>
                    <span data-testid="content">{payload?.()}</span>
                  </Dialog.Popup>
                </Dialog.Portal>
              )}
            </Dialog.Root>
          </div>
        );
      }

      const { user } = await render(<App />);

      const trigger1 = screen.getByRole('button', { name: 'Dialog 1' });
      await user.click(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('1');
      });

      const updateButton = screen.getByRole('button', { name: 'Update payloads' });
      await user.click(updateButton);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).toBe('8');
      });
    });

    it('closes a non-modal dialog with Escape from an inactive detached trigger', async () => {
      const testDialog = Dialog.createHandle();
      const { user } = await render(
        <React.Fragment>
          <Dialog.Trigger handle={testDialog}>Trigger 1</Dialog.Trigger>
          <Dialog.Trigger handle={testDialog}>Trigger 2</Dialog.Trigger>
          <Dialog.Root handle={testDialog} modal={false}>
            <Dialog.Portal>
              <Dialog.Popup>Dialog Content</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </React.Fragment>,
      );

      await user.click(screen.getByRole('button', { name: 'Trigger 1' }));
      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeVisible();
      });

      const inactiveTrigger = screen.getByRole('button', { name: 'Trigger 2' });
      await act(async () => inactiveTrigger.focus());
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Dialog Content')).toBe(null);
      });
    });
  });

  describe('imperative actions on the handle', () => {
    it('opens and closes the dialog', async () => {
      const dialog = Dialog.createHandle();
      await render(
        <div>
          <Dialog.Trigger handle={dialog} id="trigger">
            Trigger
          </Dialog.Trigger>
          <Dialog.Root handle={dialog}>
            <Dialog.Portal>
              <Dialog.Popup data-testid="content">Content</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Trigger' });
      expect(screen.queryByRole('dialog')).toBe(null);

      await act(() => dialog.open('trigger'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });

      expect(screen.getByTestId('content').textContent).toBe('Content');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      await act(() => dialog.close());
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('sets the payload assosiated with the trigger', async () => {
      const dialog = Dialog.createHandle<number>();
      await render(
        <div>
          <Dialog.Trigger handle={dialog} id="trigger1" payload={1}>
            Trigger 1
          </Dialog.Trigger>
          <Dialog.Trigger handle={dialog} id="trigger2" payload={2}>
            Trigger 2
          </Dialog.Trigger>
          <Dialog.Root handle={dialog}>
            {({ payload }: { payload: number | undefined }) => (
              <Dialog.Portal>
                <Dialog.Popup data-testid="content">{payload}</Dialog.Popup>
              </Dialog.Portal>
            )}
          </Dialog.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      expect(screen.queryByRole('dialog')).toBe(null);

      await act(() => dialog.open('trigger2'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });

      expect(screen.getByTestId('content').textContent).toBe('2');
      expect(trigger2).toHaveAttribute('aria-expanded', 'true');
      expect(trigger1).not.toHaveAttribute('aria-expanded', 'true');

      await act(() => dialog.close());
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });

      expect(trigger2).toHaveAttribute('aria-expanded', 'false');
    });

    it('sets the payload programmatically', async () => {
      const dialog = Dialog.createHandle<number>();
      await render(
        <div>
          <Dialog.Trigger handle={dialog} id="trigger1" payload={1}>
            Trigger 1
          </Dialog.Trigger>
          <Dialog.Trigger handle={dialog} id="trigger2" payload={2}>
            Trigger 2
          </Dialog.Trigger>
          <Dialog.Root handle={dialog}>
            {({ payload }: { payload: number | undefined }) => (
              <Dialog.Portal>
                <Dialog.Popup data-testid="content">{payload}</Dialog.Popup>
              </Dialog.Portal>
            )}
          </Dialog.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      expect(screen.queryByRole('dialog')).toBe(null);

      await act(() => dialog.openWithPayload(8));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });

      expect(screen.getByTestId('content').textContent).toBe('8');
      expect(trigger1).not.toHaveAttribute('aria-expanded', 'true');
      expect(trigger2).not.toHaveAttribute('aria-expanded', 'true');

      await act(() => dialog.close());
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });
    });
  });

  // Regression test for https://github.com/mui/base-ui/issues/4951.
  // A handle-owned store is not reset when the Root unmounts; the stale state is cleared when
  // the next Root adopts the handle. The "page" (trigger + Root together) unmounts and remounts
  // to emulate navigating away from and back to a route while the module-level handle persists.
  describe('resetting handle-owned state when a new Root adopts the handle', () => {
    it('does not resurface the open state on a subsequent Root mount (uncontrolled)', async () => {
      const dialog = Dialog.createHandle();

      function Page() {
        return (
          <React.Fragment>
            <Dialog.Trigger handle={dialog} id="trigger">
              Trigger
            </Dialog.Trigger>
            <Dialog.Root handle={dialog}>
              <Dialog.Portal>
                <Dialog.Popup data-testid="content">Content</Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </React.Fragment>
        );
      }

      const { setProps } = await render(<DialogTestPage showPage Page={Page} />);

      await act(() => dialog.open('trigger'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });

      // Navigate away while open.
      await setProps({ showPage: false });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });

      // Navigate back: the dialog stays closed.
      await setProps({ showPage: true });
      expect(screen.queryByRole('dialog')).toBe(null);
      expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );

      // The handle still controls the dialog after the remount.
      await act(() => dialog.open('trigger'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });
    });

    it('does not leave a leftover popup on a subsequent Root mount (controlled)', async () => {
      const dialog = Dialog.createHandle();
      const onOpenChangeComplete = vi.fn();

      function Page() {
        const [open, setOpen] = React.useState(false);
        return (
          <React.Fragment>
            <Dialog.Trigger handle={dialog} id="trigger">
              Trigger
            </Dialog.Trigger>
            <Dialog.Root
              handle={dialog}
              open={open}
              onOpenChange={setOpen}
              onOpenChangeComplete={onOpenChangeComplete}
            >
              <Dialog.Portal>
                <Dialog.Backdrop />
                <Dialog.Popup data-testid="content">Content</Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </React.Fragment>
        );
      }

      const { setProps } = await render(<DialogTestPage showPage Page={Page} />);

      await act(() => dialog.open('trigger'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });

      onOpenChangeComplete.mockClear();
      await setProps({ showPage: false });
      await setProps({ showPage: true });

      expect(dialog.isOpen).toBe(false);
      expect(screen.queryByRole('dialog')).toBe(null);
      expect(screen.queryByTestId('content')).toBe(null);
      // The adopting Root starts closed: the stale open state must not produce a
      // transient mount followed by a close cycle.
      expect(onOpenChangeComplete).not.toHaveBeenCalled();
    });

    it('preserves defaultOpen across a Root unmount/mount', async () => {
      const dialog = Dialog.createHandle();

      function Page() {
        return (
          <Dialog.Root handle={dialog} defaultOpen>
            <Dialog.Portal>
              <Dialog.Popup data-testid="content">Content</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        );
      }

      const { setProps } = await render(<DialogTestPage showPage Page={Page} />);
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });

      await setProps({ showPage: false });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });

      // A fresh Root mount honors `defaultOpen` again, just like a dialog without a handle.
      await setProps({ showPage: true });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });
    });

    it('notifies a still-mounted detached trigger when a new Root adopts the handle', async () => {
      const dialog = Dialog.createHandle();

      // Only the Root unmounts; the trigger stays mounted and subscribed to the handle store,
      // so it must be re-rendered when the adopting Root resets the stale open state.
      function App({ showRoot }: { showRoot: boolean }) {
        return (
          <div>
            <Dialog.Trigger handle={dialog} id="trigger">
              Trigger
            </Dialog.Trigger>
            {showRoot && (
              <Dialog.Root handle={dialog}>
                <Dialog.Portal>
                  <Dialog.Popup data-testid="content">Content</Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            )}
          </div>
        );
      }

      const { setProps } = await render(<App showRoot />);

      const trigger = screen.getByRole('button', { name: 'Trigger' });

      await act(() => dialog.open('trigger'));
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });

      // Unmounting the Root alone does not reset the store; the trigger still reflects it.
      await setProps({ showRoot: false });
      expect(dialog.isOpen).toBe(true);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // The adopting Root resets the store and flushes the still-mounted trigger.
      await setProps({ showRoot: true });
      expect(dialog.isOpen).toBe(false);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('dialog')).toBe(null);
    });

    it('keeps a controlled dialog open across a remount when the parent holds open=true', async () => {
      const dialog = Dialog.createHandle();

      // The controlled `open` lives outside the remounting subtree, so the adopting Root
      // must re-apply it after the reset.
      function App({ showRoot }: { showRoot: boolean }) {
        return (
          <div>
            {showRoot && (
              <Dialog.Root handle={dialog} open onOpenChange={() => {}}>
                <Dialog.Portal>
                  <Dialog.Popup data-testid="content">Content</Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            )}
          </div>
        );
      }

      const { setProps } = await render(<App showRoot />);
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });

      await setProps({ showRoot: false });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });

      await setProps({ showRoot: true });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBe(null);
      });
    });

    it('does not expose a stale nested-dialog count to the adopting Root before its first commit', async () => {
      const dialog = Dialog.createHandle();

      // `nestedOpenDialogCount` is open-cycle state on the parent store. The adopting Root only
      // re-derives it through a layout-effect sync, so a render-phase consumer (one rendered
      // before the popup mounts) would read the previous Root's value on the first render unless
      // the adoption reset clears it. This probe is such a consumer: it subscribes to the count
      // and is rendered directly under the Root (not gated by the popup mounting), recording every
      // value it sees while the adopting Root is mounted.
      const observedCounts: number[] = [];
      function NestedCountProbe() {
        observedCounts.push(dialog.store.useState('nestedOpenDialogCount'));
        return null;
      }

      function ParentWithNestedChild() {
        return (
          <Dialog.Root handle={dialog} defaultOpen>
            <Dialog.Portal>
              <Dialog.Popup>
                <Dialog.Root defaultOpen>
                  <Dialog.Portal>
                    <Dialog.Popup>Nested</Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        );
      }

      function AdoptingParent() {
        return (
          <Dialog.Root handle={dialog} defaultOpen>
            <NestedCountProbe />
            <Dialog.Portal>
              <Dialog.Popup data-testid="adopted-popup">Adopted</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        );
      }

      function App({ page }: { page: 'with-nested' | 'none' | 'adopting' }) {
        if (page === 'with-nested') {
          return <ParentWithNestedChild />;
        }
        if (page === 'adopting') {
          return <AdoptingParent />;
        }
        return <div>Other page</div>;
      }

      const { setProps } = await render(<App page="with-nested" />);

      // Parent is open with a nested child open, so it reports one nested dialog.
      await waitFor(() => {
        expect(dialog.store.state.nestedOpenDialogCount).toBe(1);
      });

      // Navigate away while both are open: the handle store keeps `nestedOpenDialogCount` at 1.
      await setProps({ page: 'none' });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBe(null);
      });
      expect(dialog.store.state.nestedOpenDialogCount).toBe(1);

      // A `defaultOpen` Root with no nested child adopts the handle.
      observedCounts.length = 0;
      await setProps({ page: 'adopting' });
      await screen.findByTestId('adopted-popup');

      // The adopting Root must never see the previous Root's nested count, including on its very
      // first render before the layout-effect sync runs.
      expect(observedCounts.length).toBeGreaterThan(0);
      expect(observedCounts.every((count) => count === 0)).toBe(true);
    });
  });
});

function DialogTestPage({ showPage, Page }: { showPage: boolean; Page: React.ComponentType }) {
  return <div>{showPage ? <Page /> : <div>Other page</div>}</div>;
}
