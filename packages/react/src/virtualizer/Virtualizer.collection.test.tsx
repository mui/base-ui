import * as React from 'react';
import { expect, vi } from 'vitest';
import { screen, waitFor } from '@mui/internal-test-utils';
import {
  createRenderer,
  createDOMRect,
  setElementClientHeight,
  TestListItem,
  TestVirtualizedList,
  createVirtualizerItems as createItems,
  type VirtualizerTestItem as TestItem,
} from '#test-utils';
import { Virtualizer } from './Virtualizer';

describe('<Virtualizer /> collection', () => {
  const { render } = createRenderer();
  const { render: renderNonStrict } = createRenderer({ strict: false });

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

  it('passes virtual metadata to items', async () => {
    await render(
      <TestVirtualizedList
        estimatedItemHeight={20}
        overscanPx={0}
        render={<div ref={setElementClientHeight(40)} />}
        items={createItems(10)}
      >
        {(item: TestItem) => <TestListItem style={{ height: 20 }}>{item.label}</TestListItem>}
      </TestVirtualizedList>,
    );

    const firstItem = await screen.findByText('Item 1');

    expect(firstItem).toHaveAttribute('aria-posinset', '1');
    expect(firstItem).toHaveAttribute('aria-setsize', '10');
    expect(firstItem).toHaveAttribute('data-index', '0');
  });

  it('does not re-derive keys or estimates when the feature layer re-renders', async () => {
    type Item = { id: string; label: string; size: number };
    const items: Item[] = Array.from({ length: 10 }, (_, index) => ({
      id: String(index),
      label: `Item ${index}`,
      size: 20,
    }));
    const handleGetItemKey = vi.fn();
    const handleEstimatedItemHeight = vi.fn();
    const renderItem = vi.fn((item: Item) => (
      <TestListItem style={{ height: item.size }}>{item.label}</TestListItem>
    ));

    function Test() {
      return (
        <TestVirtualizedList<Item>
          estimatedItemHeight={(item: Item) => {
            handleEstimatedItemHeight(item);
            return item.size;
          }}
          getItemKey={(item: Item) => {
            handleGetItemKey(item);
            return item.id;
          }}
          render={<div ref={setElementClientHeight(60)} data-testid="virtualizer" />}
          items={items}
        >
          {renderItem}
        </TestVirtualizedList>
      );
    }

    const { rerender } = await renderNonStrict(<Test />);
    await waitFor(() =>
      expect(screen.getByTestId('virtualizer').style.getPropertyValue('--total-size')).toBe(
        '200px',
      ),
    );
    handleGetItemKey.mockClear();
    handleEstimatedItemHeight.mockClear();
    renderItem.mockClear();

    await rerender(<Test />);

    // Inline callbacks change identity on every render of the feature layer. Neither derivation
    // may walk the collection for that, and the rows they produced are reused as they were.
    expect(handleGetItemKey).not.toHaveBeenCalled();
    expect(handleEstimatedItemHeight).not.toHaveBeenCalled();
    expect(renderItem).not.toHaveBeenCalled();
  });

  it('uses stable item keys for object values', async () => {
    const items = [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
    ];
    const getItemKey = vi.fn((item: (typeof items)[number]) => item.id);

    await render(
      <TestVirtualizedList
        estimatedItemHeight={20}
        getItemKey={getItemKey}
        render={<div ref={setElementClientHeight(40)} />}
        items={items}
      >
        {(item: (typeof items)[number]) => <TestListItem>{item.label}</TestListItem>}
      </TestVirtualizedList>,
    );

    await waitFor(() => expect(getItemKey).toHaveBeenCalledWith(items[0]));
    expect(getItemKey.mock.calls.every((call) => call.length === 1)).toBe(true);
  });

  it('preserves row identity when object items are recreated and reordered', async () => {
    type Item = { id: string; label: string; size: number };

    function Test(props: { items: Item[] }) {
      return (
        <TestVirtualizedList<Item>
          estimatedItemHeight={(item: Item) => item.size}
          getItemKey={(item: Item) => item.id}
          render={<div ref={setElementClientHeight(200)} />}
          items={props.items}
        >
          {(item: Item) => <TestListItem style={{ height: item.size }}>{item.label}</TestListItem>}
        </TestVirtualizedList>
      );
    }

    const initialItems = [
      { id: 'a', label: 'Alpha', size: 20 },
      { id: 'b', label: 'Beta', size: 40 },
      { id: 'c', label: 'Gamma', size: 60 },
    ];
    const { rerender } = await render(<Test items={initialItems} />);
    const alpha = await screen.findByText('Alpha');

    await rerender(<Test items={[...initialItems].reverse().map((item) => ({ ...item }))} />);

    expect(screen.getByText('Alpha')).toBe(alpha);
    expect(alpha).toHaveAttribute('data-index', '2');
  });

  it('warns about duplicate item keys', async () => {
    const items = [
      { id: 'same', label: 'Alpha' },
      { id: 'same', label: 'Beta' },
    ];
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await render(
        <TestVirtualizedList
          estimatedItemHeight={20}
          getItemKey={(item: (typeof items)[number]) => item.id}
          items={items}
        >
          {(item: (typeof items)[number]) => <TestListItem>{item.label}</TestListItem>}
        </TestVirtualizedList>,
      );

      expect(
        warnSpy.mock.calls.some(([message]) =>
          String(message).includes('received the duplicate item key `same`'),
        ),
      ).toBe(true);
    } finally {
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });

  it('keeps primitive values with the same string representation distinct', async () => {
    const firstSymbol = Symbol('same');
    const secondSymbol = Symbol('same');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await render(
        // No `getItemKey`: primitives are keyed by the virtualizer itself, and the host passes
        // nothing for a collection that is not made of its own test items.
        <TestVirtualizedList<string | number | symbol>
          estimatedItemHeight={20}
          items={[1, '1', firstSymbol, secondSymbol]}
        >
          {(item, index) => <TestListItem>{`${typeof item} ${index}`}</TestListItem>}
        </TestVirtualizedList>,
      );

      expect(screen.getAllByRole('listitem')).toHaveLength(4);
      expect(errorSpy.mock.calls.some(([message]) => String(message).includes('same key'))).toBe(
        false,
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('updates virtual metadata and empty state after filtering', async () => {
    // The list narrows its collection — a Combobox does this from its input — and the metadata
    // and empty state follow the collection the virtualizer is given, not what it was mounted with.
    function Test(props: { items: TestItem[] }) {
      return (
        <TestVirtualizedList
          estimatedItemHeight={20}
          className={(state) => (state.empty ? 'empty' : undefined)}
          render={<div ref={setElementClientHeight(40)} data-testid="virtualizer" />}
          items={props.items}
        >
          {(item: TestItem) => <TestListItem>{item.label}</TestListItem>}
        </TestVirtualizedList>
      );
    }

    const all = createItems(10);
    const { rerender } = await render(<Test items={all} />);
    const virtualizer = screen.getByTestId('virtualizer');

    await rerender(<Test items={all.filter((item) => item.label === 'Item 10')} />);
    const item = await screen.findByText('Item 10');
    expect(item).toHaveAttribute('aria-posinset', '1');
    expect(item).toHaveAttribute('aria-setsize', '1');
    expect(item).toHaveAttribute('data-index', '0');

    await rerender(<Test items={[]} />);

    await waitFor(() => expect(screen.queryAllByRole('listitem')).toHaveLength(0));
    expect(virtualizer).toHaveAttribute('data-empty');
    expect(virtualizer).toHaveClass('empty');
  });

  describe('prop: totalItems', () => {
    it('reports the whole collection size to rendered items', async () => {
      await render(
        <TestVirtualizedList
          estimatedItemHeight={20}
          render={<div ref={setElementClientHeight(40)} />}
          totalItems={500}
          items={createItems(20)}
        >
          {(item: TestItem) => <TestListItem>{item.label}</TestListItem>}
        </TestVirtualizedList>,
      );

      const item = await screen.findByText('Item 1');
      expect(item).toHaveAttribute('aria-setsize', '500');
      expect(item).toHaveAttribute('aria-posinset', '1');
    });

    it('reports an unknown collection size', async () => {
      await render(
        <TestVirtualizedList
          estimatedItemHeight={20}
          render={<div ref={setElementClientHeight(40)} />}
          totalItems={-1}
          items={createItems(20)}
        >
          {(item: TestItem) => <TestListItem>{item.label}</TestListItem>}
        </TestVirtualizedList>,
      );

      const item = await screen.findByText('Item 1');
      expect(item).toHaveAttribute('aria-setsize', '-1');
    });

    it('defaults to the number of items in the list', async () => {
      await render(
        <TestVirtualizedList
          estimatedItemHeight={20}
          render={<div ref={setElementClientHeight(40)} />}
          items={createItems(20)}
        >
          {(item: TestItem) => <TestListItem>{item.label}</TestListItem>}
        </TestVirtualizedList>,
      );

      const item = await screen.findByText('Item 1');
      expect(item).toHaveAttribute('aria-setsize', '20');
    });
  });

  describe('types', () => {
    it('requires getItemKey for object values at the type level', () => {
      function TypeTest() {
        return (
          // @ts-expect-error object values require getItemKey
          <Virtualizer estimatedItemHeight={20}>
            {(value: { id: number }) => <TestListItem>{value.id}</TestListItem>}
          </Virtualizer>
        );
      }

      expect(TypeTest).toBeDefined();
    });

    it('requires getItemKey when the item type cannot be inferred', () => {
      const item = { id: 1 };

      function TypeTest() {
        return (
          // @ts-expect-error unknown item types require getItemKey
          <Virtualizer estimatedItemHeight={20}>
            {() => <TestListItem>{item.id}</TestListItem>}
          </Virtualizer>
        );
      }

      expect(TypeTest).toBeDefined();
    });

    it('does not allow item renderers to omit a row', () => {
      function TypeTest() {
        return (
          <Virtualizer<string> estimatedItemHeight={20}>
            {
              // @ts-expect-error virtualized item renderers must return an element
              () => null
            }
          </Virtualizer>
        );
      }

      expect(TypeTest).toBeDefined();
    });
  });
});
