import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { expect, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { createRenderer, isJSDOM, createDOMRect, setElementClientHeight } from '#test-utils';
import {
  ListVirtualizationHostContext,
  ListVirtualizationListStateContext,
  type ListVirtualizationHost,
  type ListVirtualizationListState,
} from '../internals/virtualization/ListVirtualizationHostContext';
import {
  createListVirtualizationRegistry,
  type VirtualizerHandle,
} from '../internals/virtualization/ListVirtualizationRegistry';
import type { VirtualizerItemMetadata } from '../internals/virtualization/types';
import { Virtualizer } from './Virtualizer';

interface TestItem {
  label: string;
  /** Overrides the identity derived from the label, for tests that vary row identity. */
  key?: string | number | undefined;
}

const TestVirtualItemContext = React.createContext<VirtualizerItemMetadata | undefined>(undefined);

/**
 * Stands in for a list's `<Item>`: applies the collection metadata the virtualizer supplies and
 * registers itself as the single item rendered for its row.
 */
function TestListItem(props: { children: React.ReactNode; style?: React.CSSProperties }) {
  const virtualItem = React.useContext(TestVirtualItemContext);

  useIsoLayoutEffect(() => virtualItem?.registerItem?.(), [virtualItem]);

  return (
    <div role="listitem" {...virtualItem?.props} style={props.style}>
      {props.children}
    </div>
  );
}

/**
 * Minimal list host, standing in for a component like `<Combobox.List>`. It keeps these tests on
 * the windowing behavior itself, and doubles as a check that the host contract is implementable
 * outside of the components that ship with it.
 */
function TestVirtualizedList(
  props: {
    /** Row retained outside the rendered window. Mapped to a pointer highlight, which never scrolls. */
    pinnedRowIndex?: number | undefined;
    /** Row that should be scrolled into view. Mapped to a keyboard highlight. */
    scrollToRowIndex?: number | undefined;
    /** Receives the imperative handle the virtualizer registers with the list. */
    apiRef?: React.RefObject<VirtualizerHandle | null> | undefined;
    items: TestItem[];
    children: (item: TestItem, index: number) => React.ReactElement;
    getItemKey?: ((item: TestItem) => string | number) | undefined;
  } & Omit<Virtualizer.Props<TestItem>, 'children' | 'getItemKey'>,
) {
  const { apiRef, getItemKey, items, pinnedRowIndex, scrollToRowIndex, ...virtualizerProps } =
    props;

  const registry = React.useRef(createListVirtualizationRegistry()).current;

  const host = React.useMemo<ListVirtualizationHost>(
    () => ({
      componentName: 'Combobox',
      registry,
      virtualItemContext: TestVirtualItemContext,
    }),
    [registry],
  );

  const listState = React.useMemo<ListVirtualizationListState>(
    () => ({
      activeIndex: scrollToRowIndex ?? pinnedRowIndex ?? null,
      items,
      renderAllRows: false,
      // A pinned row is kept mounted without being scrolled to; a scroll target is scrolled to.
      scrollActiveIntoView: scrollToRowIndex != null,
    }),
    [items, pinnedRowIndex, scrollToRowIndex],
  );

  React.useImperativeHandle<VirtualizerHandle | null, VirtualizerHandle | null>(
    apiRef,
    () => registry.virtualizer,
    [registry],
  );

  return (
    <ListVirtualizationHostContext.Provider value={host}>
      <ListVirtualizationListStateContext.Provider value={listState}>
        <Virtualizer<TestItem>
          getItemKey={getItemKey ?? ((item) => item.key ?? item.label)}
          {...virtualizerProps}
        />
      </ListVirtualizationListStateContext.Provider>
    </ListVirtualizationHostContext.Provider>
  );
}

describe('<Virtualizer /> windowing', () => {
  const { render } = createRenderer();

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement,
    ) {
      if (this.hasAttribute('data-row-index')) {
        return createDOMRect({ height: 20, width: 200 });
      }

      return createDOMRect({ height: 60, width: 200 });
    });
  });

  it('windows component-specific row content', async () => {
    const items = createItems(100);

    await render(
      <TestVirtualizedList
        estimatedItemHeight={20}
        overscanPx={20}
        render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" role="list" />}
        items={items}
      >
        {renderItem}
      </TestVirtualizedList>,
    );

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(5));

    expect(screen.getByText('Item 5')).not.toBe(null);
    expect(screen.queryByText('Item 20')).toBe(null);

    const virtualizer = screen.getByTestId('virtualizer');
    expect(virtualizer).toHaveStyle({ overflow: 'auto' });
    expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2000px');
  });

  it('retains a pinned row outside the rendered window', async () => {
    await render(
      <TestVirtualizedList
        estimatedItemHeight={20}
        overscanPx={0}
        pinnedRowIndex={50}
        render={<div ref={setElementClientHeight(40)} />}
        items={createItems(100)}
      >
        {renderItem}
      </TestVirtualizedList>,
    );

    const pinnedRow = await screen.findByText('Item 51');

    expect(pinnedRow.parentElement).toHaveStyle({
      position: 'absolute',
    });
    expect(pinnedRow.parentElement?.style.transform).toBe('translateX(-10000px)');
  });

  it('renders a pinned row at the half-open bottom boundary', async () => {
    await render(
      <TestVirtualizedList
        estimatedItemHeight={20}
        overscanPx={0}
        pinnedRowIndex={3}
        render={<div ref={setElementClientHeight(40)} />}
        items={createItems(100)}
      >
        {renderItem}
      </TestVirtualizedList>,
    );

    expect(await screen.findByText('Item 4')).not.toBe(null);
  });

  it('does not rerender rows retained between virtual windows', async () => {
    const renderItemSpy = vi.fn(renderItem);

    await render(
      <TestVirtualizedList
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
        items={createItems(100)}
      >
        {renderItemSpy}
      </TestVirtualizedList>,
    );

    await screen.findByText('Item 2');
    const initiallyRenderedIndexes = new Set(renderItemSpy.mock.calls.map(([, index]) => index));
    const initialRenderCount = renderItemSpy.mock.calls.filter(([, index]) => index === 1).length;

    const virtualizer = screen.getByTestId('virtualizer');
    virtualizer.scrollTop = 20;
    fireEvent.scroll(virtualizer);

    await waitFor(() =>
      expect(
        renderItemSpy.mock.calls.some(([, index]) => !initiallyRenderedIndexes.has(index)),
      ).toBe(true),
    );
    expect(renderItemSpy.mock.calls.filter(([, index]) => index === 1)).toHaveLength(
      initialRenderCount,
    );
    expect(virtualizer.scrollTop).toBe(20);
  });

  it.skipIf(isJSDOM)('resolves calculated scroll padding against the scrollport', async () => {
    vi.restoreAllMocks();

    const scrollTo = vi.fn();
    await render(
      <TestVirtualizedList
        estimatedItemHeight={20}
        overscanPx={0}
        render={
          <div
            ref={(element) => {
              if (element) {
                Object.defineProperty(element, 'scrollTo', {
                  configurable: true,
                  value: scrollTo,
                });
              }
            }}
            style={{ height: 100, scrollPaddingBottom: 'calc(20% + 5px)', width: 200 }}
          />
        }
        items={createItems(20)}
        scrollToRowIndex={17}
      >
        {renderItem}
      </TestVirtualizedList>,
    );

    await waitFor(() =>
      expect(scrollTo).toHaveBeenLastCalledWith({
        behavior: 'instant',
        top: 285,
      }),
    );
  });

  // A padded scrollport is 100px tall with 10px of block padding, holding 20 rows of 20px.
  describe.skipIf(isJSDOM)('scrollport padding', () => {
    function renderPaddedList(scrollToRowIndex?: number) {
      return render(
        <TestVirtualizedList
          estimatedItemHeight={20}
          overscanPx={0}
          render={
            <div
              data-testid="virtualizer"
              style={{ boxSizing: 'border-box', height: 100, paddingBlock: 10, width: 200 }}
            />
          }
          items={createItems(20)}
          scrollToRowIndex={scrollToRowIndex}
        >
          {renderItem}
        </TestVirtualizedList>,
      );
    }

    it('starts the rows below the padding and counts it in the total size', async () => {
      vi.restoreAllMocks();

      await renderPaddedList();

      const virtualizer = screen.getByTestId('virtualizer');
      const firstRow = await screen.findByText('Item 1');

      await waitFor(() => expect(virtualizer.style.getPropertyValue('--total-size')).toBe('420px'));
      expect(
        firstRow.getBoundingClientRect().top - virtualizer.getBoundingClientRect().top,
      ).toBeCloseTo(10, 1);
      expect(virtualizer.scrollHeight).toBe(420);
    });

    it('keeps the last row above the end padding at the maximum scroll position', async () => {
      vi.restoreAllMocks();

      await renderPaddedList();

      const virtualizer = screen.getByTestId('virtualizer');
      await screen.findByText('Item 1');

      virtualizer.scrollTop = virtualizer.scrollHeight;
      fireEvent.scroll(virtualizer);

      await waitFor(() => expect(virtualizer.scrollTop).toBe(320));

      const lastRow = await screen.findByText('Item 20');
      await waitFor(() =>
        expect(
          virtualizer.getBoundingClientRect().bottom - lastRow.getBoundingClientRect().bottom,
        ).toBeCloseTo(10, 1),
      );
    });

    it('paints rows inside the padding while scrolling', async () => {
      vi.restoreAllMocks();

      await renderPaddedList();

      const virtualizer = screen.getByTestId('virtualizer');
      await screen.findByText('Item 1');

      // Item 11 spans 200-220, so it reaches 5px into the 10px start padding.
      virtualizer.scrollTop = 205;
      fireEvent.scroll(virtualizer);

      await waitFor(() => {
        const rect = virtualizer.getBoundingClientRect();
        const paintedInPadding = document.elementFromPoint(rect.left + 5, rect.top + 7);
        expect(paintedInPadding?.closest('[role="listitem"]')).toHaveTextContent('Item 11');
      });
    });

    it('scrolls a row into view against the padded geometry', async () => {
      vi.restoreAllMocks();

      await renderPaddedList(17);

      const virtualizer = screen.getByTestId('virtualizer');
      await waitFor(() => expect(virtualizer.scrollTop).toBe(270));
    });
  });

  it.skipIf(isJSDOM)(
    'anchors the scroll position when an adaptive estimate updates rows above the viewport',
    async () => {
      vi.restoreAllMocks();

      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      const iframeDocument = iframe.contentDocument;
      if (!iframeDocument) {
        throw new Error('Expected iframe document.');
      }
      const portalContainer = iframeDocument.createElement('div');
      iframeDocument.body.appendChild(portalContainer);

      try {
        await render(
          <React.Fragment>
            {ReactDOM.createPortal(
              <TestVirtualizedList
                estimatedItemHeight={20}
                overscanPx={0}
                render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
                items={createItems(300)}
              >
                {renderMixedItem}
              </TestVirtualizedList>,
              portalContainer,
            )}
          </React.Fragment>,
        );

        const virtualizer = iframeDocument.querySelector<HTMLElement>(
          '[data-testid="virtualizer"]',
        );
        if (!virtualizer) {
          throw new Error('Expected virtualizer.');
        }

        // The initial short rows match the estimate, so the virtual total starts near 300 × 20.
        await waitFor(() => expect(virtualizer.scrollHeight).toBeLessThan(6500));

        // Tall rows later in the collection refine the estimate after scrolling stops. Updating the
        // unmeasured rows above this viewport moves the same logical anchor much farther down.
        const scrollTarget = 2000;
        virtualizer.scrollTop = scrollTarget;
        fireEvent.scroll(virtualizer);

        await waitFor(() => expect(virtualizer.scrollHeight).toBeGreaterThan(15000));
        expect(virtualizer.scrollTop).toBeGreaterThan(scrollTarget);
      } finally {
        iframe.remove();
      }
    },
  );

  // Reduced repro for the app-level finding: with the estimate below the measured height,
  // arrowing past the fold parked the highlighted row entirely below the scrollport and never
  // self-corrected. Measuring the destination row is not enough to settle a scroll request —
  // the rows above it are still estimated, and measuring those later moves the destination.
  it.skipIf(isJSDOM)(
    'corrects a scrolled row that later geometry pushes out of the scrollport',
    async () => {
      vi.restoreAllMocks();
      const items = createItems(200);

      function Test(props: { scrollToRowIndex?: number | undefined }) {
        return (
          <TestVirtualizedList
            estimatedItemHeight={32}
            overscanPx={0}
            render={<div data-testid="virtualizer" style={{ height: 251, width: 200 }} />}
            items={items}
            scrollToRowIndex={props.scrollToRowIndex}
          >
            {renderItemOf(54)}
          </TestVirtualizedList>
        );
      }

      const { rerender } = await render(<Test />);
      const virtualizer = screen.getByTestId('virtualizer');

      // One row at a time, the way arrow-key navigation advances the highlight.
      for (let index = 0; index <= 12; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        await rerender(<Test scrollToRowIndex={index} />);
      }

      // The estimate is refreshed once scrolling goes idle, which rewrites every unmeasured row
      // and moves the destination. The request must survive that and re-align against it.
      await waitFor(() => {
        const row = virtualizer.querySelector('[data-row-index="12"]');
        expect(row).not.toBe(null);

        const scrollerRect = virtualizer.getBoundingClientRect();
        const rowRect = (row as HTMLElement).getBoundingClientRect();
        expect(rowRect.bottom).toBeLessThanOrEqual(scrollerRect.bottom + 1);
        expect(rowRect.top).toBeGreaterThanOrEqual(scrollerRect.top - 1);
      });
    },
  );

  it.skipIf(isJSDOM)('refines a static estimate with the measured row average', async () => {
    vi.restoreAllMocks();

    await render(
      <TestVirtualizedList
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
        items={createItems(200)}
      >
        {renderTallItem}
      </TestVirtualizedList>,
    );

    const virtualizer = screen.getByTestId('virtualizer');

    // Once the initial window measures 60px rows, the running average replaces the 20px
    // estimate for all unmeasured rows, converging the total from 200 × 20 = 4000px to
    // 200 × 60 = 12000px without scrolling through the list.
    await waitFor(() => expect(virtualizer.scrollHeight).toBeGreaterThanOrEqual(11900));
    expect(virtualizer.scrollHeight).toBeLessThanOrEqual(12100);
  });

  it.skipIf(isJSDOM)(
    'retains the refined estimate when a filtered collection expands around an offscreen target',
    async () => {
      vi.restoreAllMocks();
      const items = createItems(200);
      const filteredItems = [items[100]];

      function Test(props: { filtered?: boolean; scrollToRowIndex?: number }) {
        return (
          <TestVirtualizedList
            estimatedItemHeight={20}
            overscanPx={0}
            render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
            items={props.filtered ? filteredItems : items}
            scrollToRowIndex={props.scrollToRowIndex}
          >
            {renderTallItem}
          </TestVirtualizedList>
        );
      }

      const { rerender } = await render(<Test />);
      const virtualizer = screen.getByTestId('virtualizer');

      await waitFor(() => expect(virtualizer.scrollHeight).toBeGreaterThanOrEqual(11900));

      await rerender(<Test filtered />);
      await rerender(<Test scrollToRowIndex={100} />);

      // Filtering must not throw away the estimate learned from the same logical collection.
      // Otherwise reopening at a distant selected item first paints the low estimated position,
      // then visibly jumps when the running average is learned again.
      expect(virtualizer.scrollHeight).toBeGreaterThanOrEqual(11900);
    },
  );

  it.skipIf(isJSDOM)(
    'resets the refined estimate when a replacement collection partially overlaps',
    async () => {
      vi.restoreAllMocks();
      const initialItems = createItems(200).map((item, index) => ({
        label: `Tall ${item.label}`,
        key: index,
      }));
      // Only the first row keeps its identity, so the replacement partially overlaps.
      const replacementItems = createItems(200).map((item, index) => ({
        label: `Short ${item.label}`,
        key: index === 0 ? 0 : index + 1000,
      }));

      function renderVariableItem(item: TestItem) {
        return (
          <TestListItem style={{ height: item.label.startsWith('Tall') ? 60 : 20 }}>
            {item.label}
          </TestListItem>
        );
      }

      function Test(props: { replaced?: boolean }) {
        return (
          <TestVirtualizedList
            estimatedItemHeight={20}
            overscanPx={0}
            render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
            items={props.replaced ? replacementItems : initialItems}
          >
            {renderVariableItem}
          </TestVirtualizedList>
        );
      }

      const { rerender } = await render(<Test />);
      const virtualizer = screen.getByTestId('virtualizer');

      await waitFor(() => expect(virtualizer.scrollHeight).toBeGreaterThanOrEqual(11900));

      await rerender(<Test replaced />);

      await waitFor(() => expect(virtualizer.scrollHeight).toBeLessThanOrEqual(4100));
      expect(virtualizer.scrollHeight).toBeGreaterThanOrEqual(3900);
    },
  );

  it.skipIf(isJSDOM)('does not seed the estimate with transient mount measurements', async () => {
    vi.restoreAllMocks();
    const items = createItems(200);

    function Test(props: { rowHeight: number }) {
      return (
        <TestVirtualizedList
          estimatedItemHeight={20}
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
          items={items}
        >
          {(item) => <TestListItem style={{ height: props.rowHeight }}>{item.label}</TestListItem>}
        </TestVirtualizedList>
      );
    }

    const { rerender } = await render(<Test rowHeight={100} />);
    const virtualizer = screen.getByTestId('virtualizer');

    // The first low estimate mounts more rows than the settled window. Some of these transient
    // measurements remain cached after the range contracts.
    await waitFor(() => expect(virtualizer.scrollHeight).toBeGreaterThan(4000));
    await rerender(<Test rowHeight={40} />);

    // Only the settled rendered range seeds the collection-wide estimate. Stale 100px entries
    // from rows that already unmounted must not keep the total above 200 × 40 = 8000px.
    await waitFor(() => expect(virtualizer.scrollHeight).toBeGreaterThanOrEqual(7900));
    expect(virtualizer.scrollHeight).toBeLessThanOrEqual(8100);
  });

  it.skipIf(isJSDOM)('defers refining the estimate until a scroll gesture ends', async () => {
    vi.restoreAllMocks();

    await render(
      <TestVirtualizedList
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
        items={createItems(300)}
      >
        {renderMixedItem}
      </TestVirtualizedList>,
    );

    const virtualizer = screen.getByTestId('virtualizer');

    // The first window only contains 20px rows, which match the estimate, so the total stays at
    // the estimated 300 × 20 = 6000px.
    await waitFor(() => expect(virtualizer.scrollHeight).toBeLessThan(6500));
    const initialScrollHeight = virtualizer.scrollHeight;

    // Scroll into the region of 100px rows, keeping the gesture alive for longer than the idle
    // window. Refreshing the estimate here would rewrite all 300 rows and move the scrollbar
    // geometry out from under the pointer.
    await act(async () => {
      for (let step = 0; step < 8; step += 1) {
        virtualizer.scrollTop = 2000 + step * 20;
        fireEvent.scroll(virtualizer);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, 40);
        });
      }
    });

    // Newly measured rows still replace their own estimates, so the total moves a little.
    const scrollHeightDuringGesture = virtualizer.scrollHeight;
    expect(scrollHeightDuringGesture).toBeLessThan(initialScrollHeight * 2.5);

    // Once scrolling stops, the average of the measured rows is applied to the whole collection.
    await waitFor(() =>
      expect(virtualizer.scrollHeight).toBeGreaterThan(scrollHeightDuringGesture * 1.5),
    );
  });

  it.skipIf(isJSDOM)(
    'suspends estimate refinement during a scrollbar drag until release',
    async () => {
      vi.restoreAllMocks();

      await render(
        <TestVirtualizedList
          estimatedItemHeight={20}
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
          items={createItems(300)}
        >
          {renderMixedItem}
        </TestVirtualizedList>,
      );

      const virtualizer = screen.getByTestId('virtualizer');

      await waitFor(() => expect(virtualizer.scrollHeight).toBeLessThan(6500));
      const initialScrollHeight = virtualizer.scrollHeight;

      // A native scrollbar drag: scroll bursts with a held mouse button and no wheel events.
      // The pauses exceed the scroll-idle window, which on its own would release the deferred
      // refinement mid-drag and move the scrollbar geometry under the pointer.
      fireEvent.mouseDown(virtualizer);
      for (let step = 0; step < 3; step += 1) {
        virtualizer.scrollTop = 2000 + step * 40;
        fireEvent.scroll(virtualizer);
        // eslint-disable-next-line no-await-in-loop
        await act(
          () =>
            new Promise((resolve) => {
              setTimeout(resolve, 250);
            }),
        );
      }

      // Newly mounted rows are measured, but their real heights are committed together after the
      // drag so the native scrollbar range stays fixed under the pointer.
      expect(Math.abs(virtualizer.scrollHeight - initialScrollHeight)).toBeLessThanOrEqual(1);

      // Releasing the button ends the drag and applies the deferred refinement.
      fireEvent.mouseUp(virtualizer);
      await waitFor(() =>
        expect(virtualizer.scrollHeight).toBeGreaterThan(initialScrollHeight * 2.5),
      );
    },
  );

  it.skipIf(isJSDOM)(
    'keeps geometry frozen when re-dragging through rows demoted by an estimate refresh',
    async () => {
      vi.restoreAllMocks();

      // Three height bands: the middle band is measured mid-drag and later demoted, and its real
      // height must differ from the average the collection settles on, so a stale remeasurement
      // produces an observable geometry change.
      const renderBandedItem = (item: TestItem, index: number) => {
        let height = 20;
        if (index >= 50) {
          height = index < 100 ? 100 : 40;
        }
        return <TestListItem style={{ height }}>{item.label}</TestListItem>;
      };

      await render(
        <TestVirtualizedList
          estimatedItemHeight={20}
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
          items={createItems(300)}
        >
          {renderBandedItem}
        </TestVirtualizedList>,
      );

      const virtualizer = screen.getByTestId('virtualizer');
      await waitFor(() => expect(virtualizer.scrollHeight).toBeLessThan(6500));
      const initialScrollHeight = virtualizer.scrollHeight;

      // First drag: measure the 100px band around one window, then move past it so those rows
      // unmount before release. Their deferred heights commit on release, and the estimate
      // refresh that follows demotes them: they are not part of the settled sample, which the
      // 40px band around the release position dominates.
      fireEvent.mouseDown(virtualizer);
      virtualizer.scrollTop = 1500;
      fireEvent.scroll(virtualizer);
      await act(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          }),
      );
      virtualizer.scrollTop = 3500;
      fireEvent.scroll(virtualizer);
      await act(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          }),
      );
      fireEvent.mouseUp(virtualizer);

      await waitFor(() =>
        expect(virtualizer.scrollHeight).toBeGreaterThan(initialScrollHeight + 1000),
      );
      // Let the post-release estimate refresh, including its demotions, settle.
      await act(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 400);
          }),
      );

      // Second drag: sweep back through the demoted band. Remeasuring those rows mid-drag must
      // defer like any first measurement instead of committing and moving the scrollbar range.
      const settledScrollHeight = virtualizer.scrollHeight;
      fireEvent.mouseDown(virtualizer);
      for (const row of [60, 72, 84]) {
        virtualizer.scrollTop = Math.round((settledScrollHeight / 300) * row);
        fireEvent.scroll(virtualizer);
        // eslint-disable-next-line no-await-in-loop
        await act(
          () =>
            new Promise((resolve) => {
              setTimeout(resolve, 120);
            }),
        );
      }
      await act(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 150);
          }),
      );

      expect(Math.abs(virtualizer.scrollHeight - settledScrollHeight)).toBeLessThanOrEqual(1);

      fireEvent.mouseUp(virtualizer);
    },
  );

  it.skipIf(isJSDOM)(
    'keeps the viewport pinned to the bottom when the final rows change the total size',
    async () => {
      vi.restoreAllMocks();

      await render(
        <TestVirtualizedList
          estimatedItemHeight={20}
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
          items={createItems(300)}
        >
          {renderMixedItem}
        </TestVirtualizedList>,
      );

      const virtualizer = screen.getByTestId('virtualizer');

      await waitFor(() => expect(virtualizer.scrollHeight).toBeLessThan(6500));
      const initialScrollHeight = virtualizer.scrollHeight;

      fireEvent.mouseDown(virtualizer);
      virtualizer.scrollTop = virtualizer.scrollHeight;
      fireEvent.scroll(virtualizer);

      await screen.findByText('Item 300');
      expect(Math.abs(virtualizer.scrollHeight - initialScrollHeight)).toBeLessThanOrEqual(1);

      fireEvent.mouseUp(virtualizer);
      await waitFor(() =>
        expect(virtualizer.scrollHeight).toBeGreaterThan(initialScrollHeight + 100),
      );
      await waitFor(() =>
        expect(
          Math.abs(virtualizer.scrollTop - (virtualizer.scrollHeight - virtualizer.clientHeight)),
        ).toBeLessThanOrEqual(1),
      );
    },
  );

  it.skipIf(isJSDOM)(
    'keeps the final row flush with the scrollport while a scrollbar drag holds the bottom',
    async () => {
      vi.restoreAllMocks();

      await render(
        <TestVirtualizedList
          estimatedItemHeight={20}
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
          items={createItems(300)}
        >
          {renderMixedItem}
        </TestVirtualizedList>,
      );

      const virtualizer = screen.getByTestId('virtualizer');

      await waitFor(() => expect(virtualizer.scrollHeight).toBeLessThan(6500));

      // A native scrollbar drag pinned at the very bottom: the browser maps the thumb to the
      // maximum position of the frozen estimate-based geometry.
      fireEvent.mouseDown(virtualizer);
      virtualizer.scrollTop = virtualizer.scrollHeight;
      fireEvent.scroll(virtualizer);

      await screen.findByText('Item 300');

      // Real tail rows are taller than their frozen estimates. Without bottom anchoring the
      // final row would extend past the scrollport and appear clipped while the button is held.
      await waitFor(() =>
        expect(
          Math.abs(
            screen.getByText('Item 300').getBoundingClientRect().bottom -
              virtualizer.getBoundingClientRect().bottom,
          ),
        ).toBeLessThanOrEqual(1),
      );

      fireEvent.mouseUp(virtualizer);

      // Committing the deferred measurements after release must keep the bottom edge flush.
      await waitFor(() =>
        expect(
          Math.abs(
            screen.getByText('Item 300').getBoundingClientRect().bottom -
              virtualizer.getBoundingClientRect().bottom,
          ),
        ).toBeLessThanOrEqual(1),
      );
    },
  );

  it.skipIf(isJSDOM)(
    'keeps the scrollport covered while post-release geometry rewrites re-pin the bottom',
    async () => {
      vi.restoreAllMocks();

      await render(
        <TestVirtualizedList
          estimatedItemHeight={20}
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
          items={createItems(300)}
        >
          {renderMixedItem}
        </TestVirtualizedList>,
      );

      const virtualizer = screen.getByTestId('virtualizer');
      await waitFor(() => expect(virtualizer.scrollHeight).toBeLessThan(6500));
      const initialScrollHeight = virtualizer.scrollHeight;

      // A native scrollbar drag to the very bottom: a scroll burst with a held mouse button.
      fireEvent.mouseDown(virtualizer);
      virtualizer.scrollTop = virtualizer.scrollHeight;
      fireEvent.scroll(virtualizer);
      await screen.findByText('Item 300');

      // Release commits the deferred drag measurements and the estimate refresh follows; both
      // rewrite the virtual geometry and re-pin the viewport to a new maximum scroll position.
      // Watch every DOM state committed along the way: none may leave part of the scrollport
      // without rows, which the user would see as the list blinking out for a frame.
      const uncoveredStates: string[] = [];
      const observer = new MutationObserver(() => {
        const scrollerRect = virtualizer.getBoundingClientRect();
        let coveredTop = Number.POSITIVE_INFINITY;
        let coveredBottom = Number.NEGATIVE_INFINITY;
        for (const rowElement of virtualizer.querySelectorAll<HTMLElement>('[data-row-index]')) {
          if (rowElement.style.position === 'absolute') {
            continue;
          }
          const rect = rowElement.getBoundingClientRect();
          if (rect.height > 0) {
            coveredTop = Math.min(coveredTop, rect.top);
            coveredBottom = Math.max(coveredBottom, rect.bottom);
          }
        }
        if (coveredTop > scrollerRect.top + 1 || coveredBottom < scrollerRect.bottom - 1) {
          uncoveredStates.push(
            `covered [${coveredTop.toFixed(1)}, ${coveredBottom.toFixed(1)}] of ` +
              `[${scrollerRect.top.toFixed(1)}, ${scrollerRect.bottom.toFixed(1)}] ` +
              `at scrollTop ${virtualizer.scrollTop.toFixed(1)}`,
          );
        }
      });
      observer.observe(virtualizer, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['style'],
      });

      try {
        fireEvent.mouseUp(virtualizer);

        await waitFor(() =>
          expect(virtualizer.scrollHeight).toBeGreaterThan(initialScrollHeight + 100),
        );
        // Let any follow-up estimate refresh and its own re-pin settle as well.
        await act(
          () =>
            new Promise((resolve) => {
              setTimeout(resolve, 400);
            }),
        );
      } finally {
        observer.disconnect();
      }

      expect(uncoveredStates).toEqual([]);
      expect(
        Math.abs(virtualizer.scrollTop - (virtualizer.scrollHeight - virtualizer.clientHeight)),
      ).toBeLessThanOrEqual(1);
    },
  );

  it.skipIf(isJSDOM)(
    'keeps the content anchored when an estimate refresh shrinks the total above the bottom',
    async () => {
      vi.restoreAllMocks();

      // Tall rows up front seed a high estimate; the short remainder keeps lowering the average
      // as it is measured, so each refresh shrinks the virtual total.
      const renderShrinkingItem = (item: TestItem, index: number) => (
        <TestListItem style={{ height: index < 10 ? 100 : 20 }}>{item.label}</TestListItem>
      );

      await render(
        <TestVirtualizedList
          estimatedItemHeight={20}
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
          items={createItems(300)}
        >
          {renderShrinkingItem}
        </TestVirtualizedList>,
      );

      const virtualizer = screen.getByTestId('virtualizer');
      await waitFor(() => expect(virtualizer.scrollHeight).toBeGreaterThan(20000));

      // Scrollbar-drag to the very bottom, release, and let the first refresh settle pinned.
      fireEvent.mouseDown(virtualizer);
      virtualizer.scrollTop = virtualizer.scrollHeight;
      fireEvent.scroll(virtualizer);
      await screen.findByText('Item 300');
      fireEvent.mouseUp(virtualizer);
      await act(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 600);
          }),
      );

      // Scroll up a little; the rows this mounts measure short, so the next idle refresh shrinks
      // the total below the current scroll position and the browser clamps `scrollTop`.
      virtualizer.scrollTop -= 240;
      fireEvent.scroll(virtualizer);
      await act(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 50);
          }),
      );

      const getTopVisibleRow = () => {
        const scrollerRect = virtualizer.getBoundingClientRect();
        let topRow: { index: number; offset: number } | null = null;
        for (const rowElement of virtualizer.querySelectorAll<HTMLElement>('[data-row-index]')) {
          if (rowElement.style.position === 'absolute') {
            continue;
          }
          const rect = rowElement.getBoundingClientRect();
          if (rect.height > 0 && rect.bottom > scrollerRect.top && rect.top < scrollerRect.bottom) {
            if (topRow === null || rect.top < topRow.offset) {
              topRow = { index: Number(rowElement.dataset.rowIndex), offset: rect.top };
            }
          }
        }
        return topRow;
      };

      const tracked = getTopVisibleRow();
      expect(tracked).not.toBe(null);
      const trackedElement = virtualizer.querySelector<HTMLElement>(
        `[data-row-index="${tracked!.index}"]`,
      );
      expect(trackedElement).not.toBe(null);

      // Watch every committed state until the refresh settles: the row the user is looking at
      // must not move on screen even though the geometry rewrite clamps the scroll position.
      const disturbances: string[] = [];
      const observer = new MutationObserver(() => {
        const element = virtualizer.querySelector<HTMLElement>(
          `[data-row-index="${tracked!.index}"]`,
        );
        if (element === null || element.style.position === 'absolute') {
          disturbances.push(`row ${tracked!.index} left the window`);
          return;
        }
        const offset = element.getBoundingClientRect().top;
        if (Math.abs(offset - tracked!.offset) > 2) {
          disturbances.push(
            `row ${tracked!.index} moved from ${tracked!.offset.toFixed(1)} to ${offset.toFixed(1)}`,
          );
        }
      });
      observer.observe(virtualizer, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['style'],
      });

      const scrollHeightBeforeRefresh = virtualizer.scrollHeight;
      try {
        // The refresh fires after the idle window; wait long enough for it and its follow-ups.
        await waitFor(() =>
          expect(virtualizer.scrollHeight).toBeLessThan(scrollHeightBeforeRefresh - 500),
        );
        await act(
          () =>
            new Promise((resolve) => {
              setTimeout(resolve, 400);
            }),
        );
      } finally {
        observer.disconnect();
      }

      expect(disturbances).toEqual([]);
    },
  );

  it('scrolls to an index with the requested alignment', async () => {
    const apiRef = React.createRef<VirtualizerHandle>();
    const scrollTo = vi.fn<(options: ScrollToOptions) => void>();
    let scrollTop = 0;

    await render(
      <TestVirtualizedList
        apiRef={apiRef}
        estimatedItemHeight={20}
        overscanPx={0}
        pinnedRowIndex={10}
        render={
          <div
            ref={(element) => {
              if (!element) {
                return;
              }

              Object.defineProperty(element, 'clientHeight', {
                configurable: true,
                value: 100,
              });
              Object.defineProperty(element, 'scrollTop', {
                configurable: true,
                get: () => scrollTop,
              });
              Object.defineProperty(element, 'scrollTo', {
                configurable: true,
                value: (options: ScrollToOptions) => {
                  scrollTop = options.top ?? scrollTop;
                  scrollTo(options);
                },
              });
            }}
            data-testid="virtualizer"
          />
        }
        items={createItems(100)}
      >
        {renderItem}
      </TestVirtualizedList>,
    );

    const renderZone = screen
      .getByTestId('virtualizer')
      .querySelector<HTMLElement>('[style*="translate3d"]');
    const target = screen.getByText('Item 11').parentElement;
    expect(target).toHaveStyle({ position: 'absolute' });

    act(() => apiRef.current?.scrollToIndex(10, { align: 'start' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 200 });
    // The native scroll event arrives later; the target window must already follow the immediate
    // scroll write instead of leaving the viewport covered by the initial rows or nothing at all.
    expect(screen.getByText('Item 11')).not.toBe(null);
    expect(target).not.toHaveStyle({ position: 'absolute' });
    expect(renderZone?.style.transform).toContain('-20px');

    act(() => apiRef.current?.scrollToIndex(10, { align: 'center' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 160 });

    act(() => apiRef.current?.scrollToIndex(10, { align: 'end' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 120 });

    scrollTop = 0;
    act(() => apiRef.current?.scrollToIndex(10));
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 120 });
  });

  it('renders a requested position the scroll element has not accepted yet', async () => {
    const apiRef = React.createRef<VirtualizerHandle>();
    const scrollTo = vi.fn<(options: ScrollToOptions) => void>();
    let acceptsScroll = false;
    let scrollTop = 0;

    await render(
      <TestVirtualizedList
        apiRef={apiRef}
        estimatedItemHeight={20}
        overscanPx={0}
        render={
          <div
            ref={(element) => {
              if (!element) {
                return;
              }

              Object.defineProperty(element, 'clientHeight', {
                configurable: true,
                value: 100,
              });
              Object.defineProperty(element, 'scrollTop', {
                configurable: true,
                get: () => scrollTop,
              });
              Object.defineProperty(element, 'scrollTo', {
                configurable: true,
                value: (options: ScrollToOptions) => {
                  scrollTo(options);
                  // A scrollport without scrollable overflow clamps the write back to the top.
                  if (acceptsScroll) {
                    scrollTop = options.top ?? 0;
                  }
                },
              });
            }}
            data-testid="virtualizer"
          />
        }
        items={createItems(100)}
      >
        {renderItem}
      </TestVirtualizedList>,
    );

    const renderZone = screen
      .getByTestId('virtualizer')
      .querySelector<HTMLElement>('[style*="translate3d"]');

    act(() => apiRef.current?.scrollToIndex(10, { align: 'start' }));

    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 200 });
    // The scrollport rejected the write, but the rows are laid out for the position it was asked
    // for, so the requested row is on screen in this commit rather than once the scroll lands.
    expect(screen.getByText('Item 11').parentElement).not.toHaveStyle({ position: 'absolute' });
    expect(renderZone?.style.transform).toContain('-20px');

    // Once the scrollport can accept it, the retry brings `scrollTop` in line without moving the
    // rows, which are already where the completed scroll puts them.
    acceptsScroll = true;
    await waitFor(() => expect(scrollTop).toBe(200));
    expect(renderZone?.style.transform).toContain('-20px');
  });
});

function createItems(count: number): TestItem[] {
  return Array.from({ length: count }, (_, index) => ({
    label: `Item ${index + 1}`,
  }));
}

function renderItem(item: TestItem, _index: number) {
  return <TestListItem style={{ height: 20 }}>{item.label}</TestListItem>;
}

function renderItemOf(height: number) {
  return function renderMeasuredItem(item: TestItem) {
    return <TestListItem style={{ height }}>{item.label}</TestListItem>;
  };
}

function renderTallItem(item: TestItem) {
  return <TestListItem style={{ height: 60 }}>{item.label}</TestListItem>;
}

/** Short rows up front and tall rows later, so the measured average changes while scrolling. */
function renderMixedItem(item: TestItem, index: number) {
  return <TestListItem style={{ height: index < 50 ? 20 : 100 }}>{item.label}</TestListItem>;
}
