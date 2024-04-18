import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import * as Tabs from '@base_ui/react/Tabs';
import { describeConformance } from '../../../test/describeConformance';

async function waitForNextEventCycle() {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    });
  });
}

function round(value: number) {
  return Math.round(value * 100) * 0.01;
}

describe('<Tabs.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Tabs.Indicator />, () => ({
    inheritComponent: 'span',
    render: (node) => {
      const { container, ...other } = render(
        <Tabs.Root defaultValue={1}>
          <Tabs.List>
            <Tabs.Tab value={1} />
            {node}
          </Tabs.List>
        </Tabs.Root>,
      );

      return { container, ...other };
    },
    refInstanceof: window.HTMLSpanElement,
    testRenderPropWith: 'div',
    skip: [
      'reactTestRenderer', // Need to be wrapped with TabsContext
    ],
  }));

  describe('rendering', () => {
    before(function suite() {
      if (/jsdom/.test(window.navigator.userAgent)) {
        this.skip();
      }
    });

    it('should not render when no tab is selected', () => {
      const { queryByTestId } = render(
        <Tabs.Root value={null}>
          <Tabs.List>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>,
      );

      expect(queryByTestId('bubble')).to.equal(null);
    });

    function assertBubblePositionVariables(
      bubble: HTMLElement,
      tabList: HTMLElement,
      activeTab: HTMLElement,
    ) {
      const {
        left: listLeft,
        top: listTop,
        right: listRight,
        bottom: listBottom,
      } = tabList.getBoundingClientRect();

      const {
        left: tabLeft,
        right: tabRight,
        top: tabTop,
        bottom: tabBottom,
      } = activeTab.getBoundingClientRect();

      const relativeLeft = round(tabLeft - listLeft);
      const relativeRight = round(listRight - tabRight);
      const relativeTop = round(tabTop - listTop);
      const relativeBottom = round(listBottom - tabBottom);

      expect(window.getComputedStyle(bubble).getPropertyValue('--active-tab-left')).to.equal(
        `${relativeLeft}px`,
      );

      expect(window.getComputedStyle(bubble).getPropertyValue('--active-tab-right')).to.equal(
        `${relativeRight}px`,
      );

      expect(window.getComputedStyle(bubble).getPropertyValue('--active-tab-top')).to.equal(
        `${relativeTop}px`,
      );

      expect(window.getComputedStyle(bubble).getPropertyValue('--active-tab-bottom')).to.equal(
        `${relativeBottom}px`,
      );
    }

    it('should set CSS variables corresponding to the active tab', () => {
      const { getByTestId, getByRole, getAllByRole } = render(
        <Tabs.Root value={2}>
          <Tabs.List>
            <Tabs.Tab value={1}>One</Tabs.Tab>
            <Tabs.Tab value={2}>Two</Tabs.Tab>
            <Tabs.Tab value={3}>Three</Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>,
      );

      const bubble = getByTestId('bubble');
      const tabs = getAllByRole('tab');
      const activeTab = tabs[1];
      const tabList = getByRole('tablist');

      assertBubblePositionVariables(bubble, tabList, activeTab);
    });

    it('should update the position and movement variables when the active tab changes', () => {
      const { getByTestId, getByRole, getAllByRole, setProps } = render(
        <Tabs.Root value={2}>
          <Tabs.List>
            <Tabs.Tab value={1}>One</Tabs.Tab>
            <Tabs.Tab value={2}>Two</Tabs.Tab>
            <Tabs.Tab value={3}>Three</Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>,
      );

      setProps({ value: 3 });

      const bubble = getByTestId('bubble');
      const tabs = getAllByRole('tab');
      let activeTab = tabs[2];
      const tabList = getByRole('tablist');

      assertBubblePositionVariables(bubble, tabList, activeTab);
      expect(bubble.getAttribute('data-movement-direction')).to.equal('next');

      setProps({ value: 1 });
      activeTab = tabs[0];
      assertBubblePositionVariables(bubble, tabList, activeTab);
      expect(bubble.getAttribute('data-movement-direction')).to.equal('previous');
    });

    it('should update the position variables when the tab list is resized', async () => {
      const { getByTestId, getByRole, getAllByRole, setProps } = render(
        <Tabs.Root value={1} style={{ width: '400px' }}>
          <Tabs.List style={{ display: 'flex' }}>
            <Tabs.Tab value={1} style={{ flex: '1 1 auto' }}>
              One
            </Tabs.Tab>
            <Tabs.Tab value={2} style={{ flex: '1 1 auto' }}>
              Two
            </Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>,
      );

      const bubble = getByTestId('bubble');
      const tabs = getAllByRole('tab');
      const activeTab = tabs[0];
      const tabList = getByRole('tablist');

      assertBubblePositionVariables(bubble, tabList, activeTab);

      setProps({
        style: { width: '800px' },
      });

      // wait for the resize observer to trigger
      await waitForNextEventCycle();
      assertBubblePositionVariables(bubble, tabList, activeTab);
    });
  });
});
