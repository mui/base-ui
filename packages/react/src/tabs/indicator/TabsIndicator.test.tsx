import { expect } from 'chai';
import { Tabs } from '@base-ui-components/react/tabs';
import { waitFor, screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

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

  describe.skipIf(isJSDOM)('rendering', () => {
    it('should not render when no tab is selected', async () => {
      await render(
        <Tabs.Root value={null}>
          <Tabs.List>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>,
      );

      expect(screen.queryByTestId('bubble')).to.equal(null);
    });

    function assertSize(actual: string, expected: number) {
      const actualNumber = parseFloat(actual);
      expect(actualNumber).to.be.closeTo(expected, 0.01);
    }

    function assertBubblePositionVariables(
      bubble: HTMLElement,
      tabList: HTMLElement,
      selectedTab: HTMLElement,
    ) {
      const relativeLeft = selectedTab.offsetLeft - tabList.clientLeft;
      const { width: rectWidth, height: rectHeight } = selectedTab.getBoundingClientRect();
      const flooredWidth = Math.floor(rectWidth);
      const flooredHeight = Math.floor(rectHeight);
      const relativeRight =
        tabList.scrollWidth - selectedTab.offsetLeft - flooredWidth - tabList.clientLeft;
      const relativeTop = selectedTab.offsetTop - tabList.clientTop;
      const relativeBottom =
        tabList.scrollHeight - selectedTab.offsetTop - flooredHeight - tabList.clientTop;

      const bubbleComputedStyle = window.getComputedStyle(bubble);
      const actualLeft = bubbleComputedStyle.getPropertyValue('--selected-tab-left');
      const actualRight = bubbleComputedStyle.getPropertyValue('--selected-tab-right');
      const actualTop = bubbleComputedStyle.getPropertyValue('--selected-tab-top');
      const actualBottom = bubbleComputedStyle.getPropertyValue('--selected-tab-bottom');
      const actualWidth = bubbleComputedStyle.getPropertyValue('--selected-tab-width');
      const actualHeight = bubbleComputedStyle.getPropertyValue('--selected-tab-height');

      assertSize(actualLeft, relativeLeft);
      assertSize(actualRight, relativeRight);
      assertSize(actualTop, relativeTop);
      assertSize(actualBottom, relativeBottom);
      assertSize(actualWidth, flooredWidth);
      assertSize(actualHeight, flooredHeight);
    }

    it('should set CSS variables corresponding to the selected tab', async () => {
      await render(
        <Tabs.Root value={2}>
          <Tabs.List>
            <Tabs.Tab value={1}>One</Tabs.Tab>
            <Tabs.Tab value={2}>Two</Tabs.Tab>
            <Tabs.Tab value={3}>Three</Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>,
      );

      const bubble = screen.getByTestId('bubble');
      const tabs = screen.getAllByRole('tab');
      const selectedTab = tabs[1];
      const tabList = screen.getByRole('tablist');

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, selectedTab);
      });
    });

    it('should update the position and movement variables when the selected tab changes', async () => {
      const { setProps } = await render(
        <Tabs.Root value={2}>
          <Tabs.List>
            <Tabs.Tab value={1}>One</Tabs.Tab>
            <Tabs.Tab value={2}>Two</Tabs.Tab>
            <Tabs.Tab value={3}>Three</Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>,
      );

      await setProps({ value: 3 });

      const bubble = screen.getByTestId('bubble');
      const tabs = screen.getAllByRole('tab');
      let selectedTab = tabs[2];
      const tabList = screen.getByRole('tablist');

      assertBubblePositionVariables(bubble, tabList, selectedTab);

      await setProps({ value: 1 });
      selectedTab = tabs[0];
      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, selectedTab);
      });
    });

    it('should update the position variables when the tab list is resized', async () => {
      const { setProps } = await render(
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

      const bubble = screen.getByTestId('bubble');
      const tabs = screen.getAllByRole('tab');
      const selectedTab = tabs[0];
      const tabList = screen.getByRole('tablist');

      assertBubblePositionVariables(bubble, tabList, selectedTab);

      await setProps({
        style: { width: '800px' },
      });

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, selectedTab);
      });
    });
  });
});
