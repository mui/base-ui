import { expect } from 'vitest';
import { Dialog } from '@base-ui/react/dialog';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Dialog.Trigger />', () => {
  const { render, renderToString } = createRenderer();

  describeConformance(<Dialog.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false}>
          {node}
        </Dialog.Root>,
      );
    },
  }));

  describe('prop: disabled', () => {
    it('disables the dialog', async () => {
      const { user } = await render(
        <Dialog.Root modal={false}>
          <Dialog.Trigger disabled />
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup>
              <Dialog.Title>title text</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('disabled');
      expect(trigger).toHaveAttribute('data-disabled');

      await user.click(trigger);
      expect(screen.queryByText('title text')).toBe(null);

      await user.keyboard('[Tab]');
      expect(document.activeElement).not.toBe(trigger);
    });

    it('custom element', async () => {
      const { user } = await render(
        <Dialog.Root modal={false}>
          <Dialog.Trigger disabled render={<span />} nativeButton={false} />
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup>
              <Dialog.Title>title text</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const trigger = screen.getByRole('button');
      expect(trigger).not.toHaveAttribute('disabled');
      expect(trigger).toHaveAttribute('data-disabled');
      expect(trigger).toHaveAttribute('aria-disabled', 'true');

      await user.click(trigger);
      expect(screen.queryByText('title text')).toBe(null);

      await user.keyboard('[Tab]');
      expect(document.activeElement).not.toBe(trigger);
    });
  });

  describe('accessibility attributes', () => {
    it('sets closed trigger ARIA attributes during server render', () => {
      renderToString(
        <Dialog.Root modal={false}>
          <Dialog.Trigger data-testid="trigger">Open</Dialog.Trigger>
        </Dialog.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).not.toHaveAttribute('aria-controls');
    });

    it('links the open trigger to the popup', async () => {
      await render(
        <Dialog.Root modal={false} defaultOpen defaultTriggerId="trigger">
          <Dialog.Trigger id="trigger">Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup id="popup">Content</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      const popup = screen.getByRole('dialog');

      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-controls', popup.id);
    });
  });
});
