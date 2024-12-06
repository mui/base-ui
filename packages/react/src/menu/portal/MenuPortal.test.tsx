import * as React from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { expect } from 'chai';

describe('<Menu.Portal />', () => {
  const { render } = createRenderer();

  it('renders children', async () => {
    await render(
      <Menu.Root open>
        <Menu.Portal data-testid="portal">
          <Menu.Positioner data-testid="positioner" />
        </Menu.Portal>
      </Menu.Root>,
    );
    expect(screen.getByTestId('positioner')).not.to.equal(null);
  });
});
