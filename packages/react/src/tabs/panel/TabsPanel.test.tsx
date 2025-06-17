import * as React from 'react';
import { expect } from 'chai';
import { Tabs } from '@base-ui-components/react/tabs';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tabs.Panel />', () => {
  const { render } = createRenderer();

  describeConformance(<Tabs.Panel value="1" />, () => ({
    render: (node) => render(<Tabs.Root>{node}</Tabs.Root>),
    refInstanceof: window.HTMLDivElement,
  }));

  describe('accessibility attributes', () => {
    it('set the aria-labelledby attribute referencing the associated tab', async () => {
      const { getByText, getByTestId } = await render(
        <Tabs.Root defaultValue="1">
          <Tabs.List>
            <Tabs.Tab value="1">Tab 1</Tabs.Tab>
            <Tabs.Tab id="custom-id" value="2">
              Tab 2
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="1" data-testid="panel-1">
            Panel 1
          </Tabs.Panel>
          <Tabs.Panel value="2" data-testid="panel-2">
            Panel 2
          </Tabs.Panel>
        </Tabs.Root>,
      );

      const tab1 = getByText('Tab 1');
      const tab2 = getByText('Tab 2');
      const panel1 = getByTestId('panel-1');
      const panel2 = getByTestId('panel-2');

      expect(panel1).to.have.attribute('aria-labelledby', tab1.id);
      expect(panel2).to.have.attribute('aria-labelledby', tab2.id);
    });
  });
});
