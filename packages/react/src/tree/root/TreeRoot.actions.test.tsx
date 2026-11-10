import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY } from '../../internals/useInitialLiveRegionTextMutation';
import { Tree } from '..';

const { render } = createRenderer();

interface Item {
  id: string;
  label: string;
  children?: Item[];
}

const ITEMS: Item[] = [
  {
    id: 'a',
    label: 'A',
    children: [
      { id: 'a1', label: 'A1' },
      { id: 'a2', label: 'A2' },
    ],
  },
  { id: 'b', label: 'B', children: [{ id: 'b1', label: 'B1' }] },
  { id: 'c', label: 'C' },
];

async function mountTree(props?: {
  actionsRef?: React.RefObject<Tree.Root.Actions<Item> | null>;
  rootProps?: object;
}) {
  const actionsRef = props?.actionsRef ?? React.createRef<Tree.Root.Actions<Item>>();
  await render(
    <Tree.Root defaultItems={ITEMS} actionsRef={actionsRef} {...props?.rootProps}>
      <Tree.List>
        {(item: Item) => (
          <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
            <Tree.ItemContent>{item.label}</Tree.ItemContent>
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>,
  );
  return actionsRef;
}

function renderedItemIds(): string[] {
  return screen.getAllByRole('row').map((element) => element.dataset.itemId!);
}

describe('Tree actionsRef', () => {
  describe('expandAll / collapseAll', () => {
    it('expands and then collapses every expandable item', async () => {
      const onExpandedItemsChange = vi.fn();
      const actionsRef = await mountTree({ rootProps: { onExpandedItemsChange } });

      await act(async () => actionsRef.current!.expandAll());
      expect(renderedItemIds()).toEqual(['a', 'a1', 'a2', 'b', 'b1', 'c']);

      act(() => actionsRef.current!.collapseAll());
      expect(renderedItemIds()).toEqual(['a', 'b', 'c']);
      expect(onExpandedItemsChange.mock.calls.at(-1)![0]).toEqual([]);
    });

    it('collapseAll on an already-collapsed tree reports no change', async () => {
      const onExpandedItemsChange = vi.fn();
      const actionsRef = await mountTree({ rootProps: { onExpandedItemsChange } });

      act(() => actionsRef.current!.collapseAll());
      expect(onExpandedItemsChange).not.toHaveBeenCalled();
    });
  });

  describe('applyTransaction placements', () => {
    it('inserts relative to a reference item, inside its parent', async () => {
      const actionsRef = await mountTree({ rootProps: { defaultExpandedItems: ['a'] } });

      await act(() =>
        actionsRef.current!.applyTransaction((transaction) => {
          transaction.add({ id: 'a0', label: 'A0' }, { before: 'a1' });
          transaction.add({ id: 'a3', label: 'A3' }, { after: 'a2' });
        }),
      );

      expect(renderedItemIds()).toEqual(['a', 'a0', 'a1', 'a2', 'a3', 'b', 'c']);
    });

    it('inserts at root level for a root reference item', async () => {
      const actionsRef = await mountTree();

      await act(() =>
        actionsRef.current!.applyTransaction((transaction) =>
          transaction.add({ id: 'z', label: 'Z' }, { before: 'c' }),
        ),
      );

      expect(renderedItemIds()).toEqual(['a', 'b', 'z', 'c']);
    });

    it('skips an insertion next to an unknown reference item', async () => {
      const onItemsChange = vi.fn();
      const actionsRef = await mountTree({ rootProps: { onItemsChange } });
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      let changed: boolean | undefined;
      await act(async () => {
        changed = await actionsRef.current!.applyTransaction((transaction) =>
          transaction.add({ id: 'z', label: 'Z' }, { after: 'nope' }),
        );
      });

      expect(changed).toBe(false);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('under ID "nope"'));
      expect(onItemsChange).not.toHaveBeenCalled();
      expect(renderedItemIds()).toEqual(['a', 'b', 'c']);
    });
  });

  describe('getItemIndex', () => {
    it('reports the index within the item’s own parent', async () => {
      const actionsRef = await mountTree({ rootProps: { defaultExpandedItems: ['a'] } });

      expect(actionsRef.current!.getItemIndex('a')).toBe(0);
      expect(actionsRef.current!.getItemIndex('c')).toBe(2);
      // Sibling index, not a flat-list index.
      expect(actionsRef.current!.getItemIndex('a2')).toBe(1);
    });
  });

  describe('isItemExpandable', () => {
    it('answers from the item’s children, not its expanded state', async () => {
      const actionsRef = await mountTree();

      expect(actionsRef.current!.isItemExpandable('a')).toBe(true);
      expect(actionsRef.current!.isItemExpandable('c')).toBe(false);
      expect(actionsRef.current!.isItemExpandable('nope')).toBe(false);

      await act(async () => actionsRef.current!.expandAll());
      expect(actionsRef.current!.isItemExpandable('a')).toBe(true);
    });
  });
});

describe('Tree.Empty', () => {
  function EmptyTree(props: { items: Item[] }) {
    return (
      <Tree.Root items={props.items}>
        <Tree.List>
          {(item: Item) => (
            <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
              <Tree.ItemContent />
            </Tree.Item>
          )}
        </Tree.List>
        <Tree.Empty data-testid="empty">Nothing here</Tree.Empty>
      </Tree.Root>
    );
  }

  it('shows its children only while the tree has no items', async () => {
    const { rerender } = await render(<EmptyTree items={[]} />);
    expect(screen.getByTestId('empty')).toHaveTextContent('Nothing here');

    await rerender(<EmptyTree items={ITEMS} />);
    // The live region itself stays mounted — a `role="status"` added at the
    // moment it fills is not reliably announced — but it empties out.
    expect(screen.getByTestId('empty')).toBeEmptyDOMElement();
    expect(screen.getByTestId('empty')).toHaveAttribute('aria-live', 'polite');
  });

  describe('with fake timers', () => {
    const { render: renderWithClock, clock } = createRenderer();
    clock.withFakeTimers();

    it('marks the message it mounts with so that Safari announces it', async () => {
      await renderWithClock(<EmptyTree items={[]} />);
      expect(screen.getByTestId('empty').textContent).toBe('Nothing here\u2060');

      clock.tick(INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY);
      expect(screen.getByTestId('empty').textContent).toBe('Nothing here');
    });
  });
});

describe('Tree.ItemCheckboxIndicator', () => {
  function CheckboxTree(props: { keepMounted?: boolean | undefined }) {
    const actionsRef = React.useRef<Tree.Root.Actions<Item> | null>(null);
    return (
      <React.Fragment>
        <button
          type="button"
          data-testid="select-a"
          onClick={() => actionsRef.current!.setItemSelection('a', true)}
        />
        <Tree.Root defaultItems={ITEMS} selectionMode="multiple" actionsRef={actionsRef}>
          <Tree.List>
            {(item: Item) => (
              <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
                <Tree.ItemContent>
                  <Tree.ItemCheckbox>
                    <Tree.ItemCheckboxIndicator
                      keepMounted={props.keepMounted}
                      data-testid={`indicator-${item.id}`}
                    />
                  </Tree.ItemCheckbox>
                </Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>
      </React.Fragment>
    );
  }

  it('mounts only while the item is checked', async () => {
    await render(<CheckboxTree />);
    expect(screen.queryByTestId('indicator-a')).toBe(null);

    act(() => {
      screen.getByTestId('select-a').click();
    });
    expect(screen.getByTestId('indicator-a')).toBeInTheDocument();
  });

  it('stays mounted with keepMounted, carrying the checked state as an attribute', async () => {
    await render(<CheckboxTree keepMounted />);
    expect(screen.getByTestId('indicator-a')).toHaveAttribute('data-unchecked');

    act(() => {
      screen.getByTestId('select-a').click();
    });
    expect(screen.getByTestId('indicator-a')).toHaveAttribute('data-checked');
  });
});
