import * as React from 'react';
import * as PreviewCard from '@base_ui/react/PreviewCard';
import { createRenderer, describeConformance } from '#test-utils';

describe('<PreviewCard.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(<PreviewCard.Arrow />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <PreviewCard.Root open animated={false}>
          <PreviewCard.Positioner>
            <PreviewCard.Popup>{node}</PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Root>,
      );
    },
  }));
});
