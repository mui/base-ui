export type CollectionItemId = string | number;

/**
 * Actions that can be performed on a collection-based component such as a
 * tree, kanban board, or list.
 */
export interface CollectionActions<TItem = unknown> {
  /**
   * Returns whether the given item exists in the collection.
   */
  hasItem: (itemId: CollectionItemId) => boolean;
  /**
   * Returns all currently selected item IDs.
   */
  getSelectedItemIds: () => Set<CollectionItemId>;
  /**
   * Returns the models (data) for the given item IDs, in the order provided.
   * Items that do not exist in the collection are excluded from the result.
   */
  getItemModels: (itemIds: readonly CollectionItemId[]) => TItem[];
}
