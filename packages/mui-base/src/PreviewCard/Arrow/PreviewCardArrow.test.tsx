import * as React from 'react';
import * as PreviewCard from '@base_ui/react/PreviewCard';
import { describeConformance } from '../../../test/describeConformance';
import { createRenderer } from '../../../test';

describe('<PreviewCard.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(<PreviewCard.Arrow />, () => ({
    inheritComponent: 'div',
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
