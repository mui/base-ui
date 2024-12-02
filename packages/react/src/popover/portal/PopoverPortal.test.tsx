import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { expect } from 'chai';

describe('<Popover.Portal />', () => {
  const { render } = createRenderer();

  it('renders children', async () => {
    await render(
      <Popover.Root open>
        <Popover.Portal data-testid="portal">
          <Popover.Positioner data-testid="positioner" />
        </Popover.Portal>
      </Popover.Root>,
    );
    expect(screen.getByTestId('positioner')).not.to.equal(null);
  });
});
