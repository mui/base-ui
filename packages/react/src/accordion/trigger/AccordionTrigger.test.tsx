import { Accordion } from '@base-ui/react/accordion';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Accordion.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render: (node) =>
      render(
        <Accordion.Root>
          <Accordion.Item>{node}</Accordion.Item>
        </Accordion.Root>,
      ),
  }));
});
