import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Tree } from '..';
import { TreeGrid } from '../../tree-grid';

const items: Tree.DefaultItem[] = [
  { id: 'documents', label: 'Documents', children: [{ id: 'resume', label: 'Resume' }] },
  { id: 'music', label: 'Music' },
];

describe('<Tree.CheckboxItem />', () => {
  const { render } = createRenderer();

  it('passes its checked state to its state callbacks and data attributes', async () => {
    const states: Tree.CheckboxItem.State[] = [];
    await render(
      <Tree.Root
        items={items}
        multiple="opt-in"
        defaultSelectedItems={['resume']}
        defaultExpandedItems={['documents']}
        checkboxSelectionPropagation={{ parents: false, descendants: false }}
      >
        <Tree.List>
          {(item) => (
            <Tree.CheckboxItem
              itemId={item.id}
              data-testid={item.id}
              className={(state) => {
                if (state.itemId === 'documents') {
                  states.push(state);
                }
                return undefined;
              }}
            >
              {item.label}
            </Tree.CheckboxItem>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    expect(states.at(-1)).toMatchObject({ checked: false, indeterminate: true });
    expect(screen.getByTestId('documents')).toHaveAttribute('data-indeterminate');
    expect(screen.getByTestId('documents')).not.toHaveAttribute('data-unchecked');
    expect(screen.getByTestId('resume')).toHaveAttribute('data-checked');
    expect(screen.getByTestId('music')).toHaveAttribute('data-unchecked');
  });

  it('checks its descendants on a Ctrl click, like on a plain click', async () => {
    await render(
      <Tree.Root items={items} multiple="opt-in" defaultExpandedItems={['documents']}>
        <Tree.List>
          {(item) => (
            <Tree.CheckboxItem itemId={item.id} data-testid={item.id}>
              {item.label}
            </Tree.CheckboxItem>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    fireEvent.click(screen.getByTestId('documents'), { ctrlKey: true });

    expect(screen.getByTestId('documents')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('resume')).toHaveAttribute('aria-checked', 'true');
  });
  it('keeps the selection when the arrow keys move focus to it with multiple="opt-in"', async () => {
    const onSelectedItemsChange = vi.fn();
    await render(
      <Tree.Root
        items={items}
        multiple="opt-in"
        defaultSelectedItems={['documents']}
        onSelectedItemsChange={onSelectedItemsChange}
      >
        <Tree.List>
          {(item) => (
            <Tree.CheckboxItem itemId={item.id} data-testid={item.id}>
              {item.label}
            </Tree.CheckboxItem>
          )}
        </Tree.List>
      </Tree.Root>,
    );
    act(() => screen.getByTestId('documents').focus());

    fireEvent.keyDown(screen.getByTestId('documents'), { key: 'ArrowDown' });
    expect(screen.getByTestId('music')).toHaveFocus();
    expect(onSelectedItemsChange).not.toHaveBeenCalled();
  });

  it('throws in a TreeGrid.Root', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      render(
        <TreeGrid.Root items={[{ id: 'a', label: 'A' }]}>
          <TreeGrid.Table>
            {(item) => <Tree.CheckboxItem itemId={item.id}>{item.label}</Tree.CheckboxItem>}
          </TreeGrid.Table>
        </TreeGrid.Root>,
      ),
    ).rejects.toThrow(
      /<Tree\.CheckboxItem> cannot be placed in <TreeGrid\.Root>.*<TreeGrid\.RowCheckbox>/,
    );
  });
});
