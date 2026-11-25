import type { TreeStore } from '../store/TreeStore';
import type { TreeItemKind } from '../store/types';
import type { TreeGridPlugin } from '../../tree-grid/plugins/TreeGridPlugin';

/**
 * Throws when a `TreeGrid` part renders in a `Tree.Root`.
 * `treePart` names the part a `Tree` renders instead, if any.
 */
export function assertTreeGrid(
  store: TreeStore<any, any>,
  part: string,
  treePart?: string,
): asserts store is TreeStore<any, any> & { grid: TreeGridPlugin<any> } {
  if (store.grid === undefined) {
    const fix =
      treePart === undefined
        ? 'Replace <Tree.Root> with <TreeGrid.Root>.'
        : `Render <Tree.${treePart}> instead, or replace <Tree.Root> with <TreeGrid.Root>.`;
    throw new Error(
      `Base UI: <TreeGrid.${part}> must be placed in <TreeGrid.Root>. ` +
        '<Tree.Root> follows the tree pattern, whose items cannot contain cells or controls ' +
        `that the keyboard reaches. ${fix} ` +
        'See https://base-ui.com/react/components/tree-grid',
    );
  }
}

// The `Tree` item parts, and the part a `TreeGrid` renders inside its cell instead.
const PLAIN_ITEM_PARTS = {
  checkbox: ['CheckboxItem', 'RowCheckbox'],
  link: ['LinkItem', 'CellLink'],
} as const;

/** Throws when a `Tree` item part renders in a `TreeGrid.Root`. */
export function assertPlainTree(
  store: TreeStore<any, any>,
  kind: Exclude<TreeItemKind, 'item'>,
): void {
  if (store.grid !== undefined) {
    const [part, treeGridPart] = PLAIN_ITEM_PARTS[kind];
    throw new Error(
      `Base UI: <Tree.${part}> cannot be placed in <TreeGrid.Root>. ` +
        'Each item of a tree grid is a row that holds its controls in a cell, so the item ' +
        'itself cannot act as one. ' +
        `Render <TreeGrid.Row> with <TreeGrid.${treeGridPart}> inside ` +
        '<TreeGrid.Cell> instead. ' +
        'See https://base-ui.com/react/components/tree-grid',
    );
  }
}
