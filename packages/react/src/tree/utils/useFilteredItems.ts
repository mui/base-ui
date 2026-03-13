'use client';
import * as React from 'react';
import type { Filter } from '../../utils/filter';
import type { TreeItemId } from '../store/types';

const defaultItemToId = (item: any): string => item.id;
const defaultItemToStringLabel = (item: any): string => item.label;
const defaultItemToChildren = (item: any): any[] | undefined => item.children;

export interface UseTreeFilteredItemsOptions<TItem> {
  /**
   * The items to filter.
   */
  items: readonly TItem[];
  /**
   * The text to filter items by.
   * When empty, all items are returned.
   */
  filterText: string;
  /**
   * The filter object to use for matching.
   * Obtain one via `Tree.useFilter()`.
   */
  filter?: Filter | undefined;
  /**
   * The matching strategy to use.
   * @default 'contains'
   */
  method?: 'contains' | 'startsWith' | 'endsWith' | undefined;
  /**
   * Whether to automatically expand ancestor items that have matching descendants.
   * When `true`, the return value includes an `expandedItems` array.
   * @default false
   */
  autoExpand?: boolean | undefined;
  /**
   * Extracts the unique ID from an item.
   * Required when `autoExpand` is `true`.
   * @default (item) => item.id
   */
  itemToId?: ((item: TItem) => string) | undefined;
  /**
   * Extracts the string label from an item for filtering.
   * @default (item) => item.label
   */
  itemToStringLabel?: ((item: TItem) => string) | undefined;
  /**
   * Extracts the children from an item.
   * @default (item) => item.children
   */
  itemToChildren?: ((item: TItem) => TItem[] | undefined) | undefined;
}

export interface UseTreeFilteredItemsReturnValue<TItem> {
  /**
   * The filtered items tree.
   * Contains only matching items and their ancestors.
   */
  items: TItem[];
  /**
   * The IDs of items that should be expanded to reveal matching descendants.
   * Only populated when `autoExpand` is `true`.
   */
  expandedItems: TreeItemId[];
}

/**
 * Filters a tree of items by a text query, preserving ancestors of matching items.
 */
export function useTreeFilteredItems<TItem>(
  options: UseTreeFilteredItemsOptions<TItem> & { autoExpand: true },
): UseTreeFilteredItemsReturnValue<TItem>;
export function useTreeFilteredItems<TItem>(
  options: UseTreeFilteredItemsOptions<TItem> & { autoExpand?: false | undefined },
): TItem[];
export function useTreeFilteredItems<TItem>(
  options: UseTreeFilteredItemsOptions<TItem>,
): TItem[] | UseTreeFilteredItemsReturnValue<TItem>;
export function useTreeFilteredItems<TItem>(
  options: UseTreeFilteredItemsOptions<TItem>,
): TItem[] | UseTreeFilteredItemsReturnValue<TItem> {
  const {
    items,
    filterText,
    filter,
    method = 'contains',
    autoExpand = false,
    itemToId = defaultItemToId,
    itemToStringLabel = defaultItemToStringLabel,
    itemToChildren = defaultItemToChildren,
  } = options;

  return React.useMemo(() => {
    const trimmedQuery = filterText.trim();

    if (!trimmedQuery || !filter) {
      if (autoExpand) {
        return { items: items as TItem[], expandedItems: [] };
      }
      return items as TItem[];
    }

    const expandedItems: TreeItemId[] = [];

    const filterTree = (nodes: readonly TItem[]): TItem[] => {
      const result: TItem[] = [];

      for (const node of nodes) {
        const label = itemToStringLabel(node);
        const matches = filter[method](label, trimmedQuery);
        const children = itemToChildren(node);
        const filteredChildren = children && children.length > 0 ? filterTree(children) : [];

        if (matches || filteredChildren.length > 0) {
          const hasFilteredChildren = filteredChildren.length > 0;
          const newNode =
            hasFilteredChildren && children
              ? ({ ...node, children: filteredChildren } as TItem)
              : node;

          result.push(newNode);

          if (autoExpand && hasFilteredChildren) {
            expandedItems.push(itemToId(node));
          }
        }
      }

      return result;
    };

    const filteredItems = filterTree(items);

    if (autoExpand) {
      return { items: filteredItems, expandedItems };
    }
    return filteredItems;
  }, [items, filterText, filter, method, autoExpand, itemToId, itemToStringLabel, itemToChildren]);
}
