import * as React from 'react';
import { expect, vi, describe, it, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import {
  createRenderer,
  isJSDOM,
  createDOMRect,
  TestListItem,
  TestVirtualizedList,
  createVirtualizerItems as createItems,
  type VirtualizerTestItem as TestItem,
} from '#test-utils';

function TrailingList(props: { itemCount?: number; trailing?: React.ReactNode }) {
  return (
    <TestVirtualizedList
      estimatedItemHeight={20}
      overscanPx={0}
      render={<div data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
      trailing={props.trailing}
      items={createItems(props.itemCount ?? 100)}
    >
      {(item: TestItem) => (
        <TestListItem style={{ display: 'block', height: 20 }}>{item.label}</TestListItem>
      )}
    </TestVirtualizedList>
  );
}

describe('<Virtualizer /> trailing', () => {
  const { render } = createRenderer();

  // jsdom has no layout: give rows and the scrollport the geometry the window is computed from.
  // The measurement tests below restore real geometry before rendering.
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

  it.skipIf(isJSDOM)('is measured into the scrollable height', async () => {
    vi.restoreAllMocks();

    const { rerender } = await render(<TrailingList />);
    const virtualizer = screen.getByTestId('virtualizer');

    await waitFor(() => expect(virtualizer.scrollHeight).toBe(2000));

    await rerender(
      <TrailingList
        trailing={<div style={{ height: 40 }} data-testid="loading" aria-hidden="true" />}
      />,
    );

    await waitFor(() => expect(virtualizer.scrollHeight).toBe(2040));
  });

  it.skipIf(isJSDOM)('sits after the last item and scrolls with it', async () => {
    vi.restoreAllMocks();

    await render(
      <TrailingList
        trailing={<div style={{ height: 40 }} data-testid="loading" aria-hidden="true" />}
      />,
    );

    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(2040));

    // Out of view at the top of a long list, rather than pinned to the scrollport.
    const scrollerRect = virtualizer.getBoundingClientRect();
    expect(screen.getByTestId('loading').getBoundingClientRect().top).toBeGreaterThan(
      scrollerRect.bottom,
    );

    virtualizer.scrollTop = virtualizer.scrollHeight;
    fireEvent.scroll(virtualizer);

    // At the end it is on screen, directly below the last item.
    await waitFor(() => {
      const trailingRect = screen.getByTestId('loading').getBoundingClientRect();
      expect(trailingRect.bottom).toBeLessThanOrEqual(
        virtualizer.getBoundingClientRect().bottom + 1,
      );
    });

    const lastItem = screen.getByText('Item 100');
    expect(screen.getByTestId('loading').getBoundingClientRect().top).toBeGreaterThanOrEqual(
      lastItem.getBoundingClientRect().bottom - 1,
    );
  });

  it('is not an item and does not appear in the collection metadata', async () => {
    await render(
      <TrailingList itemCount={3} trailing={<div data-testid="loading" aria-hidden="true" />} />,
    );

    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveAttribute('aria-setsize', '3');

    // Rendered, but the list still contains only items.
    expect(screen.getByTestId('loading')).not.toBe(null);
    expect(screen.getByTestId('loading').closest('[role="listitem"]')).toBe(null);
  });
});
