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
import { collectAncestorIds } from '../utils/pruneDescendantIds';

/** Which modifiers a press was made with. */
export interface PressModifiers {
  shiftKey?: boolean | undefined;
  /** Ctrl, or Cmd on macOS. */
  ctrlKey?: boolean | undefined;
  /** Touch has no modifier keys, so opt-in multiple selection toggles on tap. */
  touch?: boolean | undefined;
  /** Whether the press is on the item's checkbox, which toggles it in every mode. */
  toggle?: boolean | undefined;
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
   * Checks or unchecks an item's checkbox, or toggles it when `checked` is
   * `undefined`, propagating the change through the hierarchy. With multiple
   * selection, the rest of the selection stays as it is.
   */
  public setItemChecked = (
    itemId: TreeItemId,
    checked: boolean | undefined,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) => {
    const { state } = this.store;
    let newSelected: TreeItemId[] | TreeItemId | null;

    if (state.multiple !== false) {
      const isSelectedBefore = selectors.isItemSelected(state, itemId);
      const select = checked ?? selectors.checkboxSelectionStatus(state, itemId) !== 'checked';
      if (!select) {
        newSelected = this.getSelectedIds().filter((id) => id !== itemId);
      } else if (isSelectedBefore) {
        // A selected item that isn't fully checked still propagates to its subtree now.
        newSelected = this.getSelectedIds().slice();
      } else {
        newSelected = [...this.getSelectedIds(), itemId];
      }
    } else {
      const select = checked ?? !selectors.isItemSelected(state, itemId);
      newSelected = select ? itemId : null;
    }

    this.setSelectedItems(newSelected, reason, event, {
      propagateFrom: [itemId],
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
   */
  public press = (
    itemId: TreeItemId,
    modifiers: PressModifiers,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) => {
    const { shiftKey = false, ctrlKey = false, touch = false, toggle = false } = modifiers;
    const { multiple } = this.store.state;
    const replaceOnPress = multiple === 'opt-in' && !touch;

    if (shiftKey && multiple) {
      const anchor = this.resolveAnchor() ?? this.getDefaultAnchor();
      if (anchor == null) {
        return;
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
      return;
    }

    if (toggle || (multiple && (!replaceOnPress || ctrlKey))) {
      this.setItemChecked(itemId, undefined, reason, event);
      return;
    }

    if (!selectors.canItemBeSelected(this.store.state, itemId)) {
      return;
    }
    this.setSelectedItems(multiple ? this.replaceWith([itemId]) : itemId, reason, event, {
      anchor: { itemId, focus: itemId },
    });
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
      this.store.set('selectedItems', this.getSelectedIds()[0] ?? null);
    }
  };

  public handleControlledSelectedItemsChange(model: SelectionModel): void {
    const pending = this.pendingControlledAnchor;
    this.pendingControlledAnchor = null;
    if (pending != null && selectionModelsHaveSameItems(pending.model, model)) {
      this.applyAnchor(pending.anchor);
    } else {
      // The parent replaced the controlled model independently. Any anchor from
      // the previous model would make the next Shift interaction start from an
      // item that no longer anchors the selection.
      this.applyAnchor({ itemId: null, focus: null });
    }
  }

  /** The ids of a selection model, the current one by default, as an array. */
  private getSelectedIds(
    model: SelectionModel = this.store.state.selectedItems,
  ): readonly TreeItemId[] {
    return normalizeSelectedItems(model);
  }

  /**
   * Selects every item, in tree order, including the ones under collapsed parents. Items
   * that can't be selected keep their state, so the selected disabled ones stay selected.
   * While filtering, adds the items the filter shows to the selection instead.
   */
  public selectAll = (reason: TreeRootSelectionChangeEventReason, event?: Event) => {
    const state = this.store.state;
    if (state.disabled || !state.multiple) {
      return;
    }
    if (!selectors.isViewTransformed(state)) {
      const selected = new Set(this.getSelectedIds());
      const allIds: TreeItemId[] = [];
      forEachDescendant(state.itemOrderedChildrenIdsLookup, null, (itemId) => {
        if (selected.has(itemId) || selectors.canItemBeSelected(state, itemId)) {
          allIds.push(itemId);
        }
      });
      this.setSelectedItems(allIds, reason, event);
      return;
    }
    // Select all replaces the selection, so it drops the ids the tree doesn't know.
    const knownIds = this.getSelectedIds().filter((id) => selectors.itemMeta(state, id) != null);
    const shownIds: TreeItemId[] = [];
    forEachDescendant(projectedChildrenLookupSelector(state), null, (itemId) => {
      if (selectors.canItemBeSelected(state, itemId)) {
        shownIds.push(itemId);
      }
    });
    this.setSelectedItems([...new Set([...knownIds, ...shownIds])], reason, event);
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
    let anchor: TreeItemId | null = null;
    let anchorIndex = Infinity;
    for (const itemId of this.getSelectedIds()) {
      const index = selectors.flatListIndex(state, itemId);
      if (index !== -1 && index < anchorIndex) {
        anchor = itemId;
        anchorIndex = index;
      }
    }
    return anchor ?? getFirstNavigableItem(state);
  }

  private applyAnchor(anchor: SelectionAnchor) {
    this.anchor = anchor.itemId;
    this.anchorFocus = anchor.focus;
  }

  /**
   * Replaces the selection with `itemIds`. Selected items that can't be selected anymore,
   * such as disabled ones, stay selected, since users can't deselect them. Ids the tree
   * doesn't know are dropped.
   */
  private replaceWith(itemIds: TreeItemId[]): TreeItemId[] {
    const state = this.store.state;
    const replacement = new Set(itemIds);
    const kept = this.getSelectedIds().filter(
      (id) =>
        !replacement.has(id) &&
        selectors.itemMeta(state, id) != null &&
        !selectors.canItemBeSelected(state, id),
    );
    return kept.length === 0 ? itemIds : [...itemIds, ...kept];
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
    return [...new Set([...this.getSelectedIds(), ...this.selectableRowsBetween(from, to)])];
  }

  public actions = {
    getSelectedItemIds: () => new Set(this.getSelectedIds()),
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
      !state.multiple ||
      (!state.checkboxSelectionPropagation.descendants &&
        !state.checkboxSelectionPropagation.parents)
    ) {
      return;
    }

    const selectedItems = this.getSelectedIds();
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
       * The items whose checkbox toggled, to propagate the change through the
       * hierarchy from. Range selection does not select hidden descendants.
       */
      propagateFrom?: TreeItemId[] | undefined;
      /**
       * The range anchor the change sets once committed: at once while
       * uncontrolled, or once a controlled parent accepts the model.
       */
      anchor?: SelectionAnchor | undefined;
      /** Whether the tree makes the change on its own, so it isn't announced and can't be canceled. */
      automatic?: boolean | undefined;
    } = {},
  ): boolean {
    const { propagateFrom, anchor, automatic = false } = options;
    const oldModel = this.store.state.selectedItems;
    let cleanModel: TreeItemId[] | TreeItemId | null;
    if (propagateFrom !== undefined && this.store.state.multiple) {
      cleanModel = this.propagateSelection(
        newModel as TreeItemId[],
        this.getSelectedIds(),
        selectors.checkboxSelectionPropagation(this.store.state),
        propagateFrom,
      );
    } else {
      cleanModel = newModel;
    }

    // No-op guard: don't fire onSelectedItemsChange (or churn state) when the
    // resulting model is identical to the current one — e.g. re-clicking the
    // already-selected item in single-select mode. The anchor still moves, as the
    // gesture that made it would have.
    if (selectionModelsEqual(oldModel, cleanModel)) {
      if (anchor !== undefined) {
        this.applyAnchor(anchor);
      }
      return false;
    }

    // Ids the tree no longer knows are retained for when they return, but they
    // are not a selection the user still has.
    if (
      this.store.state.disableEmptySelection &&
      !normalizeSelectedItems(cleanModel).some(
        (id) => selectors.itemMeta(this.store.state, id)?.selectable,
      )
    ) {
      return false;
    }

    if (this.store.state.selectedItemsProp !== undefined && anchor !== undefined) {
      this.pendingControlledAnchor = { anchor, model: cleanModel };
    }

    const details = createChangeEventDetails(reason, event);
    // Recorded before the callback, which a controlled parent can apply synchronously.
    const { status } = this.store;
    status?.handleSelectionProposal(
      automatic || reason === REASONS.imperativeAction ? undefined : cleanModel,
    );
    // Reports the model the tree stores, so controlled and uncontrolled trees agree.
    this.store.context.onSelectedItemsChange?.(copySelectionModel(cleanModel), details);
    if (details.isCanceled && !automatic) {
      if (this.pendingControlledAnchor?.model === cleanModel) {
        this.pendingControlledAnchor = null;
      }
      status?.discardUserSelection(cleanModel);
      return false;
    }
    // Only persist internally when uncontrolled; when `selectedItems` is
    // controlled the prop drives the state (synced by the store observer).
    if (this.store.state.selectedItemsProp === undefined) {
      this.store.set('selectedItems', cleanModel);
    }

    // Fire onItemSelectionToggle for each item whose selection state changed
    if (this.store.state.hasItemSelectionToggleHandler) {
      const normalizedOld = new Set(this.getSelectedIds(oldModel));
      const normalizedNew = new Set(this.getSelectedIds(cleanModel));
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
