import * as React from 'react';
import { PreviewCard } from '@base-ui-components/react/preview-card';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'vitest';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Popover.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<PreviewCard.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <PreviewCard.Root open>
          <PreviewCard.Portal>
            <PreviewCard.Positioner>{node}</PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );
    },
  }));

  it('should render the children', async () => {
    await render(
      <PreviewCard.Root open>
        <PreviewCard.Portal>
          <PreviewCard.Positioner>
            <PreviewCard.Popup>Content</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      </PreviewCard.Root>,
    );

    expect(screen.getByText('Content')).not.to.equal(null);
  });
});
