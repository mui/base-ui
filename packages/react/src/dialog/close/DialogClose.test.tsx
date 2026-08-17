import { expect, vi } from 'vitest';
import { Dialog } from '@base-ui/react/dialog';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Dialog.Close />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Close />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false}>
          <Dialog.Portal>
            <Dialog.Popup>{node}</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );
    },
  }));

  describe('prop: disabled', () => {
    it('disables the button', async () => {
      const handleOpenChange = vi.fn();

      const { user } = await render(
        <Dialog.Root onOpenChange={handleOpenChange}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close disabled>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      expect(handleOpenChange.mock.calls.length).toBe(0);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      expect(handleOpenChange.mock.calls.length).toBe(1);
      expect(handleOpenChange.mock.calls[0][0]).toBe(true);

      const closeButton = screen.getByText('Close');
      expect(closeButton).toHaveAttribute('disabled');
      expect(closeButton).toHaveAttribute('data-disabled');
      await user.click(closeButton);

      expect(handleOpenChange.mock.calls.length).toBe(1);
    });

    it('custom element', async () => {
      const handleOpenChange = vi.fn();

      const { user } = await render(
        <Dialog.Root onOpenChange={handleOpenChange}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Close disabled render={<span />} nativeButton={false}>
                Close
              </Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      expect(handleOpenChange.mock.calls.length).toBe(0);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      expect(handleOpenChange.mock.calls.length).toBe(1);
      expect(handleOpenChange.mock.calls[0][0]).toBe(true);

      const closeButton = screen.getByText('Close');
      expect(closeButton).not.toHaveAttribute('disabled');
      expect(closeButton).toHaveAttribute('data-disabled');
      expect(closeButton).toHaveAttribute('aria-disabled', 'true');
      await user.click(closeButton);

      expect(handleOpenChange.mock.calls.length).toBe(1);
    });
  });

  it('closes the dialog when undefined is passed to the `onClick` prop', async () => {
    const handleOpenChange = vi.fn();

    const { user } = await render(
      <Dialog.Root onOpenChange={handleOpenChange}>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Popup>
            <Dialog.Close onClick={undefined}>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );

    expect(handleOpenChange.mock.calls.length).toBe(0);

    const openButton = screen.getByText('Open');
    await user.click(openButton);

    expect(handleOpenChange.mock.calls.length).toBe(1);
    expect(handleOpenChange.mock.calls[0][0]).toBe(true);

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    expect(handleOpenChange.mock.calls.length).toBe(2);
    expect(handleOpenChange.mock.calls[1][0]).toBe(false);
  });

  it('does not close the dialog when the Base UI click handler is prevented', async () => {
    const handleOpenChange = vi.fn();

    const { user } = await render(
      <Dialog.Root defaultOpen modal={false} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Popup>
            <Dialog.Close onClick={(event) => event.preventBaseUIHandler()}>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.getByRole('dialog')).not.toBe(null);
    expect(handleOpenChange.mock.calls.length).toBe(0);
  });

  it('does not request another close when clicked after the dialog has closed', async () => {
    const handleOpenChange = vi.fn();
    const handleClick = vi.fn();

    await render(
      <Dialog.Root open={false} modal={false} onOpenChange={handleOpenChange}>
        <Dialog.Portal keepMounted>
          <Dialog.Popup>
            <Dialog.Close onClick={handleClick}>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close', hidden: true }));

    expect(handleClick.mock.calls.length).toBe(1);
    expect(handleOpenChange.mock.calls.length).toBe(0);
  });
});
