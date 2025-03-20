import * as React from 'react';
import { Accordion } from '@base-ui-components/react/accordion';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Accordion.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Trigger />, () => ({
    render: (node) =>
      render(
        <Accordion.Root>
          <Accordion.Item>{node}</Accordion.Item>
        </Accordion.Root>,
      ),
    refInstanceof: window.HTMLDivElement,
  }));
});
