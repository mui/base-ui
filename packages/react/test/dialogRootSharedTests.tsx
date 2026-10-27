import * as React from 'react';
import { expect, vi, describe, it, afterEach } from 'vitest';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import type { AlertDialog } from '@base-ui/react/alert-dialog';
import type { Dialog } from '@base-ui/react/dialog';
import type { createRenderer } from '#test-utils';
import { isJSDOM, wait } from '#test-utils';
import { REASONS } from '../src/internals/reasons';

/**
 * Root behavior that Dialog and AlertDialog share. The alert mode only changes modality,
 * pointer dismissal and the popup role, so these cases run for both namespaces.
 */
export function dialogRootSharedTests(config: DialogRootSharedTestsConfig) {
  const { parts, popupRole, render } = config;
  // With a union of the two namespaces, a handle from `createHandle()` can't be typed as fitting
  // its own Root and Triggers. The suite only passes props that both namespaces accept.
  const { Root, Trigger, Portal, Popup, Close, createHandle } = parts as typeof Dialog;

  type NumberPayload = { payload: number | undefined };

  const queryPopup = () => screen.queryByRole(popupRole);

  describe('Dialog root shared behavior', () => {
    describe('prop: onOpenChange', () => {
      it('reports the trigger and reason when opened by a trigger and closed by a close button', async () => {
        const handleOpenChange = vi.fn();

        const { user } = await render(
          <Root onOpenChange={handleOpenChange}>
            <Trigger>Open</Trigger>
            <Portal>
              <Popup>
                <Close>Close</Close>
              </Popup>
            </Portal>
          </Root>,
        );

        const trigger = screen.getByRole('button', { name: 'Open' });
        await user.click(trigger);

        expect(handleOpenChange).toHaveBeenCalledTimes(1);
        expect(handleOpenChange).toHaveBeenNthCalledWith(
          1,
          true,
          expect.objectContaining({ reason: REASONS.triggerPress, trigger }),
        );

        await user.click(screen.getByRole('button', { name: 'Close' }));

        expect(handleOpenChange).toHaveBeenCalledTimes(2);
        expect(handleOpenChange).toHaveBeenNthCalledWith(
          2,
          false,
          expect.objectContaining({ reason: REASONS.closePress, trigger }),
        );
      });

      it('reports the trigger the popup was opened from for an Escape close', async () => {
        const handleOpenChange = vi.fn();

        const { user } = await render(
          <Root onOpenChange={handleOpenChange}>
            <Trigger>Open A</Trigger>
            <Trigger>Open B</Trigger>
            <Portal>
              <Popup />
            </Portal>
          </Root>,
        );

        const triggerB = screen.getByRole('button', { name: 'Open B' });
        await user.click(triggerB);
        expect(queryPopup()).not.toBe(null);
        await user.keyboard('[Escape]');

        expect(handleOpenChange).toHaveBeenCalledTimes(2);
        expect(handleOpenChange).toHaveBeenNthCalledWith(
          2,
          false,
          expect.objectContaining({ reason: REASONS.escapeKey, trigger: triggerB }),
        );
      });
    });

    describe.skipIf(isJSDOM)('close requests', () => {
      afterEach(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      const exitStyle = `
        @keyframes dialog-await-exit { to { opacity: 0; } }
        .dialog-await-popup[data-ending-style] { animation: dialog-await-exit 200ms; }
      `;

      it('keeps the popup mounted when onOpenChange prevents unmounting after an await', async () => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
        const { user } = await render(
          <div>
            <style>{exitStyle}</style>
            <Root
              defaultOpen
              onOpenChange={async (open, eventDetails) => {
                if (!open) {
                  await Promise.resolve();
                  eventDetails.preventUnmountOnClose();
                }
              }}
            >
              <Portal>
                <Popup data-testid="popup" className="dialog-await-popup" />
              </Portal>
            </Root>
          </div>,
        );
        expect(screen.getByTestId('popup')).toHaveAttribute('data-open');

        await user.keyboard('[Escape]');
        await wait(400);

        expect(screen.queryByTestId('popup')).not.toBe(null);
        expect(screen.getByTestId('popup')).not.toHaveAttribute('data-open');
      });

      it('keeps a controlled popup mounted when onOpenChange prevents unmounting after an await', async () => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        function App() {
          const [open, setOpen] = React.useState(true);
          return (
            <Root
              open={open}
              onOpenChange={async (nextOpen, eventDetails) => {
                if (nextOpen) {
                  setOpen(true);
                  return;
                }
                await Promise.resolve();
                eventDetails.preventUnmountOnClose();
                setOpen(false);
              }}
            >
              <Portal>
                <Popup data-testid="popup" className="dialog-await-popup" />
              </Portal>
            </Root>
          );
        }

        const { user } = await render(
          <div>
            <style>{exitStyle}</style>
            <App />
          </div>,
        );
        expect(screen.getByTestId('popup')).toHaveAttribute('data-open');

        await user.keyboard('[Escape]');
        await wait(400);

        expect(screen.queryByTestId('popup')).not.toBe(null);
        expect(screen.getByTestId('popup')).not.toHaveAttribute('data-open');
      });
    });

    describe('prop: actionsRef', () => {
      it('unmounts the popup when the `unmount` method is called', async () => {
        const actionsRef = React.createRef<Dialog.Root.Actions>();

        const { user } = await render(
          <Root
            actionsRef={actionsRef}
            onOpenChange={(open, details) => {
              if (!open) {
                details.preventUnmountOnClose();
              }
            }}
          >
            <Trigger>Open</Trigger>
            <Portal>
              <Popup />
            </Portal>
          </Root>,
        );

        const trigger = screen.getByRole('button', { name: 'Open' });
        await user.click(trigger);
        expect(await screen.findByRole(popupRole)).toBeVisible();

        await user.click(trigger);
        await waitFor(() => {
          expect(trigger).toHaveAttribute('aria-expanded', 'false');
        });
        expect(screen.getByRole(popupRole, { hidden: true })).toHaveAttribute('data-closed');

        await act(async () => actionsRef.current?.unmount());

        await waitFor(() => {
          expect(screen.queryByRole(popupRole, { hidden: true })).toBe(null);
        });
      });

      it('clears manual unmount state after the `unmount` method is called', async () => {
        const actionsRef = React.createRef<Dialog.Root.Actions>();
        let shouldPreventUnmount = true;

        const { user } = await render(
          <Root
            actionsRef={actionsRef}
            onOpenChange={(open, details) => {
              if (!open && shouldPreventUnmount) {
                shouldPreventUnmount = false;
                details.preventUnmountOnClose();
              }
            }}
          >
            <Trigger>Open</Trigger>
            <Portal>
              <Popup>
                <Close>Close</Close>
              </Popup>
            </Portal>
          </Root>,
        );

        const trigger = screen.getByRole('button', { name: 'Open' });
        await user.click(trigger);
        expect(await screen.findByRole(popupRole)).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Close' }));
        await waitFor(() => {
          expect(trigger).toHaveAttribute('aria-expanded', 'false');
        });
        expect(screen.getByRole(popupRole, { hidden: true })).toHaveAttribute('data-closed');

        await act(async () => actionsRef.current?.unmount());
        await waitFor(() => {
          expect(screen.queryByRole(popupRole, { hidden: true })).toBe(null);
        });

        // The next close unmounts on its own again.
        await user.click(trigger);
        expect(await screen.findByRole(popupRole)).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Close' }));
        await waitFor(() => {
          expect(screen.queryByRole(popupRole, { hidden: true })).toBe(null);
        });
      });

      it('closes the popup when the `close` method is called', async () => {
        const actionsRef = React.createRef<Dialog.Root.Actions>();
        const handleOpenChange = vi.fn();

        await render(
          <Root defaultOpen actionsRef={actionsRef} onOpenChange={handleOpenChange}>
            <Portal>
              <Popup />
            </Portal>
          </Root>,
        );

        expect(screen.getByRole(popupRole)).toBeVisible();

        await act(async () => actionsRef.current?.close());

        await waitFor(() => {
          expect(queryPopup()).toBe(null);
        });
        expect(handleOpenChange).toHaveBeenCalledTimes(1);
        expect(handleOpenChange).toHaveBeenNthCalledWith(
          1,
          false,
          expect.objectContaining({ reason: REASONS.imperativeAction }),
        );
      });
    });

    describe('imperative actions on the handle', () => {
      it('opens with a payload set programmatically', async () => {
        const handle = createHandle<number>();
        await render(
          <div>
            <Trigger handle={handle} id="trigger-1" payload={1}>
              Trigger 1
            </Trigger>
            <Trigger handle={handle} id="trigger-2" payload={2}>
              Trigger 2
            </Trigger>
            <Root handle={handle}>
              {({ payload }: NumberPayload) => (
                <Portal>
                  <Popup data-testid="content">{payload}</Popup>
                </Portal>
              )}
            </Root>
          </div>,
        );

        const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
        const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
        expect(queryPopup()).toBe(null);

        await act(() => handle.openWithPayload(8));
        await waitFor(() => {
          expect(queryPopup()).not.toBe(null);
        });

        expect(screen.getByTestId('content')).toHaveTextContent('8');
        expect(trigger1).toHaveAttribute('aria-expanded', 'false');
        expect(trigger2).toHaveAttribute('aria-expanded', 'false');

        await act(() => handle.close());
        await waitFor(() => {
          expect(queryPopup()).toBe(null);
        });
      });
    });
  });
}

export interface DialogRootSharedTestsConfig {
  /**
   * The component namespace to test.
   */
  parts: typeof Dialog | typeof AlertDialog;
  /**
   * The `role` of the popup element.
   */
  popupRole: 'dialog' | 'alertdialog';
  /**
   * Render function returned from `createRenderer`.
   */
  render: ReturnType<typeof createRenderer>['render'];
}
