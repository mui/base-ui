import * as React from 'react';
import { expect, vi } from 'vitest';
import { screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
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
        estimateSize={20}
        overscanPx={20}
        paddingStart={4}
        render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" role="list" />}
        renderRow={renderRow}
        rows={rows}
        totalSizeCssVariable="--list-size"
      />,
    );

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(5));

    expect(screen.getByText('Item 1')).toHaveStyle({ marginTop: '4px' });
    expect(screen.getByText('Item 5')).not.toBe(null);
    expect(screen.queryByText('Item 20')).toBe(null);

    const virtualizer = screen.getByTestId('virtualizer');
    expect(virtualizer).toHaveStyle({ overflow: 'auto' });
    expect(virtualizer.style.getPropertyValue('--list-size')).toBe('2004px');
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
      height: '0px',
      opacity: '0',
      overflow: 'hidden',
      position: 'absolute',
      width: '0px',
    });
    expect(secondPinnedRow.parentElement).toHaveStyle({
      height: '0px',
      opacity: '0',
      overflow: 'hidden',
      position: 'absolute',
      width: '0px',
    });
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
    <div
      ref={params.measureRef}
      data-row-index={params.rowIndex}
      role="listitem"
      style={{
        height: 20,
        marginBottom: params.spacing.bottom || undefined,
        marginTop: params.spacing.top || undefined,
      }}
    >
      {params.row.model.label}
    </div>
  );
}

function setElementClientHeight(clientHeight: number) {
  return (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }

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
