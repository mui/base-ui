import { createSelectorMemoized } from '@base-ui/utils/store';
import { EMPTY_ARRAY, EMPTY_OBJECT, NOOP } from '@base-ui/utils/empty';
import { activeElement } from '@base-ui/utils/shadowDom';
import { ownerDocument } from '@base-ui/utils/owner';
import { warn } from '@base-ui/utils/warn';
import { TREE_VIEW_ROOT_PARENT_ID } from '../store/types';
import type {
  TreeDefaultItem,
  TreeFilterMode,
  TreeRootHighlightEventReason,
  TreeItemId,
  TreeParentKeyed,
  TreeParentLookupKey,
  TreeSelectionMode,
  TreeState,
  TreeView,
} from '../store/types';

import type { TreeStore } from '../store/TreeStore';
import { EMPTY_SET, selectors } from '../store/selectors';
import { createLookup } from '../utils/lookup';
import { getItemIdKey } from '../utils/itemIdKey';

const EMPTY_MAP: ReadonlyMap<TreeItemId, boolean> = new Map();

interface TreeFilterResult {
  /** Whether the filter changes the view. */
  active: boolean;
  mode: TreeFilterMode;
  /** The exact matches in canonical preorder. */
  matchIds: readonly TreeItemId[];
  matchSet: ReadonlySet<TreeItemId>;
  /** The `filteredItems` entries missing from the canonical items. Empty in production. */
  unknownMatchIds: readonly TreeItemId[];
  /** The matches with their ancestors and descendants, in `hide-non-matches` mode only. */
  retainedItemIds: ReadonlySet<TreeItemId> | null;
  /** The expandable items that are or contain a match. */
  expandedItemIds: ReadonlySet<TreeItemId>;
}

const INACTIVE_RESULT: TreeFilterResult = {
  active: false,
  mode: 'hide-non-matches',
  matchIds: EMPTY_ARRAY,
  matchSet: EMPTY_SET,
  unknownMatchIds: EMPTY_ARRAY,
  retainedItemIds: null,
  expandedItemIds: EMPTY_SET,
};

// Matching runs against the canonical items, so an expansion change never
// re-runs the filter function.
const filterResultSelector = createSelectorMemoized(
  (state: TreeState) => state.filterOptions,
  (state: TreeState) => state.itemCollection,
  (state: TreeState) => state.itemModelLookup,
  (state: TreeState) => state.itemMetaLookup,
  (state: TreeState) => state.itemOrderedChildrenIdsLookup,
  (options, itemCollection, modelLookup, metaLookup, childrenLookup): TreeFilterResult => {
    if (options == null) {
      return INACTIVE_RESULT;
    }
    const { query, filter, filteredItems, mode } = options;
    if (filteredItems === undefined && (filter === null || query === '')) {
      return INACTIVE_RESULT;
    }

    const externalMatchKeys = new Set<string>();
    const unknownMatchIds: TreeItemId[] = [];
    if (filteredItems !== undefined) {
      for (const item of filteredItems) {
        const id = itemCollection.itemToId(item);
        const key = getItemIdKey(id);
        if (!externalMatchKeys.has(key)) {
          externalMatchKeys.add(key);
          // Only for the development warning.
          if (process.env.NODE_ENV !== 'production' && metaLookup[key] == null) {
            unknownMatchIds.push(id);
          }
        }
      }
    }

    const matchIds: TreeItemId[] = [];
    const matchSet = new Set<TreeItemId>();
    const retainedItemIds = mode === 'hide-non-matches' ? new Set<TreeItemId>() : null;
    const expandedItemIds = new Set<TreeItemId>();

    // Iterative depth-first walk: matches are recorded in preorder, while
    // `containsMatch` bubbles up once all of an item's children are done.
    interface VisitFrame {
      itemId: TreeItemId;
      key: string;
      ancestorMatches: boolean;
      entered: boolean;
      containsMatch: boolean;
      /** Whether the item is expandable and its children have loaded. */
      hasLoadedChildren: boolean;
      parent: VisitFrame | null;
    }
    const pending: VisitFrame[] = [];
    const pushChildren = (
      children: readonly TreeItemId[] | undefined,
      ancestorMatches: boolean,
      parent: VisitFrame | null,
    ) => {
      if (children == null) {
        return;
      }
      for (let index = children.length - 1; index >= 0; index -= 1) {
        pending.push({
          itemId: children[index],
          key: getItemIdKey(children[index]),
          ancestorMatches,
          entered: false,
          containsMatch: false,
          hasLoadedChildren: false,
          parent,
        });
      }
    };
    pushChildren(childrenLookup[TREE_VIEW_ROOT_PARENT_ID], false, null);
    while (pending.length > 0) {
      const frame = pending[pending.length - 1];

      if (!frame.entered) {
        frame.entered = true;
        const { key } = frame;
        const meta = metaLookup[key];
        const children = childrenLookup[key];
        const exactMatch =
          meta != null &&
          (filteredItems !== undefined
            ? externalMatchKeys.has(key)
            : filter!(meta.label, query, modelLookup[key]));
        if (exactMatch) {
          matchIds.push(frame.itemId);
          matchSet.add(frame.itemId);
        }
        frame.containsMatch = exactMatch;
        frame.hasLoadedChildren = !!meta?.expandable && !!children?.length;
        pushChildren(children, frame.ancestorMatches || exactMatch, frame);
        continue;
      }

      pending.pop();
      const { itemId, ancestorMatches, containsMatch } = frame;
      if (containsMatch && frame.parent !== null) {
        frame.parent.containsMatch = true;
      }
      if (retainedItemIds !== null && (ancestorMatches || containsMatch)) {
        retainedItemIds.add(itemId);
      }
      // A folder whose children haven't loaded stays collapsed, so expanding it
      // still loads them.
      if (containsMatch && frame.hasLoadedChildren) {
        expandedItemIds.add(itemId);
      }
    }

    return {
      active: true,
      mode,
      matchIds,
      matchSet,
      unknownMatchIds,
      retainedItemIds,
      expandedItemIds,
    };
  },
);

