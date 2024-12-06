import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { expect } from 'chai';

describe('<Select.Portal />', () => {
  const { render } = createRenderer();

  it('renders children', async () => {
    await render(
      <Select.Root open>
        <Select.Portal data-testid="portal">
          <Select.Positioner data-testid="positioner" />
        </Select.Portal>
      </Select.Root>,
    );
    expect(screen.getByTestId('positioner')).not.to.equal(null);
  });
});
