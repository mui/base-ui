import * as React from 'react';
import * as PreviewCard from '@base_ui/react/PreviewCard';
import { createRenderer, describeConformance } from '../../../test';

describe('<PreviewCard.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<PreviewCard.Backdrop />, () => ({
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
