import { expect } from 'vitest';
import { Accordion } from '@base-ui/react/accordion';
import { describeConformance, createRenderer } from '#test-utils';

describe('<Accordion.Header />', () => {
  const { render } = createRenderer();

  it('throws when rendered outside an Accordion.Item', async () => {
    await expect(render(<Accordion.Header />)).rejects.toThrow(
      'Base UI: AccordionItemContext is missing. Accordion parts must be placed within <Accordion.Item>.',
    );
  });

  describeConformance(<Accordion.Header />, () => ({
    render: (node) =>
      render(
        <Accordion.Root>
          <Accordion.Item>{node}</Accordion.Item>
        </Accordion.Root>,
      ),
    refInstanceof: window.HTMLHeadingElement,
  }));
});
