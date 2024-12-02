import * as React from 'react';
import { PreviewCard } from '@base-ui-components/react/preview-card';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { expect } from 'chai';

describe('<PreviewCard.Portal />', () => {
  const { render } = createRenderer();

  it('renders children', async () => {
    await render(
      <PreviewCard.Root open>
        <PreviewCard.Portal data-testid="portal">
          <PreviewCard.Positioner data-testid="positioner" />
        </PreviewCard.Portal>
      </PreviewCard.Root>,
    );
    expect(screen.getByTestId('positioner')).not.to.equal(null);
  });
});
