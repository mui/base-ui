import * as React from 'react';
import { expect, vi, describe, beforeEach, it } from 'vitest';
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

function TrailingList(props: {
  enabled?: boolean;
  windowingSuspended?: boolean;
  itemCount?: number;
  trailing?: React.ReactNode;
}) {
  return (
    <TestVirtualizedList
      enabled={props.enabled}
      windowingSuspended={props.windowingSuspended}
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

  it('is rendered after the last item while virtualization is disabled', async () => {
    await render(
      <TrailingList
        enabled={false}
        itemCount={3}
        trailing={<div data-testid="loading" aria-hidden="true" />}
      />,
    );

    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(3);

    const trailing = screen.getByTestId('loading');
    expect(screen.getByTestId('virtualizer')).toContainElement(trailing);
    expect(trailing.closest('[role="listitem"]')).toBe(null);
    // After the last item in document order, as in the windowed list: a following sibling and
    // nothing else, since neither contains the other.
    expect(items[2].compareDocumentPosition(trailing)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('is rendered after the last item while the host suspends windowing', async () => {
    // The Combobox autofill pass renders every row this way; it must not lose the trailing content.
    await render(
      <TrailingList
        windowingSuspended
        itemCount={3}
        trailing={<div data-testid="loading" aria-hidden="true" />}
      />,
    );

    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(3);

    const trailing = screen.getByTestId('loading');
    expect(screen.getByTestId('virtualizer')).toContainElement(trailing);
    expect(items[2].compareDocumentPosition(trailing)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it.skipIf(isJSDOM)(
    'is measured into the scrollable height while disabled, and stays measured across mode switches',
    async () => {
      vi.restoreAllMocks();

      function Test(props: { enabled: boolean; trailingHeight: number }) {
        return (
          <TrailingList
            enabled={props.enabled}
            trailing={
              <div
                style={{ height: props.trailingHeight }}
                data-testid="loading"
                aria-hidden="true"
              />
            }
          />
        );
      }

      const { rerender } = await render(<Test enabled={false} trailingHeight={40} />);
      const virtualizer = screen.getByTestId('virtualizer');

      // Every row plus the trailing content, in normal flow, and the same total published.
      await waitFor(() => expect(virtualizer.scrollHeight).toBe(2040));
      expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2040px');

      // Windowing moves the trailing content into the virtual layout; it must be measured there
      // again, since the element that was observed is gone with the branch that rendered it.
      await rerender(<Test enabled trailingHeight={40} />);
      await waitFor(() => expect(virtualizer.scrollHeight).toBe(2040));

      // And the observer attached there must still be the live one.
      await rerender(<Test enabled trailingHeight={60} />);
      await waitFor(() => expect(virtualizer.scrollHeight).toBe(2060));

      // The way back is what the Combobox autofill pass takes first: the normal-flow element
      // replaces the windowed one and is the one observed from then on.
      await rerender(<Test enabled={false} trailingHeight={60} />);
      await waitFor(() => expect(virtualizer.scrollHeight).toBe(2060));
      await rerender(<Test enabled={false} trailingHeight={90} />);
      await waitFor(() => expect(virtualizer.scrollHeight).toBe(2090));
      // Layout grows at once; the published total follows the observer's notification.
      await waitFor(() =>
        expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2090px'),
      );
    },
  );

  it.skipIf(isJSDOM)(
    'keeps measuring the trailing content after the root element is replaced',
    async () => {
      vi.restoreAllMocks();

      // A changed `render` prop recreates the root and everything under it, the trailing wrapper
      // included, without the component remounting.
      function Test(props: { tag: 'div' | 'section'; trailingHeight: number }) {
        const { tag: Tag, trailingHeight } = props;
        return (
          <TestVirtualizedList
            estimatedItemHeight={20}
            overscanPx={0}
            render={<Tag data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
            trailing={
              <div style={{ height: trailingHeight }} data-testid="loading" aria-hidden="true" />
            }
            items={createItems(100)}
          >
            {(item: TestItem) => (
              <TestListItem style={{ display: 'block', height: 20 }}>{item.label}</TestListItem>
            )}
          </TestVirtualizedList>
        );
      }

      const { rerender } = await render(<Test tag="div" trailingHeight={40} />);
      await waitFor(() =>
        expect(screen.getByTestId('virtualizer').style.getPropertyValue('--total-size')).toBe(
          '2040px',
        ),
      );

      await rerender(<Test tag="section" trailingHeight={40} />);
      const virtualizer = screen.getByTestId('virtualizer');
      expect(virtualizer.tagName).toBe('SECTION');
      await waitFor(() =>
        expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2040px'),
      );

      // The content in the new wrapper must be the one observed.
      await rerender(<Test tag="section" trailingHeight={60} />);
      await waitFor(() =>
        expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2060px'),
      );
    },
  );

  it.skipIf(isJSDOM)(
    'publishes the margins of the trailing content in the total size while disabled',
    async () => {
      vi.restoreAllMocks();

      await render(
        <TrailingList
          enabled={false}
          trailing={
            <div style={{ height: 40, marginBlock: 10 }} data-testid="loading" aria-hidden="true" />
          }
        />,
      );

      const virtualizer = screen.getByTestId('virtualizer');
      // The rows plus the trailing content's margin box, as in the windowed list, where the
      // positioned wrapper contains the margins.
      await waitFor(() => expect(virtualizer.scrollHeight).toBe(2060));
      await waitFor(() =>
        expect(virtualizer.style.getPropertyValue('--total-size')).toBe('2060px'),
      );
    },
  );
});
