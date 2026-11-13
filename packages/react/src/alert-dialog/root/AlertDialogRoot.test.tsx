import { expect, vi, describe, beforeEach, it } from 'vitest';
import * as React from 'react';
import { flushMicrotasks, screen, waitFor, within } from '@mui/internal-test-utils';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import {
  createRenderer,
  detachedTriggersConformanceTests,
  dialogRootSharedTests,
  isJSDOM,
  popupConformanceTests,
} from '#test-utils';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';

describe('<AlertDialog.Root />', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  popupConformanceTests({
    createComponent: (props) => (
      <AlertDialog.Root {...props.root}>
        <AlertDialog.Trigger {...props.trigger}>Open dialog</AlertDialog.Trigger>
        <AlertDialog.Portal {...props.portal}>
          <AlertDialog.Popup {...props.popup}>Dialog</AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ),
    render,
    triggerMouseAction: 'click',
    expectedPopupRole: 'alertdialog',
    expectedAriaHasPopupValue: 'dialog',
  });

  dialogRootSharedTests({ parts: AlertDialog, popupRole: 'alertdialog', render });

  detachedTriggersConformanceTests({
    render,
    createHandle: AlertDialog.createHandle,
    Root: AlertDialog.Root,
    Trigger: AlertDialog.Trigger,
    Portal: AlertDialog.Portal,
    Popup: AlertDialog.Popup,
    Close: AlertDialog.Close,
    openInteractions: ['click'],
    ariaExpanded: true,
    throwOnMissingTrigger: false,
    closesOnActiveTriggerUnmount: false,
  });

  it('ARIA attributes', async () => {
    await render(
      <AlertDialog.Root open>
        <AlertDialog.Trigger />
        <AlertDialog.Portal>
          <AlertDialog.Backdrop />
          <AlertDialog.Popup>
            <AlertDialog.Title>title text</AlertDialog.Title>
            <AlertDialog.Description>description text</AlertDialog.Description>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );

    const popup = screen.queryByRole('alertdialog');
    expect(popup).not.toBe(null);

    expect(screen.getByText('title text').getAttribute('id')).toBe(
      popup?.getAttribute('aria-labelledby'),
    );
    expect(screen.getByText('description text').getAttribute('id')).toBe(
      popup?.getAttribute('aria-describedby'),
    );
  });

  it('synchronizes trigger ARIA attributes when initially open with a handle', async () => {
    const handle = AlertDialog.createHandle();

    await render(
      <AlertDialog.Root handle={handle} defaultOpen defaultTriggerId="trigger">
        <AlertDialog.Trigger id="trigger">Open</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Popup>Dialog</AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );

    const trigger = screen.getByText('Open');
    const popup = screen.getByRole('alertdialog');

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger.getAttribute('aria-controls')).toBe(popup.getAttribute('id'));
  });

  it('synchronizes detached trigger ARIA attributes when initially open with a handle', async () => {
    const handle = AlertDialog.createHandle();

    await render(
      <React.Fragment>
        <AlertDialog.Trigger handle={handle} id="trigger">
          Open
        </AlertDialog.Trigger>
        <AlertDialog.Root handle={handle} defaultOpen defaultTriggerId="trigger">
          <AlertDialog.Portal>
            <AlertDialog.Popup>Dialog</AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </React.Fragment>,
    );

    const trigger = screen.getByText('Open');
    const popup = screen.getByRole('alertdialog');

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger.getAttribute('aria-controls')).toBe(popup.getAttribute('id'));
    expect(handle.isOpen).toBe(true);
  });

  it('does not re-render inactive detached triggers when the popup opens and closes', async () => {
    const handle = AlertDialog.createHandle();
    const bystander = { renders: 0 };

    const { user } = await render(
      <div>
        <AlertDialog.Trigger handle={handle} id="trigger-1">
          Trigger 1
        </AlertDialog.Trigger>
        <AlertDialog.Trigger
          handle={handle}
          id="trigger-2"
          render={(props) => {
            bystander.renders += 1;
            return <button {...props} />;
          }}
        >
          Trigger 2
        </AlertDialog.Trigger>
        <AlertDialog.Root handle={handle}>
          <AlertDialog.Portal>
            <AlertDialog.Popup data-testid="popup">
              <AlertDialog.Close>Close</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger 1' });

    async function openAndClose() {
      await user.click(trigger);
      expect(await screen.findByTestId('popup')).not.toBe(null);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => {
        expect(screen.queryByTestId('popup')).toBe(null);
      });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    }

    bystander.renders = 0;
    await openAndClose();
    await openAndClose();
    expect(bystander.renders).toBe(0);
  });

  it('renders a viewport', async () => {
    await render(
      <AlertDialog.Root open>
        <AlertDialog.Portal>
          <AlertDialog.Viewport data-testid="viewport">
            <AlertDialog.Popup>Dialog</AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );

    expect(screen.getByTestId('viewport')).toContain(screen.getByRole('alertdialog'));
  });

  describe('prop: onOpenChange', () => {
    it('does not close when the backdrop is clicked', async () => {
      const handleOpenChange = vi.fn();

      const { user } = await render(
        <AlertDialog.Root defaultOpen onOpenChange={handleOpenChange}>
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Close>Close</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );

      await user.click(screen.getByRole('presentation', { hidden: true }));

      expect(handleOpenChange.mock.calls.length).toBe(0);
      expect(screen.queryByRole('alertdialog')).not.toBe(null);
    });

    it('keeps the trigger data-popup-open attribute and handle.isOpen when a controlled close is vetoed', async () => {
      const handle = AlertDialog.createHandle();

      function TestCase() {
        const [open, setOpen] = React.useState(false);

        return (
          <AlertDialog.Root
            handle={handle}
            open={open}
            onOpenChange={(nextOpen) => {
              if (nextOpen) {
                setOpen(true);
              }
            }}
          >
            <AlertDialog.Trigger>Open</AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Popup>
                <AlertDialog.Title>Confirm</AlertDialog.Title>
                <AlertDialog.Close>Cancel</AlertDialog.Close>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        );
      }

      const { user } = await render(<TestCase />);

      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.click(trigger);

      await screen.findByRole('alertdialog');
      expect(trigger).toHaveAttribute('data-popup-open');
      expect(handle.isOpen).toBe(true);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.getByRole('alertdialog')).toHaveAttribute('data-open');
      expect(trigger).toHaveAttribute('data-popup-open');
      expect(handle.isOpen).toBe(true);
    });
  });

  describe('handle-backed roots', () => {
    it('rewires the trigger and keeps pointer dismissal disabled after the root remounts while open', async () => {
      const testDialog = AlertDialog.createHandle();

      function App() {
        const [mounted, setMounted] = React.useState(true);

        return (
          <div>
            <AlertDialog.Trigger handle={testDialog} id="trigger">
              Trigger
            </AlertDialog.Trigger>
            {!mounted && (
              <button type="button" onClick={() => setMounted(true)}>
                Remount root
              </button>
            )}

            {mounted && (
              <AlertDialog.Root handle={testDialog}>
                <AlertDialog.Portal>
                  <AlertDialog.Popup>
                    Alert dialog content
                    <button type="button" onClick={() => setMounted(false)}>
                      Unmount root
                    </button>
                  </AlertDialog.Popup>
                </AlertDialog.Portal>
              </AlertDialog.Root>
            )}
          </div>
        );
      }

      const { user } = await render(<App />);
      const trigger = screen.getByRole('button', { name: 'Trigger' });

      await user.click(trigger);

      let popup = await screen.findByRole('alertdialog');
      expect(trigger.getAttribute('aria-controls')).toBe(popup.getAttribute('id'));

      await user.click(within(popup).getByRole('button', { name: 'Unmount root' }));
      expect(screen.queryByRole('alertdialog')).toBe(null);

      await user.click(screen.getByRole('button', { name: 'Remount root' }));
      expect(screen.queryByRole('alertdialog')).toBe(null);

      await user.click(trigger);

      popup = await screen.findByRole('alertdialog');
      expect(trigger.getAttribute('aria-controls')).toBe(popup.getAttribute('id'));

      await user.click(screen.getByRole('presentation', { hidden: true }));
      await flushMicrotasks();

      expect(screen.queryByRole('alertdialog')).not.toBe(null);
      expect(testDialog.isOpen).toBe(true);
    });

    it('enforces alert dialog state for handle-backed roots', async () => {
      const handle = AlertDialog.createHandle();

      const { user } = await render(
        <React.Fragment>
          <AlertDialog.Trigger handle={handle}>Open</AlertDialog.Trigger>
          <AlertDialog.Root handle={handle}>
            <AlertDialogState data-testid="alert-dialog-state" />
            <AlertDialog.Portal>
              <AlertDialog.Popup>Content</AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </React.Fragment>,
      );

      expect(screen.getByTestId('alert-dialog-state')).toHaveAttribute('data-modal', 'true');
      expect(screen.getByTestId('alert-dialog-state')).toHaveAttribute(
        'data-disable-pointer-dismissal',
        'true',
      );
      expect(screen.getByTestId('alert-dialog-state')).toHaveAttribute('data-role', 'alertdialog');

      await user.click(screen.getByRole('button', { name: 'Open' }));

      expect(await screen.findByRole('alertdialog')).not.toBe(null);
      expect(handle.isOpen).toBe(true);

      await user.click(screen.getByRole('presentation', { hidden: true }));
      await flushMicrotasks();

      expect(screen.queryByRole('alertdialog')).not.toBe(null);
      expect(handle.isOpen).toBe(true);
    });
  });

  describe.skipIf(isJSDOM)('modality', () => {
    it('makes other interactive elements on the page inert when a modal dialog is open', async () => {
      await render(
        <AlertDialog.Root defaultOpen>
          <AlertDialog.Trigger>Open Dialog</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Close>Close Dialog</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>,
      );

      expect(screen.getByRole('presentation', { hidden: true })).not.toBe(null);
    });
  });
});

function AlertDialogState(props: React.HTMLAttributes<HTMLDivElement>) {
  const store = useDialogRootContext();
  const modal = store.useState('modal');
  const disablePointerDismissal = store.useState('disablePointerDismissal');
  const role = store.useState('role');

  return (
    <div
      {...props}
      data-modal={modal}
      data-disable-pointer-dismissal={disablePointerDismissal}
      data-role={role}
    />
  );
}
