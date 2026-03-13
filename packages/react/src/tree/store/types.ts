import type {
  BaseUIChangeEventDetails,
  BaseUIGenericEventDetails,
} from '../../utils/createBaseUIEventDetails';
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

/**
 * Sparse per-item metadata patches applied on top of computed metadata.
 * Only the fields that are actually overridden are present.
 */
export type ItemMetaPatches = Record<TreeItemId, Partial<Pick<TreeItemMeta, 'label' | 'disabled'>>>;

/**
 * Lazy-loaded tree structure additions.
 * Contains children arrays keyed by parent ID and expandability hints.
 */
export interface LazyItemsState<TItem = TreeItemModel> {
  children: Record<string, TItem[]>;
  expandable: Record<TreeItemId, boolean>;
}

export const TREE_VIEW_ROOT_PARENT_ID = '__ROOT__';

/**
 * The computed lookup tables derived from the items prop and accessor functions.
 */
export interface TreeItemsState<TItem = TreeItemModel> {
  itemModelLookup: Record<TreeItemId, TItem>;
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

export type TreeItemFocusEventReason =
  | typeof REASONS.itemPress
  | typeof REASONS.keyboard
  | typeof REASONS.imperativeAction;

export type TreeItemFocusEventDetails = BaseUIGenericEventDetails<TreeItemFocusEventReason>;

export type TreeItemClickEventReason = typeof REASONS.itemPress;

export type TreeItemClickEventDetails = BaseUIGenericEventDetails<TreeItemClickEventReason>;

export type TreeItemLabelChangeEventReason =
  | typeof REASONS.keyboard
  | typeof REASONS.imperativeAction;

export type TreeItemLabelChangeEventDetails =
  BaseUIGenericEventDetails<TreeItemLabelChangeEventReason>;

export type TreeItemExpansionToggleEventDetails =
  BaseUIGenericEventDetails<TreeRootExpansionChangeEventReason>;

export type TreeItemSelectionToggleEventDetails =
  BaseUIGenericEventDetails<TreeRootSelectionChangeEventReason>;

/**
 * The full store state for the Tree component.
 */
export interface TreeState<TItem = TreeItemModel> {
  /**
   * Whether the entire tree is disabled
   */
  disabled: boolean;
  /**
   * The raw items prop from the user
   */
  items: readonly TItem[];
  /**
   * Sparse per-item metadata patches (label edits, imperative disabled).
   * Applied on top of the computed items state in selectors.
   */
  itemMetaPatches: ItemMetaPatches;
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
   * Lazy-loaded tree structure additions.
   * Contains children arrays keyed by parent ID and expandability hints.
   */
  lazyItems: LazyItemsState<TItem>;
  /**
   * Lazy loading state. undefined when lazy loading is not in use
   */
  lazyLoadedItems: LazyLoadedItemsState | undefined;
  /**
   * Extracts the ID from an item model
   */
  getItemId: (item: TItem) => TreeItemId;
  /**
   * Extracts the label from an item model
   */
  getItemLabel: (item: TItem) => string;
  /**
   * Extracts the children from an item model
   */
  getItemChildren: (item: TItem) => TItem[] | undefined;
  /**
   * Whether an item is disabled
   */
  isItemDisabled: (item: TItem) => boolean;
  /**
   * Whether an item's selection is disabled
   */
  isItemSelectionDisabled: (item: TItem) => boolean;
  /**
   * Whether an item is editable
   */
  isItemEditable: ((item: TItem) => boolean) | boolean;
  /**
   * The layout direction of the tree
   */
  direction: 'ltr' | 'rtl';
  /**
   * Whether group transitions (expand/collapse animation) are enabled.
   */
  enableGroupTransition: boolean;
  /**
   * Map of item IDs that are currently animating their children group.
   * Key: parent item ID, Value: animation direction and affected children.
   */
  animatingGroups: Record<
    TreeItemId,
    {
      type: 'expanding' | 'collapsing';
      childIds: TreeItemId[];
    }
  >;
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
  onItemExpansionToggle: (
    itemId: TreeItemId,
    isExpanded: boolean,
    details: TreeItemExpansionToggleEventDetails,
  ) => void;
  onItemSelectionToggle: (
    itemId: TreeItemId,
    isSelected: boolean,
    details: TreeItemSelectionToggleEventDetails,
  ) => void;
  onItemFocus: (itemId: TreeItemId, details: TreeItemFocusEventDetails) => void;
  onItemClick: (itemId: TreeItemId, details: TreeItemClickEventDetails) => void;
  onItemLabelChange: (
    itemId: TreeItemId,
    newLabel: string,
    details: TreeItemLabelChangeEventDetails,
  ) => void;

  // DOM ref for the tree root element
  rootRef: React.RefObject<HTMLElement | null>;
}

/**
 * Actions that can be performed imperatively on a tree via actionsRef.
 */
export interface TreeRootActions<TItem = TreeItemModel> {
  focusItem: (itemId: TreeItemId) => void;
  getItem: (itemId: TreeItemId) => TItem;
  getItemDOMElement: (itemId: TreeItemId) => HTMLElement | null;
  getItemOrderedChildrenIds: (itemId: TreeItemId | null) => TreeItemId[];
  getItemTree: () => TItem[];
  getParentId: (itemId: TreeItemId) => TreeItemId | null;
  isItemExpanded: (itemId: TreeItemId) => boolean;
  isItemSelected: (itemId: TreeItemId) => boolean;
  setItemExpansion: (itemId: TreeItemId, isExpanded: boolean) => void;
  setItemSelection: (itemId: TreeItemId, isSelected: boolean) => void;
  setEditedItem: (itemId: TreeItemId | null) => void;
  setIsItemDisabled: (itemId: TreeItemId, isDisabled: boolean) => void;
  updateItemLabel: (itemId: TreeItemId, newLabel: string) => void;
  updateItemChildren: (itemId: TreeItemId | null) => Promise<void>;
}

/**
 * An entry in the flat list that can be either a regular item or a group transition wrapper.
 */
export type FlatListEntry =
  | { type: 'item'; itemId: TreeItemId }
  | {
      type: 'group-transition';
      parentId: TreeItemId;
      childIds: TreeItemId[];
      animation: 'expanding' | 'collapsing';
    };
