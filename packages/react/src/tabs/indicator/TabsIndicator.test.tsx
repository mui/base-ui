import { expect } from 'chai';
import { Tabs } from '@base-ui/react/tabs';
import { waitFor, screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { getCssDimensions } from '../../utils/getCssDimensions';

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
    it('should not render when no tab is active', async () => {
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
      activeTab: HTMLElement,
    ) {
      const tabRect = activeTab.getBoundingClientRect();
      const tabListRect = tabList.getBoundingClientRect();
      const { width: tabWidth, height: tabHeight } = getCssDimensions(activeTab);
      const { width: tabListWidth, height: tabListHeight } = getCssDimensions(tabList);
      const scaleX = tabListWidth > 0 ? tabListRect.width / tabListWidth : 1;
      const scaleY = tabListHeight > 0 ? tabListRect.height / tabListHeight : 1;

      const relativeLeft =
        (tabRect.left - tabListRect.left) / scaleX + tabList.scrollLeft - tabList.clientLeft;
      const relativeTop =
        (tabRect.top - tabListRect.top) / scaleY + tabList.scrollTop - tabList.clientTop;
      const relativeRight = tabList.scrollWidth - relativeLeft - tabWidth;
      const relativeBottom = tabList.scrollHeight - relativeTop - tabHeight;

      const bubbleComputedStyle = window.getComputedStyle(bubble);
      const actualLeft = bubbleComputedStyle.getPropertyValue('--active-tab-left');
      const actualRight = bubbleComputedStyle.getPropertyValue('--active-tab-right');
      const actualTop = bubbleComputedStyle.getPropertyValue('--active-tab-top');
      const actualBottom = bubbleComputedStyle.getPropertyValue('--active-tab-bottom');
      const actualWidth = bubbleComputedStyle.getPropertyValue('--active-tab-width');
      const actualHeight = bubbleComputedStyle.getPropertyValue('--active-tab-height');

      assertSize(actualLeft, relativeLeft);
      assertSize(actualRight, relativeRight);
      assertSize(actualTop, relativeTop);
      assertSize(actualBottom, relativeBottom);
      assertSize(actualWidth, tabWidth);
      assertSize(actualHeight, tabHeight);
    }

    it('should set CSS variables corresponding to the active tab', async () => {
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
      const activeTab = tabs[1];
      const tabList = screen.getByRole('tablist');

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
      });
    });

    it('should update the position and movement variables when the active tab changes', async () => {
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
      let activeTab = tabs[2];
      const tabList = screen.getByRole('tablist');

      assertBubblePositionVariables(bubble, tabList, activeTab);

      await setProps({ value: 1 });
      activeTab = tabs[0];
      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
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
      const activeTab = tabs[0];
      const tabList = screen.getByRole('tablist');

      assertBubblePositionVariables(bubble, tabList, activeTab);

      await setProps({
        style: { width: '800px' },
      });

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
      });
    });

    it('should account for scroll and border when the tab list is transformed', async () => {
      await render(
        <div style={{ transform: 'scale(1.5)' }}>
          <Tabs.Root value={3}>
            <Tabs.List
              data-testid="tab-list"
              style={{
                width: '240px',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                border: '6px solid black',
                padding: '4px',
              }}
            >
              <Tabs.Tab value={1} style={{ flex: '0 0 120px' }}>
                One
              </Tabs.Tab>
              <Tabs.Tab value={2} style={{ flex: '0 0 120px' }}>
                Two
              </Tabs.Tab>
              <Tabs.Tab value={3} style={{ flex: '0 0 120px' }}>
                Three
              </Tabs.Tab>
              <Tabs.Tab value={4} style={{ flex: '0 0 120px' }}>
                Four
              </Tabs.Tab>
              <Tabs.Tab value={5} style={{ flex: '0 0 120px' }}>
                Five
              </Tabs.Tab>
              <Tabs.Indicator data-testid="bubble" />
            </Tabs.List>
          </Tabs.Root>
        </div>,
      );

      const bubble = screen.getByTestId('bubble');
      const tabList = screen.getByTestId('tab-list');
      const activeTab = screen.getAllByRole('tab')[2];

      tabList.scrollLeft = 80;

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
      });
    });
  });
});
