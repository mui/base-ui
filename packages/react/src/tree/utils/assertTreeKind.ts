import type { TreeStore } from '../store/TreeStore';
import type { TreeItemKind } from '../store/types';
import type { TreeGridPlugin } from '../../action-tree/plugins/TreeGridPlugin';

/**
 * Throws when an `ActionTree` part renders in a `Tree.Root`.
 * `treePart` names the part a `Tree` renders instead, if any.
 */
export function assertActionTree(
  store: TreeStore<any, any>,
  part: string,
  treePart?: string,
): asserts store is TreeStore<any, any> & { grid: TreeGridPlugin<any> } {
  if (store.grid === undefined) {
    const fix =
      treePart === undefined
        ? 'Replace <Tree.Root> with <ActionTree.Root>.'
        : `Render <Tree.${treePart}> instead, or replace <Tree.Root> with <ActionTree.Root>.`;
    throw new Error(
      `Base UI: <ActionTree.${part}> must be placed in <ActionTree.Root>. ` +
        '<Tree.Root> follows the tree pattern, whose items cannot contain cells or controls ' +
        `that the keyboard reaches. ${fix} ` +
        'See https://base-ui.com/react/components/action-tree',
    );
  }
}

// The `Tree` item parts, and the part an `ActionTree` renders inside its cell instead.
const PLAIN_ITEM_PARTS = {
  checkbox: ['CheckboxItem', 'ItemCheckbox'],
  link: ['LinkItem', 'ItemLink'],
} as const;

/** Throws when a `Tree` item part renders in an `ActionTree.Root`. */
export function assertPlainTree(
  store: TreeStore<any, any>,
  kind: Exclude<TreeItemKind, 'item'>,
): void {
  if (store.grid !== undefined) {
    const [part, actionTreePart] = PLAIN_ITEM_PARTS[kind];
    throw new Error(
      `Base UI: <Tree.${part}> cannot be placed in <ActionTree.Root>. ` +
        'Each item of an action tree is a row that holds its controls in a cell, so the item ' +
        'itself cannot act as one. ' +
        `Render <ActionTree.Item> with <ActionTree.${actionTreePart}> inside ` +
        '<ActionTree.ItemContent> instead. ' +
        'See https://base-ui.com/react/components/action-tree',
    );
  }
}
