import * as React from 'react';
import { expect } from 'chai';
import { Tabs } from '@base-ui-components/react/tabs';
import { describeSkipIf, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Tabs.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Tabs.Indicator />, () => ({
    render: (node) => {
      return render(
        <Tabs.Root defaultValue={1}>
          <Tabs.List>
            <Tabs.Tab value={1} />
            {node}
          </Tabs.List>
        </Tabs.Root>,
      );
    },
    refInstanceof: window.HTMLSpanElement,
    testRenderPropWith: 'div',
  }));

  describeSkipIf(/jsdom/.test(window.navigator.userAgent))('rendering', () => {
    it('should not render when no tab is selected', async () => {
      const { queryByTestId } = await render(
        <Tabs.Root value={null}>
          <Tabs.List>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>,
      );

      expect(queryByTestId('bubble')).to.equal(null);
    });

    function assertSize(actual: string, expected: number) {
      const actualNumber = parseFloat(actual);
      expect(actualNumber).to.be.closeTo(expected, 0.01);
    }

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

      const relativeLeft = tabLeft - listLeft;
      const relativeRight = listRight - tabRight;
      const relativeTop = tabTop - listTop;
      const relativeBottom = listBottom - tabBottom;

      const bubbleComputedStyle = window.getComputedStyle(bubble);
      const actualLeft = bubbleComputedStyle.getPropertyValue('--active-tab-left');
      const actualRight = bubbleComputedStyle.getPropertyValue('--active-tab-right');
      const actualTop = bubbleComputedStyle.getPropertyValue('--active-tab-top');
      const actualBottom = bubbleComputedStyle.getPropertyValue('--active-tab-bottom');

      assertSize(actualLeft, relativeLeft);
      assertSize(actualRight, relativeRight);
      assertSize(actualTop, relativeTop);
      assertSize(actualBottom, relativeBottom);
    }

    it('should set CSS variables corresponding to the active tab', async () => {
      const { getByTestId, getByRole, getAllByRole } = await render(
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

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
      });
    });

    it('should update the position and movement variables when the active tab changes', async () => {
      const { getByTestId, getByRole, getAllByRole, setProps } = await render(
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

      setProps({ value: 1 });
      activeTab = tabs[0];
      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
      });
    });

    it('should update the position variables when the tab list is resized', async () => {
      const { getByTestId, getByRole, getAllByRole, setProps } = await render(
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

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
      });
    });
  });
});
