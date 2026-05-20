import { expect, vi } from 'vitest';
import * as React from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { waitFor, screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { script as prehydrationScript } from './prehydrationScript.min';

describe('<Tabs.Indicator />', () => {
  const { render, renderToString } = createRenderer();

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

      expect(screen.queryByTestId('bubble')).toBe(null);
    });

    function assertClose(actual: number, expected: number, tolerance = 0.5) {
      expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
    }

    function assertBubblePositionVariables(
      bubble: HTMLElement,
      tabList: HTMLElement,
      activeTab: HTMLElement,
      tolerance?: number,
    ) {
      if (!tabList.style.position) {
        tabList.style.position = 'relative';
      }

      Object.assign(bubble.style, {
        position: 'absolute',
        left: '0',
        top: '0',
        right: '',
        bottom: '',
        width: 'var(--active-tab-width)',
        height: 'var(--active-tab-height)',
        transform: 'translate(var(--active-tab-left), var(--active-tab-top))',
      });

      const bubbleRect = bubble.getBoundingClientRect();
      const activeTabRect = activeTab.getBoundingClientRect();

      assertClose(bubbleRect.left, activeTabRect.left, tolerance);
      assertClose(bubbleRect.top, activeTabRect.top, tolerance);
      assertClose(bubbleRect.width, activeTabRect.width, tolerance);
      assertClose(bubbleRect.height, activeTabRect.height, tolerance);
    }

    function assertBubbleEndPositionVariables(
      bubble: HTMLElement,
      tabList: HTMLElement,
      activeTab: HTMLElement,
    ) {
      if (!tabList.style.position) {
        tabList.style.position = 'relative';
      }

      Object.assign(bubble.style, {
        position: 'absolute',
        left: '',
        top: '',
        right: 'var(--active-tab-right)',
        bottom: 'var(--active-tab-bottom)',
        width: 'var(--active-tab-width)',
        height: 'var(--active-tab-height)',
        transform: '',
      });

      const bubbleRectFromEnd = bubble.getBoundingClientRect();
      const activeTabRect = activeTab.getBoundingClientRect();

      assertClose(bubbleRectFromEnd.left, activeTabRect.left);
      assertClose(bubbleRectFromEnd.top, activeTabRect.top);
      assertClose(bubbleRectFromEnd.width, activeTabRect.width);
      assertClose(bubbleRectFromEnd.height, activeTabRect.height);
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
        assertBubbleEndPositionVariables(bubble, tabList, activeTab);
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

    it('preserves fractional tab offsets', async () => {
      await render(
        <Tabs.Root value={2}>
          <Tabs.List
            data-testid="tab-list"
            style={{
              display: 'flex',
              gap: '7.25px',
              position: 'relative',
            }}
          >
            <Tabs.Tab
              value={1}
              style={{
                border: 0,
                boxSizing: 'border-box',
                flex: '0 0 33.3px',
                minWidth: 0,
                padding: 0,
              }}
            >
              One
            </Tabs.Tab>
            <Tabs.Tab
              value={2}
              style={{
                border: 0,
                boxSizing: 'border-box',
                flex: '0 0 44.4px',
                minWidth: 0,
                padding: 0,
              }}
            >
              Two
            </Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>,
      );

      const bubble = screen.getByTestId('bubble');
      const tabList = screen.getByTestId('tab-list');
      const activeTab = screen.getAllByRole('tab')[1];

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab, 0.05);
      });

      const actualLeft = parseFloat(
        window.getComputedStyle(bubble).getPropertyValue('--active-tab-left'),
      );

      expect(Math.abs(actualLeft - Math.round(actualLeft))).toBeGreaterThan(0.1);
    });

    it('tracks visual transforms on the active tab', async () => {
      await render(
        <Tabs.Root value={2}>
          <Tabs.List
            data-testid="tab-list"
            style={{
              display: 'flex',
              gap: '8px',
              position: 'relative',
            }}
          >
            <Tabs.Tab value={1} style={{ flex: '0 0 80px' }}>
              One
            </Tabs.Tab>
            <Tabs.Tab value={2} style={{ flex: '0 0 80px', transform: 'translateX(24px)' }}>
              Two
            </Tabs.Tab>
            <Tabs.Tab value={3} style={{ flex: '0 0 80px' }}>
              Three
            </Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>,
      );

      const bubble = screen.getByTestId('bubble');
      const tabList = screen.getByTestId('tab-list');
      const activeTab = screen.getAllByRole('tab')[1];

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
      });
    });

    it('should account for 3D transforms on ancestors', async () => {
      await render(
        <div style={{ perspective: '1000px' }}>
          <div style={{ transform: 'rotateY(45deg)', transformStyle: 'preserve-3d' }}>
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
          </div>
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

    it('falls back to bounding client rect measurements when layout offsets are unavailable', async () => {
      await render(
        <Tabs.Root value={2}>
          <Tabs.List
            data-testid="tab-list"
            style={{
              position: 'fixed',
              left: '32px',
              top: '48px',
              display: 'flex',
              gap: '8px',
              border: '4px solid black',
              padding: '4px',
            }}
          >
            <Tabs.Tab value={1}>One</Tabs.Tab>
            <Tabs.Tab value={2}>Two</Tabs.Tab>
            <Tabs.Tab value={3}>Three</Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>,
      );

      const bubble = screen.getByTestId('bubble');
      const tabList = screen.getByTestId('tab-list');
      const activeTab = screen.getAllByRole('tab')[1];

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
      });
    });

    it('positions the pre-hydration indicator', async () => {
      const wrapper = document.createElement('div');
      wrapper.style.perspective = '1000px';

      const rotated = document.createElement('div');
      rotated.style.transform = 'rotateY(45deg)';
      rotated.style.transformStyle = 'preserve-3d';

      const tabList = document.createElement('div');
      tabList.setAttribute('role', 'tablist');
      Object.assign(tabList.style, {
        position: 'relative',
        width: '240px',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        border: '6px solid black',
        padding: '4px',
      });

      const tabs = ['One', 'Two', 'Three', 'Four', 'Five'].map((label, index) => {
        const tab = document.createElement('button');
        tab.setAttribute('role', 'tab');
        tab.textContent = label;
        tab.style.flex = '0 0 120px';

        if (index === 2) {
          tab.setAttribute('data-active', '');
        }

        return tab;
      });

      const activeTab = tabs[2];
      const bubble = document.createElement('span');
      bubble.hidden = true;
      bubble.setAttribute('role', 'presentation');

      tabList.append(...tabs, bubble);
      rotated.append(tabList);
      wrapper.append(rotated);
      document.body.append(wrapper);

      try {
        tabList.scrollLeft = 80;

        const script = document.createElement('script');
        script.textContent = prehydrationScript;
        bubble.after(script);

        await waitFor(() => {
          expect(bubble.hidden).toBe(false);
          assertBubblePositionVariables(bubble, tabList, activeTab);
        });
      } finally {
        wrapper.remove();
      }
    });

    it('positions a transformed pre-hydration active tab', async () => {
      const tabList = document.createElement('div');
      tabList.setAttribute('role', 'tablist');
      Object.assign(tabList.style, {
        position: 'relative',
        display: 'flex',
        gap: '8px',
      });

      const tabs = ['One', 'Two', 'Three'].map((label, index) => {
        const tab = document.createElement('button');
        tab.setAttribute('role', 'tab');
        tab.textContent = label;
        tab.style.flex = '0 0 80px';

        if (index === 1) {
          tab.setAttribute('data-active', '');
          tab.style.transform = 'translateX(24px)';
        }

        return tab;
      });

      const activeTab = tabs[1];
      const bubble = document.createElement('span');
      bubble.hidden = true;
      bubble.setAttribute('role', 'presentation');

      tabList.append(...tabs, bubble);
      document.body.append(tabList);

      try {
        const script = document.createElement('script');
        script.textContent = prehydrationScript;
        bubble.after(script);

        await waitFor(() => {
          expect(bubble.hidden).toBe(false);
          assertBubblePositionVariables(bubble, tabList, activeTab);
        });
      } finally {
        tabList.remove();
      }
    });

    it('ignores non-HTMLElement pre-hydration targets', () => {
      const tabList = document.createElement('div');
      tabList.setAttribute('role', 'tablist');

      const activeTab = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      activeTab.setAttribute('data-active', '');

      const bubble = document.createElement('span');
      bubble.hidden = true;
      bubble.setAttribute('role', 'presentation');

      tabList.append(activeTab, bubble);
      document.body.append(tabList);

      try {
        const script = document.createElement('script');
        script.textContent = prehydrationScript;
        bubble.after(script);

        expect(bubble.hidden).toBe(true);
        expect(bubble.style.getPropertyValue('--active-tab-left')).toBe('');
      } finally {
        tabList.remove();
      }
    });

    it('updates position when a different tab resizes', async () => {
      await render(
        <Tabs.Root value={2}>
          <Tabs.List
            data-testid="tab-list"
            style={{ width: '300px', display: 'flex', overflow: 'hidden' }}
          >
            <Tabs.Tab data-testid="first-tab" value={1} style={{ width: '100px', flexShrink: 0 }}>
              One
            </Tabs.Tab>
            <Tabs.Tab value={2} style={{ width: '100px', flexShrink: 0 }}>
              Two
            </Tabs.Tab>
            <Tabs.Tab value={3} style={{ width: '100px', flexShrink: 0 }}>
              Three
            </Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>,
      );

      const bubble = screen.getByTestId('bubble');
      const tabList = screen.getByTestId('tab-list');
      const firstTab = screen.getByTestId('first-tab');
      const activeTab = screen.getAllByRole('tab')[1];

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
      });

      firstTab.setAttribute('style', 'width: 140px; flex-shrink: 0;');

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, activeTab);
      });
    });

    it('updates position when a new tab is inserted and then resized', async () => {
      function TestTabs({ insertedTabWidth }: { insertedTabWidth: number | null }) {
        return (
          <Tabs.Root value={2}>
            <Tabs.List
              data-testid="tab-list"
              style={{ width: '320px', display: 'flex', overflow: 'hidden' }}
            >
              {insertedTabWidth != null && (
                <Tabs.Tab
                  data-testid="inserted-tab"
                  value={0}
                  style={{ width: `${insertedTabWidth}px`, flexShrink: 0 }}
                >
                  Inserted
                </Tabs.Tab>
              )}
              <Tabs.Tab value={1} style={{ width: '100px', flexShrink: 0 }}>
                One
              </Tabs.Tab>
              <Tabs.Tab value={2} style={{ width: '100px', flexShrink: 0 }}>
                Two
              </Tabs.Tab>
              <Tabs.Tab value={3} style={{ width: '100px', flexShrink: 0 }}>
                Three
              </Tabs.Tab>
              <Tabs.Indicator data-testid="bubble" />
            </Tabs.List>
          </Tabs.Root>
        );
      }

      const { setProps } = await render(<TestTabs insertedTabWidth={null} />);

      const bubble = screen.getByTestId('bubble');
      const tabList = screen.getByTestId('tab-list');

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, screen.getByRole('tab', { selected: true }));
      });

      await setProps({ insertedTabWidth: 60 });

      const insertedTab = screen.getByTestId('inserted-tab');

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, screen.getByRole('tab', { selected: true }));
      });

      insertedTab.setAttribute('style', 'width: 120px; flex-shrink: 0;');

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, screen.getByRole('tab', { selected: true }));
      });
    });

    it('updates all indicators when a different tab resizes', async () => {
      await render(
        <Tabs.Root value={2}>
          <Tabs.List
            data-testid="tab-list"
            style={{ width: '300px', display: 'flex', overflow: 'hidden' }}
          >
            <Tabs.Tab data-testid="first-tab" value={1} style={{ width: '100px', flexShrink: 0 }}>
              One
            </Tabs.Tab>
            <Tabs.Tab value={2} style={{ width: '100px', flexShrink: 0 }}>
              Two
            </Tabs.Tab>
            <Tabs.Tab value={3} style={{ width: '100px', flexShrink: 0 }}>
              Three
            </Tabs.Tab>
            <Tabs.Indicator data-testid="bubble-1" />
            <Tabs.Indicator data-testid="bubble-2" />
          </Tabs.List>
        </Tabs.Root>,
      );

      const bubble1 = screen.getByTestId('bubble-1');
      const bubble2 = screen.getByTestId('bubble-2');
      const tabList = screen.getByTestId('tab-list');
      const firstTab = screen.getByTestId('first-tab');
      const activeTab = screen.getAllByRole('tab')[1];

      await waitFor(() => {
        assertBubblePositionVariables(bubble1, tabList, activeTab);
        assertBubblePositionVariables(bubble2, tabList, activeTab);
      });

      firstTab.setAttribute('style', 'width: 140px; flex-shrink: 0;');

      await waitFor(() => {
        assertBubblePositionVariables(bubble1, tabList, activeTab);
        assertBubblePositionVariables(bubble2, tabList, activeTab);
      });
    });

    it('perf: single tab resize does not fan out excessive indicator rerenders', async () => {
      const renderIndicatorSpy = vi.fn();

      const LoggingIndicator = React.forwardRef(function LoggingIndicator(
        props: any & { renderSpy: () => void },
        ref: React.ForwardedRef<HTMLSpanElement>,
      ) {
        const { renderSpy, state, ...other } = props;
        renderSpy();
        return <span {...other} ref={ref} />;
      });

      await render(
        <Tabs.Root value={50}>
          <Tabs.List
            data-testid="tab-list"
            style={{ width: '1200px', display: 'flex', overflow: 'hidden' }}
          >
            {Array.from({ length: 100 }, (_, i) => (
              <Tabs.Tab
                data-testid={`tab-${i + 1}`}
                key={i}
                value={i + 1}
                style={{ width: '120px', flexShrink: 0 }}
              >
                {i + 1}
              </Tabs.Tab>
            ))}
            <Tabs.Indicator
              data-testid="bubble"
              render={<LoggingIndicator renderSpy={renderIndicatorSpy} />}
            />
          </Tabs.List>
        </Tabs.Root>,
      );

      const bubble = screen.getByTestId('bubble');
      const tabList = screen.getByTestId('tab-list');

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, screen.getByRole('tab', { selected: true }));
      });

      const firstTab = screen.getByTestId('tab-1');
      const initialRenderCount = renderIndicatorSpy.mock.calls.length;
      firstTab.setAttribute('style', 'width: 180px; flex-shrink: 0;');

      await waitFor(() => {
        assertBubblePositionVariables(bubble, tabList, screen.getByRole('tab', { selected: true }));
      });

      // React strict mode doubles render calls in tests.
      expect(renderIndicatorSpy.mock.calls.length - initialRenderCount).toBeLessThan(5);
    });
  });

  describe('pre-hydration rendering', () => {
    it('renders the inline pre-hydration script during server-side rendering', async () => {
      await renderToString(
        <Tabs.Root value={1}>
          <Tabs.List>
            <Tabs.Tab value={1}>One</Tabs.Tab>
            <Tabs.Indicator renderBeforeHydration />
          </Tabs.List>
        </Tabs.Root>,
      );

      expect(document.querySelector('script')).not.toBe(null);
    });
  });
});
