import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Tree } from '..';

const items: Tree.DefaultItem[] = [
  { id: 'documents', label: 'Documents', children: [{ id: 'resume', label: 'Resume' }] },
  { id: 'music', label: 'Music' },
];

describe('<Tree.GridProvider />', () => {
  const { render } = createRenderer();

  it('renders a tree of tree items without the provider', async () => {
    await render(
      <Tree.Root items={items} selectionMode="multiple">
        <Tree.List aria-label="Files">
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemCheckbox />
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

  it('renders a treegrid whose rows have a cell named after their item', async () => {
    await render(
      <Tree.GridProvider>
        <Tree.Root items={items} selectionMode="multiple">
          <Tree.List aria-label="Files">
            {(item) => (
              <Tree.Item itemId={item.id}>
                <Tree.ItemContent>
                  <Tree.ItemCheckbox />
                  {item.label}
                  <Tree.ItemButton>Info</Tree.ItemButton>
                </Tree.ItemContent>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>
      </Tree.GridProvider>,
    );

    expect(screen.getByRole('treegrid', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByRole('row', { name: 'Documents' })).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell')).toHaveLength(2);
    // Named after the item, not after every control label inside it.
    expect(screen.getAllByRole('gridcell')[0]).toHaveAccessibleName('Documents');
    // A single column that is always rendered needs no column metadata.
    expect(screen.getAllByRole('gridcell')[0]).not.toHaveAttribute('aria-colindex');
    expect(screen.queryByRole('treeitem')).toBeNull();
  });

  it.each([
    { name: 'ItemContent', part: <Tree.ItemContent /> },
    { name: 'ItemButton', part: <Tree.ItemButton /> },
    { name: 'ItemInput', part: <Tree.ItemInput /> },
    { name: 'ItemLink', part: <Tree.ItemLink /> },
    { name: 'ItemControl', part: <Tree.ItemControl /> },
  ])('throws when Tree.$name renders in a tree without the provider', async ({ name, part }) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      render(
        <Tree.Root items={items}>
          <Tree.List>
            {(item) => (
              <Tree.Item itemId={item.id}>
                {part}
                {item.label}
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>,
      ),
    ).rejects.toThrow(
      new RegExp(`<Tree\\.${name}> must be placed in a tree wrapped in <Tree\\.GridProvider>`),
    );
  });
});
