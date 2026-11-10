import type {
  BaseUIChangeEventDetails,
  BaseUIGenericEventDetails,
  BaseUIHighlightEventDetails,
} from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';

import type { InternalTreeItemCollection } from '../items/itemCollection';
import type { TreeStatusChange } from '../status/TreeStatus';

export type TreeItemId = string | number;

/**
 * The selection mode of the hierarchical collection.
 * - `'none'`: Selection is disabled.
 * - `'single'`: Only one item can be selected at a time.
 * - `'multiple'`: Multiple items can be selected.
 */
export type TreeSelectionMode = 'none' | 'single' | 'multiple';

/** Controls how a filtered tree presents non-matching items. */
export type TreeFilterMode = 'hide-non-matches' | 'collapse-non-matches' | 'expand-matches';

/**
 * Determines whether an item matches the filter query.
 *
 * @param text The item's label.
 * @param query The trimmed filter query.
 * @param item The item model.
 */
export type TreeFilterFunction<TItem> = (text: string, query: string, item: TItem) => boolean;

/**
 * Sentinel value representing "all selectable items are selected".
 * When used as the value of `selectedItems`, every item that supports selection and is
 * not disabled is considered selected — including items added after the value is set.
 *
 * Use it with `selectionMode="multiple"`. A tree that pauses selection with
 * `selectionMode="none"` or `disabled` keeps it. Deselecting an item replaces it with
 * an array of the remaining selected IDs. Exposed as `Tree.SELECTION_ALL`.
 *
 * It is a unique symbol rather than a string, so it never collides with an item
 * `id` and cannot be accidentally matched by `selectedItems.includes(...)`.
 */
export const TREE_SELECTION_ALL: unique symbol = Symbol('Base UI: Tree.SELECTION_ALL');

/**
 * Conditional type that narrows the selected items type based on the `selectionMode` prop.
 * When `Mode` is `'multiple'`, the type is `readonly TreeItemId[]` or `typeof TREE_SELECTION_ALL`.
 * The `'none'` mode accepts either cardinality so a controlled tree can preserve
 * its selection while interaction is temporarily disabled.
 */
export type TreeSelectedItemsType<Mode extends TreeSelectionMode | undefined> =
  Mode extends 'multiple'
    ? readonly TreeItemId[] | typeof TREE_SELECTION_ALL
    : Mode extends 'none'
      ? TreeItemId | readonly TreeItemId[] | typeof TREE_SELECTION_ALL
      : TreeItemId;

/**
 * The value `onSelectedItemsChange` receives: the shape of `TreeSelectedItemsType`, with
 * mutable arrays the tree doesn't keep.
 */
export type TreeSelectedItemsChangeValue<Mode extends TreeSelectionMode | undefined> =
  Mode extends 'multiple'
    ? TreeItemId[] | typeof TREE_SELECTION_ALL
    : Mode extends 'none'
      ? TreeItemId | TreeItemId[] | typeof TREE_SELECTION_ALL
      : TreeItemId;

/**
 * The shape of an item as provided by the user in the `items` prop.
 * Users can extend this with custom properties.
 */
export interface TreeDefaultItem {
  id: TreeItemId;
  label: string;
  children?: readonly TreeDefaultItem[] | undefined;
  disabled?: boolean | undefined;
}

/**
 * Internal metadata about an item, derived from the items prop processing.
 */
export interface TreeItemMeta {
  id: TreeItemId;
  parentId: TreeItemId | null;
  level: number;
  expandable: boolean;
  disabled: boolean;
  /**
   * Pre-computed disabled state that accounts for ancestor disabled states.
   * `true` when either the item itself or any of its ancestors is disabled.
   */
  resolvedDisabled: boolean;
  selectable: boolean;
  label: string;
}

/**
 * Checkbox selection propagation configuration.
 * Controls how checkbox selection propagates through the hierarchy.
 * This does not affect item presses, which use replace-selection semantics.
 */
export interface TreeCheckboxSelectionPropagation {
  /**
   * Whether selecting all of a parent's descendants selects the parent, and deselecting
   * one of them deselects it.
   */
  parents?: boolean | undefined;
  /**
   * Whether selecting or deselecting a parent does the same to all its descendants.
   */
  descendants?: boolean | undefined;
}

