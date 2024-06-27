import * as React from 'react';
import * as HoverCard from '@base_ui/react/HoverCard';
import { createRenderer } from '../../../test';
import { describeConformance } from '../../../test/describeConformance';

describe('<HoverCard.Positioner />', () => {
  const { render } = createRenderer();

  describeConformance(<HoverCard.Positioner />, () => ({
    inheritComponent: 'div',
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <HoverCard.Root open animated={false}>
          {node}
        </HoverCard.Root>,
      );
    },
    skip: ['reactTestRenderer'],
  }));
});
