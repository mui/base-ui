import * as React from 'react';
import { expect, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import {
  ListVirtualizer,
  type ListVirtualizerRenderRowParameters,
  type ListVirtualizerRow,
} from './ListVirtualizer';
import { createListVirtualizationRegistry } from './ListVirtualizationRegistry';

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
        estimateSize={20}
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

  it('retains multiple pinned rows outside the rendered window', async () => {
    await render(
      <ListVirtualizer
        estimateSize={20}
        overscanPx={0}
        pinnedRowIndexes={[50, 75]}
        render={<div ref={setElementClientHeight(40)} />}
        renderRow={renderRow}
        rows={createRows(100)}
      />,
    );

    const firstPinnedRow = await screen.findByText('Item 51');
    const secondPinnedRow = await screen.findByText('Item 76');

    expect(firstPinnedRow.parentElement).toHaveStyle({
      position: 'absolute',
    });
    expect(firstPinnedRow.parentElement?.style.transform).toBe('translateX(-10000px)');
    expect(secondPinnedRow.parentElement).toHaveStyle({
      position: 'absolute',
    });
    expect(secondPinnedRow.parentElement?.style.transform).toBe('translateX(-10000px)');
  });

  it('does not rerender rows retained between virtual windows', async () => {
    const renderRowSpy = vi.fn(renderRow);

    await render(
      <ListVirtualizer
        estimateSize={20}
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
        estimateSize={20}
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
});

describe('createListVirtualizationRegistry', () => {
  it('increments the restore version after each completed render-all pass', () => {
    const registry = createListVirtualizationRegistry();
    const listener = vi.fn();
    registry.subscribeRenderAllRows(listener);

    expect(registry.getRenderAllRowsRestoreVersion()).toBe(0);

    registry.setRenderAllRows(true);
    expect(registry.getRenderAllRowsRestoreVersion()).toBe(0);

    registry.setRenderAllRows(false);
    expect(registry.getRenderAllRowsRestoreVersion()).toBe(1);

    registry.setRenderAllRows(false);
    expect(registry.getRenderAllRowsRestoreVersion()).toBe(1);

    registry.setRenderAllRows(true);
    registry.setRenderAllRows(false);
    expect(registry.getRenderAllRowsRestoreVersion()).toBe(2);
    expect(listener).toHaveBeenCalledTimes(4);
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
