import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, act } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Tree } from '..';

const { render } = createRenderer();

describe('TreeItemModelProvider', () => {
  it('skips unchanged models across parent renders and expansion, and renders changed models', async () => {
    const items = [
      { id: 'a', label: 'A', children: [{ id: 'child', label: 'Child' }] },
      { id: 'b', label: 'B' },
    ];
    const actionsRef = React.createRef<Tree.Root.Actions<Tree.DefaultItem>>();
    const renderItem = vi.fn((item: Tree.DefaultItem) => (
      <Tree.Item itemId={item.id}>
        <Tree.ItemContent>{item.label}</Tree.ItemContent>
      </Tree.Item>
    ));
    function App() {
      return (
        <Tree.Root defaultItems={items} actionsRef={actionsRef}>
          <Tree.List>{renderItem}</Tree.List>
        </Tree.Root>
      );
    }
    // Counts `renderItem` calls, which Strict Mode would double.
    const { rerender } = await render(<App />, { strict: false });
    renderItem.mockClear();
    await rerender(<App />);
    expect(renderItem).not.toHaveBeenCalled();
    act(() => actionsRef.current!.setItemExpansion('a', true));
    expect(renderItem.mock.calls.map(([item]) => item.id)).toEqual(['child']);
    renderItem.mockClear();
    act(() => {
      actionsRef.current!.applyTransaction((transaction) =>
        transaction.update('b', { label: 'Renamed' }),
      );
    });
    expect(renderItem.mock.calls.map(([item]) => item.id)).toEqual(['b']);
    expect(screen.getByRole('row', { name: 'Renamed' })).toBeVisible();
  });

  it('updates rows when the render callback changes', async () => {
    const items = [{ id: 'a', label: 'A' }];
    const item = (label: string) =>
      function RenderItem() {
        return (
          <Tree.Item itemId="a">
            <Tree.ItemContent>{label}</Tree.ItemContent>
          </Tree.Item>
        );
      };
    const { rerender } = await render(
      <Tree.Root items={items}>
        <Tree.List>{item('Before')}</Tree.List>
      </Tree.Root>,
    );
    await rerender(
      <Tree.Root items={items}>
        <Tree.List>{item('After')}</Tree.List>
      </Tree.Root>,
    );
    expect(screen.getByText('After')).toBeVisible();
    expect(screen.queryByText('Before')).toBeNull();
  });
});
