import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Tree } from '.';
import type { TreeDefaultItem } from './store/types';

const { render } = createRenderer();

describe('Tree roles', () => {
  it('renders a tree of tree items', async () => {
    await render(
      <Tree.Root
        items={[
          { id: 'documents', label: 'Documents', children: [{ id: 'resume', label: 'Resume' }] },
          { id: 'music', label: 'Music' },
        ]}
      >
        <Tree.List aria-label="Files">
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemExpansionTrigger />
              {item.label}
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    expect(screen.getByRole('tree', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getAllByRole('treeitem')).toHaveLength(2);
    expect(screen.getByRole('treeitem', { name: 'Documents' })).toBeInTheDocument();
    expect(screen.queryByRole('treegrid')).toBeNull();
    expect(screen.queryByRole('row')).toBeNull();
  });
});

const renderSimpleItem = (item: TreeDefaultItem) => (
  <Tree.Item itemId={item.id}>
    <Tree.ItemExpansionTrigger />
    {item.label}
  </Tree.Item>
);

describe('nested tree ownership', () => {
  it.each([
    { target: 'row', getTarget: () => screen.getByText('inner') },
    { target: 'list', getTarget: () => screen.getByRole('tree', { name: 'Inner' }) },
  ])(
    'isolates a click on the $target of a nested tree from the enclosing row',
    async ({ getTarget }) => {
      const outerChange = vi.fn();
      await render(
        <Tree.Root items={[{ id: 'outer', label: 'outer' }]} onSelectedItemsChange={outerChange}>
          <Tree.List>
            {() => (
              <Tree.Item itemId="outer">
                outer
                <Tree.Root items={[{ id: 'inner', label: 'inner' }]}>
                  <Tree.List aria-label="Inner">{renderSimpleItem}</Tree.List>
                </Tree.Root>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>,
      );
      fireEvent.click(getTarget());
      expect(outerChange).not.toHaveBeenCalled();
    },
  );
});

describe('Tree.ItemExpansionTrigger', () => {
  it('marks the trigger of a disabled item as disabled', async () => {
    await render(
      <Tree.Root
        items={[
          { id: 'a', label: 'A', disabled: true, children: [{ id: 'a1', label: 'A1' }] },
          { id: 'b', label: 'B', children: [{ id: 'b1', label: 'B1' }] },
        ]}
      >
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemExpansionTrigger data-testid={`trigger-${item.id}`} />
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    expect(screen.getByTestId('trigger-a')).toHaveAttribute('data-disabled');
    expect(screen.getByTestId('trigger-b')).not.toHaveAttribute('data-disabled');
  });

  it('toggles the item when rendered as a non-native button', async () => {
    await render(
      <Tree.Root items={[{ id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] }]}>
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemExpansionTrigger
                nativeButton={false}
                render={<span />}
                data-testid={`trigger-${item.id}`}
              />
              {item.label}
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    const trigger = screen.getByTestId('trigger-a');
    expect(trigger).toHaveAttribute('role', 'button');
    expect(trigger).toHaveAccessibleName('Expand A');
    fireEvent.click(trigger);
    expect(screen.getByRole('treeitem', { name: 'A1' })).toBeVisible();
    expect(trigger).toHaveAccessibleName('Collapse A');
  });

  describe('Alt-click', () => {
    const items: TreeDefaultItem[] = [
      {
        id: 'a',
        label: 'A',
        children: [
          { id: 'a1', label: 'A1', children: [{ id: 'a1x', label: 'A1X' }] },
          { id: 'a2', label: 'A2', disabled: true, children: [{ id: 'a2x', label: 'A2X' }] },
        ],
      },
      { id: 'b', label: 'B', children: [{ id: 'b1', label: 'B1' }] },
    ];

    function AltClickTree(props: {
      defaultExpandedItems?: string[];
      onExpandedItemsChange: Tree.Root.Props['onExpandedItemsChange'];
    }) {
      return (
        <Tree.Root items={items} {...props}>
          <Tree.List>
            {(item: TreeDefaultItem) => (
              <Tree.Item itemId={item.id}>
                <Tree.ItemExpansionTrigger data-testid={`trigger-${item.id}`} />
                {item.label}
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>
      );
    }

    it('expands the item and the descendants that can be toggled', async () => {
      const onExpandedItemsChange = vi.fn();
      await render(<AltClickTree onExpandedItemsChange={onExpandedItemsChange} />);

      fireEvent.click(screen.getByTestId('trigger-a'), { altKey: true });

      expect(onExpandedItemsChange).toHaveBeenCalledTimes(1);
      expect([...onExpandedItemsChange.mock.calls[0][0]].sort()).toEqual(['a', 'a1']);
      expect(onExpandedItemsChange.mock.calls[0][1]).toHaveProperty('reason', 'trigger-press');
      expect(screen.getByRole('treeitem', { name: 'A1X' })).toBeVisible();
      expect(screen.queryByRole('treeitem', { name: 'A2X' })).toBeNull();
      expect(screen.queryByRole('treeitem', { name: 'B1' })).toBeNull();
    });

    it('collapses the item with its descendants', async () => {
      const onExpandedItemsChange = vi.fn();
      await render(
        <AltClickTree
          defaultExpandedItems={['a', 'a1', 'b']}
          onExpandedItemsChange={onExpandedItemsChange}
        />,
      );

      fireEvent.click(screen.getByTestId('trigger-a'), { altKey: true });

      expect(onExpandedItemsChange).toHaveBeenCalledTimes(1);
      expect(onExpandedItemsChange.mock.calls[0][0]).toEqual(['b']);
      expect(screen.queryByRole('treeitem', { name: 'A1' })).toBeNull();

      // Expanding it again shows its children collapsed.
      fireEvent.click(screen.getByTestId('trigger-a'));
      expect(screen.getByRole('treeitem', { name: 'A1' })).toBeVisible();
      expect(screen.queryByRole('treeitem', { name: 'A1X' })).toBeNull();
    });
  });

  it('does not toggle the item when the trigger itself is disabled', async () => {
    const onExpandedItemsChange = vi.fn();
    await render(
      <Tree.Root
        items={[{ id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] }]}
        onExpandedItemsChange={onExpandedItemsChange}
      >
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemExpansionTrigger
                disabled
                nativeButton={false}
                render={<span />}
                data-testid={`trigger-${item.id}`}
              />
              {item.label}
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    const trigger = screen.getByTestId('trigger-a');
    expect(trigger).toHaveAttribute('data-disabled');
    fireEvent.click(trigger);
    expect(onExpandedItemsChange).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'lets the click propagate past the tree only when allowed: %s',
    async (allowPropagation) => {
      const onOuterClick = vi.fn();
      await render(
        <div onClick={onOuterClick}>
          <Tree.Root
            items={[{ id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] }]}
            expandOnClick
            onExpandedItemsChange={(_expandedItems, eventDetails) => {
              if (allowPropagation) {
                eventDetails.allowPropagation();
              }
            }}
          >
            <Tree.List>
              {(item) => (
                <Tree.Item itemId={item.id}>
                  <Tree.ItemExpansionTrigger data-testid={`trigger-${item.id}`} />
                  {item.label}
                </Tree.Item>
              )}
            </Tree.List>
          </Tree.Root>
        </div>,
      );

      fireEvent.click(screen.getByTestId('trigger-a'));

      expect(onOuterClick).toHaveBeenCalledTimes(allowPropagation ? 1 : 0);
      // The row ignores the click of its trigger, so it doesn't toggle the item back.
      expect(screen.getByRole('treeitem', { name: 'A1' })).toBeVisible();
    },
  );
});
