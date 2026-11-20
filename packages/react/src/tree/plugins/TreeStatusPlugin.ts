import { TREE_SELECTION_ALL } from '../store/types';
import type { TreeItemId, TreeState } from '../store/types';
import type { TreeStore } from '../store/TreeStore';
import type { TreeStatusChange, TreeStatusSelectionChange } from '../status/TreeStatus';
import { normalizeSelectedItems, selectors } from '../store/selectors';
import { selectionModelsHaveSameItems } from './TreeSelectionPlugin';
import type { SelectionModel } from './TreeSelectionPlugin';

/** The selectable items of the tree a selection model selects. */
function getSelectedItemIds(state: TreeState, model: SelectionModel): readonly TreeItemId[] {
  if (model === TREE_SELECTION_ALL) {
    return selectors.selectionAllItemIds(state);
  }
  return normalizeSelectedItems(model).filter((id) => selectors.itemMeta(state, id)?.selectable);
}

/**
 * Describes a selection change: names the item when a single one is selected or
 * deselected, or when it is the only one left selected, and counts the selected
 * items in multiple selection, unless the change only selects the first item or
 * deselects the last one.
 */
function getSelectionChange(
  state: TreeState,
  previousModel: SelectionModel,
  model: SelectionModel,
): TreeStatusSelectionChange | null {
  const selected = getSelectedItemIds(state, model);
  const previous = getSelectedItemIds(state, previousModel);
  const selectedSet = new Set(selected);
  const previousSet = new Set(previous);
  const added = selected.filter((id) => !previousSet.has(id));
  const removed = previous.filter((id) => !selectedSet.has(id));

  let item: { itemId: TreeItemId; selected: boolean } | null = null;
  if (model !== TREE_SELECTION_ALL) {
    if (added.length === 1 && removed.length === 0) {
      item = { itemId: added[0], selected: true };
    } else if (removed.length === 1 && added.length === 0) {
      item = { itemId: removed[0], selected: false };
    } else if (selected.length === 1) {
      item = { itemId: selected[0], selected: true };
    }
  }
  const label = item == null ? '' : selectors.itemLabel(state, item.itemId);
  const namedItem = item == null || label === '' ? null : { ...item, label };

  const count = model === TREE_SELECTION_ALL ? 'all' : selected.length;
  const previousCount = previousModel === TREE_SELECTION_ALL ? 'all' : previous.length;
  const hasCount =
    state.selectionMode === 'multiple' &&
    (namedItem == null ||
      count === 'all' ||
      count > 1 ||
      previousCount === 'all' ||
      previousCount > 1);
  if (namedItem == null && !hasCount) {
    return null;
  }
  return { type: 'selection', item: namedItem, count: hasCount ? count : null };
}

/**
 * Records the latest change `Tree.Status` announces. Installed by `Tree.Status`,
 * and only listens while one is mounted.
 */
export class TreeStatusPlugin {
  /** Adds the status announcements to a store. Installed by `Tree.Status`. */
  static install(store: TreeStore<any, any>): TreeStatusPlugin {
    store.status ??= new TreeStatusPlugin(store);
    return store.status;
  }

  private mountedCount = 0;

  private unsubscribe: (() => void) | null = null;

  /** The selection the last announcement describes. */
  private announcedSelection: SelectionModel = null;

  /**
   * The selection a press or a key proposed, announced once the tree selects
   * it. `undefined` when there is none.
   */
  private userSelection: SelectionModel | undefined = undefined;

  constructor(private readonly store: TreeStore<any, any>) {}

  /** Counts a mounted `Tree.Status`, listening while there is one. Returns the disposer. */
  public enable = (): (() => void) => {
    this.mountedCount += 1;
    if (this.mountedCount === 1) {
      this.unsubscribe = this.subscribe();
    }
    let disposed = false;
    return () => {
      if (disposed) {
        return;
      }
      disposed = true;
      this.mountedCount -= 1;
      if (this.mountedCount === 0) {
        this.unsubscribe?.();
        this.unsubscribe = null;
      }
    };
  };

  /**
   * Called before the tree proposes a selection: `model` for a press or a key,
   * announced once the tree selects it, and `undefined` for a change made
   * through `actionsRef`, which replaces the earlier proposal. Changes that
   * follow a change to the items, or that a controlled parent applies instead
   * of the proposal, are not announced either.
   */
  public handleSelectionProposal(model: SelectionModel | undefined): void {
    if (this.mountedCount > 0) {
      this.userSelection = model;
    }
  }

  /** Called when the proposal of `model` was canceled. */
  public discardUserSelection(model: SelectionModel): void {
    if (this.userSelection === model) {
      this.userSelection = undefined;
    }
  }

  /** Announces the selection once it changes. */
  public handleSelectionChange = (): void => {
    const { state } = this.store;
    const model = state.selectedItems;
    const previousModel = this.announcedSelection;
    if (this.mountedCount === 0 || model === previousModel) {
      return;
    }
    this.announcedSelection = model;
    const userSelection = this.userSelection;
    // Any other change supersedes the proposal, which a controlled parent ignored.
    this.userSelection = undefined;
    if (userSelection !== undefined && selectionModelsHaveSameItems(userSelection, model)) {
      const change = getSelectionChange(state, previousModel, model);
      if (change != null) {
        this.setChange(change);
      }
    }
  };

  private subscribe(): () => void {
    const { store } = this;
    this.announcedSelection = store.state.selectedItems;
    this.userSelection = undefined;
    const unsubscribers = [
      store.observe((state) => state.selectedItems, this.handleSelectionChange),
      // Only a new query, mode, or set of external matches is announced: a count
      // that changes because the items did would talk over their own change.
      store.observe(
        (state) => store.filtering?.getSession(state),
        (session, previousSession) => {
          if (session !== previousSession) {
            const matchCount = store.filtering!.getMatchCount(store.state);
            this.setChange(matchCount == null ? null : { type: 'filter', matchCount });
          }
        },
      ),
    ];
    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }

  private setChange(change: TreeStatusChange | null): void {
    this.store.set('statusChange', change);
  }
}
