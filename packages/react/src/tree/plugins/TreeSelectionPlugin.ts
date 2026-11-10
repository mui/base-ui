import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import {
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type {
  TreeCheckboxSelectionPropagation,
  TreeItemId,
  TreeRootSelectionChangeEventReason,
  TreeSelectionMode,
  TreeDefaultItem,
  TreeState,
} from '../store/types';

import type { TreeStore } from '../store/TreeStore';
import { TREE_SELECTION_ALL } from '../store/types';
import {
  normalizeSelectedItems,
  projectedChildrenLookupSelector,
  selectors,
} from '../store/selectors';
import { forEachDescendant } from '../utils/forEachDescendant';
import { collectAncestorIds } from '../utils/pruneDescendantIds';

export class TreeSelectionPlugin<TItem = TreeDefaultItem> {
  declare private store: TreeStore<TreeSelectionMode | undefined, TItem>;

  private lastSelectedItem: TreeItemId | null = null;

  private lastSelectedRange = new Set<TreeItemId>();

  private propagationAllowedEvent: Event | undefined = undefined;

  private pendingControlledAnchor: {
    itemId: TreeItemId | null;
    range?: Set<TreeItemId> | undefined;
    model: SelectionModel;
  } | null = null;

  constructor(store: TreeStore<TreeSelectionMode | undefined, TItem>) {
    this.store = store;
  }

  public setItemSelection = ({
    itemId,
    keepExistingSelection = false,
    shouldBeSelected,
    shouldPropagate,
    reason,
    event,
  }: {
    itemId: TreeItemId;
    keepExistingSelection?: boolean | undefined;
    shouldBeSelected?: boolean | undefined;
    /**
     * Whether to propagate the selection change through the tree hierarchy.
     * Defaults to `false`; callers pass `true` for checkbox/toggle interactions.
     */
    shouldPropagate?: boolean | undefined;
    reason: TreeRootSelectionChangeEventReason;
    event?: Event | undefined;
  }) => {
    if (this.store.state.selectionMode === 'none') {
      return;
    }

    const isMulti = this.store.state.selectionMode === 'multiple';
    let newSelected: TreeItemId[] | TreeItemId | null;

    if (keepExistingSelection) {
      const isSelectedBefore = selectors.isItemSelected(this.store.state, itemId);
      const checked =
        shouldPropagate && isMulti
          ? selectors.checkboxSelectionStatus(this.store.state, itemId) === 'checked'
          : isSelectedBefore;
      const select = shouldBeSelected ?? !checked;
      if (select) {
        if (isSelectedBefore && !shouldPropagate) {
          return;
        }
        // An item selected without propagation still propagates to its subtree now.
        newSelected = isSelectedBefore
          ? this.materializeSelectedItems().slice()
          : [itemId, ...this.materializeSelectedItems()];
      } else {
        if (!isSelectedBefore && !shouldPropagate) {
          return;
        }
        newSelected = this.materializeSelectedItems().filter((id) => id !== itemId);
      }
    } else if (
      shouldBeSelected === false ||
      (shouldBeSelected == null && selectors.isItemSelected(this.store.state, itemId))
    ) {
      newSelected = isMulti ? [] : null;
    } else {
      newSelected = isMulti ? [itemId] : itemId;
    }

    this.setSelectedItems(newSelected, reason, event, {
      propagateFrom: shouldPropagate ? [itemId] : undefined,
      anchor: { itemId },
    });
  };

  /**
   * Checks or unchecks an item's checkbox, or toggles it when `checked` is
   * `undefined`, propagating the change through the hierarchy.
   */
  public setItemChecked = (
    itemId: TreeItemId,
    checked: boolean | undefined,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) => {
    this.setItemSelection({
      itemId,
      keepExistingSelection: this.store.state.selectionMode === 'multiple',
      shouldBeSelected: checked,
      shouldPropagate: true,
      reason,
      event,
    });
  };

  /** Converts an uncontrolled selection to the shape of a new selection mode. */
  public handleSelectionModeChange = (selectionMode: TreeSelectionMode | undefined) => {
    const { selectedItems, selectedItemsProp } = this.store.state;
    if (selectionMode === 'none' || selectedItemsProp !== undefined) {
      return;
    }
    if (selectionMode === 'multiple') {
      if (!Array.isArray(selectedItems) && selectedItems !== TREE_SELECTION_ALL) {
        this.store.set(
          'selectedItems',
          selectedItems == null ? EMPTY_ARRAY : [selectedItems as TreeItemId],
        );
      }
    } else if (selectedItems === TREE_SELECTION_ALL || Array.isArray(selectedItems)) {
      this.store.set('selectedItems', this.materializeSelectedItems()[0] ?? null);
    }
  };

  public handleControlledSelectedItemsChange(
    model: readonly TreeItemId[] | TreeItemId | null | typeof TREE_SELECTION_ALL,
  ): void {
    const pending = this.pendingControlledAnchor;
    this.pendingControlledAnchor = null;
    if (pending != null && selectionModelsHaveSameItems(pending.model, model)) {
      this.lastSelectedItem = pending.itemId;
      this.lastSelectedRange = pending.range ?? new Set();
    } else {
      // The parent replaced the controlled model independently. Any anchor from
      // the previous model would make the next Shift interaction start from an
      // item that no longer anchors the selection.
      this.lastSelectedItem = null;
      this.lastSelectedRange = new Set();
    }
  }

  /**
   * Returns the items a selection model selects, the current one by default, as
   * a plain array. Expands the "all" sentinel into the items it selects, and
   * normalizes single-item / null values into an array.
   */
  public materializeSelectedItems = (
    model: SelectionModel = this.store.state.selectedItems,
  ): readonly TreeItemId[] =>
    model === TREE_SELECTION_ALL
      ? selectors.selectionAllItemIds(this.store.state)
      : normalizeSelectedItems(model);

  /**
   * Selects every item, or deselects them all when they already are.
   * While filtering, only toggles the items the filter shows.
   */
  public toggleSelectAll = (reason: TreeRootSelectionChangeEventReason, event?: Event) => {
    const state = this.store.state;
    if (state.disabled || state.selectionMode !== 'multiple') {
      return;
    }
    if (selectors.isViewTransformed(state)) {
      this.toggleShownItems(reason, event);
      return;
    }
    const itemIds = selectors.selectionAllItemIds(state);
    const allSelected =
      state.selectedItems === TREE_SELECTION_ALL ||
      (itemIds.length > 0 && itemIds.every((itemId) => selectors.isItemSelected(state, itemId)));
    this.setSelectedItems(allSelected ? [] : TREE_SELECTION_ALL, reason, event, {
      anchor: { itemId: null },
    });
  };

  private toggleShownItems(reason: TreeRootSelectionChangeEventReason, event?: Event) {
    const state = this.store.state;
    const shownIds: TreeItemId[] = [];
    forEachDescendant(projectedChildrenLookupSelector(state), null, (itemId) => {
      if (selectors.isItemInSelectionAll(state, itemId)) {
        shownIds.push(itemId);
      }
    });
    if (shownIds.length === 0) {
      return;
    }
    const shown = new Set(shownIds);
    const selected = this.materializeSelectedItems();
    const next = shownIds.every((itemId) => selectors.isItemSelected(state, itemId))
      ? selected.filter((itemId) => !shown.has(itemId))
      : [...new Set([...selected, ...shownIds])];
    this.setSelectedItems(next, reason, event, { anchor: { itemId: null } });
  }

  /** Deselects every item of a multiple-selection tree. Returns whether the selection changed. */
  public clearSelection = (reason: TreeRootSelectionChangeEventReason, event?: Event): boolean => {
    const state = this.store.state;
    if (
      state.disabled ||
      state.selectionMode !== 'multiple' ||
      this.materializeSelectedItems().length === 0
    ) {
      return false;
    }
    return this.setSelectedItems([], reason, event, { anchor: { itemId: null } });
  };

  /** Whether the selection change caused by `event` called `eventDetails.allowPropagation()`. */
  public isPropagationAllowed = (event: Event): boolean => this.propagationAllowedEvent === event;

  public expandSelectionRange = (
    itemId: TreeItemId,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) => {
    const anchor = this.lastSelectedItem ?? this.implicitRangeAnchor();
    if (anchor == null) {
      return;
    }
    // The anchor may have been hidden since it was set (e.g. an ancestor was
    // collapsed), and a range to a hidden row is empty. Restart the range at the
    // clicked item instead, which also moves the anchor there.
    if (!this.isItemRendered(anchor) || !this.isItemRendered(itemId)) {
      this.setItemSelection({
        itemId,
        keepExistingSelection: true,
        shouldBeSelected: true,
        reason,
        event,
      });
      return;
    }
    this.selectRange([itemId, anchor], anchor, reason, event);
  };

  private isItemRendered(itemId: TreeItemId): boolean {
    return selectors.flatListIndex(this.store.state, itemId) !== -1;
  }

  /**
   * Where a range starts when no pointer or keyboard selection set an anchor:
   * the first selected item. A selection seeded by `defaultSelectedItems` /
   * `selectedItems` never sets `lastSelectedItem`, and without this a Shift+Click
   * on such a tree did nothing at all.
   *
   * Not the focused item: the click that opens the range focuses its own row
   * first, so that would make every range degenerate. `null` on a tree with no
   * selection, where a range genuinely has no other end.
   */
  private implicitRangeAnchor(): TreeItemId | null {
    return this.materializeSelectedItems()[0] ?? null;
  }

  /** Selects the rows from `itemId` to `edgeItemId`, such as the first or last row, keeping the anchor. */
  public selectRangeTo = (
    itemId: TreeItemId,
    edgeItemId: TreeItemId,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) => {
    this.selectRange([itemId, edgeItemId], this.lastSelectedItem, reason, event);
  };

  public selectItemFromArrowNavigation = (
    currentItem: TreeItemId,
    nextItem: TreeItemId,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) => {
    if (this.store.state.selectionMode !== 'multiple') {
      return;
    }

    // Seeded selections extend from their anchor.
    const anchor =
      this.lastSelectedItem ??
      (this.lastSelectedRange.size === 0 ? this.implicitRangeAnchor() : null);
    if (anchor != null) {
      let rangeAnchor = anchor;
      // Same as `expandSelectionRange`: an anchor hidden since it was set (e.g.
      // under a collapsed ancestor) cannot bound a range over the visible rows,
      // so the range restarts at the row the arrow key left.
      if (!this.isItemRendered(rangeAnchor)) {
        rangeAnchor = currentItem;
        this.lastSelectedRange = new Set();
      }
      this.selectRange([rangeAnchor, nextItem], rangeAnchor, reason, event);
      return;
    }

    // An empty selection starts at the destination; controlled range bookkeeping
    // advances only when the prop accepts it.
    let newSelectedItems = this.materializeSelectedItems().slice();
    let nextSelectedRange = new Set(this.lastSelectedRange);

    if (this.lastSelectedRange.size === 0) {
      if (
        selectors.canItemBeSelected(this.store.state, nextItem) &&
        !newSelectedItems.includes(nextItem)
      ) {
        newSelectedItems.push(nextItem);
      }
      nextSelectedRange = new Set([currentItem, nextItem]);
    } else {
      if (!this.lastSelectedRange.has(currentItem)) {
        nextSelectedRange = new Set();
      }

      if (nextSelectedRange.has(nextItem)) {
        if (selectors.canItemBeSelected(this.store.state, currentItem)) {
          newSelectedItems = newSelectedItems.filter((id) => id !== currentItem);
        }
        nextSelectedRange.delete(currentItem);
      } else {
        if (
          selectors.canItemBeSelected(this.store.state, nextItem) &&
          !newSelectedItems.includes(nextItem)
        ) {
          newSelectedItems.push(nextItem);
        }
        nextSelectedRange.add(nextItem);
      }
    }

    this.setSelectedItems(newSelectedItems, reason, event, {
      anchor: { itemId: null, range: nextSelectedRange },
    });
  };

  public actions = {
    getSelectedItemIds: () => new Set(this.materializeSelectedItems()),
    isItemSelected: (itemId: TreeItemId) => selectors.isItemSelected(this.store.state, itemId),
    // Toggle this one item: in multiple mode the action must leave the rest of
    // the selection alone. Single mode has nothing to keep — selecting one item
    // there does replace the selection.
    setItemSelection: (itemId: TreeItemId, selected: boolean) =>
      this.setItemChecked(itemId, selected, REASONS.imperativeAction),
  };

  /** Re-establish checkbox propagation after the item hierarchy changes. */
  public reconcileSelectionAfterItemsMutation = (): void => {
    const { state } = this.store;
    if (
      state.selectionMode !== 'multiple' ||
      state.selectedItems === TREE_SELECTION_ALL ||
      (!state.checkboxSelectionPropagation.descendants &&
        !state.checkboxSelectionPropagation.parents)
    ) {
      return;
    }

    const selectedItems = this.materializeSelectedItems();
    // Propagation only ever adds items next to existing ones.
    if (selectedItems.length === 0) {
      return;
    }
    const selectedSet = new Set(selectedItems);

    const childrenLookup = state.itemOrderedChildrenIdsLookup;
    if (state.checkboxSelectionPropagation.descendants) {
      // A selected item selects its subtree, which the walk then skips.
      forEachDescendant(
        childrenLookup,
        null,
        (itemId) => {
          if (selectedSet.has(itemId)) {
            forEachDescendant(childrenLookup, itemId, (descendantId) => {
              if (selectors.canItemBeSelected(state, descendantId)) {
                selectedSet.add(descendantId);
              }
            });
          }
        },
        (itemId) => !selectedSet.has(itemId),
      );
    }

    if (state.checkboxSelectionPropagation.parents) {
      const fullySelected = new Set<TreeItemId>();
      const hasSelectedItem = new Set<TreeItemId>();
      const isFullySelected = (itemId: TreeItemId) => fullySelected.has(itemId);
      const hasSelection = (itemId: TreeItemId) => hasSelectedItem.has(itemId);
      // Read backwards, a preorder that visits children right to left lists
      // every item after its children, left to right.
      const order: TreeItemId[] = [];
      const pending = selectors.itemOrderedChildrenIds(state, null).slice();
      while (pending.length > 0) {
        const itemId = pending.pop()!;
        order.push(itemId);
        for (const childId of selectors.itemOrderedChildrenIds(state, itemId)) {
          pending.push(childId);
        }
      }
      for (let index = order.length - 1; index >= 0; index -= 1) {
        const itemId = order[index];
        const children = selectors.itemOrderedChildrenIds(state, itemId);
        const childrenFullySelected = children.every(isFullySelected);
        const subtreeHasSelection = selectedSet.has(itemId) || children.some(hasSelection);
        const canBeSelected = selectors.canItemBeSelected(state, itemId);
        if (children.length > 0 && childrenFullySelected && subtreeHasSelection && canBeSelected) {
          selectedSet.add(itemId);
        }
        if (subtreeHasSelection) {
          hasSelectedItem.add(itemId);
        }
        if (childrenFullySelected && (selectedSet.has(itemId) || !canBeSelected)) {
          fullySelected.add(itemId);
        }
      }
    }

    this.setSelectedItems(Array.from(selectedSet), REASONS.none, undefined, { automatic: true });
  };

  /**
   * @internal Drops removed items from the selection of `state`. Returns the
   * update to apply along with the removal, and a `dispatch` that reports the
   * change once it is applied. The removal already happened, so the change
   * can't be canceled: under `disableEmptySelection`, removing every selected
   * item selects the first remaining selectable item instead.
   */
  public pruneRemovedItems(
    removedIds: ReadonlySet<TreeItemId>,
    state: TreeState<TItem>,
  ): { updates: Partial<TreeState<TItem>>; dispatch: () => void } {
    const filtered = filterSelectionModel(state.selectedItems, (id) => !removedIds.has(id));
    let newSelected: SelectionModel | undefined =
      filtered === state.selectedItems ? undefined : filtered;
    if (
      newSelected !== undefined &&
      state.disableEmptySelection &&
      (newSelected == null || (Array.isArray(newSelected) && newSelected.length === 0))
    ) {
      const remainingIds = [...selectors.itemOrderedChildrenIds(state, null)];
      let fallback: TreeItemId | undefined;
      for (let index = 0; index < remainingIds.length; index += 1) {
        const candidate = remainingIds[index];
        for (const childId of selectors.itemOrderedChildrenIds(state, candidate)) {
          remainingIds.push(childId);
        }
        if (!removedIds.has(candidate) && selectors.canItemBeSelected(state, candidate)) {
          fallback = candidate;
          break;
        }
      }
      if (fallback !== undefined) {
        newSelected = state.selectionMode === 'multiple' ? [fallback] : fallback;
      }
    }
    const pruned = newSelected;
    const { context } = this.store;
    return {
      updates:
        pruned !== undefined && state.selectedItemsProp === undefined
          ? { selectedItems: pruned }
          : {},
      dispatch: () => {
        if (pruned !== undefined) {
          context.onSelectedItemsChange?.(
            copySelectionModel(pruned),
            createChangeEventDetails(REASONS.missing),
          );
        }
      },
    };
  }

  /**
   * @internal Applies a new selection model. Returns `true` when the selection
   * actually changed and was committed, `false` on a no-op, a canceled
   * `onSelectedItemsChange`, or a `disableEmptySelection` block.
   */
  public setSelectedItems(
    newModel: TreeItemId[] | TreeItemId | null | typeof TREE_SELECTION_ALL,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
    options: {
      /**
       * The items whose checkbox toggled, to propagate the change through the
       * hierarchy from. Range selection does not select hidden descendants.
       */
      propagateFrom?: TreeItemId[] | undefined;
      /**
       * The range anchor the change sets once committed: at once while
       * uncontrolled, or once a controlled parent accepts the model.
       */
      anchor?: { itemId: TreeItemId | null; range?: Set<TreeItemId> | undefined } | undefined;
      /** Whether the tree makes the change on its own, so it isn't announced and can't be canceled. */
      automatic?: boolean | undefined;
    } = {},
  ): boolean {
    const { propagateFrom, anchor, automatic = false } = options;
    const oldModel = this.store.state.selectedItems;
    let cleanModel: TreeItemId[] | TreeItemId | null | typeof TREE_SELECTION_ALL;
    if (
      propagateFrom !== undefined &&
      this.store.state.selectionMode === 'multiple' &&
      newModel !== TREE_SELECTION_ALL
    ) {
      cleanModel = this.propagateSelection(
        newModel as TreeItemId[],
        this.materializeSelectedItems(),
        selectors.checkboxSelectionPropagation(this.store.state),
        propagateFrom,
      );
    } else {
      cleanModel = newModel;
    }

    // No-op guard: don't fire onSelectedItemsChange (or churn state) when the
    // resulting model is identical to the current one — e.g. re-clicking the
    // already-selected item in single-select mode.
    if (selectionModelsEqual(oldModel, cleanModel)) {
      return false;
    }

    // Ids the tree no longer knows are retained for when they return, but they
    // are not a selection the user still has.
    if (
      cleanModel !== TREE_SELECTION_ALL &&
      this.store.state.disableEmptySelection &&
      !normalizeSelectedItems(cleanModel).some(
        (id) => selectors.itemMeta(this.store.state, id)?.selectable,
      )
    ) {
      return false;
    }

    if (this.store.state.selectedItemsProp !== undefined && anchor !== undefined) {
      this.pendingControlledAnchor = {
        itemId: anchor.itemId,
        model: cleanModel,
        range: anchor.range,
      };
    }

    const details = createChangeEventDetails(reason, event);
    // Reported without ids the tree no longer knows: `items` legitimately shrinks
    // and grows (filtering, lazy loading), so internal state keeps them — but a
    // consumer storing this payload must not accumulate ids for removed items.
    const reportedModel = filterSelectionModel(
      cleanModel,
      (itemId) => selectors.itemMeta(this.store.state, itemId) != null,
    );
    // The model the state takes once the change applies. Recorded before the
    // callback, which a controlled parent can apply synchronously.
    const proposedModel =
      this.store.state.selectedItemsProp === undefined ? cleanModel : reportedModel;
    const { status } = this.store;
    status?.handleSelectionProposal(
      automatic || reason === REASONS.imperativeAction ? undefined : proposedModel,
    );
    this.store.context.onSelectedItemsChange?.(copySelectionModel(reportedModel), details);
    if (details.isPropagationAllowed) {
      this.propagationAllowedEvent = event;
    }
    if (details.isCanceled && !automatic) {
      if (this.pendingControlledAnchor?.model === cleanModel) {
        this.pendingControlledAnchor = null;
      }
      status?.discardUserSelection(proposedModel);
      return false;
    }
    // Only persist internally when uncontrolled; when `selectedItems` is
    // controlled the prop drives the state (synced by the store observer).
    if (this.store.state.selectedItemsProp === undefined) {
      this.store.set('selectedItems', cleanModel);
    }

    // Fire onItemSelectionToggle for each item whose selection state changed
    if (this.store.state.hasItemSelectionToggleHandler) {
      const normalizedOld = new Set(this.materializeSelectedItems(oldModel));
      const normalizedNew = new Set(this.materializeSelectedItems(cleanModel));
      const selectionDetails = createGenericEventDetails(reason, event);
      for (const itemId of normalizedNew) {
        if (!normalizedOld.has(itemId)) {
          this.store.context.onItemSelectionToggle?.({ itemId, selected: true }, selectionDetails);
        }
      }
      for (const itemId of normalizedOld) {
        if (!normalizedNew.has(itemId)) {
          this.store.context.onItemSelectionToggle?.({ itemId, selected: false }, selectionDetails);
        }
      }
    }

    // A canceled, disallowed or no-op change leaves the anchor where it was.
    if (anchor !== undefined && this.store.state.selectedItemsProp === undefined) {
      this.lastSelectedItem = anchor.itemId;
      this.lastSelectedRange = anchor.range ?? new Set();
    }
    return true;
  }

  /** Applies checkbox propagation to the items a new model adds or removes. */
  private propagateSelection(
    newModel: TreeItemId[],
    oldModel: readonly TreeItemId[],
    checkboxSelectionPropagation: TreeCheckboxSelectionPropagation,
    additionalItemsToPropagate?: TreeItemId[],
  ): TreeItemId[] {
    if (!checkboxSelectionPropagation.descendants && !checkboxSelectionPropagation.parents) {
      return newModel;
    }

    const flags = { shouldRegenerateModel: false };
    const newModelSet = new Set(newModel);

    const oldModelSet = new Set(oldModel);
    const added = newModel.filter((id) => !oldModelSet.has(id));
    const removed = oldModel.filter((id) => !newModelSet.has(id));

    const addedSet = new Set(added);
    const removedSet = new Set(removed);
    additionalItemsToPropagate?.forEach((itemId) => {
      if (newModelSet.has(itemId)) {
        if (!addedSet.has(itemId)) {
          addedSet.add(itemId);
          added.push(itemId);
        }
      } else if (!removedSet.has(itemId)) {
        removedSet.add(itemId);
        removed.push(itemId);
      }
    });

    const { state } = this.store;
    const childrenLookup = state.itemOrderedChildrenIdsLookup;
    const canBeSelected = (itemId: TreeItemId) => selectors.canItemBeSelected(state, itemId);

    // Cache for checkAllDescendantsSelected: only `true` results are cached
    // because newModelSet only grows during the added phase, so a `true` result
    // (item + all descendants selected) can never become `false`.
    const fullySelectedCache = new Set<TreeItemId>();

    // Non-selectable items don't count toward the "all selected" check
    // themselves, but their descendants still must all be selected — otherwise
    // a selectable subtree under a non-selectable folder would be treated as
    // complete. This keeps the walk consistent with the descendant propagation
    // below and with descendantSelectionCounts.
    const isSelectedOrExempt = (itemId: TreeItemId) =>
      fullySelectedCache.has(itemId) || newModelSet.has(itemId) || !canBeSelected(itemId);
    const checkAllDescendantsSelected = (itemId: TreeItemId): boolean => {
      if (fullySelectedCache.has(itemId)) {
        return true;
      }
      if (!isSelectedOrExempt(itemId)) {
        return false;
      }
      const result = forEachDescendant(
        childrenLookup,
        itemId,
        isSelectedOrExempt,
        (descendantId) => !fullySelectedCache.has(descendantId),
      );
      if (result) {
        fullySelectedCache.add(itemId);
      }
      return result;
    };

    if (checkboxSelectionPropagation.descendants) {
      for (const addedItemId of added) {
        // A non-selectable folder is skipped but still walked, so a selectable
        // subtree under it is not.
        forEachDescendant(childrenLookup, addedItemId, (itemId) => {
          if (canBeSelected(itemId)) {
            flags.shouldRegenerateModel = true;
            newModelSet.add(itemId);
          }
        });
        fullySelectedCache.add(addedItemId);
      }
    }

    if (checkboxSelectionPropagation.parents) {
      // Each ancestor is checked once, deepest first, so it sees the parents
      // below it that this propagation selected.
      const ancestors = collectAncestorIds(state, added);
      const level = (itemId: TreeItemId) => selectors.itemMeta(state, itemId)?.level ?? 0;
      for (const parentId of [...ancestors].sort((a, b) => level(b) - level(a))) {
        if (
          canBeSelected(parentId) &&
          selectors.itemOrderedChildrenIds(state, parentId).every(checkAllDescendantsSelected)
        ) {
          flags.shouldRegenerateModel = true;
          newModelSet.add(parentId);
        }
      }
    }

    // Once an ancestor is cleared, so is every ancestor above it.
    const clearedAncestors = new Set<TreeItemId>();
    for (const removedItemId of removed) {
      if (checkboxSelectionPropagation.parents) {
        for (
          let parentId = selectors.itemParentId(state, removedItemId);
          parentId != null && !clearedAncestors.has(parentId);
          parentId = selectors.itemParentId(state, parentId)
        ) {
          clearedAncestors.add(parentId);
          if (newModelSet.delete(parentId)) {
            flags.shouldRegenerateModel = true;
          }
        }
      }

      if (checkboxSelectionPropagation.descendants) {
        forEachDescendant(childrenLookup, removedItemId, (itemId) => {
          flags.shouldRegenerateModel = true;
          newModelSet.delete(itemId);
        });
      }
    }

    return flags.shouldRegenerateModel ? Array.from(newModelSet) : newModel;
  }

  private selectRange(
    endpoints: [TreeItemId, TreeItemId],
    anchor: TreeItemId | null,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) {
    if (this.store.state.selectionMode !== 'multiple') {
      return;
    }

    const { state } = this.store;
    // A range always produces a concrete item list, even from TREE_SELECTION_ALL,
    // and replaces the range it extends. Items of that range that can't be
    // selected anymore, such as disabled ones, keep their selection.
    const newSelectedItems = this.materializeSelectedItems().filter(
      (id) => !this.lastSelectedRange.has(id) || !selectors.canItemBeSelected(state, id),
    );
    const selectedItemsSet = new Set(newSelectedItems);

    const flatList = selectors.flatList(state);
    const indexA = selectors.flatListIndex(state, endpoints[0]);
    const indexB = selectors.flatListIndex(state, endpoints[1]);
    const range = new Set<TreeItemId>();
    if (indexA !== -1 && indexB !== -1) {
      for (let index = Math.min(indexA, indexB); index <= Math.max(indexA, indexB); index += 1) {
        const id = flatList[index];
        if (selectors.canItemBeSelected(state, id)) {
          range.add(id);
          if (!selectedItemsSet.has(id)) {
            newSelectedItems.push(id);
          }
        }
      }
    }

    this.setSelectedItems(newSelectedItems, reason, event, { anchor: { itemId: anchor, range } });
  }
}

/**
 * Structural equality for selection models, treating the `TREE_SELECTION_ALL`
 * sentinel, scalar/null single-selection values, and ordered arrays. Two arrays
 * are equal only when they hold the same ids in the same order (conservative —
 * a reorder is reported as a change).
 */
function selectionModelsEqual(
  a: readonly TreeItemId[] | TreeItemId | null | typeof TREE_SELECTION_ALL,
  b: readonly TreeItemId[] | TreeItemId | null | typeof TREE_SELECTION_ALL,
): boolean {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return areArraysEqual(a, b);
  }
  return false;
}

