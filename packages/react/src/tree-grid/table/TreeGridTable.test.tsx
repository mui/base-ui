import { describe, expect, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { TreeGrid } from '..';
import { Tree } from '../../tree';

describe('<TreeGrid.Table />', () => {
  const { render } = createRenderer();

  describe('prop: children', () => {
    it('hides the collapsed plain rows of a tree grid nested in a row of a function child', async () => {
      await render(
        <Tree.Root items={[{ id: 'outer', label: 'Outer' }]}>
          <Tree.List>
            {(item: Tree.DefaultItem) => (
              <Tree.Item itemId={item.id}>
                {item.label}
                <TreeGrid.Root
                  items={[
                    { id: 'fruits', label: 'Fruits', children: [{ id: 'apple', label: 'Apple' }] },
                    { id: 'vegetables', label: 'Vegetables' },
                  ]}
                >
                  <TreeGrid.Table data-testid="nested">
                    {['fruits', 'apple', 'vegetables'].map((id) => (
                      <TreeGrid.Row key={id} itemId={id}>
                        <TreeGrid.Cell>{id}</TreeGrid.Cell>
                      </TreeGrid.Row>
                    ))}
                  </TreeGrid.Table>
                </TreeGrid.Root>
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>,
      );
      expect(
        Array.from(
          screen.getByTestId('nested').querySelectorAll<HTMLElement>('[role="row"]'),
          (row) => row.dataset.itemId,
        ),
      ).toEqual(['fruits', 'vegetables']);
    });
  });
});
