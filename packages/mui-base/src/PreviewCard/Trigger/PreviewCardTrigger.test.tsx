import * as React from 'react';
import * as PreviewCard from '@base_ui/react/PreviewCard';
import { createRenderer, describeConformance } from '../../../test';

describe('<PreviewCard.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<PreviewCard.Trigger />, () => ({
    refInstanceof: window.HTMLAnchorElement,
    render(node) {
      return render(
        <PreviewCard.Root open animated={false}>
          {node}
        </PreviewCard.Root>,
      );
    },
  }));
});
