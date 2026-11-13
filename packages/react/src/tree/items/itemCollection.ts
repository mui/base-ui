import type { TreeItemId } from '../store/types';

const TREE_ITEM_COLLECTION = Symbol('TreeItemCollection');

/**
 * An opaque collection created by `Tree.createItems()`.
 *
 * It carries the source item type so the root can infer it for its props, callbacks, and actions.
 * Pass it directly to the root component; it has no public members.
 */
export declare class TreeItemCollection<in out TItem> {
  private constructor();
  private readonly __treeItemCollectionBrand: (item: TItem) => TItem;
}

/**
 * The members behind a `TreeItemCollection`. The package doesn't export it, but the built
 * types of other modules reference it, so `stripInternal` must keep it.
 */
export interface InternalTreeItemCollection<TItem = any> {
  readonly [TREE_ITEM_COLLECTION]: true;
  readonly data: readonly TItem[] | undefined;
  readonly itemToId: (item: TItem) => TreeItemId;
  readonly itemToStringLabel: (item: TItem) => string;
  readonly itemToChildren: (item: TItem) => readonly TItem[] | undefined;
  readonly isItemDisabled: (item: TItem) => boolean;
  readonly isItemSelectionDisabled: (item: TItem) => boolean;
  readonly setItemChildren: ((item: TItem, children: readonly TItem[]) => TItem) | undefined;
}

/** The members that read an item. Lookups built with them go stale when one changes. */
export const ITEM_READER_KEYS = [
  'itemToId',
  'itemToStringLabel',
  'itemToChildren',
  'isItemDisabled',
  'isItemSelectionDisabled',
] as const;

export type TreeItemReaders<TItem> = Pick<
  InternalTreeItemCollection<TItem>,
  (typeof ITEM_READER_KEYS)[number]
>;

export function createInternalTreeItemCollection<TItem>(
  data: readonly TItem[] | undefined,
  accessors: Omit<InternalTreeItemCollection<TItem>, typeof TREE_ITEM_COLLECTION | 'data'>,
): TreeItemCollection<TItem> {
  return {
    [TREE_ITEM_COLLECTION]: true,
    data,
    ...accessors,
  } as unknown as TreeItemCollection<TItem>;
}

const STANDARD_ACCESSORS = {
  itemToId: (item: any): TreeItemId => item.id,
  itemToStringLabel: (item: any): string => item.label,
  itemToChildren: (item: any): readonly any[] | undefined => item.children,
  isItemDisabled: (item: any): boolean => !!item.disabled,
  isItemSelectionDisabled: () => false,
  setItemChildren: (item: any, children: readonly any[]): any => ({ ...item, children }),
};

export function createStandardTreeItemCollection<TItem>(
  data: readonly TItem[] | undefined,
): InternalTreeItemCollection<TItem> {
  return {
    [TREE_ITEM_COLLECTION]: true,
    data,
    ...STANDARD_ACCESSORS,
  };
}

export function normalizeTreeItemCollection<TItem>(
  value: readonly TItem[] | TreeItemCollection<TItem> | undefined,
): InternalTreeItemCollection<TItem> {
  if (Array.isArray(value) || value === undefined) {
    return createStandardTreeItemCollection(value);
  }

  if ((value as Partial<InternalTreeItemCollection> | null)?.[TREE_ITEM_COLLECTION] !== true) {
    throw new Error(
      'Base UI: the `items` or `defaultItems` prop received an object that is not a valid item collection, ' +
        'so its items and accessors cannot be read. Pass a standard item array or the result of ' +
        '`Tree.createItems()`. ' +
        'See https://base-ui.com/react/components/tree#createitems',
    );
  }

  return value as unknown as InternalTreeItemCollection<TItem>;
}
