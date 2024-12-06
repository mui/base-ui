import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { expect } from 'chai';

describe('<Tooltip.Portal />', () => {
  const { render } = createRenderer();

  it('renders children', async () => {
    await render(
      <Tooltip.Root open>
        <Tooltip.Portal data-testid="portal">
          <Tooltip.Positioner data-testid="positioner" />
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    expect(screen.getByTestId('positioner')).not.to.equal(null);
  });
});
