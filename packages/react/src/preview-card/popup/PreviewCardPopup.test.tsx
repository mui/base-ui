import * as React from 'react';
import { PreviewCard } from '@base-ui-components/react/preview-card';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Popover.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<PreviewCard.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <PreviewCard.Root open>
          <PreviewCard.Positioner>{node}</PreviewCard.Positioner>
        </PreviewCard.Root>,
      );
    },
  }));

  it('should render the children', async () => {
    await render(
      <PreviewCard.Root open>
        <PreviewCard.Positioner>
          <PreviewCard.Popup>Content</PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Root>,
    );

    expect(screen.getByText('Content')).not.to.equal(null);
  });
});
