import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { expect, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import {
  ListVirtualizer,
  type ListVirtualizerRenderRowParameters,
  type ListVirtualizerRow,
} from './ListVirtualizer';
import type { ListVirtualizerHandle } from './ListVirtualizationRegistry';

interface TestRowModel {
  label: string;
}

describe('<ListVirtualizer />', () => {
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
    const rows = createRows(100);

    await render(
      <ListVirtualizer
        estimatedItemHeight={20}
        overscanPx={20}
        render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" role="list" />}
        renderRow={renderRow}
        rows={rows}
        totalSizeCssVariable="--list-size"
      />,
    );

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(5));

    expect(screen.getByText('Item 5')).not.toBe(null);
    expect(screen.queryByText('Item 20')).toBe(null);

    const virtualizer = screen.getByTestId('virtualizer');
    expect(virtualizer).toHaveStyle({ overflow: 'auto' });
    expect(virtualizer.style.getPropertyValue('--list-size')).toBe('2000px');
  });

  it('retains a pinned row outside the rendered window', async () => {
    await render(
      <ListVirtualizer
        estimatedItemHeight={20}
        overscanPx={0}
        pinnedRowIndex={50}
        render={<div ref={setElementClientHeight(40)} />}
        renderRow={renderRow}
        rows={createRows(100)}
      />,
    );

    const pinnedRow = await screen.findByText('Item 51');

    expect(pinnedRow.parentElement).toHaveStyle({
      position: 'absolute',
    });
    expect(pinnedRow.parentElement?.style.transform).toBe('translateX(-10000px)');
  });

  it('renders a pinned row at the half-open bottom boundary', async () => {
    await render(
      <ListVirtualizer
        estimatedItemHeight={20}
        overscanPx={0}
        pinnedRowIndex={3}
        render={<div ref={setElementClientHeight(40)} />}
        renderRow={renderRow}
        rows={createRows(100)}
      />,
    );

    expect(await screen.findByText('Item 4')).not.toBe(null);
  });

  it('does not rerender rows retained between virtual windows', async () => {
    const renderRowSpy = vi.fn(renderRow);

    await render(
      <ListVirtualizer
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
        renderRow={renderRowSpy}
        rows={createRows(100)}
      />,
    );

    await screen.findByText('Item 2');
    const initiallyRenderedIndexes = new Set(
      renderRowSpy.mock.calls.map(([params]) => params.rowIndex),
    );
    const initialRenderCount = renderRowSpy.mock.calls.filter(
      ([params]) => params.rowIndex === 1,
    ).length;

    const virtualizer = screen.getByTestId('virtualizer');
    virtualizer.scrollTop = 20;
    fireEvent.scroll(virtualizer);

    await waitFor(() =>
      expect(
        renderRowSpy.mock.calls.some(([params]) => !initiallyRenderedIndexes.has(params.rowIndex)),
      ).toBe(true),
    );
    expect(renderRowSpy.mock.calls.filter(([params]) => params.rowIndex === 1)).toHaveLength(
      initialRenderCount,
    );
    expect(virtualizer.scrollTop).toBe(20);
  });

  it.skipIf(isJSDOM)('resolves calculated scroll padding against the scrollport', async () => {
    vi.restoreAllMocks();

    const scrollTo = vi.fn();
    await render(
      <ListVirtualizer
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
        renderRow={renderRow}
        rows={createRows(20)}
        scrollToRowIndex={17}
      />,
    );

    await waitFor(() =>
      expect(scrollTo).toHaveBeenLastCalledWith({
        behavior: 'instant',
        top: 285,
      }),
    );
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
              <ListVirtualizer
                estimatedItemHeight={20}
                overscanPx={0}
                render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
                renderRow={renderMixedRow}
                rows={createRows(300)}
              />,
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

  it.skipIf(isJSDOM)('refines a static estimate with the measured row average', async () => {
    vi.restoreAllMocks();

    await render(
      <ListVirtualizer
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
        renderRow={renderTallRow}
        rows={createRows(200)}
      />,
    );

    const virtualizer = screen.getByTestId('virtualizer');

    // Once the initial window measures 60px rows, the running average replaces the 20px
    // estimate for all unmeasured rows, converging the total from 200 × 20 = 4000px to
    // 200 × 60 = 12000px without scrolling through the list.
    await waitFor(() => expect(virtualizer.scrollHeight).toBeGreaterThanOrEqual(11900));
    expect(virtualizer.scrollHeight).toBeLessThanOrEqual(12100);
  });

  it.skipIf(isJSDOM)('does not seed the estimate with transient mount measurements', async () => {
    vi.restoreAllMocks();
    const rows = createRows(200);

    function Test(props: { rowHeight: number }) {
      return (
        <ListVirtualizer
          estimatedItemHeight={20}
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
          renderRow={(params) => (
            <div role="listitem" style={{ height: props.rowHeight }}>
              {params.row.model.label}
            </div>
          )}
          rows={rows}
        />
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
      <ListVirtualizer
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
        renderRow={renderMixedRow}
        rows={createRows(300)}
      />,
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
        <ListVirtualizer
          estimatedItemHeight={20}
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
          renderRow={renderMixedRow}
          rows={createRows(300)}
        />,
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
    'keeps the viewport pinned to the bottom when the final rows change the total size',
    async () => {
      vi.restoreAllMocks();

      await render(
        <ListVirtualizer
          estimatedItemHeight={20}
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 120, width: 200 }} />}
          renderRow={renderMixedRow}
          rows={createRows(300)}
        />,
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

  it('scrolls to an index with the requested alignment', async () => {
    const apiRef = React.createRef<ListVirtualizerHandle>();
    const scrollTo = vi.fn<(options: ScrollToOptions) => void>();
    let scrollTop = 0;

    await render(
      <ListVirtualizer
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
                  scrollTop = options.top ?? scrollTop;
                  scrollTo(options);
                },
              });
            }}
            data-testid="virtualizer"
          />
        }
        renderRow={renderRow}
        rows={createRows(100)}
      />,
    );

    const renderZone = screen
      .getByTestId('virtualizer')
      .querySelector<HTMLElement>('[style*="translate3d"]');

    act(() => apiRef.current?.scrollToIndex(10, { align: 'start' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 200 });
    // The native scroll event arrives later; the sticky render zone must move with the immediate
    // scroll write so the old window keeps covering the viewport in the meantime.
    expect(renderZone?.style.transform).toContain('-200px');

    act(() => apiRef.current?.scrollToIndex(10, { align: 'center' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 160 });

    act(() => apiRef.current?.scrollToIndex(10, { align: 'end' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 120 });

    scrollTop = 0;
    act(() => apiRef.current?.scrollToIndex(10));
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 120 });
  });

  it('keeps the render zone in place when the scroll element rejects a requested position', async () => {
    const apiRef = React.createRef<ListVirtualizerHandle>();
    const scrollTo = vi.fn<(options: ScrollToOptions) => void>();

    await render(
      <ListVirtualizer
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
                get: () => 0,
              });
              Object.defineProperty(element, 'scrollTo', {
                configurable: true,
                value: scrollTo,
              });
            }}
            data-testid="virtualizer"
          />
        }
        renderRow={renderRow}
        rows={createRows(100)}
      />,
    );

    const renderZone = screen
      .getByTestId('virtualizer')
      .querySelector<HTMLElement>('[style*="translate3d"]');

    act(() => apiRef.current?.scrollToIndex(10, { align: 'start' }));

    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 200 });
    expect(renderZone?.style.transform).toMatch(/^translate3d\(0(?:px)?, 0px, 0(?:px)?\)$/);
  });
});

