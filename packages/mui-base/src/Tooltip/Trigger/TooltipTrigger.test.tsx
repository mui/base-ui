import * as React from 'react';
import * as Tooltip from '@base_ui/react/Tooltip';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { expect } from 'chai';

describe('<Tooltip.Trigger />', () => {
  const { render } = createRenderer();

  it('should render the children with cloneElement', () => {
    render(
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button />
        </Tooltip.Trigger>
      </Tooltip.Root>,
    );

    expect(screen.getByRole('button')).not.to.equal(null);
  });

  it('should render the children with a function render prop', () => {
    render(
      <Tooltip.Root>
        <Tooltip.Trigger>{(props) => <button {...props} />}</Tooltip.Trigger>
      </Tooltip.Root>,
    );

    expect(screen.getByRole('button')).not.to.equal(null);
  });
});