/** A visible expansion change planned by {@link TreeFilteringPlugin.planItemsExpansion}. */
export interface TreeFilterExpansionPlan {
  /** The items whose expansion model must also change. */
  modelItemIds: TreeItemId[];
  /** Writes the filter's part of the change. */
  apply: () => void;
}

/**
 * Identifies the current filter session: a new object whenever the query, the
 * external matches, or the mode change, including when the same query is typed
 * again after being changed. The filter function is left out so an inline
 * function does not discard the user's expansion changes on every render.
 */
const filterSessionSelector = createSelectorMemoized(
  (state: TreeState) => state.filterOptions?.query,
  (state: TreeState) => state.filterOptions?.filteredItems,
  (state: TreeState) => state.filterOptions?.mode,
  (query, filteredItems, mode) => ({ query, filteredItems, mode }),
);

const expansionOverridesSelector = (state: TreeState): ReadonlyMap<TreeItemId, boolean> => {
  const overrides = state.filterExpansionOverrides;
  return overrides != null && overrides.session === filterSessionSelector(state)
    ? overrides.values
    : EMPTY_MAP;
};

function projectExpansion(
  view: TreeView,
  result: TreeFilterResult,
  overrides: ReadonlyMap<TreeItemId, boolean>,
): ReadonlySet<TreeItemId> {
  // `collapse-non-matches` ignores the expansion model; the other modes add
  // the filter's expansion to it.
  const modelDriven = result.mode !== 'collapse-non-matches';
  const base = modelDriven ? view.expandedItems : result.expandedItemIds;
  let expandedItems: Set<TreeItemId> | null = null;
  if (modelDriven && result.expandedItemIds.size > 0) {
    expandedItems = new Set(base);
    for (const itemId of result.expandedItemIds) {
      expandedItems.add(itemId);
    }
  }
  if (overrides.size > 0) {
    expandedItems ??= new Set(base);
    for (const [itemId, isExpanded] of overrides) {
      if (isExpanded) {
        expandedItems.add(itemId);
      } else if (!modelDriven || !view.expandedItems.has(itemId)) {
        // A collapse override only hides the filter's forced expansion; an item
        // the expansion model itself expands stays expanded.
        expandedItems.delete(itemId);
      }
    }
  }
  return expandedItems ?? base;
}

type TreeHierarchy = Pick<TreeView, 'childrenLookup'>;

function projectHierarchy(view: TreeView, retained: ReadonlySet<TreeItemId>): TreeHierarchy {
  const childrenLookup: TreeParentKeyed<TreeItemId[]> = createLookup();
  const isRetained = (itemId: TreeItemId) => retained.has(itemId);
  const projectChildren = (parentKey: TreeParentLookupKey) => {
    const children = view.childrenLookup[parentKey];
    if (children == null || children.length === 0) {
      return;
    }
    if (children.every(isRetained)) {
      // Nothing excluded: keep the incoming arrays so their identities hold.
      childrenLookup[parentKey] = children;
      return;
    }
    const projected = children.filter(isRetained);
    if (projected.length > 0) {
      childrenLookup[parentKey] = projected;
    }
  };
  projectChildren(TREE_VIEW_ROOT_PARENT_ID);
  for (const itemId of retained) {
    projectChildren(getItemIdKey(itemId));
  }

  return { childrenLookup };
}

