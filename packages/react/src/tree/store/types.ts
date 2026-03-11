import type { BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';

export type TreeItemId = string;

/**
 * The selection mode of the tree.
 * - `'none'`: Selection is disabled.
 * - `'single'`: Only one item can be selected at a time.
 * - `'multiple'`: Multiple items can be selected.
 */
export type TreeSelectionMode = 'none' | 'single' | 'multiple';

/**
 * Conditional type that narrows the selected items type based on the `selectionMode` prop.
 * When `Mode` is `'multiple'`, the type is `TreeItemId[]`.
 * Otherwise, the type is `TreeItemId`.
 */
export type TreeSelectedItemsType<Mode extends TreeSelectionMode | undefined> =
  Mode extends 'multiple' ? TreeItemId[] : TreeItemId;

/**
 * The shape of an item as provided by the user in the `items` prop.
 * Users can extend this with custom properties.
 */
export interface TreeItemModel {
  id: string;
  label: string;
  children?: TreeItemModel[] | undefined;
  [key: string]: any;
}

/**
 * Internal metadata about an item, derived from the items prop processing.
 */
export interface TreeItemMeta {
  id: TreeItemId;
  parentId: TreeItemId | null;
  depth: number;
  expandable: boolean;
  disabled: boolean;
  selectable: boolean;
  label: string;
}

/**
 * Selection propagation configuration.
 */
export interface SelectionPropagation {
  parents?: boolean | undefined;
  descendants?: boolean | undefined;
}

/**
 * Lazy loading state for items.
 */
export interface LazyLoadedItemsState {
  loading: Record<string, boolean>;
  errors: Record<string, Error | undefined>;
}

export const TREE_VIEW_ROOT_PARENT_ID = '__ROOT__';

export type TreeRootExpansionChangeEventReason =
  | typeof REASONS.itemPress
  | typeof REASONS.keyboard
  | typeof REASONS.imperativeAction;

export type TreeRootExpansionChangeEventDetails =
  BaseUIChangeEventDetails<TreeRootExpansionChangeEventReason>;

export type TreeRootSelectionChangeEventReason =
  | typeof REASONS.itemPress
  | typeof REASONS.keyboard
  | typeof REASONS.imperativeAction;

export type TreeRootSelectionChangeEventDetails =
  BaseUIChangeEventDetails<TreeRootSelectionChangeEventReason>;

/**
 * The full store state for the Tree component.
 */
export interface TreeState {
  // === Items ===
  /** Model of each item as provided via the items prop */
  itemModelLookup: Record<TreeItemId, TreeItemModel>;
  /** Metadata derived from processing items */
  itemMetaLookup: Record<TreeItemId, TreeItemMeta>;
  /** Ordered children IDs for each parent. Key '__ROOT__' = root-level items */
  itemOrderedChildrenIdsLookup: Record<string, TreeItemId[]>;
  /** Index of each child within its parent's children array */
  itemChildrenIndexesLookup: Record<string, Record<TreeItemId, number>>;

  // === Expansion ===
  /** IDs of currently expanded items */
  expandedItems: readonly TreeItemId[];

  // === Selection ===
  /** Currently selected items. string | null for single, string[] for multi */
  selectedItems: TreeItemId | null | readonly TreeItemId[];
  /** The selection mode of the tree */
  selectionMode: TreeSelectionMode;
  /** Whether at least one item must remain selected */
  disallowEmptySelection: boolean;
  /** How selection propagates through the tree hierarchy */
  selectionPropagation: SelectionPropagation;

  // === Focus ===
  /** The currently focused item ID, or null */
  focusedItemId: TreeItemId | null;
  /** Whether disabled items can receive focus */
  itemFocusableWhenDisabled: boolean;

  // === Label editing ===
  /** The ID of the item currently being edited, or null */
  editedItemId: TreeItemId | null;

  // === Lazy loading ===
  /** Lazy loading state. undefined when lazy loading is not in use */
  lazyLoadedItems: LazyLoadedItemsState | undefined;

  // === Identity ===
  /** User-provided tree ID for accessibility */
  treeId: string | undefined;
}

/**
 * Non-reactive context values stored alongside state in the TreeStore.
 */
export interface TreeStoreContext {
  // Callbacks wired via useContextCallback
  onExpandedItemsChange: (
    expandedItems: TreeItemId[],
    details: TreeRootExpansionChangeEventDetails,
  ) => void;
  onSelectedItemsChange: (
    selectedItems: TreeItemId | null | TreeItemId[],
    details: TreeRootSelectionChangeEventDetails,
  ) => void;
  onItemExpansionToggle: (itemId: TreeItemId, isExpanded: boolean) => void;
  onItemSelectionToggle: (itemId: TreeItemId, isSelected: boolean) => void;
  onItemFocus: (itemId: TreeItemId) => void;
  onItemClick: (event: React.MouseEvent, itemId: TreeItemId) => void;
  onItemLabelChange: (itemId: TreeItemId, newLabel: string) => void;

  // Item configuration callbacks
  getItemId: (item: TreeItemModel) => TreeItemId;
  getItemLabel: (item: TreeItemModel) => string;
  getItemChildren: (item: TreeItemModel) => TreeItemModel[] | undefined;
  isItemDisabled: (item: TreeItemModel) => boolean;
  isItemSelectionDisabled: (item: TreeItemModel) => boolean;
  isItemEditable: ((item: TreeItemModel) => boolean) | boolean;

  // Lazy loading
  fetchChildren: ((parentId: TreeItemId | null) => Promise<TreeItemModel[]>) | undefined;

  // RTL
  isRtl: boolean;

  // DOM ref for the tree root element
  rootRef: React.RefObject<HTMLElement | null>;
}

/**
 * Actions that can be performed imperatively on a tree via actionsRef.
 */
export interface TreeRootActions {
  focusItem: (itemId: TreeItemId) => void;
  getItem: (itemId: TreeItemId) => TreeItemModel;
  getItemDOMElement: (itemId: TreeItemId) => HTMLElement | null;
  getItemOrderedChildrenIds: (itemId: TreeItemId | null) => TreeItemId[];
  getItemTree: () => TreeItemModel[];
  getParentId: (itemId: TreeItemId) => TreeItemId | null;
  isItemExpanded: (itemId: TreeItemId) => boolean;
  isItemSelected: (itemId: TreeItemId) => boolean;
  setItemExpansion: (itemId: TreeItemId, isExpanded: boolean) => void;
  setItemSelection: (itemId: TreeItemId, isSelected: boolean) => void;
  setEditedItem: (itemId: TreeItemId | null) => void;
  updateItemLabel: (itemId: TreeItemId, newLabel: string) => void;
}
