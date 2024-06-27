import * as React from 'react';
import * as HoverCard from '@base_ui/react/HoverCard';
import { describeConformance } from '../../../test/describeConformance';
import { createRenderer } from '../../../test';

describe('<HoverCard.Arrow />', () => {
  const { render } = createRenderer();

  describeConformance(<HoverCard.Arrow />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <HoverCard.Root open animated={false}>
          <HoverCard.Positioner>
            <HoverCard.Popup>{node}</HoverCard.Popup>
          </HoverCard.Positioner>
        </HoverCard.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));
});
