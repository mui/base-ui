import { warn } from '@base-ui/utils/warn';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type {
  TreeItemId,
  TreeRootItemsChangeEventReason,
  TreeSelectionMode,
  TreeState,
  TreeItemTransaction,
} from '../store/types';

import type { TreeStore } from '../store/TreeStore';
import { selectors } from '../store/selectors';
import { buildItemsState, isSameHierarchy } from '../store/itemIndex';
import type { TreeItemsEdit } from '../store/itemIndex';
import { getTransactionEdit, recordItemsTransaction } from '../store/itemsTransaction';
import type { TreeItemsOperation } from '../store/itemsTransaction';
import { ACCEPTED_PROPOSAL, TreeItemsProposals } from '../store/itemsProposals';
import type { TreeItemsProposal } from '../store/itemsProposals';
import { areItemModelsEquivalent } from '../utils/areItemModelsEquivalent';

export class TreeItemMutationPlugin<TItem> {
  declare private store: TreeStore<TreeSelectionMode | undefined, TItem>;

  /** The changes proposed to a parent that controls `items`. */
  private proposals = new TreeItemsProposals<TItem>((items, expected) =>
    this.matchesItemModels(items, expected),
  );

  constructor(store: TreeStore<TreeSelectionMode | undefined, TItem>) {
    this.store = store;
  }

  private getMutationState(): TreeState<TItem> {
    if (this.proposals.isStale()) {
      this.acceptControlledItems(this.store.state.items);
    }
    return this.proposals.baseState ?? this.store.state;
  }

  /** The operations of the throttled transactions waiting for their window to end. */
  private pendingOperations: TreeItemsOperation<TItem>[] = [];

  /** Settle the throttled transactions with the outcome of the batch they joined. */
  private pendingSettlements: Array<{
    resolve: (changed: boolean) => void;
    reject: (error: unknown) => void;
  }> = [];

  /** When the last transaction committed, which starts a `transactionThrottle` window. */
  private lastTransactionTime = -Infinity;

