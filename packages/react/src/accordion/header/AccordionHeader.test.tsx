import * as React from 'react';
import { Accordion } from '@base-ui-components/react/accordion';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Accordion.Header />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Header />, () => ({
    render: (node) =>
      render(
        <Accordion.Root>
          <Accordion.Item value={0}>{node}</Accordion.Item>
        </Accordion.Root>,
      ),
    refInstanceof: window.HTMLHeadingElement,
  }));
});
