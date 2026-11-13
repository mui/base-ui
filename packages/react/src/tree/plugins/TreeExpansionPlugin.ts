import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { NOOP } from '@base-ui/utils/empty';
import {
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type {
  TreeItemId,
  TreeRootExpansionChangeEventReason,
  TreeSelectionMode,
  TreeDefaultItem,
  TreeState,
} from '../store/types';

import type { TreeStore } from '../store/TreeStore';
import {
  areAncestorsExpanded,
  effectiveExpandedItemsSetSelector,
  selectors,
} from '../store/selectors';
import { cloneLookup } from '../utils/lookup';
import { getItemIdKey } from '../utils/itemIdKey';
import { forEachDescendant, getVisibleDescendants } from '../utils/forEachDescendant';

export class TreeExpansionPlugin<TItem = TreeDefaultItem> {
  declare private store: TreeStore<TreeSelectionMode | undefined, TItem>;

  /**
   * Mounted `Tree.GroupTransition` instances, counted per row item ID key. Only
   * a row that renders one animates its children: the list moves them into
   * the transition, so animating any other row would hide them for good.
   */
  private groupTransitionCounts = new Map<string, number>();

  /** The latest event whose expansion change called `eventDetails.allowPropagation()`. */
  private propagationAllowedEvent: Event | undefined = undefined;

  constructor(store: TreeStore<TreeSelectionMode | undefined, TItem>) {
    this.store = store;
  }

  /**
   * Registers a mounted `Tree.GroupTransition` rendered by the row of `itemId`.
   * Returns a dispose function to call on unmount.
   */
  public registerGroupTransition = (itemId: TreeItemId): (() => void) => {
    const key = getItemIdKey(itemId);
    this.groupTransitionCounts.set(key, (this.groupTransitionCounts.get(key) ?? 0) + 1);
    return () => {
      const count = (this.groupTransitionCounts.get(key) ?? 0) - 1;
      if (count > 0) {
        this.groupTransitionCounts.set(key, count);
        return;
      }
      this.groupTransitionCounts.delete(key);
      // Nothing is left to finish this group's transition and release its children.
      if (this.store.state.animatingGroups[key] != null) {
        this.completeGroupTransition(itemId);
      }
    };
  };

  public canToggleItemExpansion = (itemId: TreeItemId): boolean => {
    return (
      !selectors.isItemDisabled(this.store.state, itemId) &&
      selectors.isItemExpandable(this.store.state, itemId)
    );
  };

  public setItemExpansion = (
    itemId: TreeItemId,
    shouldBeExpanded: boolean | undefined,
    reason: TreeRootExpansionChangeEventReason,
    event?: Event,
  ) => {
    const isExpandedBefore = selectors.isItemModelExpanded(this.store.state, itemId);
    // A toggle flips what the user sees, which differs from the model while a
    // filter forces rows open or, in `collapse-non-matches` mode, closed.
    const cleanShouldBeExpanded =
      shouldBeExpanded ?? !selectors.isItemExpanded(this.store.state, itemId);

    // While filtering, the filter plans its part of the visible expansion and
    // tells whether the model changes too.
    const viewChange = this.store.filtering?.planItemsExpansion([itemId], cleanShouldBeExpanded);
    const commitModel = viewChange == null || viewChange.modelItemIds.length > 0;
    if (commitModel && isExpandedBefore === cleanShouldBeExpanded) {
      viewChange?.apply();
      return;
    }

    if (commitModel) {
      this.applyItemExpansion(itemId, cleanShouldBeExpanded, reason, event, viewChange?.apply);
    } else {
      viewChange?.apply();
    }
  };

  /** Whether the expansion change caused by `event` called `eventDetails.allowPropagation()`. */
  public isPropagationAllowed = (event: Event): boolean => this.propagationAllowedEvent === event;

  /** Toggles an item's expansion when it can be toggled. Returns whether it could. */
  public toggleItemExpansion = (
    itemId: TreeItemId,
    reason: TreeRootExpansionChangeEventReason,
    event?: Event,
  ): boolean => {
    if (!this.canToggleItemExpansion(itemId)) {
      return false;
    }
    this.setItemExpansion(itemId, undefined, reason, event);
    return true;
  };

  /**
   * Toggles an item together with its descendants, like Option-clicking a macOS
   * disclosure triangle: a collapsed item expands with every descendant that can
   * be toggled, and an expanded one collapses with them, so expanding it again
   * later shows its children collapsed. Returns whether the item could be toggled.
   */
  public toggleSubtreeExpansion = (
    itemId: TreeItemId,
    reason: TreeRootExpansionChangeEventReason,
    event?: Event,
  ): boolean => {
    if (!this.canToggleItemExpansion(itemId)) {
      return false;
    }
    if (selectors.isItemExpanded(this.store.state, itemId)) {
      this.collapseAll(reason, itemId, event);
    } else {
      this.expandAll(reason, itemId, event);
    }
    return true;
  };

  private applyItemExpansion = (
    itemId: TreeItemId,
    shouldBeExpanded: boolean,
    reason: TreeRootExpansionChangeEventReason,
    event?: Event,
    applyView?: () => void,
  ) => {
    // No-op when the item is already in the target state.
    if (selectors.isItemModelExpanded(this.store.state, itemId) === shouldBeExpanded) {
      applyView?.();
      return;
    }

    const oldExpanded = this.store.state.expandedItems;
    this.commitExpansion(
      shouldBeExpanded ? [itemId, ...oldExpanded] : oldExpanded.filter((id) => id !== itemId),
      [itemId],
      shouldBeExpanded,
      reason,
      event,
      oldExpanded,
      applyView,
    );
  };

  /**
   * Called when a group transition animation completes.
   * Removes the animating group entry, causing the wrapper to be removed from the DOM.
   */
  public completeGroupTransition = (parentId: TreeItemId) => {
    const rest = cloneLookup(this.store.state.animatingGroups);
    delete rest[getItemIdKey(parentId)];
    this.store.set('animatingGroups', rest);
  };

  public expandAllSiblings = (
    itemId: TreeItemId,
    reason: TreeRootExpansionChangeEventReason,
    event?: Event,
  ) => {
    const meta = selectors.itemMeta(this.store.state, itemId);
    if (meta == null) {
      return;
    }

    const siblings = selectors.itemOrderedChildrenIds(this.store.state, meta.parentId);
    const candidates = siblings.filter(
      (child) =>
        this.canToggleItemExpansion(child) && !selectors.isItemExpanded(this.store.state, child),
    );

    // While filtering, the visible expansion is not the model alone: the filter
    // plans its part and returns the rows the model must expand.
    const viewChange = this.store.filtering?.isActive(this.store.state)
      ? this.store.filtering.planItemsExpansion(candidates, true)
      : undefined;
    this.expandItems(
      candidates,
      reason,
      event,
      viewChange && new Set(viewChange.modelItemIds),
      viewChange?.apply,
    );
  };

  /**
   * Expands every expandable item, or, with `rootId`, the item and those of its
   * descendants that can be toggled.
   */
  public expandAll = (
    reason: TreeRootExpansionChangeEventReason,
    rootId?: TreeItemId,
    event?: Event,
  ): void => {
    const { state } = this.store;
    const expandedSet = selectors.expandedItemsSet(state);
    const expandable: TreeItemId[] = [];
    if (rootId === undefined) {
      for (const meta of Object.values(selectors.itemMetaLookup(state))) {
        if (meta.expandable) {
          expandable.push(meta.id);
        }
      }
    } else {
      for (const itemId of this.getSubtreeIds(rootId)) {
        if (this.canToggleItemExpansion(itemId)) {
          expandable.push(itemId);
        }
      }
    }
    // While filtering, the rows the filter shows collapsed expand in its view too.
    const viewChange = this.store.filtering?.isActive(state)
      ? this.store.filtering.planItemsExpansion(
          expandable.filter((itemId) => !selectors.isItemExpanded(state, itemId)),
          true,
        )
      : undefined;
    this.expandItems(
      expandable.filter((itemId) => !expandedSet.has(itemId)),
      reason,
      event,
      // A subtree toggle is a user interaction, so like a single toggle it leaves
      // the model alone where the filter view decides the expansion.
      rootId === undefined || viewChange == null ? undefined : new Set(viewChange.modelItemIds),
      viewChange?.apply,
    );
  };

  /** Collapses every item, or, with `rootId`, the item and its descendants. */
  public collapseAll = (
    reason: TreeRootExpansionChangeEventReason,
    rootId?: TreeItemId,
    event?: Event,
  ) => {
    const subtree = rootId === undefined ? undefined : new Set(this.getSubtreeIds(rootId));
    const isInScope = (itemId: TreeItemId) => subtree == null || subtree.has(itemId);
    const oldExpanded = this.store.state.expandedItems;
    let collapsed = this.withoutDetachedIds(oldExpanded).filter(isInScope);
    const effectiveExpanded = [...effectiveExpandedItemsSetSelector(this.store.state)];
    const viewChange = this.store.filtering?.isActive(this.store.state)
      ? this.store.filtering.planItemsExpansion(
          subtree == null
            ? effectiveExpanded
            : [...new Set([...effectiveExpanded.filter(isInScope), ...collapsed])],
          false,
        )
      : undefined;
    if (subtree != null && viewChange != null) {
      // Like a single toggle, a subtree toggle leaves the model alone where the
      // filter view decides the expansion.
      const modelItemIds = new Set(viewChange.modelItemIds);
      collapsed = collapsed.filter((itemId) => modelItemIds.has(itemId));
    }
    if (subtree == null ? oldExpanded.length === 0 : collapsed.length === 0) {
      viewChange?.apply();
      return;
    }

    const collapsedSet = new Set(collapsed);
    this.commitExpansion(
      subtree == null ? [] : oldExpanded.filter((itemId) => !collapsedSet.has(itemId)),
      collapsed,
      false,
      reason,
      event,
      undefined,
      viewChange?.apply,
    );
  };

  /** The item and its descendants, in tree order. */
  private getSubtreeIds(rootId: TreeItemId): TreeItemId[] {
    const ids = [rootId];
    forEachDescendant(this.store.state.itemOrderedChildrenIdsLookup, rootId, (itemId) => {
      ids.push(itemId);
    });
    return ids;
  }

  /**
   * Expands a batch of candidate items in one change. `modelItemIds` limits the
   * committed items when a filter view expanded the others itself. `applyView`
   * writes that view's part once the change is accepted.
   */
  private expandItems = (
    candidates: TreeItemId[],
    reason: TreeRootExpansionChangeEventReason,
    event?: Event,
    modelItemIds?: ReadonlySet<TreeItemId>,
    applyView?: () => void,
  ): void => {
    const toCommit =
      modelItemIds == null ? candidates : candidates.filter((itemId) => modelItemIds.has(itemId));
    if (toCommit.length > 0) {
      const newExpanded = [...this.store.state.expandedItems, ...toCommit];
      this.commitExpansion(newExpanded, toCommit, true, reason, event, undefined, applyView);
    } else {
      applyView?.();
    }
  };

  /**
   * Commits a new `expandedItems` model and fires the associated callbacks:
   * invokes `onExpandedItemsChange`, bails if the change was canceled, writes the
   * store, then fires `onItemExpansionToggle` for each toggled item with the
   * given expanded state. Shared by single and bulk expansion changes.
   *
   * @param previousExpanded The model the group transitions start from. A single
   * toggle captures it before `onExpandedItemsChange`; a bulk change reads the
   * model that callback leaves.
   * @param applyView Writes a filtered view's part of the change, once the change
   * is accepted.
   */
  private commitExpansion = (
    newExpanded: TreeItemId[],
    toggledItemIds: readonly TreeItemId[],
    isExpanded: boolean,
    reason: TreeRootExpansionChangeEventReason,
    event?: Event,
    previousExpanded?: readonly TreeItemId[],
    applyView?: () => void,
  ) => {
    const details = createChangeEventDetails(reason, event);
    const reported = this.withoutDetachedIds(newExpanded);
    // A change to items the tree doesn't have yet, such as expanding a folder
    // added in the same handler, is kept below but leaves nothing to report.
    if (!this.hasSameIds(reported, this.withoutDetachedIds(this.store.state.expandedItems))) {
      // A copy, so the handler can't mutate the tree's own array.
      this.store.context.onExpandedItemsChange?.([...reported], details);
    }
    if (details.isPropagationAllowed) {
      this.propagationAllowedEvent = event;
    }
    if (details.isCanceled) {
      return;
    }
    applyView?.();
    // Only persist internally when uncontrolled; when `expandedItems` is
    // controlled the prop drives the state (synced by the store observer), and
    // the transition is started from there. Animating here would play a
    // collapse the parent may never accept, leaving the children to snap back.
    if (this.store.state.expandedItemsProp === undefined) {
      this.applyExpandedItems(previousExpanded ?? this.store.state.expandedItems, newExpanded);
    }
    for (const toggledItemId of toggledItemIds) {
      if (selectors.itemMeta(this.store.state, toggledItemId) == null) {
        continue;
      }
      this.store.context.onItemExpansionToggle?.(
        { itemId: toggledItemId, expanded: isExpanded },
        createGenericEventDetails(reason, event),
      );
    }
  };

  /**
   * @internal Drops removed items from the expansion of `state`. Returns the
   * update to apply along with the removal, and a `dispatch` that reports the
   * change once it is applied. The removal already happened, so the change
   * can't be canceled.
   */
  public pruneRemovedItems(
    removedIds: ReadonlySet<TreeItemId>,
    state: TreeState<TItem>,
  ): { updates: Partial<TreeState<TItem>>; dispatch: () => void } {
    const newExpanded = state.expandedItems.filter((id) => !removedIds.has(id));
    if (newExpanded.length === state.expandedItems.length) {
      return { updates: {}, dispatch: NOOP };
    }
    const { context } = this.store;
    return {
      updates: state.expandedItemsProp === undefined ? { expandedItems: newExpanded } : {},
      dispatch: () => {
        context.onExpandedItemsChange?.(
          [...newExpanded],
          createChangeEventDetails(REASONS.missing),
        );
      },
    };
  }

  public actions = {
    expandAll: () => this.expandAll(REASONS.imperativeAction),
    collapseAll: () => this.collapseAll(REASONS.imperativeAction),
    setItemExpansion: (itemId: TreeItemId, expanded: boolean) =>
      this.setItemExpansion(itemId, expanded, REASONS.imperativeAction),
    isItemExpanded: (itemId: TreeItemId) => selectors.isItemExpanded(this.store.state, itemId),
    isItemExpandable: (itemId: TreeItemId) => selectors.isItemExpandable(this.store.state, itemId),
  };

  /**
   * Writes a new expansion model, with the transitions of whatever flipped
   * between `oldExpanded` and it, whether the tree asked for it or a controlled
   * parent drove it from the outside. A filtered view never animates.
   */
  public applyExpandedItems(
    oldExpanded: readonly TreeItemId[],
    newExpanded: readonly TreeItemId[],
  ): void {
    this.store.update({
      expandedItems: newExpanded,
      animatingGroups:
        this.buildGroupTransitionsForChange(oldExpanded, newExpanded) ??
        this.store.state.animatingGroups,
    });
  }

  /**
   * Starts the expanding transition of a folder whose children loaded after it
   * expanded, as its expansion found no rows to animate.
   */
  public startLoadedChildrenTransition(itemId: TreeItemId): void {
    const { state } = this.store;
    if (
      !selectors.expandedItemsSet(state).has(itemId) ||
      state.animatingGroups[getItemIdKey(itemId)] != null
    ) {
      return;
    }
    const groups = this.buildGroupTransitionsForChange(
      state.expandedItems.filter((expandedId) => expandedId !== itemId),
      state.expandedItems,
    );
    if (groups != null) {
      this.store.set('animatingGroups', groups);
    }
  }

  /** The `animatingGroups` with the transitions of a change started, or `null` when none starts. */
  private buildGroupTransitionsForChange(
    oldExpanded: readonly TreeItemId[],
    newExpanded: readonly TreeItemId[],
  ): TreeState['animatingGroups'] | null {
    const { state } = this.store;
    if (this.groupTransitionCounts.size === 0 || selectors.isViewTransformed(state)) {
      return null;
    }
    const oldSet =
      oldExpanded === state.expandedItems
        ? selectors.expandedItemsSet(state)
        : new Set(oldExpanded);
    const newSet = new Set(newExpanded);
    const expanding = newExpanded.filter((itemId) => !oldSet.has(itemId));
    const collapsing = oldExpanded.filter((itemId) => !newSet.has(itemId));
    // Collected, then published once. Expanding K folders in one change used to
    // issue K store-wide notifications, each re-rendering every subscribed row.
    const groups = cloneLookup(state.animatingGroups);
    // Only the outermost group renders its rows, so a row that flips inside a
    // running group changes the rows of that group, rebuilt once at the end.
    const groupOfRow = new Map<TreeItemId, TreeItemId>();
    for (const group of Object.values(groups)) {
      for (const childId of group.childIds) {
        groupOfRow.set(childId, group.parentId);
      }
    }
    const groupsToRebuild = new Set<TreeItemId>();
    let changed = false;
    const startTransitions = (
      itemIds: readonly TreeItemId[],
      shouldBeExpanded: boolean,
      expandedSet: ReadonlySet<TreeItemId>,
    ) => {
      const covered = new Set<TreeItemId>();
      for (const itemId of this.getVisibleItems(itemIds, expandedSet)) {
        const groupId = groupOfRow.get(itemId);
        if (groupId !== undefined) {
          groupsToRebuild.add(groupId);
          continue;
        }
        // Only a row that renders a `Tree.GroupTransition` animates.
        if (covered.has(itemId) || !this.groupTransitionCounts.has(getItemIdKey(itemId))) {
          continue;
        }
        const childIds = getVisibleDescendants(
          state.itemOrderedChildrenIdsLookup,
          itemId,
          expandedSet,
        );
        if (childIds.length > 0) {
          for (const childId of childIds) {
            covered.add(childId);
            delete groups[getItemIdKey(childId)];
          }
          groups[getItemIdKey(itemId)] = {
            parentId: itemId,
            type: shouldBeExpanded ? 'expanding' : 'collapsing',
            childIds,
          };
          changed = true;
        }
      }
    };
    startTransitions(expanding, true, newSet);
    startTransitions(collapsing, false, oldSet);
    for (const parentId of groupsToRebuild) {
      const key = getItemIdKey(parentId);
      const group = groups[key];
      if (group != null) {
        groups[key] = {
          ...group,
          childIds: getVisibleDescendants(state.itemOrderedChildrenIdsLookup, parentId, newSet),
        };
        changed = true;
      }
    }
    return changed ? groups : null;
  }

  /**
   * Keeps the running transitions in line with the hierarchy after items change.
   * An expanding group shows the current visible descendants of its parent; a
   * collapsing group keeps the rows it hides that only its parent's collapse
   * still hides, in their new order, but no row it did not show. A group that a
   * move put inside another one is dropped, as only the outer group renders rows.
   */
  public reconcileGroupTransitions = (): void => {
    const { state } = this.store;
    const entries = Object.entries(state.animatingGroups);
    if (entries.length === 0) {
      return;
    }
    const expandedSet = selectors.expandedItemsSet(state);
    const groups = cloneLookup(state.animatingGroups);
    const rows = new Set<TreeItemId>();
    for (const [key, group] of entries) {
      let childIds: TreeItemId[] = [];
      if (selectors.itemMeta(state, group.parentId) != null) {
        childIds = getVisibleDescendants(
          state.itemOrderedChildrenIdsLookup,
          group.parentId,
          expandedSet,
        );
        if (group.type === 'collapsing') {
          const exiting = new Set(group.childIds);
          childIds = childIds.filter((itemId) => exiting.has(itemId));
        }
      }
      for (const childId of childIds) {
        rows.add(childId);
      }
      groups[key] = { ...group, childIds };
    }
    let changed = false;
    for (const [key, group] of entries) {
      const { childIds } = groups[key];
      if (childIds.length === 0 || rows.has(group.parentId)) {
        delete groups[key];
        changed = true;
      } else if (!areArraysEqual(childIds, group.childIds)) {
        changed = true;
      } else {
        groups[key] = group;
      }
    }
    if (changed) {
      this.store.set('animatingGroups', groups);
    }
  };

  /**
   * The items among `itemIds` whose ancestors are all in `expandedItems`, in tree
   * order. A single toggle reads its ancestors; a bulk change walks the visible
   * rows once.
   */
  private getVisibleItems(
    itemIds: readonly TreeItemId[],
    expandedItems: ReadonlySet<TreeItemId>,
  ): TreeItemId[] {
    const { state } = this.store;
    if (itemIds.length < 2) {
      return itemIds.filter((itemId) => {
        const meta = selectors.itemMeta(state, itemId);
        return (
          meta != null && areAncestorsExpanded(state.itemMetaLookup, meta.parentId, expandedItems)
        );
      });
    }
    const remaining = new Set(itemIds);
    const result: TreeItemId[] = [];
    forEachDescendant(
      state.itemOrderedChildrenIdsLookup,
      null,
      (itemId) => {
        if (remaining.delete(itemId)) {
          result.push(itemId);
        }
        return remaining.size > 0;
      },
      (itemId) => expandedItems.has(itemId),
    );
    return result;
  }

  private hasSameIds(a: readonly TreeItemId[], b: readonly TreeItemId[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    const ids = new Set(b);
    return a.every((itemId) => ids.has(itemId));
  }

  /**
   * Drop ids the tree no longer knows before handing the set to a consumer.
   *
   * Internal state deliberately keeps them: `items` legitimately shrinks and
   * grows (filtering), and discarding expansion on every rebuild
   * would collapse a row the moment it was filtered out. What must not happen is
   * a *callback* reporting an id that is not in the tree — a consumer storing
   * that payload would accumulate ids for items it removed long ago.
   */
  private withoutDetachedIds(itemIds: readonly TreeItemId[]): readonly TreeItemId[] {
    const kept = itemIds.filter((itemId) => selectors.itemMeta(this.store.state, itemId) != null);
    return kept.length === itemIds.length ? itemIds : kept;
  }
}
