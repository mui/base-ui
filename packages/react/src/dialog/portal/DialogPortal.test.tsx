import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { expect } from 'chai';

describe('<Dialog.Portal />', () => {
  const { render } = createRenderer();

  it('renders children', async () => {
    await render(
      <Dialog.Root open>
        <Dialog.Portal data-testid="portal">
          <Dialog.Popup data-testid="popup" />
        </Dialog.Portal>
      </Dialog.Root>,
    );
    expect(screen.getByTestId('popup')).not.to.equal(null);
  });
});