/**
 * Sentinel key standing in for "no parent" in the internal parent-keyed lookups.
 *
 * A symbol, not a string: item ids are `string | number`, so no consumer id can
 * collide with it.
 */
export const TREE_VIEW_ROOT_PARENT_ID: unique symbol = Symbol('treeRootParent');

/** A key in the parent-keyed lookups: an item id, or the root sentinel. */
export type TreeItemLookupKey = string;

export type TreeParentKey = TreeItemId | typeof TREE_VIEW_ROOT_PARENT_ID;

export type TreeParentLookupKey = TreeItemLookupKey | typeof TREE_VIEW_ROOT_PARENT_ID;

export type TreeItemKeyed<V> = Record<TreeItemLookupKey, V>;

/**
 * A lookup keyed by parent. The root entry is optional so it can be `delete`d,
 * and every read is already written defensively (`?? EMPTY_ARRAY`, `if (!x)`)
 * because an arbitrary id may not be present.
 */
export type TreeParentKeyed<V> = TreeItemKeyed<V> & {
  [TREE_VIEW_ROOT_PARENT_ID]?: V | undefined;
};

/**
 * The computed lookup tables derived from the items prop and accessor functions.
 */
export interface TreeItemsState<TItem = any> {
  /**
   * Maps each item ID to its full item model.
   */
  itemModelLookup: TreeItemKeyed<TItem>;
  /**
   * Maps each item ID to its computed metadata (level, parent, disabled, etc.).
   */
  itemMetaLookup: TreeItemKeyed<TreeItemMeta>;
  /**
   * Maps each item ID to the ordered list of its children's IDs.
   * The root's children are keyed by `TREE_VIEW_ROOT_PARENT_ID`.
   */
  itemOrderedChildrenIdsLookup: TreeParentKeyed<TreeItemId[]>;
}

export type TreeRootExpansionChangeEventReason =
  | typeof REASONS.itemPress
  | typeof REASONS.triggerPress
  | typeof REASONS.keyboard
  | typeof REASONS.imperativeAction
  | typeof REASONS.missing
  | typeof REASONS.none;

export type TreeRootExpansionChangeEventDetails =
  BaseUIChangeEventDetails<TreeRootExpansionChangeEventReason>;

export type TreeRootSelectionChangeEventReason =
  | typeof REASONS.itemPress
  | typeof REASONS.keyboard
  | typeof REASONS.escapeKey
  | typeof REASONS.imperativeAction
  | typeof REASONS.missing
  | typeof REASONS.none;

export type TreeRootSelectionChangeEventDetails =
  BaseUIChangeEventDetails<TreeRootSelectionChangeEventReason>;

export type TreeRootHighlightEventReason =
  | typeof REASONS.itemPress
  | typeof REASONS.keyboard
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type TreeRootHighlightEventDetails =
  BaseUIHighlightEventDetails<TreeRootHighlightEventReason>;

export type TreeRootItemExpansionToggleEventDetails =
  BaseUIGenericEventDetails<TreeRootExpansionChangeEventReason>;

export type TreeRootItemSelectionToggleEventDetails =
  BaseUIGenericEventDetails<TreeRootSelectionChangeEventReason>;

/** `'imperative-action'`: an `actionsRef` mutation method. */
export type TreeRootItemsChangeEventReason = typeof REASONS.imperativeAction;

/** One group of children animating in or out while its parent expands or collapses. */
export interface TreeAnimatingGroup {
  parentId: TreeItemId;
  type: 'expanding' | 'collapsing';
  childIds: TreeItemId[];
}

/** The filter inputs `Tree.FilterProvider` passes to the store. */
export interface TreeFilterOptions<TItem = any> {
  /** The trimmed query. */
  query: string;
  filter: TreeFilterFunction<TItem> | null;
  filteredItems: readonly TItem[] | undefined;
  mode: TreeFilterMode;
}

