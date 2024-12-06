import * as React from 'react';
import { expect } from 'chai';
import { screen, waitFor } from '@mui/internal-test-utils';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { createRenderer } from '#test-utils';

describe('<AlertDialog.Root />', () => {
  const { render } = createRenderer();

  describe('modality', () => {
    it('makes other interactive elements on the page inert when a modal dialog is open and restores them after the dialog is closed', async () => {
      const { user } = await render(
        <div>
          <input data-testid="input" />
          <textarea data-testid="textarea" />

          <AlertDialog.Root>
            <AlertDialog.Trigger>Open Dialog</AlertDialog.Trigger>
            <AlertDialog.Popup>
              <AlertDialog.Close>Close Dialog</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Root>

          <button type="button">Another Button</button>
        </div>,
      );

      const outsideElements = [
        screen.getByTestId('input'),
        screen.getByTestId('textarea'),
        screen.getByRole('button', { name: 'Another Button' }),
      ];

      const trigger = screen.getByRole('button', { name: 'Open Dialog' });
      await user.click(trigger);

      await waitFor(() => {
        outsideElements.forEach((element) => {
          // The `inert` attribute can be applied to the element itself or to an ancestor
          expect(element.closest('[inert]')).not.to.equal(null);
        });
      });

      const close = screen.getByRole('button', { name: 'Close Dialog' });
      await user.click(close);

      await waitFor(() => {
        outsideElements.forEach((element) => {
          expect(element.closest('[inert]')).to.equal(null);
        });
      });
    });
  });
});
