import type { TreeStore } from '../store/TreeStore';

/** Throws when the tree a grid part renders in is not wrapped in `Tree.GridProvider`. */
export function assertTreeGrid(store: TreeStore<any, any>, part: string): void {
  if (store.grid === undefined) {
    throw new Error(
      `Base UI: <Tree.${part}> must be placed in a tree wrapped in <Tree.GridProvider>. ` +
        'Without it, the tree follows the tree pattern, whose items cannot contain cells or ' +
        'controls that the keyboard reaches. ' +
        'Wrap the <Tree.Root> it belongs to in <Tree.GridProvider>. ' +
        'See https://base-ui.com/react/components/tree#controls-inside-items',
    );
  }
}