/** Expansion changes the user made while filtering, applied over the filter-forced expansion. */
export interface TreeFilterExpansionOverrides {
  /** The filter session the overrides belong to; they are ignored once the filter inputs change. */
  session: object;
  /** `false` collapses a row the filter expands; `true` expands a row the filter keeps collapsed. */
  values: ReadonlyMap<TreeItemId, boolean>;
}

/**
 * The hierarchy as the tree presents it. Features that change the presentation
 * without changing the items, such as filtering, derive it from the canonical
 * lookups with a {@link TreeViewTransform}.
 */
export interface TreeView {
  /** Maps each parent to its presented children, in order. */
  childrenLookup: TreeParentKeyed<TreeItemId[]>;
  /** The expanded items as presented. */
  expandedItems: ReadonlySet<TreeItemId>;
  /**
   * Whether the view departs from the canonical hierarchy. Group transitions
   * assume the canonical hierarchy, so they pause while it does.
   */
  transformed: boolean;
}

/**
 * Derives a view from the previous one. Must return the same object while its
 * inputs are unchanged so the selectors derived from the view stay memoized.
 */
export type TreeViewTransform = (state: TreeState, view: TreeView) => TreeView;

/**
 * Where items land in the tree: a parent and an index among its children.
 * It is a valid position for the `add`, `set`, and `move` operations of `applyTransaction()`.
 */
export interface TreeItemDestination {
  parentId: TreeItemId | null;
  index: number;
}

/**
 * Where `add`, `set`, or `move` places items: `before` or `after` the item with the given ID,
 * or under a parent at an index.
 * Positions are resolved against the items as the earlier operations of the transaction left them.
 */
export type TreeItemPosition =
  | {
      /**
       * The ID of the item to place the items before.
       */
      before: TreeItemId;
    }
  | {
      /**
       * The ID of the item to place the items after.
       */
      after: TreeItemId;
    }
  | {
      /**
       * The ID of the parent to place the items in, or `null` for the root.
       */
      parentId: TreeItemId | null;
      /**
       * The index among the parent's children, clamped to the valid range.
       * A `move` counts the moved items at their old positions: in `[a, b, c]`, moving `a`
       * to index `2` gives `[b, a, c]`.
       * @default the end of the parent's children
       */
      index?: number | undefined;
    };

/**
 * Records the item changes of an `applyTransaction()` call.
 * The operations are applied in the order they are called, once the callback returns.
 * Each one applies to the items as the earlier operations left them.
 */
export interface TreeItemTransaction<TItem> {
  /**
   * Inserts an item with its descendants, at the end of the root unless `position` places it elsewhere.
   * Skipped when the tree has an item with the same ID: use `set` to replace an item wholesale or
   * `update` to merge fields into it.
   */
  add: (item: TItem, position?: TreeItemPosition) => void;
  /**
   * Inserts an item, or replaces the item with the same ID wholesale.
   * The item is stored exactly as passed, and its children replace the previous ones.
   * A replaced item keeps its position, and an item the tree already holds is skipped.
   */
  set: (item: TItem, position?: TreeItemPosition) => void;
  /**
   * Merges a patch into the item with the given ID (`{ ...item, ...patch }`).
   * Skipped when no item has the ID, or when the patch changes no field.
   */
  update: (itemId: TreeItemId, patch: Partial<TItem>) => void;
  /**
   * Moves items with their descendants, keeping their tree order.
   * IDs the tree doesn't have are skipped.
   */
  move: (itemIds: TreeItemId | readonly TreeItemId[], position: TreeItemPosition) => void;
  /**
   * Removes an item with its descendants. Unknown IDs are ignored.
   */
  remove: (itemId: TreeItemId) => void;
}

/**
 * One change of an `onItemsChange` event. The changes are listed in the order
 * they applied, and each one is relative to the items as the previous ones left
 * them, so applying them in order rebuilds the new items.
 */
