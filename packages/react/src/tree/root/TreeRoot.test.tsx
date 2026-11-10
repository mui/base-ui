import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { describeTree } from '../../../test/describeTree';
import { Tree } from '..';

const { render: renderElement } = createRenderer();

describeTree('TreeRoot - Items', ({ render }) => {
  describe('items prop', () => {
    it('should support removing an item', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
      });

      await view.setItems([{ id: '1' }]);
      expect(view.getAllTreeItemIds()).toEqual(['1']);
    });

    it('should support adding an item at the end', async () => {
      const view = await render({
        items: [{ id: '1' }],
      });

      await view.setItems([{ id: '1' }, { id: '2' }]);
      expect(view.getAllTreeItemIds()).toEqual(['1', '2']);
    });

    it('should support adding an item at the beginning', async () => {
      const view = await render({
        items: [{ id: '2' }],
      });

      await view.setItems([{ id: '1' }, { id: '2' }]);
      expect(view.getAllTreeItemIds()).toEqual(['1', '2']);
    });

    it('should update indexes when two items are swapped', async () => {
      const onSelectedItemsChange = vi.fn();

      const view = await render({
        items: [{ id: '1' }, { id: '2' }, { id: '3' }],
        selectionMode: 'multiple',
        onSelectedItemsChange,
      });

      await view.setItems([{ id: '1' }, { id: '3' }, { id: '2' }]);
      expect(view.getAllTreeItemIds()).toEqual(['1', '3', '2']);

      // Check if the internal state is updated by running a range selection
      fireEvent.click(view.getItemRoot('1'));
      fireEvent.click(view.getItemRoot('3'), { shiftKey: true });
      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['1', '3']);
    });

    it('should treat an item with an empty children array as a leaf', async () => {
      const view = await render({
        items: [{ id: '1', children: [] }],
        defaultExpandedItems: ['1'],
      });

      // An empty `children` array is a common shape for a childless node, so the
      // item is a leaf and is not expandable.
      expect(view.getItemRoot('1')).not.toHaveAttribute('aria-expanded');
    });

    it('should use itemToStringLabel to name the rows', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2' }],
        itemToStringLabel: (item: any) => `Label: ${item.id}`,
      });

      expect(view.getItemRoot('1')).toHaveAttribute('aria-label', 'Label: 1');
      expect(view.getItemRoot('2')).toHaveAttribute('aria-label', 'Label: 2');
    });

    it('should use itemToChildren to find children', async () => {
      const items = [
        {
          id: '1',
          label: 'Node 1',
          section: [
            { id: '1.1', label: 'Child 1' },
            { id: '1.2', label: 'Child 2' },
          ],
        },
        { id: '2', label: 'Node 2' },
      ];

      const view = await render({
        items,
        itemToChildren: (item: any) => item.section,
        defaultExpandedItems: ['1'],
      });

      expect(view.getAllTreeItemIds()).toEqual(['1', '1.1', '1.2', '2']);
    });
  });

  describe('transaction.move', () => {
    it('keeps the moved item under its new parent when an ancestor is renamed', async () => {
      // Parent models embed their children, so after a move every ancestor of the
      // old and new positions is a different object. A rename reads the model of
      // the item it renames — from a stale lookup that still listed the moved
      // child, which put it back where it came from while it also sat in its
      // new home.
      const view = await render({
        // Uncontrolled: the tree owns the model and patches its lookups in place.
        // A controlled parent feeds the new items back, which rebuilds every
        // lookup and would hide the stale entries entirely.
        uncontrolled: true,
        items: [
          { id: 'A', children: [{ id: 'a1' }] },
          { id: 'B', children: [] },
        ],
        defaultExpandedItems: ['A', 'B'],
      });

      await act(async () => {
        view.actionsRef.current!.applyTransaction((transaction) =>
          transaction.move('a1', { parentId: 'B', index: 0 }),
        );
      });
      await act(async () => {
        view.actionsRef.current!.applyTransaction((transaction) =>
          transaction.update('A', { label: 'A renamed' }),
        );
      });

      // The item *models* are what goes wrong: the lookups already recorded the
      // move, but the rename rebuilt the tree from A's pre-move model, so `a1`
      // came back as A's child while also remaining under B.
      const a = view.actionsRef.current!.getItemModel('A') as { children?: { id: string }[] };
      const b = view.actionsRef.current!.getItemModel('B') as { children?: { id: string }[] };
      expect((a.children ?? []).map((child) => child.id)).toEqual([]);
      expect((b.children ?? []).map((child) => child.id)).toEqual(['a1']);
      expect(view.actionsRef.current!.getParentId('a1')).toBe('B');
    });

    it('is a no-op when the destination parent no longer exists', async () => {
      // An async update can drop the destination between a drop resolving and the
      // move running. The insertion then finds nowhere to put the items and the
      // already-pruned tree became the result — the items simply vanished.
      const view = await render({
        uncontrolled: true,
        items: [{ id: 'A', children: [{ id: 'a1' }] }, { id: 'B' }],
        defaultExpandedItems: ['A'],
      });

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await act(async () => {
        await view.actionsRef.current!.applyTransaction((transaction) =>
          transaction.move('a1', { parentId: 'gone', index: 0 }),
        );
      });

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('under ID "gone"'));
      expect(view.actionsRef.current!.getChildIds('A')).toEqual(['a1']);
      expect(view.actionsRef.current!.getItemModel('a1')).toBeDefined();
    });
  });

  describe('disabled prop', () => {
    it('should not have the attribute `aria-disabled` if disabled is not defined', async () => {
      const view = await render({
        items: [{ id: '1' }, { id: '2', disabled: false }, { id: '3', disabled: true }],
      });

      expect(view.getItemRoot('1')).not.toHaveAttribute('aria-disabled');
      expect(view.getItemRoot('2')).not.toHaveAttribute('aria-disabled');
      expect(view.getItemRoot('3')).toHaveAttribute('aria-disabled');
    });

    it('should disable all descendants of a disabled item', async () => {
      const view = await render({
        items: [
          { id: '1', disabled: true, children: [{ id: '1.1', children: [{ id: '1.1.1' }] }] },
        ],
        defaultExpandedItems: ['1', '1.1'],
      });

      expect(view.getItemRoot('1')).toHaveAttribute('aria-disabled', 'true');
      expect(view.getItemRoot('1.1')).toHaveAttribute('aria-disabled', 'true');
      expect(view.getItemRoot('1.1.1')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('API methods', () => {
    describe('getItemDOMElement', () => {
      it('should return the DOM element of the item', async () => {
        const view = await render({
          items: [{ id: '1' }],
        });

        expect(view.actionsRef.current!.getItemDOMElement('1')).toBe(view.getItemRoot('1'));
      });

      it('should return null when the item does not exist', async () => {
        const view = await render({
          items: [{ id: '1' }],
        });

        expect(view.actionsRef.current!.getItemDOMElement('2')).toBe(null);
      });

      it('should return the DOM element with getItemDOMElement using numeric ids', async () => {
        const view = await render({
          items: [{ id: 1 }],
        });

        expect(view.actionsRef.current!.getItemDOMElement(1)).toBe(view.getItemRoot(1));
      });
    });

    describe('getChildIds', () => {
      it('should return the children of an item in their rendering order', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
        });

        expect(view.actionsRef.current!.getChildIds('1')).toEqual(['1.1', '1.2']);
      });

      it('should work for the root items', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
        });

        expect(view.actionsRef.current!.getChildIds(null)).toEqual(['1', '2']);
      });

      it('should have up to date children when items change', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }, { id: '2' }],
        });

        await view.setItems([{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }]);

        expect(view.actionsRef.current!.getChildIds('1')).toEqual(['1.1', '1.2']);
      });

      it('should return ordered children ids using numeric ids', async () => {
        const view = await render({
          items: [{ id: 1, children: [{ id: 11 }, { id: 12 }] }],
        });

        expect(view.actionsRef.current!.getChildIds(1)).toEqual([11, 12]);
      });

      it('should return a copy, so a caller cannot reorder the store behind its back', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }] }],
        });

        const children = view.actionsRef.current!.getChildIds('1') as string[];
        children.reverse();

        expect(view.actionsRef.current!.getChildIds('1')).toEqual(['1.1', '1.2']);
      });
    });

    describe('getParentId', () => {
      it('should return the parent id of a child item', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
        });

        expect(view.actionsRef.current!.getParentId('1.1')).toBe('1');
      });

      it('should return null for root items', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
        });

        expect(view.actionsRef.current!.getParentId('1')).toBe(null);
      });

      it('should return the parent id using numeric ids', async () => {
        const view = await render({
          items: [{ id: 1, children: [{ id: 11 }] }],
        });

        expect(view.actionsRef.current!.getParentId(11)).toBe(1);
        expect(view.actionsRef.current!.getParentId(1)).toBe(null);
      });
    });

    describe('isItemExpanded', () => {
      it('should return true for expanded items', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
          defaultExpandedItems: ['1'],
        });

        expect(view.actionsRef.current!.isItemExpanded('1')).toBe(true);
      });

      it('should return false for collapsed items', async () => {
        const view = await render({
          items: [{ id: '1', children: [{ id: '1.1' }] }],
        });

        expect(view.actionsRef.current!.isItemExpanded('1')).toBe(false);
      });
    });

    describe('isItemSelected', () => {
      it('should return true for selected items', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
          defaultSelectedItems: ['1'],
        });

        expect(view.actionsRef.current!.isItemSelected('1')).toBe(true);
      });

      it('should return false for non-selected items', async () => {
        const view = await render({
          items: [{ id: '1' }, { id: '2' }],
        });

        expect(view.actionsRef.current!.isItemSelected('1')).toBe(false);
      });
    });
  });

  describe('invalid tree data', () => {
    it('should warn when two items have the same id', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await render({
          items: [{ id: '1' }, { id: '1' }],
        });

        expect(consoleError.mock.calls.length).toBeGreaterThanOrEqual(1);
        expect(consoleError.mock.calls[0][0]).toContain('same');
      } finally {
        consoleError.mockRestore();
      }
    });

    it('should allow an item with id="all" (no longer reserved)', async () => {
      // The "select all" sentinel is a unique symbol, so the string `"all"` is a
      // regular item id: selecting it selects that row only.
      const onSelectedItemsChange = vi.fn();
      const view = await render({
        items: [{ id: 'all' }, { id: 'other' }],
        selectionMode: 'multiple',
        onSelectedItemsChange,
      });

      fireEvent.click(view.getItemRoot('all'));

      expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['all']);
      expect(view.getSelectedTreeItems()).toEqual(['all']);
    });
  });

  describe('deep trees', () => {
    it('should render and navigate a tree with depth 100', async () => {
      // Build a deeply nested tree: 1 → 1.1 → 1.1.1 → ... (100 levels)
      function buildDeepTree(depth: number): any {
        if (depth === 0) {
          return { id: `d${depth}` };
        }
        return { id: `d${depth}`, children: [buildDeepTree(depth - 1)] };
      }

      const items = [buildDeepTree(100)];

      // Expand all so all items are visible
      const expandedItems: string[] = [];
      for (let i = 100; i > 0; i -= 1) {
        expandedItems.push(`d${i}`);
      }

      const view = await render({
        items,
        defaultExpandedItems: expandedItems,
      });

      expect(view.getItemRoot('d0')).toHaveAttribute('aria-level', '101');

      act(() => view.getItemRoot('d100').focus());
      fireEvent.keyDown(view.getItemRoot('d100'), { key: 'End' });
      expect(view.getFocusedItemId()).toBe('d0');
    });
  });

  describe('accessibility attributes', () => {
    it('should have correct aria-level on items', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1', children: [{ id: '1.1.1' }] }] }],
        defaultExpandedItems: ['1', '1.1'],
      });

      expect(view.getItemRoot('1')).toHaveAttribute('aria-level', '1');
      expect(view.getItemRoot('1.1')).toHaveAttribute('aria-level', '2');
      expect(view.getItemRoot('1.1.1')).toHaveAttribute('aria-level', '3');
    });

    it('should have correct aria-setsize and aria-posinset', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1' }, { id: '1.2' }, { id: '1.3' }] }, { id: '2' }],
        defaultExpandedItems: ['1'],
      });

      // Root level: 2 items
      expect(view.getItemRoot('1')).toHaveAttribute('aria-setsize', '2');
      expect(view.getItemRoot('1')).toHaveAttribute('aria-posinset', '1');
      expect(view.getItemRoot('2')).toHaveAttribute('aria-setsize', '2');
      expect(view.getItemRoot('2')).toHaveAttribute('aria-posinset', '2');

      // Nested level: 3 items
      expect(view.getItemRoot('1.1')).toHaveAttribute('aria-setsize', '3');
      expect(view.getItemRoot('1.1')).toHaveAttribute('aria-posinset', '1');
      expect(view.getItemRoot('1.3')).toHaveAttribute('aria-posinset', '3');
    });
  });

  describe('flat DOM structure', () => {
    it('should render deeply nested items correctly', async () => {
      const view = await render({
        items: [{ id: '1', children: [{ id: '1.1', children: [{ id: '1.1.1' }] }] }],
        defaultExpandedItems: ['1', '1.1'],
      });

      const item1 = view.getItemRoot('1');
      const item11 = view.getItemRoot('1.1');
      const item111 = view.getItemRoot('1.1.1');

      // All items should be siblings in flat structure
      expect(item1.parentElement).toBe(item11.parentElement);
      expect(item11.parentElement).toBe(item111.parentElement);
    });

    it('should keep numeric and string ids with the same text distinct', async () => {
      const view = await render({
        items: [
          { id: 1, label: 'Numeric one' },
          { id: '1', label: 'String one' },
        ],
        selectionMode: 'multiple',
      });

      const numericItem = view.actionsRef.current!.getItemDOMElement(1)!;
      const stringItem = view.actionsRef.current!.getItemDOMElement('1')!;
      expect(numericItem).not.toBe(stringItem);
      expect(numericItem).toHaveTextContent('Numeric one');
      expect(stringItem).toHaveTextContent('String one');

      fireEvent.click(stringItem);
      expect(view.actionsRef.current!.isItemSelected('1')).toBe(true);
      expect(view.actionsRef.current!.isItemSelected(1)).toBe(false);
    });

    it('should update disabled state when controlled items change', async () => {
      const view = await render({ items: [{ id: '1', disabled: false }] });

      expect(view.getItemRoot('1')).not.toHaveAttribute('aria-disabled');
      await view.setItems([{ id: '1', disabled: true }]);
      expect(view.getItemRoot('1')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('falsy item ids (id: 0)', () => {
    it('should focus and select an item with id 0 when clicked', async () => {
      const view = await render({
        items: [{ id: 0 }, { id: 1 }],
      });

      fireEvent.click(view.getItemRoot(0));

      expect(view.getFocusedItemId()).toBe('0');
      expect(view.actionsRef.current!.isItemSelected(0)).toBe(true);
    });

    it('should navigate to an item with id 0 via ArrowUp', async () => {
      const view = await render({
        items: [{ id: 0 }, { id: 1 }],
      });

      // Sanity check: both items rendered with the expected ids.
      expect(view.getItemRoot(0)).toBeTruthy();
      expect(view.getItemRoot(1)).toBeTruthy();

      act(() => {
        view.getItemRoot(1).focus();
      });
      fireEvent.keyDown(view.getItemRoot(1), { key: 'ArrowUp' });

      expect(view.getFocusedItemId()).toBe('0');
    });

    it('should toggle selection on a checkbox item with id 0', async () => {
      const view = await render({
        items: [{ id: 0 }, { id: 1 }],
        checkboxSelection: true,
        selectionMode: 'multiple',
      });
      const checkbox = view.getItemRoot(0).querySelector('[role=checkbox]')!;

      fireEvent.click(checkbox);
      expect(view.actionsRef.current!.isItemSelected(0)).toBe(true);

      fireEvent.click(checkbox);
      expect(view.actionsRef.current!.isItemSelected(0)).toBe(false);
    });
  });
});

describe('nested Tree item lookup', () => {
  it('returns the item owned by the current Tree when a nested Tree reuses its id', async () => {
    const actionsRef = React.createRef<Tree.Root.Actions>();
    await renderElement(
      <Tree.Root
        items={[
          { id: 'a', label: 'A', children: [{ id: 'a-child', label: 'A child' }] },
          { id: 'shared', label: 'Shared' },
        ]}
        defaultExpandedItems={['a']}
        actionsRef={actionsRef}
      >
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id} data-testid={`outer-${item.id}`}>
              <Tree.ItemContent>
                {item.id === 'a' ? (
                  <Tree.Root items={[{ id: 'shared', label: 'Nested shared' }]}>
                    <Tree.List>
                      {(nestedItem) => (
                        <Tree.Item itemId={nestedItem.id} data-testid={`inner-${nestedItem.id}`}>
                          <Tree.ItemContent />
                        </Tree.Item>
                      )}
                    </Tree.List>
                  </Tree.Root>
                ) : null}
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    expect(actionsRef.current!.getItemDOMElement('shared')).toBe(
      screen.getByTestId('outer-shared'),
    );
  });
});

describe('TreeRoot uncontrolled items', () => {
  interface Node {
    key: string;
    name: string;
  }

  const getId = vi.fn((item: Node) => item.key);
  const getLabel = (item: Node) => item.name;

  function App(props: { name: string; version: number }) {
    return (
      <Tree.Root
        defaultItems={Tree.createItems([{ key: 'a', name: props.name }], { getId, getLabel })}
        data-version={props.version}
      >
        <Tree.List<Node>>
          {(item) => (
            <Tree.Item itemId={item.key} data-testid={item.key}>
              <Tree.ItemContent>{item.name}</Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>
    );
  }

  it('ignores a new defaultItems identity after mount', async () => {
    const view = await renderElement(<App name="A" version={0} />);
    const callsAfterMount = getId.mock.calls.length;

    await view.rerender(<App name="B" version={1} />);

    expect(getId.mock.calls.length).toBe(callsAfterMount);
    expect(screen.getByTestId('a')).toHaveTextContent('A');
  });
});

describe('TreeRoot checkboxSelectionPropagation warning', () => {
  it('warns once across re-renders', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const renderTree = (label: string) => (
        <Tree.Root
          items={[{ id: '1', label }]}
          checkboxSelectionPropagation={{ descendants: true, parents: false }}
        >
          <Tree.List>
            {(item: { id: string }) => (
              <Tree.Item itemId={item.id}>
                <Tree.ItemContent />
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>
      );
      const view = await renderElement(renderTree('One'));
      await view.rerender(renderTree('Uno'));
      await view.rerender(renderTree('Eins'));

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('checkboxSelectionPropagation');
    } finally {
      warnSpy.mockRestore();
    }
  });
});
