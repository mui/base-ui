import { Tabs } from '@base-ui-components/react/tabs';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tabs.Panel />', () => {
  const { render } = createRenderer();

  describeConformance(<Tabs.Panel value="1" />, () => ({
    render: (node) => render(<Tabs.Root>{node}</Tabs.Root>),
    refInstanceof: window.HTMLDivElement,
  }));
});