export type TreeItemChange<TItem> =
  | {
      type: 'add';
      /**
       * The added items, each with its descendants, placed one after the other.
       */
      items: TItem[];
      /**
       * The ID of the parent the items were added to, or `null` for the root.
       */
      parentId: TreeItemId | null;
      /**
       * The index of the first added item among its new siblings.
       */
      index: number;
    }
  | {
      type: 'remove';
      /**
       * The removed items. Their descendants were removed along with them.
       */
      itemIds: TreeItemId[];
    }
  | {
      type: 'move';
      /**
       * The moved items, with their descendants, in the order they were placed in.
       */
      itemIds: TreeItemId[];
      /**
       * The ID of the parent the items were moved to, or `null` for the root.
       */
      parentId: TreeItemId | null;
      /**
       * The index of the first moved item among its new siblings, counted once the
       * moved items left their previous positions.
       */
      index: number;
    }
  | {
      type: 'update';
      /**
       * The ID of the replaced item.
       */
      itemId: TreeItemId;
      /**
       * The new model, whose children replaced the previous ones.
       */
      item: TItem;
    };

export type TreeRootItemsChangeEventDetails<TItem> = BaseUIChangeEventDetails<
  TreeRootItemsChangeEventReason,
  {
    /**
     * The changes, in the order they applied.
     */
    changes: TreeItemChange<TItem>[];
  }
>;

export interface TreeRootItemExpansionToggleValue {
  itemId: TreeItemId;
  expanded: boolean;
}

export interface TreeRootItemSelectionToggleValue {
  itemId: TreeItemId;
  selected: boolean;
}

/**
 * The full store state for the Tree component.
 */
export interface TreeState<TItem = any> extends TreeItemsState<TItem> {
  /**
   * Whether the entire tree is disabled
   */
  disabled: boolean;
  /**
   * The item models the tree renders from.
   */
  items: readonly TItem[];
  /**
   * The raw `items` prop; `undefined` when the tree is uncontrolled. See
   * `expandedItemsProp` — a mutation commits `items` internally only while this
   * is `undefined`, so a controlled tree that does not feed a change back stays
   * exactly as its parent rendered it.
   */
  itemsProp: readonly TItem[] | undefined;
  /** The active normalized collection descriptor, tracked by identity. */
  itemCollection: InternalTreeItemCollection<TItem>;
  /** Derives the presented view; installed by `Tree.FilterProvider`. */
  viewTransform: TreeViewTransform | undefined;
  /** The filter inputs; `undefined` until `Tree.FilterProvider` installs filtering. */
  filterOptions?: TreeFilterOptions<TItem> | undefined;
  /** Expansion changes the user made during the current filter session. */
  filterExpansionOverrides?: TreeFilterExpansionOverrides | undefined;
  /** The id of the rendered list, published for `Tree.Input` to reference. */
  listId?: string | undefined;
  /** The id of `Tree.Label`, which names the list. */
  labelId?: string | undefined;
  /**
   * IDs of currently expanded items
   */
  expandedItems: readonly TreeItemId[];
  /**
   * The controlled `expandedItems` prop, or `undefined` when uncontrolled.
   * Internal expansion state is only mutated when this is `undefined`; otherwise
   * the prop drives `expandedItems` (synced via an observer in the store).
   */
  expandedItemsProp: readonly TreeItemId[] | undefined;
  /**
   * Whether clicking anywhere on an item row toggles expansion
   */
  expandOnClick: boolean;
  /**
   * The minimum time between two commits of `applyTransaction()`, in milliseconds.
   */
  transactionThrottle: number;
  /**
   * Currently selected items.
   * - `TreeItemId | null` when selectionMode is 'single'
   * - `TreeItemId[]`, or the `TREE_SELECTION_ALL` sentinel, when selectionMode is 'multiple'
   * - null when selectionMode is 'none'
   */
  selectedItems: TreeItemId | null | readonly TreeItemId[] | typeof TREE_SELECTION_ALL;
  /**
   * The controlled `selectedItems` prop, or `undefined` when uncontrolled.
   * Internal selection state is only mutated when this is `undefined`; otherwise
   * the prop drives `selectedItems` (synced via an observer in the store).
   */
  selectedItemsProp:
    TreeItemId | null | readonly TreeItemId[] | typeof TREE_SELECTION_ALL | undefined;
  /**
   * The selection mode of the tree
   */
  selectionMode: TreeSelectionMode;
  /**
   * Whether the user is prevented from deselecting the last selected item
   */
  disableEmptySelection: boolean;
  /**
   * How checkbox selection propagates through the hierarchy.
   * Only applies to checkbox interactions with toggle semantics.
   * It does not affect item presses, which use replace semantics.
   */
  checkboxSelectionPropagation: TreeCheckboxSelectionPropagation;
  /**
   * The currently focused item ID, or null
   */
  focusedItemId: TreeItemId | null;
  /**
   * The item that held focus when focus last left the tree. It keeps the roving
   * tab stop, so tabbing back in returns to where the user left.
   */
  lastFocusedItemId: TreeItemId | null;
  /**
   * Whether disabled items can receive focus
   */
  itemFocusableWhenDisabled: boolean;
  /**
   * The layout direction of the tree
   */
  direction: 'ltr' | 'rtl';
  /**
   * Map of item IDs that are currently animating their children group.
   * Key: parent item ID, Value: animation direction and affected children.
   */
  animatingGroups: TreeItemKeyed<TreeAnimatingGroup>;
  /** How many active `Tree.ItemLink` parts each item renders. */
  activeLinkCounts: TreeItemKeyed<number>;
  /**
   * Whether the consumer passed `onItemsChange`. The store's context always holds
   * a stable wrapper for it, so checking that would never tell a supplied handler
   * from an absent one — which is what the controlled-`items` warning needs.
   */
  hasItemsChangeHandler: boolean;
  /** Whether `onItemSelectionToggle` is set; the context always holds a callable. */
  hasItemSelectionToggleHandler: boolean;
  /** The latest change `Tree.Status` announces. */
  statusChange: TreeStatusChange | null;
}

