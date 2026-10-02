import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Toast } from '@base-ui/react/toast';
import { Dialog } from '@base-ui/react/dialog';

function List({ children }: { children?: React.ReactNode }) {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast}>
      <Toast.Title />
      <Toast.Description />
      {children}
      <Toast.Close>Dismiss notification</Toast.Close>
    </Toast.Root>
  ));
}

function getAnnouncer(priority: 'polite' | 'assertive') {
  const region = screen
    .getAllByRole('status')
    .find((element) => element.getAttribute('aria-live') === priority);
  if (!region) {
    throw new Error(`Missing ${priority} announcer`);
  }
  return region;
}

describe('Toast announcements', () => {
  const { render, clock } = createRenderer();
  clock.withFakeTimers();

  it('keeps empty live regions mounted and routes rendered text by priority', async () => {
    const manager = Toast.createToastManager();
    await render(
      <Toast.Provider toastManager={manager} timeout={0}>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
      </Toast.Provider>,
    );

    const polite = getAnnouncer('polite');
    const assertive = getAnnouncer('assertive');
    expect(polite).toBeEmptyDOMElement();
    expect(assertive).toBeEmptyDOMElement();
    expect(screen.getByRole('region')).not.toHaveAttribute('aria-live');

    await act(async () => {
      manager.add({ title: 'Saved', description: <span>Your changes</span> });
      manager.add({ title: 'Upload failed', description: 'Try again', priority: 'high' });
    });

    expect(screen.getByRole('alertdialog')).not.toHaveAttribute('aria-hidden');
    expect(screen.getAllByRole('button', { name: 'Dismiss notification' })).toHaveLength(2);

    expect(polite).toHaveTextContent('SavedYour changes');
    expect(assertive).toHaveTextContent('Upload failedTry again');
    expect(polite).not.toHaveTextContent('Dismiss notification');
    expect(polite).toHaveTextContent('SavedYour changes');
    expect(polite.children).toHaveLength(1);

    clock.tick(1000);

    expect(getAnnouncer('polite')).toBe(polite);
    expect(getAnnouncer('assertive')).toBe(assertive);
    expect(polite).toHaveTextContent('SavedYour changes');
    expect(assertive).toHaveTextContent('Upload failedTry again');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Upload failed');

    await act(async () => manager.close());
    expect(polite).toBeEmptyDOMElement();
    expect(assertive).toBeEmptyDOMElement();
  });

  it('keeps provider regions mounted while each toast owns its portal lifetime', async () => {
    function Test({ show }: { show: boolean }) {
      return (
        <Toast.Provider>
          {show && (
            <Toast.Root toast={{ id: 'initial' }}>
              <Toast.Title>Initially mounted</Toast.Title>
            </Toast.Root>
          )}
        </Toast.Provider>
      );
    }

    const { setProps } = await render(<Test show />);
    const polite = getAnnouncer('polite');
    expect(polite).toHaveTextContent('Initially mounted');

    await setProps({ show: false });
    expect(getAnnouncer('polite')).toBe(polite);
    expect(polite).toBeEmptyDOMElement();
    expect(screen.getAllByRole('status')).toHaveLength(2);

    await setProps({ show: true });
    expect(polite).toHaveTextContent('Initially mounted');
  });

  it('announces each toast once, including repeated messages while focused', async () => {
    const manager = Toast.createToastManager();
    await render(
      <Toast.Provider toastManager={manager} timeout={0}>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
      </Toast.Provider>,
    );

    await act(async () => {
      manager.add({ id: 'first', title: 'Saved' });
    });
    const firstMessage = getAnnouncer('polite').firstChild;

    const toastRoot = screen.getByRole('dialog');
    await act(async () => toastRoot.focus());
    fireEvent.keyDown(toastRoot, { key: 'F6' });
    fireEvent.mouseEnter(screen.getByRole('region'));
    expect(getAnnouncer('polite').childNodes).toHaveLength(1);
    expect(getAnnouncer('polite').firstChild).toBe(firstMessage);

    await act(async () => {
      manager.add({ id: 'second', title: 'Saved' });
      manager.update('first', { title: 'Finished', priority: 'high' });
    });

    expect(getAnnouncer('polite').childNodes).toHaveLength(2);
    expect(getAnnouncer('assertive')).toBeEmptyDOMElement();
    expect(firstMessage).toHaveTextContent('Saved');

    await act(async () => {
      manager.update('first', { timeout: 10000 });
    });
    expect(getAnnouncer('assertive')).toBeEmptyDOMElement();
  });

  it('does not announce a toast added and dismissed in the same update', async () => {
    const manager = Toast.createToastManager();
    await render(
      <Toast.Provider toastManager={manager}>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
      </Toast.Provider>,
    );

    await act(async () => {
      manager.add({ id: 'removed', title: 'Do not announce' });
      manager.close('removed');
    });
    expect(getAnnouncer('polite')).toBeEmptyDOMElement();
  });
});

