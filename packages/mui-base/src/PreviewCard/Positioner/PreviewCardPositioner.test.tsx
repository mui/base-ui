import * as React from 'react';
import * as PreviewCard from '@base_ui/react/PreviewCard';
import { createRenderer } from '../../../test';
import { describeConformance } from '../../../test/describeConformance';

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
