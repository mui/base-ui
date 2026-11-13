import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import { warn } from '@base-ui/utils/warn';
import { TimeoutManager } from '../../internals/TimeoutManager';
import { getItemIdKey } from '../utils/itemIdKey';
import type {
  TreeState,
  TreeStoreContext,
  TreeDefaultItem,
  TreeItemId,
  TreeRootActions,
  TreeSelectionMode,
  TreeStoreParameters,
} from './types';

import { TreeItemsPlugin } from '../plugins/TreeItemsPlugin';
import { TreeItemMutationPlugin } from '../plugins/TreeItemMutationPlugin';
import { TreeSelectionPlugin } from '../plugins/TreeSelectionPlugin';
import { TreeExpansionPlugin } from '../plugins/TreeExpansionPlugin';
import { TreeInteractionPlugin } from '../plugins/TreeInteractionPlugin';
import type { TreeFilteringPlugin } from '../plugins/TreeFilteringPlugin';
import type { TreeStatusPlugin } from '../plugins/TreeStatusPlugin';
import { selectors } from './selectors';
import { buildItemsState } from './itemIndex';

/**
 * How many accessor-driven rebuilds to tolerate before warning. High enough that a
 * handful of legitimate accessor swaps (a filter predicate changing, a locale
 * change) stay quiet; low enough that a per-render inline accessor trips it early.
 */
const ACCESSOR_REBUILD_WARNING_THRESHOLD = 20;

export class TreeStore<
  Mode extends TreeSelectionMode | undefined = undefined,
  TItem = TreeDefaultItem,
