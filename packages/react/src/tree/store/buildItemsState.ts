import type { TreeItemId, TreeItemModel, TreeItemMeta, TreeItemsState } from './types';
import { TREE_VIEW_ROOT_PARENT_ID } from './types';

export function buildItemsState(
  items: readonly TreeItemModel[],
  getItemId: (item: TreeItemModel) => TreeItemId,
  getItemLabel: (item: TreeItemModel) => string,
  getItemChildren: (item: TreeItemModel) => TreeItemModel[] | undefined,
  isItemDisabled: (item: TreeItemModel) => boolean,
  isItemSelectionDisabled: (item: TreeItemModel) => boolean,
): TreeItemsState {
  const itemMetaLookup: Record<TreeItemId, TreeItemMeta> = {};
  const itemModelLookup: Record<TreeItemId, TreeItemModel> = {};
  const itemOrderedChildrenIdsLookup: Record<string, TreeItemId[]> = {};
  const itemChildrenIndexesLookup: Record<string, Record<TreeItemId, number>> = {};

  function processSiblings(
    siblings: readonly TreeItemModel[],
    parentId: TreeItemId | null,
    depth: number,
  ) {
    const parentKey = parentId ?? TREE_VIEW_ROOT_PARENT_ID;
    const orderedChildrenIds: TreeItemId[] = [];
    const childrenIndexes: Record<TreeItemId, number> = {};

    for (let i = 0; i < siblings.length; i += 1) {
      const item = siblings[i];
      const itemId = getItemId(item);
      const children = getItemChildren(item);
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
        label: getItemLabel(item),
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
