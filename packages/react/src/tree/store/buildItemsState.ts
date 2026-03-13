import type { TreeItemId, TreeDefaultItemModel, TreeItemMeta, TreeItemsState } from './types';
import { TREE_VIEW_ROOT_PARENT_ID } from './types';

export function buildItemsState<TItem = TreeDefaultItemModel>(
  items: readonly TItem[],
  itemToId: (item: TItem) => TreeItemId,
  itemToLabel: (item: TItem) => string,
  itemToChildren: (item: TItem) => TItem[] | undefined,
  isItemDisabled: (item: TItem) => boolean,
  isItemSelectionDisabled: (item: TItem) => boolean,
): TreeItemsState<TItem> {
  const itemMetaLookup: Record<TreeItemId, TreeItemMeta> = {};
  const itemModelLookup: Record<TreeItemId, TItem> = {};
  const itemOrderedChildrenIdsLookup: Record<string, TreeItemId[]> = {};
  const itemChildrenIndexesLookup: Record<string, Record<TreeItemId, number>> = {};

  function processSiblings(
    siblings: readonly TItem[],
    parentId: TreeItemId | null,
    depth: number,
  ) {
    const parentKey = parentId ?? TREE_VIEW_ROOT_PARENT_ID;
    const orderedChildrenIds: TreeItemId[] = [];
    const childrenIndexes: Record<TreeItemId, number> = {};

    for (let i = 0; i < siblings.length; i += 1) {
      const item = siblings[i];
      const itemId = itemToId(item);
      const children = itemToChildren(item);
      const expandable = !!children && children.length > 0;

      orderedChildrenIds.push(itemId);
      childrenIndexes[itemId] = i;

      itemModelLookup[itemId] = item;
      itemMetaLookup[itemId] = {
        id: itemId,
        parentId,
        depth,
        expandable,
        disabled: isItemDisabled(item),
        selectable: !isItemSelectionDisabled(item),
        label: itemToLabel(item),
      };

      if (children && children.length > 0) {
        processSiblings(children, itemId, depth + 1);
      }
    }

    itemOrderedChildrenIdsLookup[parentKey] = orderedChildrenIds;
    itemChildrenIndexesLookup[parentKey] = childrenIndexes;
  }

  processSiblings(items, null, 0);

  return {
    itemMetaLookup,
    itemModelLookup,
    itemOrderedChildrenIdsLookup,
    itemChildrenIndexesLookup,
  };
}
