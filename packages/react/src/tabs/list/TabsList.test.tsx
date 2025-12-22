import * as React from 'react';
import { expect } from 'chai';
import { act, screen } from '@mui/internal-test-utils';
import { Tabs } from '@base-ui/react/tabs';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tabs.List />', () => {
  const { render } = createRenderer();

  describeConformance(<Tabs.List />, () => ({
    render: (node) => render(<Tabs.Root>{node}</Tabs.Root>),
    refInstanceof: window.HTMLDivElement,
  }));

  describe('accessibility attributes', () => {
    it('sets the aria-selected attribute on the active tab', async () => {
      await render(
        <Tabs.Root defaultValue={1}>
          <Tabs.List>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
            <Tabs.Tab value={3}>Tab 3</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>,
      );

      const tab1 = screen.getByText('Tab 1');
      const tab2 = screen.getByText('Tab 2');
      const tab3 = screen.getByText('Tab 3');

      expect(tab1).to.have.attribute('aria-selected', 'true');
      expect(tab2).to.have.attribute('aria-selected', 'false');
      expect(tab3).to.have.attribute('aria-selected', 'false');

      await act(async () => {
        tab2.click();
      });

      expect(tab1).to.have.attribute('aria-selected', 'false');
      expect(tab2).to.have.attribute('aria-selected', 'true');
      expect(tab3).to.have.attribute('aria-selected', 'false');

      await act(async () => {
        tab3.click();
      });

      expect(tab1).to.have.attribute('aria-selected', 'false');
      expect(tab2).to.have.attribute('aria-selected', 'false');
      expect(tab3).to.have.attribute('aria-selected', 'true');

      await act(async () => {
        tab1.click();
      });

      expect(tab1).to.have.attribute('aria-selected', 'true');
      expect(tab2).to.have.attribute('aria-selected', 'false');
      expect(tab3).to.have.attribute('aria-selected', 'false');
    });
  });

  it('can be named via `aria-label`', async () => {
    await render(
      <Tabs.Root defaultValue={0}>
        <Tabs.List aria-label="string label">
          <Tabs.Tab value={0} />
        </Tabs.List>
      </Tabs.Root>,
    );

    expect(screen.getByRole('tablist')).toHaveAccessibleName('string label');
  });

  it('can be named via `aria-labelledby`', async () => {
    await render(
      <React.Fragment>
        <h3 id="label-id">complex name</h3>
        <Tabs.Root defaultValue={0}>
          <Tabs.List aria-labelledby="label-id">
            <Tabs.Tab value={0} />
          </Tabs.List>
        </Tabs.Root>
      </React.Fragment>,
    );

    expect(screen.getByRole('tablist')).toHaveAccessibleName('complex name');
  });
});