/**
 * Filters the tree for `Tree.FilterProvider`: matches items against the
 * `filterOptions` the provider syncs into the store, and projects the view that
 * presents them.
 */
export class TreeFilteringPlugin<TItem = TreeDefaultItem> {
  /** Adds filtering to a store. Installed by `Tree.FilterProvider`. */
  static install(store: TreeStore<any, any>) {
    if (store.filtering == null) {
      store.filtering = new TreeFilteringPlugin(store);
    }
  }

  declare private store: TreeStore<TreeSelectionMode | undefined, TItem>;

  private inputElement: HTMLInputElement | null = null;

  private projection: {
    result: TreeFilterResult;
    overrides: ReadonlyMap<TreeItemId, boolean>;
    view: TreeView;
    output: TreeView;
  } | null = null;

  /** The hierarchy of the last projection, which an expansion change keeps. */
  private hierarchy: {
    view: TreeView;
    retained: ReadonlySet<TreeItemId>;
    output: TreeHierarchy;
  } | null = null;

  constructor(store: TreeStore<TreeSelectionMode | undefined, TItem>) {
    this.store = store;
    store.set('viewTransform', this.transform);

    // The `void`s below: store-lifetime subscriptions, like the store's own.
    if (process.env.NODE_ENV !== 'production') {
      void store.observe(
        (state) => filterResultSelector(state).unknownMatchIds,
        (unknownIds) => this.warnUnknownFilteredItemIds(unknownIds),
      );
    }
    // Also keeps the session memoized across states that don't read it, such
    // as while the query is empty.
    void store.observe(filterSessionSelector, (session) => {
      const overrides = store.state.filterExpansionOverrides;
      if (overrides != null && overrides.session !== session) {
        store.set('filterExpansionOverrides', undefined);
      }
    });
    void store.observe(selectors.isViewTransformed, (transformed) => {
      if (transformed && Object.keys(store.state.animatingGroups).length > 0) {
        store.set('animatingGroups', EMPTY_OBJECT);
      }
    });
  }

  private transform = (state: TreeState, view: TreeView): TreeView => {
    const result = filterResultSelector(state);
    if (!result.active) {
      return view;
    }
    const overrides = expansionOverridesSelector(state);
    const cached = this.projection;
    if (cached?.result === result && cached.overrides === overrides && cached.view === view) {
      return cached.output;
    }
    const retained = result.retainedItemIds;
    const output: TreeView = {
      ...(retained === null ? view : this.getHierarchy(view, retained)),
      expandedItems: projectExpansion(view, result, overrides),
      transformed: true,
    };
    this.projection = { result, overrides, view, output };
    return output;
  };

  private getHierarchy(view: TreeView, retained: ReadonlySet<TreeItemId>): TreeHierarchy {
    const cached = this.hierarchy;
    if (cached?.retained === retained && cached.view.childrenLookup === view.childrenLookup) {
      return cached.output;
    }
    const output = projectHierarchy(view, retained);
    this.hierarchy = { view, retained, output };
    return output;
  }

  public isActive = (state: TreeState): boolean => filterResultSelector(state).active;

  /** The current filter session, a new object whenever the query, the external matches, or the mode change. */
  public getSession = filterSessionSelector;

  /** The number of items matching the filter, or `null` while it is inactive. */
  public getMatchCount = (state: TreeState): number | null => {
    const result = filterResultSelector(state);
    return result.active ? result.matchIds.length : null;
  };

  public isItemMatch = (state: TreeState, itemId: TreeItemId): boolean =>
    filterResultSelector(state).matchSet.has(itemId);

  /** Whether the filter is active and nothing matches it. */
  public hasNoMatches = (state: TreeState): boolean => {
    const result = filterResultSelector(state);
    return result.active && result.matchIds.length === 0;
  };