describe('Toast announcement content', () => {
  const { render } = createRenderer();

  it.each([true, false])(
    'keeps live regions accessible with a dialog initially open: %s',
    async (initiallyOpen) => {
      const manager = Toast.createToastManager();
      function Test({ open }: { open: boolean }) {
        return (
          <Toast.Provider toastManager={manager} timeout={0}>
            <button>Outside</button>
            <Toast.Portal>
              <Toast.Viewport>
                <List />
              </Toast.Viewport>
            </Toast.Portal>
            <Dialog.Root open={open}>
              <Dialog.Portal>
                <Dialog.Popup aria-label="Confirmation">
                  <Dialog.Close>Close dialog</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </Toast.Provider>
        );
      }

      const { setProps } = await render(<Test open={initiallyOpen} />);
      await act(async () => {
        manager.add({ title: 'Saved in dialog', priority: 'high' });
      });
      if (!initiallyOpen) {
        await setProps({ open: true });
      }

      expect(screen.queryByRole('button', { name: 'Outside' })).toBe(null);
      const announcer = getAnnouncer('assertive');
      expect(announcer).toHaveTextContent('Saved in dialog');

      expect(screen.getByRole('button', { name: 'Close dialog' })).toBeVisible();
    },
  );

  it.each(['low', 'high'] as const)(
    'snapshots only title and description text for %s priority',
    async (priority) => {
      const manager = Toast.createToastManager();
      function CustomContent() {
        const [message, setMessage] = React.useState('Working');
        return (
          <React.Fragment>
            <Toast.Title>Rendered title</Toast.Title>
            <Toast.Description render={<div />}>
              <p>{message}</p>
              <p>Another paragraph</p>
              <span aria-hidden="true">Hidden</span>
              <span aria-hidden="false">Included</span>
              <span hidden>Also hidden</span>
              <span style={{ display: 'none' }}>Not displayed</span>
              <img alt="Success icon" />
            </Toast.Description>
            <span>Other toast content</span>
            <button onClick={() => setMessage('Complete')}>Update</button>
          </React.Fragment>
        );
      }

      function CustomList() {
        const { toasts } = Toast.useToastManager();
        return toasts.map((toast) => (
          <Toast.Root key={toast.id} toast={toast}>
            <CustomContent />
            <Toast.Close>Dismiss notification</Toast.Close>
          </Toast.Root>
        ));
      }

      await render(
        <Toast.Provider toastManager={manager} timeout={0}>
          <Toast.Viewport>
            <CustomList />
          </Toast.Viewport>
        </Toast.Provider>,
      );

      await act(async () => {
        manager.add({
          title: 'Unused manager title',
          description: 'Unused manager description',
          priority,
        });
      });

      const announcer = getAnnouncer(priority === 'high' ? 'assertive' : 'polite');
      expect(announcer).toHaveTextContent(
        'Rendered titleWorkingAnother paragraphHiddenIncludedAlso hiddenNot displayed',
      );
      expect(announcer).toHaveTextContent(
        'Rendered titleWorkingAnother paragraphHiddenIncludedAlso hiddenNot displayed',
      );
      expect(announcer.children).toHaveLength(1);
      expect(announcer).not.toHaveTextContent('Other toast content');
      expect(announcer).not.toHaveTextContent('Update');
      expect(announcer).not.toHaveTextContent('Unused manager');
      expect(announcer).not.toHaveTextContent('Success icon');
      expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeVisible();

      fireEvent.click(screen.getByRole('button', { name: 'Update' }));
      await flushMicrotasks();
      expect(screen.getByRole(priority === 'high' ? 'alertdialog' : 'dialog')).toHaveTextContent(
        'Complete',
      );
      expect(announcer).toHaveTextContent(
        'Rendered titleWorkingAnother paragraphHiddenIncludedAlso hiddenNot displayed',
      );
    },
  );
});
