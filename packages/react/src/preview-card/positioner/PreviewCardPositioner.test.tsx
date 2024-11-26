import * as React from 'react';
import { PreviewCard } from '@base-ui-components/react/preview-card';
import { createRenderer, describeConformance } from '#test-utils';

describe('<PreviewCard.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<PreviewCard.Positioner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <PreviewCard.Root open animated={false}>
          {node}
        </PreviewCard.Root>,
      );
    },
  }));
});
