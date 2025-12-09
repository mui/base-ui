import { Accordion } from '@base-ui/react/accordion';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Accordion.Panel />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Panel keepMounted />, () => ({
    render: (node) =>
      render(
        <Accordion.Root>
          <Accordion.Item>{node}</Accordion.Item>
        </Accordion.Root>,
      ),
    refInstanceof: window.HTMLDivElement,
  }));
});
