import { expect } from 'vitest';
import { Drawer } from '@base-ui/react/drawer';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';

describe('<Drawer.Trigger />', () => {
  const { render, renderToString } = createRenderer();

  describe('accessibility attributes', () => {
    it('sets closed trigger ARIA attributes during server render', () => {
      renderToString(
        <Drawer.Root modal={false}>
          <Drawer.Trigger data-testid="trigger">Open</Drawer.Trigger>
        </Drawer.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).not.toHaveAttribute('aria-controls');
    });

    it('links the open trigger to the popup', async () => {
      await render(
        <Drawer.Root modal={false} defaultOpen defaultTriggerId="trigger">
          <Drawer.Trigger id="trigger">Open</Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Popup id="popup" data-testid="popup">
                Content
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      const popup = screen.getByTestId('popup');

      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-controls', popup.id);
    });
  });
});
