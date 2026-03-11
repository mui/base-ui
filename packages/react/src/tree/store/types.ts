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

/**
 * The computed lookup tables derived from the items prop and accessor functions.
 */
export interface TreeItemsState {
  itemModelLookup: Record<TreeItemId, TreeItemModel>;
  itemMetaLookup: Record<TreeItemId, TreeItemMeta>;
  itemOrderedChildrenIdsLookup: Record<string, TreeItemId[]>;
  itemChildrenIndexesLookup: Record<string, Record<TreeItemId, number>>;
}

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
  /**
   * Whether the entire tree is disabled
   */
  disabled: boolean;
  /**
   * The raw items prop from the user
   */
  items: readonly TreeItemModel[];
  /**
   * Overlay for inline label edits — applied on top of computed metadata
   */
  itemLabelOverrides: Record<TreeItemId, string>;
  /**
   * Overlay for imperative disabled changes — applied on top of computed metadata
   */
  itemDisabledOverrides: Record<TreeItemId, boolean>;
  /**
   * IDs of currently expanded items
   */
  expandedItems: readonly TreeItemId[];
  /**
   * Whether clicking anywhere on an item row toggles expansion
   */
  expandOnClick: boolean;
  /**
   * Currently selected items.
   * - string | null when selectionMode is 'single'
   * - string[] when selectionMode is 'multiple'
   * - null when selectionMode is 'none'
   */
  selectedItems: TreeItemId | null | readonly TreeItemId[];
  /**
   * The selection mode of the tree
   */
  selectionMode: TreeSelectionMode;
  /**
   * Whether at least one item must remain selected
   */
  disallowEmptySelection: boolean;
  /**
   * How selection propagates through the tree hierarchy
   */
  selectionPropagation: SelectionPropagation;
  /**
   * The currently focused item ID, or null
   */
  focusedItemId: TreeItemId | null;
  /**
   * Whether disabled items can receive focus
   */
  itemFocusableWhenDisabled: boolean;
  /**
   * The ID of the item currently being edited, or null
   */
  editedItemId: TreeItemId | null;
  /**
   * Lazy loading state. undefined when lazy loading is not in use
   */
  lazyLoadedItems: LazyLoadedItemsState | undefined;
  /**
   * Extracts the ID from an item model
   */
  getItemId: (item: TreeItemModel) => TreeItemId;
  /**
   * Extracts the label from an item model
   */
  getItemLabel: (item: TreeItemModel) => string;
  /**
   * Extracts the children from an item model
   */
  getItemChildren: (item: TreeItemModel) => TreeItemModel[] | undefined;
  /**
   * Whether an item is disabled
   */
  isItemDisabled: (item: TreeItemModel) => boolean;
  /**
   * Whether an item's selection is disabled
   */
  isItemSelectionDisabled: (item: TreeItemModel) => boolean;
  /**
   * Whether an item is editable
   */
  isItemEditable: ((item: TreeItemModel) => boolean) | boolean;
  /**
   * Whether the tree is in a right-to-left direction
   */
  isRtl: boolean;
  /**
   * User-provided tree ID for accessibility
   */
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

  // Lazy loading
  fetchChildren: ((parentId: TreeItemId | null) => Promise<TreeItemModel[]>) | undefined;

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
  setIsItemDisabled: (itemId: TreeItemId, isDisabled: boolean) => void;
  updateItemLabel: (itemId: TreeItemId, newLabel: string) => void;
}
