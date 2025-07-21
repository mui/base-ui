import * as React from 'react';
import { Accordion } from '@base-ui-components/react/accordion';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Accordion.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Item />, () => ({
    render: (node) => {
      return render(<Accordion.Root>{node}</Accordion.Root>);
    },
    refInstanceof: window.HTMLDivElement,
  }));
});