/**
 * Non-reactive context values stored alongside state in the TreeStore.
 */
export interface TreeStoreContext<TItem> {
  rootRef: React.RefObject<HTMLElement | null>;
  onExpandedItemsChange:
    | ((expandedItems: TreeItemId[], eventDetails: TreeRootExpansionChangeEventDetails) => void)
    | undefined;
  onSelectedItemsChange:
    | ((
        selectedItems: TreeItemId | null | TreeItemId[] | typeof TREE_SELECTION_ALL,
        eventDetails: TreeRootSelectionChangeEventDetails,
      ) => void)
    | undefined;
  onItemExpansionToggle:
    | ((
        value: TreeRootItemExpansionToggleValue,
        eventDetails: TreeRootItemExpansionToggleEventDetails,
      ) => void)
    | undefined;
  onItemSelectionToggle:
    | ((
        value: TreeRootItemSelectionToggleValue,
        eventDetails: TreeRootItemSelectionToggleEventDetails,
      ) => void)
    | undefined;
  onItemHighlighted:
    | ((itemId: TreeItemId | undefined, eventDetails: TreeRootHighlightEventDetails) => void)
    | undefined;
  onItemsChange:
    ((items: TItem[], eventDetails: TreeRootItemsChangeEventDetails<TItem>) => void) | undefined;
}

/**
 * Keys from TreeState that have default values applied by TreeRoot.
 * TreeStoreParameters picks them as required; TreeRootProps makes them optional again.
 */
export type TreeStateDefaultedKeys =
  | 'disabled'
  | 'expandOnClick'
  | 'selectionMode'
  | 'disableEmptySelection'
  | 'checkboxSelectionPropagation'
  | 'itemFocusableWhenDisabled';

export interface TreeStoreParameters<
  Mode extends TreeSelectionMode | undefined = undefined,
  TItem = TreeDefaultItem,
