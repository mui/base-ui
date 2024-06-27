import * as React from 'react';
import * as HoverCard from '@base_ui/react/HoverCard';
import { describeConformance } from '../../../test/describeConformance';
import { createRenderer } from '../../../test';

describe('<HoverCard.Backdrop />', () => {
  const { render } = createRenderer();

  describeConformance(<HoverCard.Backdrop />, () => ({
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
