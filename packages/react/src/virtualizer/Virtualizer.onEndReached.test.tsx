import * as React from 'react';
import { expect, vi, it } from 'vitest';
import { fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import {
  createRenderer,
  isJSDOM,
  TestListItem,
  TestVirtualizedList,
  createVirtualizerItems as createItems,
  type VirtualizerTestItem as TestItem,
} from '#test-utils';
import { Virtualizer } from './Virtualizer';

function EndReachedList(props: {
  endReachedThreshold?: number;
  itemCount?: number;
  onEndReached: () => void;
  windowingSuspended?: boolean;
}) {
  return (
    <TestVirtualizedList
      endReachedThreshold={props.endReachedThreshold}
      estimatedItemHeight={20}
      onEndReached={props.onEndReached}
      overscanPx={0}
      render={<div data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
      items={createItems(props.itemCount ?? 100)}
      windowingSuspended={props.windowingSuspended}
    >
      {(item: TestItem) => (
        <TestListItem style={{ display: 'block', height: 20 }}>{item.label}</TestListItem>
      )}
    </TestVirtualizedList>
  );
}

describe.skipIf(isJSDOM)('<Virtualizer /> onEndReached', () => {
  const { render } = createRenderer();

  it('fires once the last item enters the rendered window', async () => {
    const onEndReached = vi.fn();

    await render(<EndReachedList onEndReached={onEndReached} />);

    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(2000));
    expect(onEndReached).not.toHaveBeenCalled();

    virtualizer.scrollTop = virtualizer.scrollHeight;
    fireEvent.scroll(virtualizer);

    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(1));
  });

  it('does not repeat while the window stays at the end', async () => {
    const onEndReached = vi.fn();

    await render(<EndReachedList onEndReached={onEndReached} />);

    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(2000));

    virtualizer.scrollTop = virtualizer.scrollHeight;
    fireEvent.scroll(virtualizer);
    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(1));

    // Scrolling further within the last window is still the same arrival.
    virtualizer.scrollTop = virtualizer.scrollHeight;
    fireEvent.scroll(virtualizer);
    await flushMicrotasks();

    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('arms again once the collection grows past the window', async () => {
    const onEndReached = vi.fn();

    const { rerender } = await render(
      <EndReachedList itemCount={100} onEndReached={onEndReached} />,
    );
    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(2000));

    virtualizer.scrollTop = virtualizer.scrollHeight;
    fireEvent.scroll(virtualizer);
    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(1));

    // The next page arrives, so the window is no longer at the end.
    await rerender(<EndReachedList itemCount={200} onEndReached={onEndReached} />);
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(4000));

    virtualizer.scrollTop = virtualizer.scrollHeight;
    fireEvent.scroll(virtualizer);

    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(2));
  });

  it('arms again after the collection empties', async () => {
    const onEndReached = vi.fn();

    const { rerender } = await render(
      <EndReachedList itemCount={100} onEndReached={onEndReached} />,
    );
    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(2000));

    virtualizer.scrollTop = virtualizer.scrollHeight;
    fireEvent.scroll(virtualizer);
    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(1));

    // A query with no results, then one whose end is in the window from the start: that end is a
    // new arrival, and the list is too short to scroll away from it and arm any other way.
    await rerender(<EndReachedList itemCount={0} onEndReached={onEndReached} />);
    await waitFor(() => expect(screen.queryAllByRole('listitem')).toHaveLength(0));

    await rerender(<EndReachedList itemCount={2} onEndReached={onEndReached} />);
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));

    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(2));
  });

  it('arms again for a shorter collection whose end is in view from the start', async () => {
    const onEndReached = vi.fn();

    const { rerender } = await render(
      <EndReachedList itemCount={100} onEndReached={onEndReached} />,
    );
    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(2000));

    virtualizer.scrollTop = virtualizer.scrollHeight;
    fireEvent.scroll(virtualizer);
    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(1));

    // A new query's first page, all of it in view: a new end, reached at once.
    await rerender(<EndReachedList itemCount={2} onEndReached={onEndReached} />);
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));

    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(2));
  });

  it('arms again for a collection of the same length made of other items', async () => {
    const onEndReached = vi.fn();
    const createKeyedItems = (query: string) =>
      Array.from({ length: 2 }, (_, index) => ({
        key: `${query}-${index}`,
        label: `${query} ${index + 1}`,
      }));

    const { rerender } = await render(
      <TestVirtualizedList
        estimatedItemHeight={20}
        onEndReached={onEndReached}
        overscanPx={0}
        render={<div data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
        items={createKeyedItems('Apple')}
      >
        {(item: TestItem) => (
          <TestListItem style={{ display: 'block', height: 20 }}>{item.label}</TestListItem>
        )}
      </TestVirtualizedList>,
    );
    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(1));

    await rerender(
      <TestVirtualizedList
        estimatedItemHeight={20}
        onEndReached={onEndReached}
        overscanPx={0}
        render={<div data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
        items={createKeyedItems('Pear')}
      >
        {(item: TestItem) => (
          <TestListItem style={{ display: 'block', height: 20 }}>{item.label}</TestListItem>
        )}
      </TestVirtualizedList>,
    );
    await screen.findByText('Pear 1');

    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(2));
  });

  it('arms again for other items behind an unchanged trailing empty group', async () => {
    const onEndReached = vi.fn();
    interface KeyedItem {
      key: string;
      label: string;
    }
    interface KeyedGroup {
      label: string;
      items: KeyedItem[];
    }
    const createGroups = (query: string): KeyedGroup[] => [
      {
        label: 'Matches',
        items: Array.from({ length: 2 }, (_, index) => ({
          key: `${query}-${index}`,
          label: `${query} ${index + 1}`,
        })),
      },
      { label: 'Nothing yet', items: [] },
    ];

    function GroupedList(props: { query: string }) {
      return (
        <Virtualizer<KeyedItem>
          estimatedItemHeight={20}
          getItemKey={(item) => item.key}
          items={createGroups(props.query)}
          onEndReached={onEndReached}
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 200, width: 200 }} />}
          renderGroupHeader={(group: KeyedGroup, _, headerProps) => (
            <div {...headerProps} style={{ height: 20 }}>
              {group.label}
            </div>
          )}
          role="listbox"
        >
          {(item, _, itemProps) => (
            <div {...itemProps} role="option" aria-selected={false} style={{ height: 20 }}>
              {item.label}
            </div>
          )}
        </Virtualizer>
      );
    }

    const { rerender } = await render(<GroupedList query="Apple" />);
    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(1));

    // The last row is the empty group's header, and stays; the items behind it are all new.
    await rerender(<GroupedList query="Pear" />);
    await screen.findByText('Pear 1');

    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(2));
  });

  it('does not treat items rebuilt on every render as a new end', async () => {
    const onEndReached = vi.fn();
    // Object items without `getItemKey` are keyed by identity, which is what is being rebuilt.
    // That configuration is warned about; it must still not loop.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    interface UnkeyedItem {
      label: string;
    }

    function RebuildingList() {
      const [loads, setLoads] = React.useState(0);
      const items = Array.from({ length: 3 }, (_, index) => ({ label: `Item ${index + 1}` }));

      return (
        // @ts-expect-error Simulates a JavaScript consumer omitting the `getItemKey` the types require.
        <Virtualizer<UnkeyedItem>
          estimatedItemHeight={20}
          items={items}
          onEndReached={() => {
            onEndReached();
            setLoads((count) => count + 1);
          }}
          overscanPx={0}
          render={<div data-testid="virtualizer" style={{ height: 200, width: 200 }} />}
          role="listbox"
        >
          {(item, _, itemProps) => (
            <div {...itemProps} role="option" aria-selected={false} style={{ height: 20 }}>
              {item.label} ({loads})
            </div>
          )}
        </Virtualizer>
      );
    }

    try {
      await render(<RebuildingList />);
      await screen.findByText('Item 1 (1)');
      await flushMicrotasks();

      expect(onEndReached).toHaveBeenCalledTimes(1);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('does not fire while the host suspends windowing', async () => {
    const onEndReached = vi.fn();

    const { rerender } = await render(
      <EndReachedList onEndReached={onEndReached} windowingSuspended={false} />,
    );
    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(2000));

    // Every row is mounted for the host's own purposes; the user has not moved.
    await rerender(<EndReachedList onEndReached={onEndReached} windowingSuspended />);
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(100));
    await flushMicrotasks();
    expect(onEndReached).not.toHaveBeenCalled();

    await rerender(<EndReachedList onEndReached={onEndReached} windowingSuspended={false} />);
    await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeLessThan(100));
    await flushMicrotasks();
    expect(onEndReached).not.toHaveBeenCalled();

    // The arrival is still the user's to make.
    virtualizer.scrollTop = virtualizer.scrollHeight;
    fireEvent.scroll(virtualizer);
    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(1));
  });

  it('fires early by the threshold in items', async () => {
    const onEndReached = vi.fn();

    await render(<EndReachedList endReachedThreshold={40} onEndReached={onEndReached} />);

    const virtualizer = screen.getByTestId('virtualizer');
    await waitFor(() => expect(virtualizer.scrollHeight).toBe(2000));
    expect(onEndReached).not.toHaveBeenCalled();

    // Halfway down, which is within 40 items of the end but well short of it.
    virtualizer.scrollTop = 1200;
    fireEvent.scroll(virtualizer);

    await waitFor(() => expect(onEndReached).toHaveBeenCalledTimes(1));
  });
});