  /**
   * Plans a user expansion change to the rows whose visible expansion the filter
   * decides: filter-expanded rows, or any row in `collapse-non-matches` mode,
   * which ignores the expansion model. The change is view state for the current
   * filter session only, so it fires no callbacks. Call `apply` once the model
   * change is accepted, so that a canceled change leaves the view as it was.
   *
   * @returns The items whose expansion model must also change, and `apply`, which
   * writes the filter's part of the change.
   */
  public planItemsExpansion(
    itemIds: readonly TreeItemId[],
    isExpanded: boolean,
  ): TreeFilterExpansionPlan {
    const { state } = this.store;
    const result = filterResultSelector(state);
    if (!result.active) {
      return { modelItemIds: itemIds.slice(), apply: NOOP };
    }
    const modelDriven = result.mode !== 'collapse-non-matches';
    const current = expansionOverridesSelector(state);
    // The override each row gets, or `null` to remove it.
    const updates: [TreeItemId, boolean | null][] = [];
    const modelItemIds: TreeItemId[] = [];
    for (const itemId of itemIds) {
      const filterExpanded = result.expandedItemIds.has(itemId);
      if (modelDriven && !filterExpanded) {
        modelItemIds.push(itemId);
        continue;
      }
      const overridden = isExpanded !== filterExpanded;
      if (overridden ? current.get(itemId) !== isExpanded : current.has(itemId)) {
        updates.push([itemId, overridden ? isExpanded : null]);
      }
      // Collapsing a filter-expanded row must also collapse it in the model when
      // the model expands it too; expanding it is already visible.
      if (modelDriven && !isExpanded) {
        modelItemIds.push(itemId);
      }
    }
    const apply = () => {
      if (updates.length === 0) {
        return;
      }
      const values = new Map(expansionOverridesSelector(this.store.state));
      for (const [itemId, value] of updates) {
        if (value == null) {
          values.delete(itemId);
        } else {
          values.set(itemId, value);
        }
      }
      this.store.set('filterExpansionOverrides', {
        session: filterSessionSelector(this.store.state),
        values,
      });
    };
    return { modelItemIds, apply };
  }

  /** The first visible, focusable match from the start, or from the end for `'last'`. */
  public getFocusableMatch(state: TreeState, from: 'first' | 'last'): TreeItemId | null {
    const { matchIds } = filterResultSelector(state);
    return from === 'first'
      ? findFocusableMatch(state, matchIds, 0, 1)
      : findFocusableMatch(state, matchIds, matchIds.length - 1, -1);
  }

  /**
   * Moves focus from the input into the tree: to the first or last match while
   * filtering, otherwise to the row that holds the tree's tab stop.
   *
   * @returns Whether a row received focus.
   */
  public focusTree(
    from: 'first' | 'last',
    reason: TreeRootHighlightEventReason,
    event?: KeyboardEvent,
  ): boolean {
    const { state } = this.store;
    const target = filterResultSelector(state).active
      ? this.getFocusableMatch(state, from)
      : selectors.tabbableItemId(state);
    if (target == null) {
      return false;
    }
    this.store.interaction.focusItem(target, reason, event);
    return true;
  }

  public registerInput(element: HTMLInputElement): () => void {
    this.inputElement = element;
    return () => {
      if (this.inputElement === element) {
        this.inputElement = null;
      }
    };
  }

  /**
   * Moves focus to the input, with the caret at the end, so a character typed
   * on a row continues the query.
   *
   * @returns Whether the input received focus.
   */
  public focusInput(): boolean {
    const input = this.inputElement;
    if (input == null || input.disabled || input.readOnly) {
      return false;
    }
    input.focus();
    if (activeElement(ownerDocument(input)) !== input) {
      return false;
    }
    const end = input.value.length;
    input.setSelectionRange(end, end);
    return true;
  }

  private warnUnknownFilteredItemIds(unknownIds: readonly TreeItemId[]): void {
    if (process.env.NODE_ENV === 'production' || unknownIds.length === 0) {
      return;
    }
    warn(
      'Tree.FilterProvider received `filteredItems` containing item IDs that do not exist ' +
        `in the tree: ${unknownIds.map(String).join(', ')}. These matches are ignored ` +
        'because filtered items must first exist in `items` or `defaultItems`.',
    );
  }
}

/** The first match from `start`, stepping by `step`, that focus can move to. */
function findFocusableMatch(
  state: TreeState,
  matchIds: readonly TreeItemId[],
  start: number,
  step: 1 | -1,
): TreeItemId | null {
  for (let index = start; index >= 0 && index < matchIds.length; index += step) {
    if (selectors.isItemFocusTarget(state, matchIds[index])) {
      return matchIds[index];
    }
  }
  return null;
}
