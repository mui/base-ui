import * as React from 'react';
import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { expect } from 'chai';

describe('<AlertDialog.Portal />', () => {
  const { render } = createRenderer();

  it('renders children', async () => {
    await render(
      <AlertDialog.Root open>
        <AlertDialog.Portal data-testid="portal">
          <AlertDialog.Popup data-testid="popup" />
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );
    expect(screen.getByTestId('popup')).not.to.equal(null);
  });
});