> extends ReactStore<TreeState<TItem>, TreeStoreContext<TItem>, typeof selectors> {
  public items = new TreeItemsPlugin<TItem>(this);

  public itemMutation = new TreeItemMutationPlugin<TItem>(this);

  public selection = new TreeSelectionPlugin<TItem>(this);

  public expansion = new TreeExpansionPlugin<TItem>(this);

  public interaction = new TreeInteractionPlugin<TItem>(this);

  /** Installed by `Tree.FilterProvider`. */
  public filtering: TreeFilteringPlugin<TItem> | undefined;

  /** Installed lazily by `Tree.Status` so Root-only bundles exclude it. */
  public status: TreeStatusPlugin | undefined;

  public timeoutManager = new TimeoutManager();

  /** Whether the root is mounted. Asynchronous work checks it before changing the tree. */
  public mounted = false;

  constructor(parameters: TreeStoreParameters<Mode, TItem>) {
    const {
      disabled,
      items,
      defaultItems,
      itemCollection,
      expandedItems,
      defaultExpandedItems,
      onExpandedItemsChange,
      onItemExpansionToggle,
      selectedItems,
      defaultSelectedItems,
      onSelectedItemsChange,
      onItemSelectionToggle,
      selectionMode,
      disableEmptySelection,
      expandOnClick,
      checkboxSelectionPropagation,
      itemFocusableWhenDisabled,
      onItemHighlighted,
      direction,
      rootRef,
      onItemsChange,
    } = parameters;

    const initialItems = items ?? defaultItems ?? EMPTY_ARRAY;
    const initialItemsState = buildItemsState(initialItems, itemCollection);
    super(
      {
        disabled,
        items: initialItems,
        itemsProp: items,
        itemCollection,
        viewTransform: undefined,
        ...initialItemsState,
        expandedItems: expandedItems ?? defaultExpandedItems ?? EMPTY_ARRAY,
        expandedItemsProp: expandedItems,
        expandOnClick,
        transactionThrottle: 0,
        selectedItems:
          selectedItems ??
          defaultSelectedItems ??
          (selectionMode === 'multiple' ? EMPTY_ARRAY : null),
        selectedItemsProp: selectedItems,
        selectionMode,
        disableEmptySelection,
        checkboxSelectionPropagation,
        focusedItemId: null,
        lastFocusedItemId: null,
        itemFocusableWhenDisabled,
        direction,
        animatingGroups: EMPTY_OBJECT,
        activeLinkCounts: EMPTY_OBJECT,
        hasItemsChangeHandler: false,
        hasItemSelectionToggleHandler: false,
        statusChange: null,
      },
      {
        onExpandedItemsChange,
        onSelectedItemsChange:
          onSelectedItemsChange as TreeStoreContext<TItem>['onSelectedItemsChange'],
        onItemExpansionToggle,
        onItemSelectionToggle,
        onItemHighlighted,
        onItemsChange,
        rootRef,
      },
      selectors,
    );

    // The `void`s below: these are store-lifetime subscriptions — the store
    // subscribes to its own state, so the two die together and there is nothing
    // to unsubscribe from.
    void this.observe(selectors.itemsConfiguration, (next, previous) => {
      const collectionChanged = next.itemCollection !== previous.itemCollection;
      const nextItems = next.itemsProp ?? this.state.items;

      // `itemsProp` and the collection descriptor arrive in one synchronized
      // update. Sync `items` only after both are current, so the lookups are
      // rebuilt once from the final pair.
      if (nextItems !== this.state.items) {
        this.itemMutation.syncItems(nextItems);
        return;
      }
      if (!collectionChanged) {
        return;
      }

      // A collection normally changes because its source data changed. That is
      // the documented memoization pattern, not accessor churn.
      if (next.itemCollection.data === previous.itemCollection.data) {
        this.warnOnAccessorChurn();
      }
      this.items.rebuildItemsState();
    });

    // Moved and removed rows must leave the running group transitions, whether
    // a mutation or a new `items` value changed the hierarchy.
    void this.observe(
      (state: TreeState<TItem>) => state.itemOrderedChildrenIdsLookup,
      this.expansion.reconcileGroupTransitions,
    );

    // Controlled `expandedItems`/`selectedItems`: the plugins never mutate the
    // internal state while the corresponding prop is set, so drive it from the
    // prop here whenever the controlled value changes.
    void this.observe(
      (state: TreeState<TItem>) => state.expandedItemsProp,
      (newExpandedItemsProp) => {
        if (newExpandedItemsProp !== undefined) {
          // Animate what actually changed, now that the controlled value has.
          this.expansion.applyExpandedItems(this.state.expandedItems, newExpandedItemsProp);
        }
      },
    );

    void this.observe(
      (state: TreeState<TItem>) => state.selectedItemsProp,
      (newSelectedItemsProp) => {
        if (newSelectedItemsProp !== undefined) {
          this.selection.handleControlledSelectedItemsChange(newSelectedItemsProp);
          this.set('selectedItems', newSelectedItemsProp);
        }
      },
    );

    void this.observe(
      (state: TreeState<TItem>) => state.selectionMode,
      this.selection.handleSelectionModeChange,
    );
  }

  public mountEffect = () => {
    this.mounted = true;

    return () => {
      this.mounted = false;
      this.timeoutManager.clearAll();
      this.itemMutation.discardPendingTransactions();
    };
  };

  /** Starts focus recovery. Runs in a layout effect once `actionsRef` is set. */
  public layoutMountEffect = () => {
    this.interaction.setupFocusRecovery();
    return () => {
      this.interaction.cleanupFocusRecovery();
    };
  };

  /** An item-collection accessor change rebuilds every lookup — O(N) over the whole tree. */
  private accessorRebuildCount = 0;

  private warnOnAccessorChurn(): void {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    this.accessorRebuildCount += 1;
    if (this.accessorRebuildCount === ACCESSOR_REBUILD_WARNING_THRESHOLD) {
      warn(
        'a hierarchical component rebuilt its item lookups ' +
          `${ACCESSOR_REBUILD_WARNING_THRESHOLD} times because a ` +
          '`createItems()` collection or one of its readers changed identity, which costs ' +
          'a full pass over every item each ' +
          'time. Create static collections outside the component, or memoize dynamic collections ' +
          'with `React.useMemo`.',
      );
    }
  }

  private actions: TreeRootActions<TItem> = {
    ...this.items.actions,
    ...this.itemMutation.actions,
    ...this.expansion.actions,
    ...this.selection.actions,
    ...this.interaction.actions,
  };

  /** Adds `delta` to an item's count in a counter lookup, dropping the entry at zero. */
  public updateItemCount(field: 'activeLinkCounts', itemId: TreeItemId, delta: number): void {
    const key = getItemIdKey(itemId);
    const count = (this.state[field][key] ?? 0) + delta;
    const next = { ...this.state[field] };
    if (count > 0) {
      next[key] = count;
    } else {
      delete next[key];
    }
    this.set(field, next);
  }

  public getActions = (): TreeRootActions<TItem> => {
    return this.actions;
  };

  /** Adds the actions of a plugin installed by a provider wrapping the root. */
  public registerActions(actions: Partial<TreeRootActions<TItem>>): void {
    Object.assign(this.actions, actions);
  }
}