> extends Pick<TreeState<TItem>, TreeStateDefaultedKeys> {
  /** The active normalized collection descriptor. */
  itemCollection: InternalTreeItemCollection<TItem>;
  /**
   * The items to render.
   * Each item must have a unique identifier.
   *
   * Controlled: the component renders exactly what is passed and never changes it on
   * its own. Anything that would modify the model, such as the `actionsRef`
   * mutation methods, reports
   * through `onItemsChange`, and only shows up once the new items come back in
   * through this prop.
   *
   * To let the component own the items, use the `defaultItems` prop instead.
   */
  items?: readonly TItem[] | undefined;
  /**
   * The items that are initially rendered.
   *
   * To render a controlled component, use the `items` prop instead.
   */
  defaultItems?: readonly TItem[] | undefined;
  /**
   * The expanded items.
   *
   * To render an uncontrolled component, use the `defaultExpandedItems` prop instead.
   */
  expandedItems?: readonly TreeItemId[] | undefined;
  /**
   * The items that are initially expanded.
   *
   * To render a controlled component, use the `expandedItems` prop instead.
   * @default []
   */
  defaultExpandedItems?: readonly TreeItemId[] | undefined;
  /**
   * Event handler called when items are expanded or collapsed.
   *
   * The event `reason` is `'missing'` when expanded items left the tree. Automatic
   * changes cannot be canceled; calling `eventDetails.cancel()` for `'missing'` has no effect.
   */
  onExpandedItemsChange?:
    | ((expandedItems: TreeItemId[], eventDetails: TreeRootExpansionChangeEventDetails) => void)
    | undefined;
  /**
   * Event handler called when an item is expanded or collapsed.
   */
  onItemExpansionToggle?:
    | ((
        value: TreeRootItemExpansionToggleValue,
        eventDetails: TreeRootItemExpansionToggleEventDetails,
      ) => void)
    | undefined;
  /**
   * The selected items.
   *
   * To render an uncontrolled component, use the `defaultSelectedItems` prop instead.
   */
  selectedItems?:
    TreeSelectedItemsType<Mode> | (Mode extends 'multiple' ? never : null) | undefined;
  /**
   * The items that are initially selected.
   * Defaults to `null` in single-selection mode and `[]` in multiple-selection mode.
   *
   * To render a controlled component, use the `selectedItems` prop instead.
   */
  defaultSelectedItems?:
    TreeSelectedItemsType<Mode> | (Mode extends 'multiple' ? never : null) | undefined;
  /**
   * Event handler called when the selected items change.
   *
   * The event `reason` is `'missing'` when selected items left the tree, and `'none'` when
   * the tree re-applies checkbox propagation after its items change, such as when a checked
   * folder loads its children. Automatic changes cannot be canceled; calling
   * `eventDetails.cancel()` for `'missing'` or `'none'` has no effect.
   */
  onSelectedItemsChange?:
    | ((
        selectedItems:
          TreeSelectedItemsChangeValue<Mode> | (Mode extends 'multiple' ? never : null),
        eventDetails: TreeRootSelectionChangeEventDetails,
      ) => void)
    | undefined;
  /**
   * Event handler called when an item is selected or deselected.
   */
  onItemSelectionToggle?:
    | ((
        value: TreeRootItemSelectionToggleValue,
        eventDetails: TreeRootItemSelectionToggleEventDetails,
      ) => void)
    | undefined;
  /**
   * Event handler called when an item is highlighted (it receives focus, or one of its
   * controls does) or unhighlighted.
   * Receives the highlighted item's id, or `undefined` when no item is highlighted anymore,
   * such as when focus leaves the tree.
   *
   * The event `reason` is `'none'` when nothing in the tree caused it, such as tabbing
   * into or out of the tree, or focus moving away from a removed item.
   */
  onItemHighlighted?:
    | ((itemId: TreeItemId | undefined, eventDetails: TreeRootHighlightEventDetails) => void)
    | undefined;
  /**
   * The direction of the tree layout.
   */
  direction: 'ltr' | 'rtl';
  /**
   * A ref to the root element of the tree.
   */
  rootRef: React.RefObject<HTMLElement | null>;
  /**
   * Event handler called when the items change.
   * Fires when items are added, removed, moved, or updated, so controlled
   * hierarchies can persist every edit.
   */
  onItemsChange?:
    ((items: TItem[], eventDetails: TreeRootItemsChangeEventDetails<TItem>) => void) | undefined;
}

/**
 * Actions that can be performed imperatively on a tree via `actionsRef`.
 */
