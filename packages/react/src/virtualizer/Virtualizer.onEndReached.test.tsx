import * as React from 'react';
import { expect, vi } from 'vitest';
import { fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import {
  createRenderer,
  isJSDOM,
  TestListItem,
  TestVirtualizedList,
  createVirtualizerItems as createItems,
  type VirtualizerTestItem as TestItem,
} from '#test-utils';

function EndReachedList(props: {
  endReachedThreshold?: number;
  itemCount?: number;
  onEndReached: () => void;
}) {
  return (
    <TestVirtualizedList
      endReachedThreshold={props.endReachedThreshold}
      estimatedItemHeight={20}
      onEndReached={props.onEndReached}
      overscanPx={0}
      render={<div data-testid="virtualizer" style={{ height: 60, width: 200 }} />}
      items={createItems(props.itemCount ?? 100)}
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
