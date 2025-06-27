import * as React from 'react';
import { Tabs } from '@base-ui-components/react/tabs';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tabs.Tab />', () => {
  const { render } = createRenderer();

  describeConformance(<Tabs.Tab value="1" />, () => ({
    render: (node) =>
      render(
        <Tabs.Root>
          <Tabs.List>{node}</Tabs.List>
        </Tabs.Root>,
      ),
    refInstanceof: window.HTMLButtonElement,
  }));
});