function createRows(count: number): ListVirtualizerRow<TestRowModel>[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    model: {
      label: `Item ${index + 1}`,
    },
  }));
}

function renderRow(params: ListVirtualizerRenderRowParameters<TestRowModel>) {
  return (
    <div role="listitem" style={{ height: 20 }}>
      {params.row.model.label}
    </div>
  );
}

function renderTallRow(params: ListVirtualizerRenderRowParameters<TestRowModel>) {
  return (
    <div role="listitem" style={{ height: 60 }}>
      {params.row.model.label}
    </div>
  );
}

/** Short rows up front and tall rows later, so the measured average changes while scrolling. */
function renderMixedRow(params: ListVirtualizerRenderRowParameters<TestRowModel>) {
  return (
    <div role="listitem" style={{ height: params.rowIndex < 50 ? 20 : 100 }}>
      {params.row.model.label}
    </div>
  );
}

function setElementClientHeight(clientHeight: number) {
  return (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }

    element.style.height = `${clientHeight}px`;
    Object.defineProperty(element, 'clientHeight', {
      configurable: true,
      value: clientHeight,
    });
    Object.defineProperty(element, 'scrollTo', {
      configurable: true,
      value: (options: ScrollToOptions) => {
        element.scrollTop = options.top ?? element.scrollTop;
      },
    });
  };
}

function createDOMRect(rect: Partial<DOMRectInit>) {
  return {
    x: rect.x ?? 0,
    y: rect.y ?? 0,
    width: rect.width ?? 0,
    height: rect.height ?? 0,
    top: rect.y ?? 0,
    left: rect.x ?? 0,
    right: (rect.x ?? 0) + (rect.width ?? 0),
    bottom: (rect.y ?? 0) + (rect.height ?? 0),
    toJSON() {
      return this;
    },
  } as DOMRect;
}
