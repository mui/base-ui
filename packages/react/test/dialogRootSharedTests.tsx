import * as React from 'react';
import { expect, vi, describe, it } from 'vitest';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import type { AlertDialog } from '@base-ui/react/alert-dialog';
import type { Dialog } from '@base-ui/react/dialog';
import type { createRenderer } from '#test-utils';
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
