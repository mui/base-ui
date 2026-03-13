'use client';
import * as React from 'react';
import type { TreeItemId, TreeDefaultItemModel } from '../store/types';
import { TREE_VIEW_ROOT_PARENT_ID } from '../store/types';
import type { TreeLazyLoading, TreeStore } from '../store/TreeStore';
import { selectors } from '../store/selectors';
import { NestedDataManager } from './NestedDataManager';
import type { DataSourceCache } from './cache';

const LAZY_LOADED_ITEMS_INITIAL_STATE = {
  loading: {} as Record<string, boolean>,
  errors: {} as Record<string, Error | undefined>,
};

export interface UseTreeLazyLoadingParameters<TItem = TreeDefaultItemModel> {
  /**
   * Fetches children for a given parent item.
   * Called with `undefined` to fetch root items.
   */
  fetchChildren: (parentId?: TreeItemId) => Promise<TItem[]>;
  /**
   * Returns the number of children an item has.
   * - `0` means the item is a leaf (not expandable).
   * - `-1` means the count is unknown (still expandable).
   * - Any positive number means the item is expandable.
   */
  getChildrenCount: (item: TItem) => number;
  /**
   * Optional cache for fetched children.
   * When omitted, no caching is performed (useful when using React Query or similar).
   * Use `DataSourceCacheDefault` for a simple TTL-based cache.
   */
  cache?: DataSourceCache<TItem> | undefined;
}

class LazyLoadingPlugin<TItem = TreeDefaultItemModel> implements TreeLazyLoading<TItem> {
  private store: TreeStore<any, TItem> | null = null;

  private nestedDataManager = new NestedDataManager(this);

  private configRef: React.RefObject<UseTreeLazyLoadingParameters<TItem>>;

  private cache: DataSourceCache<TItem> | undefined;

  constructor(configRef: React.RefObject<UseTreeLazyLoadingParameters<TItem>>) {
    this.configRef = configRef;
    this.cache = configRef.current.cache;
  }

  private get config(): UseTreeLazyLoadingParameters<TItem> {
    return this.configRef.current;
  }

  attach(store: TreeStore<any, TItem>): void {
    this.store = store;
    this.cache = this.config.cache;

    // Initialize lazy loading state
    store.set('lazyLoadedItems', { ...LAZY_LOADED_ITEMS_INITIAL_STATE });

    // Scan existing items and mark expandable ones based on getChildrenCount
    this.updateExpandableOverrides();

    // If no items provided, fetch root items
    if (store.state.items.length === 0) {
      this.fetchItemChildren({ itemId: null });
    }

    // Fetch children for already-expanded items
    this.fetchExpandedItems();
  }

  private updateExpandableOverrides(): void {
    if (!this.store) {
      return;
    }

    const { getChildrenCount } = this.config;
    const overrides: Record<TreeItemId, boolean> = {};
    const metaLookup = selectors.itemMetaLookup(this.store.state);

    for (const [id, meta] of Object.entries(metaLookup)) {
      const model = selectors.itemModel(this.store.state, id) as TItem;
      if (!model) {
        continue;
      }
      const count = getChildrenCount(model);
      const shouldBeExpandable = count !== 0;
      if (shouldBeExpandable !== meta.expandable) {
        overrides[id] = shouldBeExpandable;
      }
    }

    if (Object.keys(overrides).length > 0) {
      this.store.setItemExpandableOverrides(overrides);
    }
  }

  private async fetchExpandedItems(): Promise<void> {
    if (!this.store) {
      return;
    }

    const fetchChildrenIfExpanded = async (parentIds: TreeItemId[]): Promise<void> => {
      if (!this.store) {
        return;
      }
      const expandedItems = parentIds.filter((id) =>
        selectors.isItemExpanded(this.store!.state, id),
      );
      if (expandedItems.length === 0) {
        return;
      }
      const itemsToLazyLoad = expandedItems.filter(
        (id) => selectors.itemOrderedChildrenIds(this.store!.state, id).length === 0,
      );
      if (itemsToLazyLoad.length > 0) {
        await this.fetchItems(itemsToLazyLoad);
      }
      if (!this.store) {
        return;
      }
      const childrenIds = expandedItems.flatMap((id) =>
        selectors.itemOrderedChildrenIds(this.store!.state, id),
      );
      await fetchChildrenIfExpanded(childrenIds);
    };

    await fetchChildrenIfExpanded(selectors.itemOrderedChildrenIds(this.store.state, null));
  }

  async onBeforeExpand(
    itemId: TreeItemId,
    reason: Parameters<TreeLazyLoading['onBeforeExpand']>[1],
    event?: Event,
  ): Promise<void> {
    if (!this.store) {
      return;
    }

    await this.fetchItems([itemId]);

    const hasError = selectors.itemError(this.store.state, itemId) != null;
    if (!hasError) {
      this.store.applyItemExpansion(itemId, true, reason, event);
    }
  }

  private setItemLoading(itemId: TreeItemId | null, isLoading: boolean): void {
    if (!this.store?.state.lazyLoadedItems) {
      return;
    }

    if (selectors.isItemLoading(this.store.state, itemId) === isLoading) {
      return;
    }

    const itemIdWithDefault = itemId ?? TREE_VIEW_ROOT_PARENT_ID;
    const loading = { ...this.store.state.lazyLoadedItems.loading };
    if (!isLoading) {
      delete loading[itemIdWithDefault];
    } else {
      loading[itemIdWithDefault] = isLoading;
    }

    this.store.set('lazyLoadedItems', { ...this.store.state.lazyLoadedItems, loading });
  }