export interface TreeRootActions<TItem = TreeDefaultItem> {
  /**
   * Returns whether the item is disabled, including by an ancestor or the tree.
   */
  isItemDisabled: (itemId: TreeItemId) => boolean;
  /** Whether an item exists in the tree. */
  hasItem: (itemId: TreeItemId) => boolean;
  /** Returns a copy of the selected item IDs. */
  getSelectedItemIds: () => Set<TreeItemId>;
  /** Returns the models for the supplied IDs, skipping unknown items. */
  getItemModels: (itemIds: Iterable<TreeItemId>) => TItem[];
  // --- Queries ---
  /**
   * Returns the zero-based index of an item among its siblings, or `-1` when the item
   * isn't in the tree.
   */
  getItemIndex: (itemId: TreeItemId) => number;
  /**
   * Returns the model (data) associated with the given item ID,
   * or `undefined` if the item does not exist.
   */
  getItemModel: (itemId: TreeItemId) => TItem | undefined;
  /**
   * Returns the ordered child IDs of an item, or of the root when `itemId` is `null`.
   * Returns an empty array for an item that has no children or isn't in the tree.
   */
  getChildIds: (itemId: TreeItemId | null) => readonly TreeItemId[];
  /**
   * Returns the parent ID of an item, or `null` when it is a root item or isn't in the tree.
   */
  getParentId: (itemId: TreeItemId) => TreeItemId | null;
  /**
   * Returns the IDs of an item's ancestors, from the root down to its parent.
   * Returns an empty array for a root item or an item that isn't in the tree.
   */
  getAncestorIds: (itemId: TreeItemId) => TreeItemId[];
  /**
   * Returns the DOM element rendered for an item, or `null` when it is not mounted.
   */
  getItemDOMElement: (itemId: TreeItemId) => HTMLElement | null;
  /**
   * Returns the currently focused item ID, or `null` when none is focused.
   */
  getFocusedItemId: () => TreeItemId | null;
  /**
   * Whether an item is currently expanded.
   */
  isItemExpanded: (itemId: TreeItemId) => boolean;
  /**
   * Whether an item can be expanded (has or may have children).
   */
  isItemExpandable: (itemId: TreeItemId) => boolean;
  /**
   * Whether an item is currently selected.
   */
  isItemSelected: (itemId: TreeItemId) => boolean;

  // --- Mutations ---
  /**
   * Applies item changes as a single change: one `onItemsChange` call, and one proposal while
   * `items` is controlled.
   * The callback records `add`, `set`, `update`, `move`, and `remove` operations on the
   * transaction, which are applied in the order they were called once it returns. Using the
   * transaction after the callback returned throws.
   *
   * The changes are applied, or proposed, before this returns, unless `transactionThrottle`
   * holds them for the rest of its window.
   * Resolves with whether any item changed, or was proposed through `onItemsChange` while
   * `items` is controlled.
   * Rejects when the callback throws, which applies none of its operations, or when an
   * operation is invalid.
   */
  applyTransaction: (
    callback: (transaction: TreeItemTransaction<TItem>) => void,
  ) => Promise<boolean>;
  /**
   * Commits the transactions that `transactionThrottle` holds back right away,
   * instead of when their window ends.
   */
  flushTransactions: () => void;

  // --- Expansion / selection / focus ---
  /**
   * Expands every expandable item.
   */
  expandAll: () => void;
  /**
   * Collapses every expanded item.
   */
  collapseAll: () => void;
  /**
   * Expands or collapses a single item.
   * In an uncontrolled tree, an item that isn't in the tree yet, such as one just added with
   * `applyTransaction()`, keeps the expansion for when it appears, and no callback reports it.
   * A controlled tree must add the item to `expandedItems` itself.
   */
  setItemExpansion: (itemId: TreeItemId, expanded: boolean) => void;
  /**
   * Selects or deselects an item, keeping the rest of a multiple selection.
   * The change propagates through the hierarchy like the item's checkbox, following `checkboxSelectionPropagation`.
   */
  setItemSelection: (itemId: TreeItemId, selected: boolean) => void;
  /**
   * Moves focus to an item.
   */
  focusItem: (itemId: TreeItemId) => void;
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