  /**
   * Applies the operations a callback records as a single items change, or adds
   * them to the batch of the current `transactionThrottle` window.
   * With a custom item model, an operation that edits a nested position requires
   * `setChildren` in `Tree.createItems()` to rebuild the ancestors.
   */
  public applyTransaction = (
    callback: (transaction: TreeItemTransaction<TItem>) => void,
  ): Promise<boolean> => {
    // A throttle window turns an error into a rejection, so every error rejects.
    try {
      return this.startTransaction(callback);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  private startTransaction(
    callback: (transaction: TreeItemTransaction<TItem>) => void,
  ): Promise<boolean> {
    // Recorded in full before anything is applied, so a callback that throws applies nothing.
    const operations = recordItemsTransaction(callback, this.store.state.itemCollection.itemToId);
    if (operations.length === 0) {
      return Promise.resolve(false);
    }
    const remaining = this.getRemainingWindow();
    const opensBatch = this.pendingOperations.length === 0;
    if (opensBatch && remaining <= 0) {
      return this.commitOperations(operations);
    }
    for (const operation of operations) {
      this.pendingOperations.push(operation);
    }
    const settled = new Promise<boolean>((resolve, reject) => {
      this.pendingSettlements.push({ resolve, reject });
    });
    if (remaining <= 0) {
      this.flushTransactions();
    } else if (opensBatch) {
      this.store.timeoutManager.start('transaction-throttle', remaining, this.flushWhenDue);
    }
    return settled;
  }

  private getRemainingWindow(): number {
    return this.store.state.transactionThrottle - (performance.now() - this.lastTransactionTime);
  }

  /** Commits the throttled transactions when their window ends. */
  private flushWhenDue = (): void => {
    const remaining = this.getRemainingWindow();
    if (remaining > 0) {
      this.store.timeoutManager.start('transaction-throttle', remaining, this.flushWhenDue);
    } else {
      this.flushTransactions();
    }
  };

  /** Commits the throttled transactions waiting for their window to end. */
  public flushTransactions = (): void => {
    this.store.timeoutManager.clear('transaction-throttle');
    if (this.pendingOperations.length === 0) {
      return;
    }
    const operations = this.pendingOperations;
    const settlements = this.pendingSettlements;
    this.pendingOperations = [];
    this.pendingSettlements = [];
    let committed: Promise<boolean>;
    try {
      committed = this.commitOperations(operations);
    } catch (error) {
      committed = Promise.reject(error);
    }
    committed.then(
      (changed) => settlements.forEach(({ resolve }) => resolve(changed)),
      (error) => settlements.forEach(({ reject }) => reject(error)),
    );
  };

  /** @internal Drops the throttled transactions of a tree that unmounted. */
  public discardPendingTransactions(): void {
    const settlements = this.pendingSettlements;
    this.pendingOperations = [];
    this.pendingSettlements = [];
    settlements.forEach(({ resolve }) => resolve(false));
  }

  private commitOperations(operations: readonly TreeItemsOperation<TItem>[]): Promise<boolean> {
    const state = this.getMutationState();
    const { edit } = getTransactionEdit(state, operations);
    const committed = edit != null && this.applyEdit(state, edit, REASONS.imperativeAction) != null;
    if (committed) {
      this.lastTransactionTime = performance.now();
    }
    return Promise.resolve(committed);
  }

  /**
   * Remove deleted ids from `selectedItems` and `expandedItems`.
   *
   * Returns the store updates to apply with the mutation, plus a `dispatch` the
   * caller runs once the mutation commits, which reports the pruned models.
   */
  private pruneRemovedItemsFromState(
    removedIds: ReadonlySet<TreeItemId>,
    state: TreeState<TItem>,
  ): {
    updates: Partial<TreeState<TItem>>;
    dispatch: () => void;
  } {
    const expansion = this.store.expansion.pruneRemovedItems(removedIds, state);
    const selection = this.store.selection.pruneRemovedItems(removedIds, state);

    // `focusedItemId` is deliberately left pointing at the removed item. The
    // focus-recovery subscriber (see `TreeInteractionPlugin.setupFocusRecovery`)
    // needs it to work out which neighbour to move to, and clears it itself when
    // there is none. Nulling it here ran first and left focus on `<body>`.

    return {
      updates: { ...expansion.updates, ...selection.updates },
      dispatch: () => {
        expansion.dispatch();
        selection.dispatch();
      },
    };
  }

  /**
   * @internal Whether controlled items hold the content a proposal described. An
   * equivalent copy counts; the same ids with other labels or data do not.
   */
  public matchesItemModels = (items: readonly TItem[], expected: readonly TItem[]): boolean =>
    areItemModelsEquivalent(items, expected, this.store.state.itemCollection);

  public actions = {
    applyTransaction: this.applyTransaction,
    flushTransactions: this.flushTransactions,
  };

  /**
   * @internal Installs an `items` value this plugin did not commit, along with
   * its lookups, then settles the controlled proposals against it.
   */
  public syncItems(items: readonly TItem[]): void {
    const { state } = this.store;
    this.store.update({
      items,
      ...(this.proposals.getPreparedItemsState(items, state) ??
        buildItemsState(items, state.itemCollection)),
    });
    this.acceptControlledItems(items);
  }

  /** Settles the controlled proposals against rendered `items`, pruning what the accepted one removed. */
  private acceptControlledItems(items: readonly TItem[]): void {
    const acceptance = this.proposals.accept(items);
    if (acceptance == null) {
      return;
    }
    // A later proposal in the chain may have added back an item an earlier one
    // removed, and that item stays selected and expanded.
    const removedIds = new Set(acceptance.removedIds);
    for (const id of removedIds) {
      if (selectors.itemMeta(this.store.state, id) != null) {
        removedIds.delete(id);
      }
    }
    if (removedIds.size > 0) {
      // Prune against the current state: selection or expansion may have
      // changed while the parent was deciding.
      const prune = this.pruneRemovedItemsFromState(removedIds, this.store.state);
      if (Object.keys(prune.updates).length > 0) {
        this.store.setState({ ...this.store.state, ...prune.updates });
      }
      prune.dispatch();
    }
    if (acceptance.reconcileSelection) {
      this.store.selection.reconcileSelectionAfterItemsMutation();
    }
    acceptance.settle();
  }

  /**
   * Fire `onItemsChange`, check cancellation, and commit an edit of `state`, or
   * propose it to a controlled parent. Returns `null` when the change is
   * canceled or dropped.
   */
  private applyEdit(
    state: TreeState<TItem>,
    edit: TreeItemsEdit<TItem>,
    reason: TreeRootItemsChangeEventReason,
  ): TreeItemsProposal | null {
    const { items: newItems, lookups: lookupUpdates, removedIds } = edit;
    const hierarchy = lookupUpdates.itemOrderedChildrenIdsLookup;
    // Selection follows the hierarchy, which an edit that only replaces item
    // models leaves as is.
    const reconcileSelection =
      hierarchy != null && !isSameHierarchy(hierarchy, state.itemOrderedChildrenIdsLookup);
    const itemsControlled = selectors.isItemsControlled(this.store.state);

    if (itemsControlled && !this.store.state.hasItemsChangeHandler) {
      if (process.env.NODE_ENV !== 'production') {
        warn(
          'a component with a controlled `items` prop tried to change its items, ' +
            'but no `onItemsChange` handler is set, so the change is dropped and the hierarchy ' +
            'stays as rendered. Handle `onItemsChange` and pass the new items back through ' +
            '`items`, or use `defaultItems` to let the component own them.',
        );
      }
      return null;
    }

    const details = createChangeEventDetails(reason, undefined, undefined, {
      changes: edit.changes,
    });
    const itemsBeforeNotify = this.store.state.items;
    const base = this.proposals.latest;
    const notified = this.proposals.notify(newItems, () => {
      this.store.context.onItemsChange?.(newItems as TItem[], details);
      return !details.isCanceled;
    });
    if (!notified) {
      return null;
    }
    // `onItemsChange` ran another mutation, which changed the hierarchy this one
    // was built on: committing would overwrite it, such as by putting back a
    // removed parent.
    if (!itemsControlled && this.store.state.items !== state.items) {
      return null;
    }

    // Controlled `items`: the parent owns the model. Committing it here as well
    // would move the tree even when the parent kept the same prop — the classic
    // controlled-component drift. The lookups go with it: they describe
    // `newItems`, so applying them against unchanged `items` would leave the
    // tree rendering a structure its own model does not have. If the parent
    // *does* feed `newItems` back, `syncItems` can install the prepared lookups
    // only after checking that their source lookups and accessors are still
    // current.
    //
    // Selection and expansion pruning waits for the same acceptance: applying it
    // here would leave a still-rendered controlled item deselected or collapsed
    // merely because the parent ignored `onItemsChange`.
    if (itemsControlled) {
      const proposal = this.proposals.propose({
        base,
        items: newItems,
        state: { ...state, items: newItems, ...lookupUpdates },
        baseItemsState: this.store.state,
        removedIds,
        reconcileSelection,
      });
      // A `flushSync` parent already answered from `onItemsChange`.
      if (this.store.state.items !== itemsBeforeNotify) {
        this.acceptControlledItems(this.store.state.items);
      }
      return proposal;
    }

    // Pruned against the hierarchy being committed: a required selection falls
    // back to an item the edit adds, and never to one it disables.
    const nextState: TreeState<TItem> = { ...this.store.state, items: newItems, ...lookupUpdates };
    const prune = removedIds?.size ? this.pruneRemovedItemsFromState(removedIds, nextState) : null;
    this.store.setState({ ...nextState, ...prune?.updates });
    prune?.dispatch();
    if (reconcileSelection) {
      this.store.selection.reconcileSelectionAfterItemsMutation();
    }
    return ACCEPTED_PROPOSAL;
  }
}
