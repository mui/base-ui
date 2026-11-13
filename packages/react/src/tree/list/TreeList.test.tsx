import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, act, fireEvent } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM, waitSingleFrame } from '#test-utils';
import { Tree } from '..';

const { render } = createRenderer();

// These tests assert real scroll positions of a fixed-height, overflowing
// list. jsdom reports zero-sized rects and doesn't scroll, so
// the whole file is Chromium-only.
describe.skipIf(isJSDOM)('<Tree.List /> keyboard scroll-into-view', () => {
  const ROW_HEIGHT = 28;
  const VIEWPORT_HEIGHT = 200;

  interface Item {
    id: string;
    label: string;
  }

  // 100 rows at 28px = 2800px of content vs a 200px viewport, so only ~7 rows
  // fit and keyboard navigation must scroll the container to keep focus visible.
  const ITEMS: Item[] = Array.from({ length: 100 }, (_, i) => ({
    id: `item${i}`,
    label: `Item ${i}`,
  }));

  function renderSizedItem(item: Item) {
    return (
      <Tree.Item
        key={item.id}
        itemId={item.id}
        style={{
          height: ROW_HEIGHT,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          margin: 0,
          padding: 0,
          border: 0,
        }}
      >
        <Tree.ItemContent>{item.label}</Tree.ItemContent>
      </Tree.Item>
    );
  }

  function focusedRow(): HTMLElement {
    return document.activeElement as HTMLElement;
  }

  // Let the focus observer's scroll settle inside `act` so the fail-on-console
  // act guard stays satisfied.
  async function settle(frames = 2) {
    await act(async () => {
      for (let i = 0; i < frames; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await waitSingleFrame();
      }
    });
  }

  async function press(key: string) {
    fireEvent.keyDown(focusedRow(), { key });
    await settle();
  }

  async function renderTree() {
    const view = await render(
      <Tree.Root items={ITEMS}>
        <Tree.List
          data-testid="list"
          style={{ height: VIEWPORT_HEIGHT, width: 240, overflow: 'auto' }}
        >
          {renderSizedItem}
        </Tree.List>
      </Tree.Root>,
    );
    const scroller = screen.getByTestId('list');
    return { ...view, scroller };
  }

  function rowIsWithinViewport(row: HTMLElement, scroller: HTMLElement) {
    const rowRect = row.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    return rowRect.top >= scrollerRect.top - 1 && rowRect.bottom <= scrollerRect.bottom + 1;
  }

  it('pins focus to the bottom edge on End and back to the top on Home', async () => {
    const { scroller } = await renderTree();
    await settle();

    await act(async () => {
      (screen.getByText('Item 0').closest('[role="row"]') as HTMLElement).focus();
    });

    await press('End');
    expect(focusedRow().dataset.itemId).toBe('item99');
    expect(scroller.scrollTop).toBeGreaterThan(0);
    expect(rowIsWithinViewport(focusedRow(), scroller)).toBe(true);

    await press('Home');
    expect(focusedRow().dataset.itemId).toBe('item0');
    expect(scroller.scrollTop).toBe(0);
    expect(rowIsWithinViewport(focusedRow(), scroller)).toBe(true);
  });

  it('keeps the focused row visible while navigating back up with ArrowUp', async () => {
    const { scroller } = await renderTree();
    await settle();

    await act(async () => {
      (screen.getByText('Item 0').closest('[role="row"]') as HTMLElement).focus();
    });

    await press('End');
    const scrollTopAtBottom = scroller.scrollTop;

    let index = 99;
    for (let i = 0; i < 30; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await press('ArrowUp');
      index -= 1;
      expect(focusedRow().dataset.itemId).toBe(`item${index}`);
      expect(rowIsWithinViewport(focusedRow(), scroller)).toBe(true);
    }

    expect(scroller.scrollTop).toBeLessThan(scrollTopAtBottom);
  });

  it('keeps the focused row inside the scrollport of a bordered list with a horizontal scrollbar', async () => {
    await render(
      <Tree.Root items={ITEMS}>
        <Tree.List
          data-testid="list"
          style={{ height: VIEWPORT_HEIGHT, width: 240, overflow: 'auto', border: '12px solid' }}
        >
          {(item: Item) => (
            <Tree.Item
              key={item.id}
              itemId={item.id}
              style={{ height: ROW_HEIGHT, width: 480, boxSizing: 'border-box', margin: 0 }}
            >
              <Tree.ItemContent>{item.label}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );
    const scroller = screen.getByTestId('list');
    await settle();
    await act(async () => {
      (screen.getByText('Item 0').closest('[role="row"]') as HTMLElement).focus();
    });

    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await press('ArrowDown');
    }

    const scrollportBottom =
      scroller.getBoundingClientRect().top + scroller.clientTop + scroller.clientHeight;
    expect(focusedRow().getBoundingClientRect().bottom).toBeLessThanOrEqual(scrollportBottom + 1);
  });

  it('keeps the focused row inside the scrollport of a scaled list', async () => {
    await render(
      <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
        <Tree.Root items={ITEMS}>
          <Tree.List
            data-testid="list"
            style={{ height: VIEWPORT_HEIGHT, width: 240, overflow: 'auto' }}
          >
            {renderSizedItem}
          </Tree.List>
        </Tree.Root>
      </div>,
    );
    const scroller = screen.getByTestId('list');
    await settle();
    await act(async () => {
      (screen.getByText('Item 0').closest('[role="row"]') as HTMLElement).focus();
    });

    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await press('ArrowDown');
    }

    const rowRect = focusedRow().getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    expect(rowRect.top).toBeGreaterThanOrEqual(scrollerRect.top - 1);
    expect(rowRect.bottom).toBeLessThanOrEqual(scrollerRect.bottom + 1);
    // Scrolled just enough: the row sits at the bottom edge.
    expect(scrollerRect.bottom - rowRect.bottom).toBeLessThan(ROW_HEIGHT / 2);
  });

  // The scroll container is a plain `overflow: auto` list — not positioned, so
  // it isn't the rows' `offsetParent`. When the whole tree sits far down the
  // page, a row's `offsetParent`-relative offset is its page offset, which the
  // focus scroll must NOT confuse for its offset within the container. Before
  // the fix this jumped the list to the bottom the first time a row was focused.
  describe('when the container is unpositioned and far down the page', () => {
    async function renderTreeFarDownThePage() {
      const view = await render(
        <React.Fragment>
          <div style={{ height: 1500 }} />
          <Tree.Root items={ITEMS}>
            <Tree.List
              data-testid="list"
              style={{ height: VIEWPORT_HEIGHT, width: 240, overflow: 'auto' }}
            >
              {renderSizedItem}
            </Tree.List>
          </Tree.Root>
        </React.Fragment>,
      );
      const scroller = screen.getByTestId('list');
      return { ...view, scroller };
    }

    it('does not scroll when focusing a row that is already visible at the top', async () => {
      const { scroller } = await renderTreeFarDownThePage();
      await settle();

      expect(scroller.scrollTop).toBe(0);

      await act(async () => {
        (screen.getByText('Item 0').closest('[role="row"]') as HTMLElement).focus();
      });
      await settle();

      expect(scroller.scrollTop).toBe(0);
      expect(rowIsWithinViewport(focusedRow(), scroller)).toBe(true);
    });

    it('still scrolls the container (not the page) to follow keyboard navigation', async () => {
      const { scroller } = await renderTreeFarDownThePage();
      await settle();

      await act(async () => {
        (screen.getByText('Item 0').closest('[role="row"]') as HTMLElement).focus();
      });
      await settle();
      const pageScrollY = window.scrollY;

      for (let i = 0; i < 30; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await press('ArrowDown');
      }

      expect(focusedRow().dataset.itemId).toBe('item30');
      expect(scroller.scrollTop).toBeGreaterThan(0);
      expect(window.scrollY).toBe(pageScrollY);
      expect(rowIsWithinViewport(focusedRow(), scroller)).toBe(true);
    });
  });
});

