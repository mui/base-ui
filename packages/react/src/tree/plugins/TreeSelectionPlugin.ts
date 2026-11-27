import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import {
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type {
  TreeItemId,
  TreeItemLookupKey,
  TreeRootSelectionChangeEventReason,
  TreeMultiple,
  TreeDefaultItem,
  TreeState,
} from '../store/types';

import type { TreeStore } from '../store/TreeStore';
import {
  normalizeSelectedItems,
  projectedChildrenLookupSelector,
  selectors,
} from '../store/selectors';
import { getFirstNavigableItem } from '../store/treeNavigation';
import { forEachDescendant } from '../utils/forEachDescendant';
import { haveSameMembers } from '../utils/haveSameMembers';
import { collectAncestorIds, isInSubtreeOf } from '../utils/pruneDescendantIds';

/** Which modifiers a press was made with. */
export interface PressModifiers {
  shiftKey?: boolean | undefined;
  /** Ctrl, or Cmd on macOS. */
  ctrlKey?: boolean | undefined;
  /** Touch has no modifier keys, so opt-in multiple selection toggles on tap. */
  touch?: boolean | undefined;
}

/** The anchor a change sets once committed, and the item that has focus then. */
interface SelectionAnchor {
  itemId: TreeItemId | null;
  focus: TreeItemId | null;
}

export class TreeSelectionPlugin<TItem = TreeDefaultItem> {
  declare private store: TreeStore<TreeMultiple | undefined, TItem>;

  /** The last pressed or selected item, which a Shift+press extends a range from. */
  private anchor: TreeItemId | null = null;

  /** The item that had focus when `anchor` was last set or kept. */
  private anchorFocus: TreeItemId | null = null;

  private pendingControlledAnchor: {
    anchor: SelectionAnchor;
    model: SelectionModel;
  } | null = null;

  constructor(store: TreeStore<TreeMultiple | undefined, TItem>) {
    this.store = store;
  }

  /**
   * Selects or deselects an item, or toggles it when `selected` is `undefined`. With
   * multiple selection, the rest of the selection stays as it is. With `propagate`, as
   * for a checkbox, the change spreads through the hierarchy following
   * `checkboxSelectionPropagation`.
   */
  public setItemSelected = (
    itemId: TreeItemId,
    selected: boolean | undefined,
    propagate: boolean,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) => {
    const { state } = this.store;
    let newSelected: TreeItemId[] | TreeItemId | null;

    if (state.multiple !== false) {
      const selectedIds = normalizeSelectedItems(state.selectedItems);
      const isSelectedBefore = selectors.isItemSelected(state, itemId);
      // A checkbox toggles from its own state, which its descendants can make checked.
      const isChecked = propagate
        ? selectors.checkboxSelectionStatus(state, itemId) === 'checked'
        : isSelectedBefore;
      const select = selected ?? !isChecked;
      if (!select) {
        newSelected = selectedIds.filter((id) => id !== itemId);
      } else if (isSelectedBefore) {
        // A selected item that isn't fully checked still propagates to its subtree now.
        newSelected = selectedIds.slice();
      } else {
        newSelected = [...selectedIds, itemId];
      }
      if (propagate) {
        newSelected = this.propagateSelection(newSelected, itemId, select);
      }
    } else {
      const select = selected ?? !selectors.isItemSelected(state, itemId);
      // Deselecting another item than the selected one leaves the selection as it is.
      if (!select && state.selectedItems !== itemId) {
        return;
      }
      newSelected = select ? itemId : null;
    }

    this.setSelectedItems(newSelected, reason, event, {
      anchor: { itemId, focus: itemId },
    });
  };

  /**
   * A click, tap, or Space/Enter on an item, as the APG selection models describe:
   * - Shift+press selects the range from the anchor, replacing the selection. With
   *   `multiple="opt-in"`, Ctrl/Cmd+Shift+press adds the range instead.
   * - `multiple` toggles the item on every press, and `multiple="opt-in"` does with
   *   Ctrl/Cmd or on touch, which has no modifier keys.
   * - Otherwise, the press makes the item the selection.
   *
   * A press on a checkbox toggles its item in every mode, and only that press
   * propagates through the hierarchy.
   *
   * Returns `false` when the item can't be selected, and the press does nothing.
   */
  public press = (
    itemId: TreeItemId,
    modifiers: PressModifiers,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ): boolean => {
    if (!selectors.canItemBeSelected(this.store.state, itemId)) {
      return false;
    }
    const { shiftKey = false, ctrlKey = false, touch = false } = modifiers;
    const { multiple } = this.store.state;
    const toggle = this.store.items.getItemKind(itemId) === 'checkbox';
    const replaceOnPress = multiple === 'opt-in' && !touch;

    if (shiftKey && multiple) {
      const anchor = this.resolveAnchor() ?? this.getDefaultAnchor();
      if (anchor == null) {
        return true;
      }
      if (replaceOnPress && ctrlKey && !toggle) {
        this.setSelectedItems(this.addRange(anchor, itemId), reason, event, {
          anchor: { itemId, focus: itemId },
        });
      } else {
        // Extending a range keeps its anchor, so the next Shift+press extends from the same item.
        this.setSelectedItems(this.replaceWithRange(anchor, itemId), reason, event, {
          anchor: { itemId: anchor, focus: itemId },
        });
      }
      return true;
    }

    if (toggle || (multiple && (!replaceOnPress || ctrlKey))) {
      this.setItemSelected(itemId, undefined, toggle, reason, event);
      return true;
    }

    this.setSelectedItems(multiple ? this.replaceWith([itemId]) : itemId, reason, event, {
      anchor: { itemId, focus: itemId },
    });
    return true;
  };

  /**
   * Moves the selection to an item, as focus moves to it with `multiple="opt-in"`. A disabled
   * item can't be selected, so the selection stays where it was while focus is on one.
   */
  public moveTo = (
    itemId: TreeItemId,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) => {
    // An item with a checkbox only changes through it, as with `multiple`.
    if (this.store.items.getItemKind(itemId) === 'checkbox') {
      return;
    }
    const anchor = { itemId, focus: itemId };
    if (!selectors.canItemBeSelected(this.store.state, itemId)) {
      this.applyAnchor(anchor);
      return;
    }
    this.setSelectedItems(this.replaceWith([itemId]), reason, event, { anchor });
  };

  /**
   * Selects the range from the anchor to an item as focus moves to it from `focusedItemId`,
   * replacing the rest of the selection, so the range grows and shrinks as focus moves.
   */
  public extendTo = (
    itemId: TreeItemId,
    focusedItemId: TreeItemId,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) => {
    if (!this.store.state.multiple) {
      return;
    }
    // The anchor holds while focus is still on the item that set or kept it. Once focus
    // moved another way, such as by typing, the range starts at the focused item.
    const anchor =
      this.anchorFocus === focusedItemId ? (this.resolveAnchor() ?? focusedItemId) : focusedItemId;
    this.setSelectedItems(this.replaceWithRange(anchor, itemId), reason, event, {
      anchor: { itemId: anchor, focus: itemId },
    });
  };

  /** Adds the rows from `itemId` to `edgeItemId`, such as the first or last row, to the selection. */
  public selectRangeTo = (
    itemId: TreeItemId,
    edgeItemId: TreeItemId,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) => {
    if (!this.store.state.multiple) {
      return;
    }
    this.setSelectedItems(this.addRange(itemId, edgeItemId), reason, event, {
      anchor: { itemId: edgeItemId, focus: edgeItemId },
    });
  };

  /** Converts an uncontrolled selection to the shape of a new `multiple` value. */
  public handleMultipleChange = (multiple: TreeMultiple) => {
    const { selectedItems, selectedItemsProp } = this.store.state;
    if (selectedItemsProp !== undefined) {
      return;
    }
    if (multiple) {
      if (!Array.isArray(selectedItems)) {
        this.store.set(
          'selectedItems',
          selectedItems == null ? EMPTY_ARRAY : [selectedItems as TreeItemId],
        );
      }
    } else if (Array.isArray(selectedItems)) {
      this.store.set('selectedItems', selectedItems[0] ?? null);
    }
  };

  public handleControlledSelectedItemsChange(model: SelectionModel): void {
    const pending = this.pendingControlledAnchor;
    this.pendingControlledAnchor = null;
    if (pending != null && haveSameMembers(pending.model, model)) {
      this.applyAnchor(pending.anchor);
    } else {
      // The parent replaced the controlled model independently. Any anchor from
      // the previous model would make the next Shift interaction start from an
      // item that no longer anchors the selection.
      this.applyAnchor({ itemId: null, focus: null });
    }
  }

  /**
   * Selects every item, in tree order, including the ones under collapsed parents. While
   * filtering, selects the items the filter shows. As with any change that replaces the
   * selection, selected items that users can't deselect stay selected.
   */
  public selectAll = (reason: TreeRootSelectionChangeEventReason, event?: Event) => {
    const state = this.store.state;
    if (state.disabled || !state.multiple) {
      return;
    }
    const selectedSet = selectors.selectedItemsSet(state);
    const itemIds: TreeItemId[] = [];
    // Selected items that can't be selected keep their place in tree order.
    forEachDescendant(projectedChildrenLookupSelector(state), null, (itemId) => {
      if (selectedSet.has(itemId) || selectors.canItemBeSelected(state, itemId)) {
        itemIds.push(itemId);
      }
    });
    // The walk has every selected item the filter shows, so only the hidden ones are left.
    for (const itemId of normalizeSelectedItems(state.selectedItems)) {
      if (selectors.hasItem(state, itemId) && selectors.isItemFilteredOut(state, itemId)) {
        itemIds.push(itemId);
      }
    }
    this.setSelectedItems(itemIds, reason, event);
  };

  private isItemRendered(itemId: TreeItemId): boolean {
    return selectors.flatListIndex(this.store.state, itemId) !== -1;
  }

  /** The anchor, or `null` when there's none or its row isn't shown, such as under a collapsed parent. */
  private resolveAnchor(): TreeItemId | null {
    return this.anchor != null && this.isItemRendered(this.anchor) ? this.anchor : null;
  }

  /**
   * Where a range starts when nothing was pressed or selected before it, such as with a
   * selection from `defaultSelectedItems`: the first selected row, or the first row.
   */
  private getDefaultAnchor(): TreeItemId | null {
    const state = this.store.state;
    return selectors.firstSelectedRow(state) ?? getFirstNavigableItem(state);
  }

  private applyAnchor(anchor: SelectionAnchor) {
    this.anchor = anchor.itemId;
    this.anchorFocus = anchor.focus;
  }

  /**
   * Replaces the selection with `itemIds`. Selected items that users can't deselect stay
   * selected: the ones that can't be selected anymore, such as disabled ones, and the ones
   * the filter hides. Ids the tree doesn't know are dropped.
   */
  private replaceWith(itemIds: TreeItemId[]): TreeItemId[] {
    const state = this.store.state;
    const kept = normalizeSelectedItems(state.selectedItems).filter(
      (id) =>
        selectors.hasItem(state, id) &&
        (!selectors.canItemBeSelected(state, id) || selectors.isItemFilteredOut(state, id)),
    );
    if (kept.length === 0) {
      return itemIds;
    }
    const replacement = new Set(itemIds);
    return [...itemIds, ...kept.filter((id) => !replacement.has(id))];
  }

  /** The rows between two rows that can be selected, in tree order. */
  private selectableRowsBetween(from: TreeItemId, to: TreeItemId): TreeItemId[] {
    const state = this.store.state;
    const flatList = selectors.flatList(state);
    const indexA = selectors.flatListIndex(state, from);
    const indexB = selectors.flatListIndex(state, to);
    const rows: TreeItemId[] = [];
    if (indexA === -1 || indexB === -1) {
      return rows;
    }
    for (let index = Math.min(indexA, indexB); index <= Math.max(indexA, indexB); index += 1) {
      if (selectors.canItemBeSelected(state, flatList[index])) {
        rows.push(flatList[index]);
      }
    }
    return rows;
  }

  /** Makes the range from an anchor to an item the selection. */
  private replaceWithRange(anchor: TreeItemId, itemId: TreeItemId): TreeItemId[] {
    return this.replaceWith(this.selectableRowsBetween(anchor, itemId));
  }

  /** Adds the rows between two rows to the selection. */
  private addRange(from: TreeItemId, to: TreeItemId): TreeItemId[] {
    return [
      ...new Set([
        ...normalizeSelectedItems(this.store.state.selectedItems),
        ...this.selectableRowsBetween(from, to),
      ]),
    ];
  }

  public actions = {
    // A copy, so the caller can't change the tree's own set.
    getSelectedItemIds: () => new Set(selectors.selectedItemsSet(this.store.state)),
    isItemSelected: (itemId: TreeItemId) => selectors.isItemSelected(this.store.state, itemId),
    // Toggle this one item: in multiple mode the action must leave the rest of
    // the selection alone. Single mode has nothing to keep — selecting one item
    // there does replace the selection.
    setItemSelection: (itemId: TreeItemId, selected: boolean) =>
      this.setItemSelected(itemId, selected, true, REASONS.imperativeAction),
  };

  /** Whether a checkbox press spreads through the hierarchy. It never does with single selection. */
  public canPropagate(): boolean {
    const { descendants, parents } = selectors.checkboxSelectionPropagation(this.store.state);
    return Boolean(descendants || parents);
  }

  /**
   * Re-establish checkbox propagation around the parents whose children an items
   * change changed. The rest of the selection may come from presses that don't
   * propagate, so it stays as is.
   */
  public reconcileSelectionAfterItemsMutation = (
    changedParentKeys: ReadonlySet<TreeItemLookupKey>,
  ): void => {
    const { state } = this.store;
    const selectedSet = selectors.selectedItemsSet(state);
    // Propagation only ever adds items next to existing ones.
    if (!this.canPropagate() || selectedSet.size === 0) {
      return;
    }

    // A removed parent has no meta anymore.
    const changedParentIds: TreeItemId[] = [];
    for (const key of changedParentKeys) {
      const meta = state.itemMetaLookup[key];
      if (meta != null) {
        changedParentIds.push(meta.id);
      }
    }
    if (changedParentIds.length === 0) {
      return;
    }

    const { descendants, parents } = selectors.checkboxSelectionPropagation(state);
    const added = new Set<TreeItemId>();
    const selection: SelectionDraft = {
      has: (itemId) => selectedSet.has(itemId) || added.has(itemId),
      add: (itemId) => added.add(itemId),
    };
    // The changed parents now selected with their whole subtree.
    const walkedIds = new Set<TreeItemId>();
    if (descendants) {
      // Shallowest first, so a walk covers the changed parents below it.
      changedParentIds.sort(
        (a, b) => selectors.itemLevel(state, a) - selectors.itemLevel(state, b),
      );
      for (const parentId of changedParentIds) {
        if (isInSubtreeOf(state, parentId, walkedIds)) {
          continue;
        }
        // A parent that can't be selected follows its closest selectable ancestor.
        let ownerId: TreeItemId | null = parentId;
        while (ownerId != null && !selectors.canItemBeSelected(state, ownerId)) {
          ownerId = selectors.itemParentId(state, ownerId);
        }
        if (ownerId != null && selection.has(ownerId)) {
          walkedIds.add(parentId);
          selectDescendants(state, selection, parentId);
        }
      }
    }

    if (parents) {
      // A changed parent can become fully selected, and so can its ancestors.
      selectFullySelectedParents(
        state,
        selection,
        new Set([...changedParentIds, ...collectAncestorIds(state, changedParentIds)]),
        walkedIds,
      );
    }

    if (added.size === 0) {
      return;
    }
    this.setSelectedItems(
      [...normalizeSelectedItems(state.selectedItems), ...added],
      REASONS.none,
      undefined,
      { automatic: true },
    );
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
        newSelected = state.multiple ? [fallback] : fallback;
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
    newModel: TreeItemId[] | TreeItemId | null,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
    options: {
      /**
       * The range anchor the change sets once committed: at once while
       * uncontrolled, or once a controlled parent accepts the model.
       */
      anchor?: SelectionAnchor | undefined;
      /** Whether the tree makes the change on its own, so it isn't announced and can't be canceled. */
      automatic?: boolean | undefined;
    } = {},
  ): boolean {
    const { anchor, automatic = false } = options;
    const oldModel = this.store.state.selectedItems;

    // No-op guard: don't fire onSelectedItemsChange (or churn state) when the
    // resulting model is identical to the current one — e.g. re-clicking the
    // already-selected item in single-select mode. The anchor still moves, as the
    // gesture that made it would have.
    if (selectionModelsEqual(oldModel, newModel)) {
      if (anchor !== undefined) {
        this.applyAnchor(anchor);
      }
      return false;
    }

    // Ids the tree no longer knows are retained for when they return, but they
    // are not a selection the user still has.
    if (
      this.store.state.disableEmptySelection &&
      !normalizeSelectedItems(newModel).some((id) =>
        selectors.isItemSelectionSupported(this.store.state, id),
      )
    ) {
      return false;
    }

    if (this.store.state.selectedItemsProp !== undefined && anchor !== undefined) {
      this.pendingControlledAnchor = { anchor, model: newModel };
    }

    const details = createChangeEventDetails(reason, event);
    // Recorded before the callback, which a controlled parent can apply synchronously.
    const { status } = this.store;
    status?.handleSelectionProposal(
      automatic || reason === REASONS.imperativeAction ? undefined : newModel,
    );
    // Reports the model the tree stores, so controlled and uncontrolled trees agree.
    this.store.context.onSelectedItemsChange?.(copySelectionModel(newModel), details);
    if (details.isCanceled && !automatic) {
      if (this.pendingControlledAnchor?.model === newModel) {
        this.pendingControlledAnchor = null;
      }
      status?.discardUserSelection(newModel);
      return false;
    }
    // Only persist internally when uncontrolled; when `selectedItems` is
    // controlled the prop drives the state (synced by the store observer).
    if (this.store.state.selectedItemsProp === undefined) {
      this.store.set('selectedItems', newModel);
    }

    // Fire onItemSelectionToggle for each item whose selection state changed
    if (this.store.state.hasItemSelectionToggleHandler) {
      const normalizedOld = new Set(normalizeSelectedItems(oldModel));
      const normalizedNew = new Set(normalizeSelectedItems(newModel));
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

    // A canceled or disallowed change leaves the anchor where it was.
    if (anchor !== undefined && this.store.state.selectedItemsProp === undefined) {
      this.applyAnchor(anchor);
    }
    return true;
  }

  /**
   * Spreads the toggle of an item's checkbox through the hierarchy of `newModel`, which
   * selects or deselects the item as `selected` says.
   */
  private propagateSelection(
    newModel: TreeItemId[],
    toggledItemId: TreeItemId,
    selected: boolean,
  ): TreeItemId[] {
    if (!this.canPropagate()) {
      return newModel;
    }
    const { state } = this.store;
    const { descendants, parents } = selectors.checkboxSelectionPropagation(state);
    const newModelSet = new Set(newModel);
    let changed = false;

    if (selected) {
      // Items selected with their whole subtree, which the parent check skips.
      const fullySelectedIds = new Set<TreeItemId>();
      if (descendants) {
        changed = selectDescendants(state, newModelSet, toggledItemId);
        fullySelectedIds.add(toggledItemId);
      }
      if (parents) {
        changed =
          selectFullySelectedParents(
            state,
            newModelSet,
            collectAncestorIds(state, [toggledItemId]),
            fullySelectedIds,
          ) || changed;
      }
    } else {
      if (parents) {
        // Deselecting an item deselects its selectable ancestors.
        for (const ancestorId of collectAncestorIds(state, [toggledItemId])) {
          if (selectors.canItemBeSelected(state, ancestorId) && newModelSet.delete(ancestorId)) {
            changed = true;
          }
        }
      }
      if (descendants) {
        // Selected items that can't be selected, such as disabled ones, stay selected.
        forEachDescendant(state.itemOrderedChildrenIdsLookup, toggledItemId, (itemId) => {
          if (selectors.canItemBeSelected(state, itemId) && newModelSet.delete(itemId)) {
            changed = true;
          }
        });
      }
    }

    return changed ? Array.from(newModelSet) : newModel;
  }
}

/** The selection a propagation adds to. */
interface SelectionDraft {
  has(itemId: TreeItemId): boolean;
  add(itemId: TreeItemId): void;
}

/** Selects every descendant of `itemId` that can be selected. Returns whether it selected any. */
function selectDescendants(
  state: TreeState,
  selection: SelectionDraft,
  itemId: TreeItemId,
): boolean {
  let changed = false;
  // A non-selectable folder is skipped but still walked, so a selectable subtree under it is not.
  forEachDescendant(state.itemOrderedChildrenIdsLookup, itemId, (descendantId) => {
    if (!selection.has(descendantId) && selectors.canItemBeSelected(state, descendantId)) {
      selection.add(descendantId);
      changed = true;
    }
  });
  return changed;
}

/**
 * Selects each of `parentIds` whose subtree is otherwise fully selected, deepest
 * first, so a parent sees the ones below it that this selected. Items that can't
 * be selected don't count, but a parent still needs a selected descendant.
 * `fullySelectedIds` lists items known to be selected with their whole subtree.
 * Returns whether it selected any.
 */
function selectFullySelectedParents(
  state: TreeState,
  selection: SelectionDraft,
  parentIds: Iterable<TreeItemId>,
  fullySelectedIds: Set<TreeItemId>,
): boolean {
  const childrenLookup = state.itemOrderedChildrenIdsLookup;
  // A non-selectable item is exempt itself, but its descendants still count, so a
  // selectable subtree under a non-selectable folder isn't treated as complete.
  const isSelectedOrExempt = (itemId: TreeItemId) =>
    fullySelectedIds.has(itemId) ||
    selection.has(itemId) ||
    !selectors.canItemBeSelected(state, itemId);
  // Only `true` is cached: the selection only grows, so a full subtree stays full.
  const isFullySelected = (itemId: TreeItemId): boolean => {
    if (fullySelectedIds.has(itemId)) {
      return true;
    }
    if (!isSelectedOrExempt(itemId)) {
      return false;
    }
    const result = forEachDescendant(
      childrenLookup,
      itemId,
      isSelectedOrExempt,
      (descendantId) => !fullySelectedIds.has(descendantId),
    );
    if (result) {
      fullySelectedIds.add(itemId);
    }
    return result;
  };
  const hasSelectedDescendant = (itemId: TreeItemId) =>
    !forEachDescendant(childrenLookup, itemId, (descendantId) => !selection.has(descendantId));

  let changed = false;
  // The ancestors of a selectable parent left unselected can't be fully selected.
  const blockedIds = new Set<TreeItemId>();
  const byDepth = [...parentIds].sort(
    (a, b) => selectors.itemLevel(state, b) - selectors.itemLevel(state, a),
  );
  for (const parentId of byDepth) {
    if (
      blockedIds.has(parentId) ||
      selection.has(parentId) ||
      !selectors.canItemBeSelected(state, parentId)
    ) {
      continue;
    }
    const children = selectors.itemOrderedChildrenIds(state, parentId);
    if (children.length > 0 && children.every(isFullySelected) && hasSelectedDescendant(parentId)) {
      selection.add(parentId);
      changed = true;
    } else {
      for (
        let id = selectors.itemParentId(state, parentId);
        id != null && !blockedIds.has(id);
        id = selectors.itemParentId(state, id)
      ) {
        blockedIds.add(id);
      }
    }
  }
  return changed;
}

/**
 * Structural equality for selection models: scalar/null single-selection values,
 * and ordered arrays. Two arrays are equal only when they hold the same ids in the
 * same order (conservative — a reorder is reported as a change).
 */
function selectionModelsEqual(a: SelectionModel, b: SelectionModel): boolean {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return areArraysEqual(a, b);
  }
  return false;
}

export type SelectionModel = readonly TreeItemId[] | TreeItemId | null;

/** Copies an array model, so a change handler can't mutate the tree's own array. */
function copySelectionModel(model: SelectionModel): TreeItemId[] | TreeItemId | null {
  // Only an array is an object: the other models are ids or `null`.
  return model !== null && typeof model === 'object' ? [...model] : model;
}

/**
 * The model without the ids `keep` rejects, keeping its shape: an array stays an
 * array, and a rejected single id becomes `null`. Returns the same model when it
 * keeps every id.
 */
function filterSelectionModel(
  model: SelectionModel,
  keep: (itemId: TreeItemId) => boolean,
): SelectionModel {
  if (model == null) {
    return model;
  }
  if (Array.isArray(model)) {
    const kept = model.filter(keep);
    return kept.length === model.length ? model : kept;
  }
  return keep(model as TreeItemId) ? model : null;
}
