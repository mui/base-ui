import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { TreeStoreTap } from '../../../test/describeTree';
import { Tree } from '..';
import type { TreeStore } from '../store/TreeStore';
import type { TreeViewport } from '../utils/viewport';

const { render } = createRenderer();

const ITEMS = Array.from({ length: 10 }, (_, index) => ({
  id: String(index),
  label: `Item ${index}`,
}));

/** A viewport of `rowsPerPage` rows of 20px, standing in for the list's geometry. */
function createViewport(rowsPerPage: number) {
  return {
    getRowHeight: () => 20,
    getScrollportHeight: () => rowsPerPage * 20,
    scrollToItem: vi.fn(),
    scrollIntoViewHorizontally: vi.fn(),
  } satisfies TreeViewport;
}

async function renderTree(viewport: TreeViewport) {
  const storeRef = React.createRef<TreeStore | null>();
  await render(
    <Tree.Root defaultItems={ITEMS}>
      <TreeStoreTap storeRef={storeRef} />
      <Tree.List>
        {(item) => (
          <Tree.Item itemId={item.id} data-testid={item.id}>
            <Tree.ItemContent>{item.label}</Tree.ItemContent>
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>,
  );
  // Replaces the viewport of the list, which jsdom can't measure.
  act(() => {
    storeRef.current!.items.attachViewport(viewport);
  });
}

describe('TreeItemsPlugin viewport', () => {
  it('brings the focused row into view through the viewport', async () => {
    const viewport = createViewport(3);
    await renderTree(viewport);

    act(() => screen.getByTestId('0').focus());
    fireEvent.keyDown(screen.getByTestId('0'), { key: 'ArrowDown' });

    expect(viewport.scrollToItem).toHaveBeenLastCalledWith('1');
  });

  it('pages by the rows the viewport fits, stopping at the first and last row', async () => {
    await renderTree(createViewport(4));
    const press = (id: string, key: string) => fireEvent.keyDown(screen.getByTestId(id), { key });

    act(() => screen.getByTestId('0').focus());
    press('0', 'PageDown');
    expect(screen.getByTestId('4')).toHaveFocus();
    press('4', 'PageDown');
    press('8', 'PageDown');
    expect(screen.getByTestId('9')).toHaveFocus();
    press('9', 'PageUp');
    press('5', 'PageUp');
    press('1', 'PageUp');
    expect(screen.getByTestId('0')).toHaveFocus();
  });
});