it('exposes the row level through aria-level only', async () => {
  await render(
    <Tree.Root items={[{ id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] }]}>
      <Tree.List>
        {(item) => (
          <Tree.Item itemId={item.id}>
            <Tree.ItemContent>
              <Tree.ItemIndentGuide data-testid={`guide-${item.id}`} />
              {item.label}
            </Tree.ItemContent>
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>,
  );

  fireEvent.click(screen.getByRole('row', { name: 'A' }));
  fireEvent.keyDown(screen.getByRole('row', { name: 'A' }), { key: 'ArrowRight' });

  const child = screen.getByRole('row', { name: 'A1' });
  expect(child).toHaveAttribute('aria-level', '2');
  expect(child).not.toHaveAttribute('data-level');
  expect(screen.getByTestId('guide-a1')).not.toHaveAttribute('data-level');
});

it('gives each indent guide line the level of the ancestor it belongs to', async () => {
  await render(
    <Tree.Root
      items={[
        {
          id: 'a',
          label: 'A',
          children: [{ id: 'a1', label: 'A1', children: [{ id: 'a11', label: 'A11' }] }],
        },
      ]}
      defaultExpandedItems={['a', 'a1']}
    >
      <Tree.List>
        {(item) => (
          <Tree.Item itemId={item.id}>
            <Tree.ItemContent>
              <Tree.ItemIndentGuide data-testid={`guide-${item.id}`} />
              {item.label}
            </Tree.ItemContent>
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>,
  );

  const lines = Array.from(screen.getByTestId('guide-a11').children) as HTMLElement[];
  expect(lines.map((line) => line.getAttribute('data-level'))).toEqual(['1', '2']);
  expect(lines.map((line) => line.style.getPropertyValue('--tree-indent-guide-level'))).toEqual([
    '1',
    '2',
  ]);
});

describe('<Tree.List /> state', () => {
  interface Item {
    id: string;
    label: string;
  }

  function List() {
    const renderItem = (item: Item) => (
      <Tree.Item itemId={item.id}>
        <Tree.ItemContent />
      </Tree.Item>
    );
    return <Tree.List data-testid="list">{renderItem}</Tree.List>;
  }

  it('is disabled with the tree', async () => {
    const { setProps } = await render(
      <Tree.Root items={[{ id: 'a', label: 'A' }]} disabled>
        <List />
      </Tree.Root>,
    );

    expect(screen.getByTestId('list')).toHaveAttribute('data-disabled');
    expect(screen.getByTestId('list')).not.toHaveAttribute('data-empty');

    await setProps({ disabled: false });
    expect(screen.getByTestId('list')).not.toHaveAttribute('data-disabled');
  });
});
