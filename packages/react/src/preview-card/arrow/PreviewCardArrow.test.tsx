import * as React from 'react';
import { PreviewCard } from '@base-ui-components/react/preview-card';
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