  private setItemError(itemId: TreeItemId | null, error: Error | null): void {
    if (!this.store?.state.lazyLoadedItems) {
      return;
    }

    const itemIdWithDefault = itemId ?? TREE_VIEW_ROOT_PARENT_ID;
    const currentError = selectors.itemError(this.store.state, itemId);
    if (currentError === error) {
      return;
    }

    const errors = { ...this.store.state.lazyLoadedItems.errors };
    if (error === null) {
      delete errors[itemIdWithDefault];
    } else {
      errors[itemIdWithDefault] = error;
    }

    this.store.set('lazyLoadedItems', { ...this.store.state.lazyLoadedItems, errors });
  }

  public fetchItems = (parentIds: TreeItemId[]): Promise<void> =>
    this.nestedDataManager.queue(parentIds);

  public updateItemChildren = (itemId: TreeItemId | null): Promise<void> =>
    this.fetchItemChildren({ itemId, forceRefresh: true });

  public fetchItemChildren = async ({
    itemId,
    forceRefresh,
  }: {
    itemId: TreeItemId | null;
    forceRefresh?: boolean | undefined;
  }): Promise<void> => {
    if (!this.store) {
      return;
    }

    const { fetchChildren } = this.config;

    // Clear the request if the item is not in the tree
    if (itemId != null && !selectors.itemMeta(this.store.state, itemId)) {
      this.nestedDataManager.clearPendingRequest(itemId);
      return;
    }

    // Reset the state if we are fetching the root items
    if (itemId == null) {
      this.store.set('lazyLoadedItems', { ...LAZY_LOADED_ITEMS_INITIAL_STATE });
    }

    const cacheKey = itemId ?? TREE_VIEW_ROOT_PARENT_ID;

    if (!forceRefresh && this.cache) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData !== undefined && cachedData !== -1) {
        if (itemId != null) {
          this.nestedDataManager.setRequestSettled(itemId);
        }
        this.store.setItemChildrenOverride(cacheKey, cachedData);
        this.updateExpandableOverridesForItems(cachedData);
        this.setItemLoading(itemId, false);
        return;
      }

      // Set loading state
      this.setItemLoading(itemId, true);

      if (cachedData === -1) {
        this.store.removeChildrenOverride(cacheKey);
      }
    } else {
      this.setItemLoading(itemId, true);
    }

    // Reset existing error if any
    if (selectors.itemError(this.store.state, itemId) != null) {
      this.setItemError(itemId, null);
    }

    try {
      let response: TItem[];
      if (itemId == null) {
        response = await fetchChildren();
      } else {
        response = await fetchChildren(itemId);
        this.nestedDataManager.setRequestSettled(itemId);
      }

      // Save the response in the cache
      if (this.cache) {
        this.cache.set(cacheKey, response);
      }

      // Update the items in the state
      this.store.setItemChildrenOverride(cacheKey, response);
      this.updateExpandableOverridesForItems(response);
    } catch (error) {
      this.setItemError(itemId, error as Error);
      if (forceRefresh) {
        this.store.removeChildrenOverride(cacheKey);
      }
    } finally {
      this.setItemLoading(itemId, false);
      if (itemId != null) {
        this.nestedDataManager.setRequestSettled(itemId);
      }
    }
  };

  private updateExpandableOverridesForItems(items: TItem[]): void {
    if (!this.store) {
      return;
    }

    const { getChildrenCount } = this.config;
    const itemToId = this.store.state.itemToId;
    const overrides: Record<TreeItemId, boolean> = {};

    for (const item of items) {
      const id = itemToId(item);
      const count = getChildrenCount(item);
      overrides[id] = count !== 0;
    }

    if (Object.keys(overrides).length > 0) {
      this.store.setItemExpandableOverrides(overrides);
    }
  }

  destroy(): void {
    this.nestedDataManager.clear();
    this.store = null;
  }
}

/**
 * Creates a lazy loading configuration for `Tree.Root`.
 * Returns an object to pass as the `lazyLoading` prop.
 *
 * @example
 * ```tsx
 * const lazyLoading = Tree.useLazyLoading({
 *   fetchChildren: (parentId) => fetch(`/api/items/${parentId}`).then(r => r.json()),
 *   getChildrenCount: (item) => item.childCount ?? 0,
 * });
 *
 * <Tree.Root items={items} lazyLoading={lazyLoading}>
 *   {(item) => <Tree.Item>...</Tree.Item>}
 * </Tree.Root>
 * ```
 */
export function useLazyLoading<TItem = TreeDefaultItemModel>(
  config: UseTreeLazyLoadingParameters<TItem>,
): TreeLazyLoading<TItem> {
  const configRef = React.useRef(config);
  configRef.current = config;

  const pluginRef = React.useRef<LazyLoadingPlugin<TItem> | null>(null);
  if (pluginRef.current === null) {
    pluginRef.current = new LazyLoadingPlugin<TItem>(configRef);
  }

  // Keep cache in sync
  // eslint-disable-next-line dot-notation
  pluginRef.current['cache'] = config.cache;

  return pluginRef.current;
}

export namespace useLazyLoading {
  export type Parameters<TItem = TreeDefaultItemModel> = UseTreeLazyLoadingParameters<TItem>;
}
