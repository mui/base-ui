import * as React from 'react';
import * as PreviewCard from '@base_ui/react/PreviewCard';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { describeConformance } from '../../../test/describeConformance';
import { createRenderer } from '../../../test';

describe('<Popover.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<PreviewCard.Popup />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <PreviewCard.Root open animated={false}>
          <PreviewCard.Positioner>{node}</PreviewCard.Positioner>
        </PreviewCard.Root>,
      );
    },
  }));

  it('should render the children', async () => {
    await render(
      <PreviewCard.Root open animated={false}>
        <PreviewCard.Positioner>
          <PreviewCard.Popup>Content</PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Root>,
    );

    expect(screen.getByText('Content')).not.to.equal(null);
  });
});
