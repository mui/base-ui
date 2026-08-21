import { describe, expect, it } from 'vitest';
import {
  ROOT_ID,
  createBookmarkTree,
  getBookmarkSeed,
  getFolderPath,
  getInsertionLocationForNode,
  getMoveValidity,
  getVisibleCount,
  insertBookmarkSeed,
  moveNode,
  removeNode,
  type BookmarkSeed,
} from './bookmark-bar-model';

const seed: BookmarkSeed[] = [
  { id: 'a', name: 'A', url: 'https://a.example' },
  { id: 'b', name: 'B', url: 'https://b.example' },
  {
    id: 'folder',
    name: 'Folder',
    children: [
      { id: 'c', name: 'C', url: 'https://c.example' },
      {
        id: 'nested',
        name: 'Nested',
        children: [{ id: 'd', name: 'D', url: 'https://d.example' }],
      },
    ],
  },
];

describe('bookmark bar model', () => {
  it('normalizes nested bookmark data', () => {
    const tree = createBookmarkTree(seed);

    expect(tree.children[ROOT_ID]).toEqual(['a', 'b', 'folder']);
    expect(tree.children.folder).toEqual(['c', 'nested']);
    expect(tree.nodes.d.parentId).toBe('nested');
    expect(getFolderPath(tree, 'nested')).toBe('Folder / Nested');
  });

  it('moves items in both directions within one folder', () => {
    const tree = createBookmarkTree(seed);
    const movedEarlier = moveNode(tree, 'b', ROOT_ID, 0);
    const movedLater = moveNode(tree, 'a', ROOT_ID, 2);

    expect(movedEarlier.children[ROOT_ID]).toEqual(['b', 'a', 'folder']);
    expect(movedLater.children[ROOT_ID]).toEqual(['b', 'a', 'folder']);
    expect(getMoveValidity(tree, 'a', ROOT_ID, 0)).toBe(false);
    expect(getMoveValidity(tree, 'a', ROOT_ID, 1)).toBe(false);
  });

  it('moves bookmarks across folders and clamps the insertion index', () => {
    const tree = createBookmarkTree(seed);
    const movedToRoot = moveNode(tree, 'c', ROOT_ID, 1);
    const movedToStart = moveNode(tree, 'd', ROOT_ID, -10);

    expect(movedToRoot.children[ROOT_ID]).toEqual(['a', 'c', 'b', 'folder']);
    expect(movedToRoot.children.folder).toEqual(['nested']);
    expect(movedToRoot.nodes.c.parentId).toBe(ROOT_ID);
    expect(movedToStart.children[ROOT_ID][0]).toBe('d');
  });

  it('rejects moving a folder into itself or a descendant', () => {
    const tree = createBookmarkTree(seed);

    expect(getMoveValidity(tree, 'folder', 'folder', 0)).toBe('reject');
    expect(getMoveValidity(tree, 'folder', 'nested', 0)).toBe('reject');
    expect(moveNode(tree, 'folder', 'nested', 0)).toBe(tree);
  });

  it('removes a folder and all of its descendants', () => {
    const tree = removeNode(createBookmarkTree(seed), 'folder');

    expect(tree.children[ROOT_ID]).toEqual(['a', 'b']);
    expect(tree.nodes.folder).toBeUndefined();
    expect(tree.nodes.c).toBeUndefined();
    expect(tree.nodes.d).toBeUndefined();
    expect(tree.children.nested).toBeUndefined();
  });

  it('inserts after a page but inside a folder', () => {
    const tree = createBookmarkTree(seed);

    expect(getInsertionLocationForNode(tree, 'a')).toEqual({ parentId: ROOT_ID, index: 1 });
    expect(getInsertionLocationForNode(tree, 'folder')).toEqual({ parentId: 'folder', index: 2 });
  });

  it('copies nested folders with new IDs', () => {
    const tree = createBookmarkTree(seed);
    const folderSeed = getBookmarkSeed(tree, 'folder');
    let id = 0;

    expect(folderSeed).not.toBeNull();
    const result = insertBookmarkSeed(tree, folderSeed!, ROOT_ID, 1, (type) => {
      id += 1;
      return `copy-${type}-${id}`;
    });

    expect(result.rootId).toBe('copy-folder-1');
    expect(result.tree.children[ROOT_ID]).toEqual(['a', 'copy-folder-1', 'b', 'folder']);
    expect(result.tree.children['copy-folder-1']).toEqual(['copy-bookmark-2', 'copy-folder-3']);
    expect(result.tree.nodes['copy-bookmark-4']).toMatchObject({
      name: 'D',
      parentId: 'copy-folder-3',
      type: 'bookmark',
    });
    expect(tree.nodes['copy-folder-1']).toBeUndefined();
  });
});

describe('getVisibleCount', () => {
  it('shows every item when they exactly fit', () => {
    expect(getVisibleCount([40, 50], 20, 10, 100)).toBe(2);
  });

  it('reserves room for the overflow button when items do not fit', () => {
    expect(getVisibleCount([40, 50], 20, 10, 99)).toBe(1);
  });

  it('shows only the overflow button in a narrow container', () => {
    expect(getVisibleCount([40, 50], 20, 10, 29)).toBe(0);
  });
});