export type SelectionModel = readonly TreeItemId[] | TreeItemId | null | typeof TREE_SELECTION_ALL;

/** Copies an array model, so a change handler can't mutate the tree's own array. */
function copySelectionModel(
  model: SelectionModel,
): TreeItemId[] | TreeItemId | null | typeof TREE_SELECTION_ALL {
  // Only an array is an object: the other models are ids, `null` or the select-all symbol.
  return model !== null && typeof model === 'object' ? [...model] : model;
}

/**
 * The model without the ids `keep` rejects, keeping its shape: an array stays an
 * array, and a rejected single id becomes `null`. `TREE_SELECTION_ALL` is a
 * sentinel, not ids. Returns the same model when it keeps every id.
 */
function filterSelectionModel(
  model: SelectionModel,
  keep: (itemId: TreeItemId) => boolean,
): SelectionModel {
  if (model === TREE_SELECTION_ALL || model == null) {
    return model;
  }
  if (Array.isArray(model)) {
    const kept = model.filter(keep);
    return kept.length === model.length ? model : kept;
  }
  return keep(model as TreeItemId) ? model : null;
}

/**
 * Whether two models select the same items, whatever order they store the ids
 * in, such as a proposal and the value a controlled parent accepted for it.
 */
export function selectionModelsHaveSameItems(a: SelectionModel, b: SelectionModel): boolean {
  if (a === b) {
    return true;
  }
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  const items = new Set(a);
  return b.every((id) => items.has(id));
}
