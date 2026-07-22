import * as React from 'react';
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
      if (
        this.hasAttribute('data-row-index') ||
        this.firstElementChild?.hasAttribute('data-row-index')
      ) {
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
          />
        }
        renderRow={renderRow}
        rows={createRows(100)}
      />,
    );

    act(() => apiRef.current?.scrollToIndex(10, { align: 'start' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 200 });

    act(() => apiRef.current?.scrollToIndex(10, { align: 'center' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 160 });

    act(() => apiRef.current?.scrollToIndex(10, { align: 'end' }));
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 120 });

    scrollTop = 0;
    act(() => apiRef.current?.scrollToIndex(10));
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'instant', top: 120 });
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
    <div data-row-index={params.rowIndex} role="listitem" style={{ height: 20 }}>
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
