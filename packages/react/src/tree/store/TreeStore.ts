import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import { TimeoutManager } from '@base-ui/utils/TimeoutManager';
import type {
  TreeState,
  TreeStoreContext,
  TreeItemId,
  TreeDefaultItemModel,
  TreeItemMeta,
  TreeRootActions,
  TreeRootExpansionChangeEventReason,
  TreeRootExpansionChangeEventDetails,
  TreeRootSelectionChangeEventReason,
  TreeRootSelectionChangeEventDetails,
  TreeSelectedItemsType,
  TreeSelectionMode,
  TreeItemFocusEventReason,
  TreeItemExpansionToggleEventDetails,
  TreeItemExpansionToggleValue,
  TreeItemSelectionToggleEventDetails,
  TreeItemSelectionToggleValue,
  TreeItemFocusEventDetails,
} from './types';
import { selectors } from './selectors';
import {
  createChangeEventDetails,
  createGenericEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import {
  getFirstNavigableItem,
  getLastNavigableItem,
  getNextNavigableItem,
  getPreviousNavigableItem,
  findOrderInTremauxTree,
  getNonDisabledItemsInRange,
  getAllNavigableItems,
} from './treeNavigation';

const TYPEAHEAD_TIMEOUT = 500;

export interface TreeStoreParameters<
  Mode extends TreeSelectionMode | undefined = undefined,
  TItem = TreeDefaultItemModel,
> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * The items to render.
   * Each item must have a unique identifier.
   */
  items: readonly TItem[];
  /**
   * The expanded items.
   *
   * To render an uncontrolled tree, use the `defaultExpandedItems` prop instead.
   */
  expandedItems?: readonly TreeItemId[] | undefined;
  /**
   * The items that are initially expanded.
   *
   * To render a controlled tree, use the `expandedItems` prop instead.
   * @default []
   */
  defaultExpandedItems?: readonly TreeItemId[] | undefined;
  /**
   * Whether clicking anywhere on an item row toggles expansion.
   * When `false`, only `Tree.ItemExpansionTrigger` can expand items.
   * @default false
   */
  expandOnClick?: boolean | undefined;
  /**
   * Event handler called when items are expanded or collapsed.
   */
  onExpandedItemsChange?:
    | ((expandedItems: TreeItemId[], eventDetails: TreeRootExpansionChangeEventDetails) => void)
    | undefined;
  /**
   * Event handler called when an item is expanded or collapsed.
   */
  onItemExpansionToggle?:
    | ((value: TreeItemExpansionToggleValue, details: TreeItemExpansionToggleEventDetails) => void)
    | undefined;
  /**
   * The selected items.
   *
   * To render an uncontrolled tree, use the `defaultSelectedItems` prop instead.
   */
  selectedItems?:
    | TreeSelectedItemsType<Mode>
    | (Mode extends 'multiple' ? never : null)
    | undefined;
  /**
   * The items that are initially selected.
   *
   * To render a controlled tree, use the `selectedItems` prop instead.
   * @default []
   */
  defaultSelectedItems?:
    | TreeSelectedItemsType<Mode>
    | (Mode extends 'multiple' ? never : null)
    | undefined;
  /**
   * Event handler called when the selected items change.
   */
  onSelectedItemsChange?:
    | ((
        selectedItems: TreeSelectedItemsType<Mode> | (Mode extends 'multiple' ? never : null),
        eventDetails: TreeRootSelectionChangeEventDetails,
      ) => void)
    | undefined;
  /**
   * Event handler called when an item is selected or deselected.
   */
  onItemSelectionToggle?:
    | ((value: TreeItemSelectionToggleValue, details: TreeItemSelectionToggleEventDetails) => void)
    | undefined;
  /**
   * The selection mode of the tree.
   * Use `'single'` for single selection, `'multiple'` for multiple selection.
   */
  selectionMode?: Mode | undefined;
  /**
   * Whether the tree disallows having no selected item.
   * When `true`, at least one item must remain selected at all times.
   * @default false
   */
  disallowEmptySelection?: boolean | undefined;
  /**
   * Controls how selecting a `Tree.CheckboxItem` propagates through the tree hierarchy.
   * This does not affect `Tree.Item` interactions (which use replace-selection semantics).
   *
   * When `checkboxSelectionPropagation.descendants` is set to `true`:
   * - Selecting a parent selects all its descendants automatically.
   * - Deselecting a parent deselects all its descendants automatically.
   *
   * When `checkboxSelectionPropagation.parents` is set to `true`:
   * - Selecting all descendants of a parent selects the parent automatically.
   * - Deselecting a descendant of a selected parent deselects the parent automatically.
   *
   * @default { parents: true, descendants: true }
   */
  checkboxSelectionPropagation?:
    | { parents?: boolean | undefined; descendants?: boolean | undefined }
    | undefined;
  /**
   * Whether disabled items should be focusable.
   * @default false
   */
  itemFocusableWhenDisabled?: boolean | undefined;
  /**
   * Event handler called when an item is focused.
   */
  onItemFocus?: ((itemId: TreeItemId, details: TreeItemFocusEventDetails) => void) | undefined;
  /**
   * Used to determine the id of a given item.
   * @default (item) => item.id
   */
  itemToId?: ((item: TItem) => TreeItemId) | undefined;
  /**
   * Used to determine the string label of a given item.
   * @default (item) => item.label
   */
  itemToStringLabel?: ((item: TItem) => string) | undefined;
  /**
   * Used to determine the children of a given item.
   * @default (item) => item.children
   */
  itemToChildren?: ((item: TItem) => TItem[] | undefined) | undefined;
  /**
   * Used to determine if a given item should be disabled.
   * @default (item) => !!item.disabled
   */
  isItemDisabled?: ((item: TItem) => boolean) | undefined;
  /**
   * Used to determine if a given item should have selection disabled.
   * @default (item) => !!item.disabled
   */
  isItemSelectionDisabled?: ((item: TItem) => boolean) | undefined;
  /**
   * The direction of the tree layout.
   */
  direction: 'ltr' | 'rtl';
  /**
   * A ref to the root element of the tree.
   */
  rootRef: React.RefObject<HTMLElement | null>;
  /**
   * The lazy loading plugin instance, used to load items on demand when expanding a parent item.
   */
  lazyLoading?: TreeLazyLoading<TItem> | undefined;
  /**
   * Whether the items are being externally virtualized.
   * @default false
   */
  virtualized?: boolean | undefined;
}

function getLookupFromArray(array: string[]): Record<string, true> {
  const lookup: Record<string, true> = {};
  for (const item of array) {
    lookup[item] = true;
  }
  return lookup;
}

function normalizeSelectedItems(raw: TreeItemId | null | readonly TreeItemId[]): TreeItemId[] {
  if (Array.isArray(raw)) {
    return raw as TreeItemId[];
  }
  if (raw != null) {
    return [raw as TreeItemId];
  }
  return [];
}

function isPrintableKey(key: string): boolean {
  return key.length === 1 && !!key.match(/\S/);
}

export interface TreeLazyLoading<TItem = TreeDefaultItemModel> {
  attach(store: TreeStore<any, TItem>): void;
  onBeforeExpand(
    itemId: TreeItemId,
    reason: TreeRootExpansionChangeEventReason,
    event?: Event,
  ): Promise<void>;
  updateItemChildren(itemId: TreeItemId | null): Promise<void>;
  destroy(): void;
}

export class TreeStore<
  Mode extends TreeSelectionMode | undefined = undefined,
  TItem = TreeDefaultItemModel,
> extends ReactStore<TreeState<any>, TreeStoreContext, typeof selectors> {
  // Focus reason tracking — default to 'keyboard' since tab focus is keyboard-like
  private lastFocusReason: TreeItemFocusEventReason = REASONS.keyboard;

  // Selection tracking
  private lastSelectedItem: TreeItemId | null = null;

  private lastSelectedRange: Record<string, boolean> = {};

  // Typeahead
  private typeaheadQuery = '';

  private timeoutManager = new TimeoutManager();

  private labelMap: Record<string, string> = {};

  public lazyLoading: TreeLazyLoading<TItem> | undefined;

  constructor(parameters: TreeStoreParameters<Mode, TItem>) {
    const selectionMode: TreeSelectionMode = parameters.selectionMode ?? 'single';
    const itemToId = parameters.itemToId ?? ((item: any) => item.id);
    const itemToStringLabel = parameters.itemToStringLabel ?? ((item: any) => item.label);
    const itemToChildren = parameters.itemToChildren ?? ((item: any) => item.children);
    const isItemDisabled = parameters.isItemDisabled ?? ((item: any) => !!item.disabled);
    const isItemSelectionDisabled =
      parameters.isItemSelectionDisabled ?? ((item: any) => !!item.disabled);
    super(
      {
        disabled: parameters.disabled ?? false,
        items: parameters.items,
        itemMetaPatches: {},
        lazyItems: { children: EMPTY_OBJECT, expandable: EMPTY_OBJECT },
        expandedItems: parameters.expandedItems ?? parameters.defaultExpandedItems ?? EMPTY_ARRAY,
        expandOnClick: parameters.expandOnClick ?? false,
        selectedItems:
          parameters.selectedItems ??
          parameters.defaultSelectedItems ??
          (selectionMode === 'multiple' ? EMPTY_ARRAY : null),
        selectionMode,
        disallowEmptySelection: parameters.disallowEmptySelection ?? false,
        checkboxSelectionPropagation: parameters.checkboxSelectionPropagation ?? {
          parents: true,
          descendants: true,
        },
        focusedItemId: null,
        itemFocusableWhenDisabled: parameters.itemFocusableWhenDisabled ?? false,
        lazyLoadedItems: undefined,
        itemToId,
        itemToStringLabel,
        itemToChildren,
        isItemDisabled,
        isItemSelectionDisabled,
        direction: parameters.direction,
        virtualized: parameters.virtualized ?? false,
        enableGroupTransition: false,
        animatingGroups: EMPTY_OBJECT,
      },
      {
        onExpandedItemsChange: parameters.onExpandedItemsChange ?? (() => {}),
        onSelectedItemsChange:
          (parameters.onSelectedItemsChange as TreeStoreContext['onSelectedItemsChange']) ??
          (() => {}),
        onItemExpansionToggle: parameters.onItemExpansionToggle ?? (() => {}),
        onItemSelectionToggle: parameters.onItemSelectionToggle ?? (() => {}),
        onItemFocus: parameters.onItemFocus ?? (() => {}),
        rootRef: parameters.rootRef,
      },
      selectors,
    );

    // Wire lazy loading plugin (attach is called in mountEffect)
    this.lazyLoading = parameters.lazyLoading;

    // Build initial label map
    this.labelMap = this.createLabelMap(selectors.itemMetaLookup(this.state));

    // Observe items changes to keep focus valid and update label map
    let previousState = this.state;
    let previousMetaLookup = selectors.itemMetaLookup(this.state);
    this.subscribe((newState) => {
      const newMetaLookup = selectors.itemMetaLookup(newState);
      if (newMetaLookup === previousMetaLookup) {
        previousState = newState;
        return;
      }

      this.labelMap = this.createLabelMap(newMetaLookup);

      // If focused item was removed, focus the closest neighbor.
      // The focus call is deferred with requestAnimationFrame because this
      // subscription fires synchronously on state change, before React has
      // committed the new DOM. Calling .focus() immediately could target an
      // element that hasn't been inserted yet, silently losing focus.
      const focusedId = newState.focusedItemId;
      if (focusedId != null && !newMetaLookup[focusedId]) {
        // Use previousState for navigation since the focused item still exists there.
        // Then verify the candidate still exists in the new state.
        // Walk forward then backward through the previous state to find the
        // nearest surviving neighbor. Multiple siblings may have been removed
        // in the same batch, so we keep walking until we find one that still
        // exists in the new state (or exhaust both directions).
        let candidate: string | null = null;

        let probe = getNextNavigableItem(previousState, focusedId);
        while (probe != null && !newMetaLookup[probe]) {
          probe = getNextNavigableItem(previousState, probe);
        }
        candidate = probe;

        if (candidate == null) {
          probe = getPreviousNavigableItem(previousState, focusedId);
          while (probe != null && !newMetaLookup[probe]) {
            probe = getPreviousNavigableItem(previousState, probe);
          }
          candidate = probe;
        }

        const itemToFocusId = candidate ?? getFirstNavigableItem(newState);

        if (itemToFocusId == null) {
          this.set('focusedItemId', null);
        } else {
          requestAnimationFrame(() => {
            this.focusItem(itemToFocusId);
          });
        }
      }

      previousState = newState;
      previousMetaLookup = newMetaLookup;
    });
  }

  // ===========================================================================
  // Expansion
  // ===========================================================================

  public setItemExpansion(
    itemId: TreeItemId,
    shouldBeExpanded: boolean | undefined,
    reason: TreeRootExpansionChangeEventReason,
    event?: Event,
  ) {
    const isExpandedBefore = selectors.isItemExpanded(this.state, itemId);
    const cleanShouldBeExpanded = shouldBeExpanded ?? !isExpandedBefore;
    if (isExpandedBefore === cleanShouldBeExpanded) {
      return;
    }

    // If lazy loading is active and we're expanding an item with no loaded children,
    // defer expansion to the plugin (it will call applyItemExpansion on success).
    if (
      this.lazyLoading &&
      cleanShouldBeExpanded &&
      selectors.isItemExpandable(this.state, itemId) &&
      selectors.itemOrderedChildrenIds(this.state, itemId).length === 0
    ) {
      this.lazyLoading.onBeforeExpand(itemId, reason, event);
      return;
    }

    this.applyItemExpansion(itemId, cleanShouldBeExpanded, reason, event);
  }

  public applyItemExpansion(
    itemId: TreeItemId,
    shouldBeExpanded: boolean,
    reason: TreeRootExpansionChangeEventReason,
    event?: Event,
  ) {
    const oldExpanded = this.state.expandedItems;
    let newExpanded: TreeItemId[];
    if (shouldBeExpanded) {
      newExpanded = [itemId, ...oldExpanded];
    } else {
      newExpanded = oldExpanded.filter((id) => id !== itemId);
    }

    const details = createChangeEventDetails(reason, event);
    this.context.onExpandedItemsChange(newExpanded, details);
    if (details.isCanceled) {
      return;
    }

    if (this.state.enableGroupTransition) {
      // Collect visible descendants using the appropriate expanded state
      const childIds = this.getVisibleDescendants(
        itemId,
        shouldBeExpanded ? newExpanded : oldExpanded,
      );

      if (childIds.length > 0) {
        this.set('animatingGroups', {
          ...this.state.animatingGroups,
          [itemId]: {
            type: shouldBeExpanded ? 'expanding' : 'collapsing',
            childIds,
          },
        });
      }
    }

    this.set('expandedItems', newExpanded);
    this.context.onItemExpansionToggle(
      { itemId, isExpanded: shouldBeExpanded },
      createGenericEventDetails(reason, event),
    );
  }

  /**
   * Collects visible descendants of an item given a specific set of expanded items.
   * Used to determine which items will appear/disappear during expand/collapse.
   */
  private getVisibleDescendants(
    itemId: TreeItemId,
    expandedItems: readonly TreeItemId[],
  ): TreeItemId[] {
    const expandedSet = new Set(expandedItems);
    const childrenLookup = selectors.itemOrderedChildrenIds;
    const result: TreeItemId[] = [];

    const walk = (parentId: TreeItemId) => {
      const children = childrenLookup(this.state, parentId) ?? [];
      for (const childId of children) {
        result.push(childId);
        if (expandedSet.has(childId)) {
          walk(childId);
        }
      }
    };

    walk(itemId);
    return result;
  }

  /**
   * Called when a group transition animation completes.
   * Removes the animating group entry, causing the wrapper to be removed from the DOM.
   */
  public completeGroupTransition(parentId: TreeItemId) {
    const { [parentId]: removedGroup, ...rest } = this.state.animatingGroups;
    this.set('animatingGroups', rest);
  }

  public expandAllSiblings(
    itemId: TreeItemId,
    reason: TreeRootExpansionChangeEventReason,
    event?: Event,
  ) {
    const meta = selectors.itemMeta(this.state, itemId);
    if (meta == null) {
      return;
    }

    const siblings = selectors.itemOrderedChildrenIds(this.state, meta.parentId);
    const diff = siblings.filter(
      (child) =>
        selectors.isItemExpandable(this.state, child) &&
        !selectors.isItemExpanded(this.state, child),
    );

    if (diff.length > 0) {
      const newExpanded = [...this.state.expandedItems, ...diff];
      const details = createChangeEventDetails(reason, event);
      this.context.onExpandedItemsChange(newExpanded, details);
      if (details.isCanceled) {
        return;
      }
      this.set('expandedItems', newExpanded);
      for (const expandedItemId of diff) {
        this.context.onItemExpansionToggle(
          { itemId: expandedItemId, isExpanded: true },
          createGenericEventDetails(reason, event),
        );
      }
    }
  }

  public expandAll(reason: TreeRootExpansionChangeEventReason) {
    const metaLookup = selectors.itemMetaLookup(this.state);
    const expandedSet = new Set(this.state.expandedItems);
    const diff = Object.keys(metaLookup).filter(
      (itemId) => metaLookup[itemId].expandable && !expandedSet.has(itemId),
    );

    if (diff.length === 0) {
      return;
    }

    const newExpanded = [...this.state.expandedItems, ...diff];
    const details = createChangeEventDetails(reason);
    this.context.onExpandedItemsChange(newExpanded, details);
    if (details.isCanceled) {
      return;
    }
    this.set('expandedItems', newExpanded);
    for (const expandedItemId of diff) {
      this.context.onItemExpansionToggle(
        { itemId: expandedItemId, isExpanded: true },
        createGenericEventDetails(reason),
      );
    }
  }

  public collapseAll(reason: TreeRootExpansionChangeEventReason) {
    const oldExpanded = this.state.expandedItems;
    if (oldExpanded.length === 0) {
      return;
    }

    const details = createChangeEventDetails(reason);
    this.context.onExpandedItemsChange([], details);
    if (details.isCanceled) {
      return;
    }
    this.set('expandedItems', []);
    for (const collapsedItemId of oldExpanded) {
      this.context.onItemExpansionToggle(
        { itemId: collapsedItemId, isExpanded: false },
        createGenericEventDetails(reason),
      );
    }
  }

  // ===========================================================================
  // Selection
  // ===========================================================================

  private setSelectedItems(
    newModel: TreeItemId[] | TreeItemId | null,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
    additionalItemsToPropagate?: TreeItemId[],
    shouldPropagate: boolean = true,
  ) {
    const oldModel = this.state.selectedItems;
    const isMulti = this.state.selectionMode === 'multiple';

    let cleanModel: TreeItemId[] | TreeItemId | null;

    if (
      shouldPropagate &&
      isMulti &&
      (this.state.checkboxSelectionPropagation.descendants ||
        this.state.checkboxSelectionPropagation.parents)
    ) {
      cleanModel = this.propagateSelection(
        newModel as TreeItemId[],
        Array.isArray(oldModel) ? oldModel : normalizeSelectedItems(oldModel),
        additionalItemsToPropagate,
      );
    } else {
      cleanModel = newModel;
    }

    if (this.state.disallowEmptySelection) {
      const normalizedClean = normalizeSelectedItems(cleanModel);
      if (normalizedClean.length === 0) {
        return;
      }
    }

    const details = createChangeEventDetails(reason, event);
    this.context.onSelectedItemsChange(cleanModel as TreeItemId | null | TreeItemId[], details);
    if (details.isCanceled) {
      return;
    }
    this.set('selectedItems', cleanModel);

    // Fire onItemSelectionToggle for each item whose selection state changed
    const normalizedOld = new Set(normalizeSelectedItems(oldModel));
    const normalizedNew = new Set(normalizeSelectedItems(cleanModel));
    const selectionDetails = createGenericEventDetails(reason, event);
    for (const itemId of normalizedNew) {
      if (!normalizedOld.has(itemId)) {
        this.context.onItemSelectionToggle({ itemId, isSelected: true }, selectionDetails);
      }
    }
    for (const itemId of normalizedOld) {
      if (!normalizedNew.has(itemId)) {
        this.context.onItemSelectionToggle({ itemId, isSelected: false }, selectionDetails);
      }
    }
  }

  private propagateSelection(
    newModel: TreeItemId[],
    oldModel: TreeItemId[],
    additionalItemsToPropagate?: TreeItemId[],
  ): TreeItemId[] {
    const { checkboxSelectionPropagation } = this.state;
    if (!checkboxSelectionPropagation.descendants && !checkboxSelectionPropagation.parents) {
      return newModel;
    }

    const flags = { shouldRegenerateModel: false };
    const newModelLookup = getLookupFromArray(newModel);

    const oldModelSet = new Set(oldModel);
    const added = newModel.filter((id) => !oldModelSet.has(id));
    const newModelSet = new Set(newModel);
    const removed = oldModel.filter((id) => !newModelSet.has(id));

    additionalItemsToPropagate?.forEach((itemId) => {
      if (newModelLookup[itemId]) {
        if (!added.includes(itemId)) {
          added.push(itemId);
        }
      } else if (!removed.includes(itemId)) {
        removed.push(itemId);
      }
    });

    for (const addedItemId of added) {
      if (checkboxSelectionPropagation.descendants) {
        const selectDescendants = (itemId: TreeItemId) => {
          if (itemId !== addedItemId) {
            if (!selectors.canItemBeSelected(this.state, itemId)) {
              return;
            }
            flags.shouldRegenerateModel = true;
            newModelLookup[itemId] = true;
          }
          const children = selectors.itemOrderedChildrenIds(this.state, itemId);
          for (const childId of children) {
            selectDescendants(childId);
          }
        };
        selectDescendants(addedItemId);
      }

      if (checkboxSelectionPropagation.parents) {
        const checkAllDescendantsSelected = (itemId: TreeItemId): boolean => {
          // Non-selectable items don't count toward the "all selected" check
          if (!selectors.canItemBeSelected(this.state, itemId)) {
            return true;
          }
          if (!newModelLookup[itemId]) {
            return false;
          }
          const children = selectors.itemOrderedChildrenIds(this.state, itemId);
          return children.every(checkAllDescendantsSelected);
        };

        const selectParents = (itemId: TreeItemId) => {
          const parentId = selectors.itemParentId(this.state, itemId);
          if (parentId == null) {
            return;
          }
          const siblings = selectors.itemOrderedChildrenIds(this.state, parentId);
          if (siblings.every(checkAllDescendantsSelected)) {
            if (selectors.canItemBeSelected(this.state, parentId)) {
              flags.shouldRegenerateModel = true;
              newModelLookup[parentId] = true;
            }
            selectParents(parentId);
          }
        };
        selectParents(addedItemId);
      }
    }

    for (const removedItemId of removed) {
      if (checkboxSelectionPropagation.parents) {
        let parentId = selectors.itemParentId(this.state, removedItemId);
        while (parentId != null) {
          if (newModelLookup[parentId]) {
            flags.shouldRegenerateModel = true;
            delete newModelLookup[parentId];
          }
          parentId = selectors.itemParentId(this.state, parentId);
        }
      }

      if (checkboxSelectionPropagation.descendants) {
        const deSelectDescendants = (itemId: TreeItemId) => {
          if (itemId !== removedItemId) {
            flags.shouldRegenerateModel = true;
            delete newModelLookup[itemId];
          }
          const children = selectors.itemOrderedChildrenIds(this.state, itemId);
          for (const childId of children) {
            deSelectDescendants(childId);
          }
        };
        deSelectDescendants(removedItemId);
      }
    }

    return flags.shouldRegenerateModel ? Object.keys(newModelLookup) : newModel;
  }

  public setItemSelection({
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
    /** Whether to propagate the selection change through the tree hierarchy.
     * Defaults to the value of `keepExistingSelection` (toggle semantics propagate, replace semantics don't). */
    shouldPropagate?: boolean | undefined;
    reason: TreeRootSelectionChangeEventReason;
    event?: Event | undefined;
  }) {
    if (this.state.selectionMode === 'none') {
      return;
    }

    const isMulti = this.state.selectionMode === 'multiple';
    let newSelected: TreeItemId[] | TreeItemId | null;

    if (keepExistingSelection) {
      const oldSelected = normalizeSelectedItems(this.state.selectedItems);
      const isSelectedBefore = selectors.isItemSelected(this.state, itemId);

      if (isSelectedBefore && (shouldBeSelected === false || shouldBeSelected == null)) {
        newSelected = oldSelected.filter((id) => id !== itemId);
      } else if (!isSelectedBefore && (shouldBeSelected === true || shouldBeSelected == null)) {
        newSelected = [itemId, ...oldSelected];
      } else {
        newSelected = oldSelected;
      }
    } else if (
      shouldBeSelected === false ||
      (shouldBeSelected == null && selectors.isItemSelected(this.state, itemId))
    ) {
      newSelected = isMulti ? [] : null;
    } else {
      newSelected = isMulti ? [itemId] : itemId;
    }

    // Prevent empty selection when disallowEmptySelection is true
    if (this.state.disallowEmptySelection) {
      const normalizedNew = normalizeSelectedItems(newSelected);
      if (normalizedNew.length === 0) {
        return;
      }
    }

    this.setSelectedItems(
      newSelected,
      reason,
      event,
      [itemId],
      shouldPropagate ?? keepExistingSelection,
    );
    this.lastSelectedItem = itemId;
    this.lastSelectedRange = {};
  }

  public selectAllNavigableItems(reason: TreeRootSelectionChangeEventReason, event?: Event) {
    if (this.state.selectionMode !== 'multiple') {
      return;
    }

    const navigableItems = getAllNavigableItems(this.state).filter((id) =>
      selectors.canItemBeSelected(this.state, id),
    );
    this.setSelectedItems(navigableItems, reason, event);
    this.lastSelectedRange = getLookupFromArray(navigableItems);
  }

  public expandSelectionRange(
    itemId: TreeItemId,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) {
    if (this.lastSelectedItem != null) {
      const [start, end] = findOrderInTremauxTree(this.state, itemId, this.lastSelectedItem);
      this.selectRange([start, end], reason, event);
    }
  }

  public selectRangeFromStartToItem(
    itemId: TreeItemId,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) {
    const firstItem = getFirstNavigableItem(this.state);
    if (firstItem != null) {
      this.selectRange([firstItem, itemId], reason, event);
    }
  }

  public selectRangeFromItemToEnd(
    itemId: TreeItemId,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) {
    const lastItem = getLastNavigableItem(this.state);
    if (lastItem != null) {
      this.selectRange([itemId, lastItem], reason, event);
    }
  }

  public selectItemFromArrowNavigation(
    currentItem: TreeItemId,
    nextItem: TreeItemId,
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) {
    if (this.state.selectionMode !== 'multiple') {
      return;
    }

    const currentSelectedItems = normalizeSelectedItems(this.state.selectedItems);
    let newSelectedItems = currentSelectedItems.slice();

    if (Object.keys(this.lastSelectedRange).length === 0) {
      newSelectedItems.push(nextItem);
      this.lastSelectedRange = { [currentItem]: true, [nextItem]: true };
    } else {
      if (!this.lastSelectedRange[currentItem]) {
        this.lastSelectedRange = {};
      }

      if (this.lastSelectedRange[nextItem]) {
        newSelectedItems = newSelectedItems.filter((id) => id !== currentItem);
        delete this.lastSelectedRange[currentItem];
      } else {
        newSelectedItems.push(nextItem);
        this.lastSelectedRange[nextItem] = true;
      }
    }

    this.setSelectedItems(newSelectedItems, reason, event);
  }

  private selectRange(
    [start, end]: [TreeItemId, TreeItemId],
    reason: TreeRootSelectionChangeEventReason,
    event?: Event,
  ) {
    if (this.state.selectionMode !== 'multiple') {
      return;
    }

    const currentSelectedItems = normalizeSelectedItems(this.state.selectedItems);
    let newSelectedItems = currentSelectedItems.slice();

    // Remove items from last range
    if (Object.keys(this.lastSelectedRange).length > 0) {
      newSelectedItems = newSelectedItems.filter((id) => !this.lastSelectedRange[id]);
    }

    // Add items in new range that are selectable
    const selectedItemsLookup = getLookupFromArray(newSelectedItems);
    const range = getNonDisabledItemsInRange(this.state, start, end).filter((id) => {
      const meta = selectors.itemMeta(this.state, id);
      return meta?.selectable !== false;
    });
    const itemsToAdd = range.filter((id) => !selectedItemsLookup[id]);
    newSelectedItems = newSelectedItems.concat(itemsToAdd);

    // Prevent empty selection when disallowEmptySelection is true
    if (this.state.disallowEmptySelection && newSelectedItems.length === 0) {
      return;
    }

    this.setSelectedItems(newSelectedItems, reason, event);
    this.lastSelectedRange = getLookupFromArray(range);
  }

  // ===========================================================================
  // Focus
  // ===========================================================================

  public focusItem(itemId: TreeItemId, reason: TreeItemFocusEventReason = REASONS.keyboard) {
    const meta = selectors.itemMeta(this.state, itemId);
    let isItemVisible = meta != null;
    if (isItemVisible) {
      let parentId = meta!.parentId;
      while (parentId != null) {
        if (!selectors.isItemExpanded(this.state, parentId)) {
          isItemVisible = false;
          break;
        }
        parentId = selectors.itemMeta(this.state, parentId)?.parentId ?? null;
      }
    }

    if (isItemVisible) {
      const element = this.getItemDOMElement(itemId);
      if (element) {
        // Calling .focus() synchronously triggers the onFocus handler,
        // which already updates focusedItemId and calls onItemFocus.
        // Set lastFocusReason so the onFocus handler picks up the correct reason.
        this.lastFocusReason = reason;
        element.focus();
      } else if (this.state.virtualized) {
        // In virtualized mode, the item may not be in the DOM yet.
        // Update state so the consumer can scroll the virtualizer to this item.
        // The item will auto-focus when it mounts (see TreeItem).
        this.set('focusedItemId', itemId);
        this.context.onItemFocus(itemId, createGenericEventDetails(reason));
      }
    }
  }

  public removeFocusedItem() {
    const focusedId = this.state.focusedItemId;
    if (focusedId == null) {
      return;
    }

    const element = this.getItemDOMElement(focusedId);
    if (element) {
      element.blur();
    }

    this.set('focusedItemId', null);
  }

  public setIsItemDisabled(itemId: TreeItemId, isDisabled: boolean) {
    const meta = selectors.itemMeta(this.state, itemId);
    if (!meta || meta.disabled === isDisabled) {
      return;
    }

    this.update({
      itemMetaPatches: {
        ...this.state.itemMetaPatches,
        [itemId]: { ...this.state.itemMetaPatches[itemId], disabled: isDisabled },
      },
    });
  }

  // ===========================================================================
  // Item DOM element
  // ===========================================================================

  public getItemDOMElement(itemId: TreeItemId): HTMLElement | null {
    const rootElement = this.context.rootRef.current;
    if (!rootElement) {
      return null;
    }
    return rootElement.querySelector(`[data-item-id="${CSS.escape(itemId)}"]`);
  }

  // ===========================================================================
  // Keyboard navigation
  // ===========================================================================

  private canToggleItemSelection(itemId: TreeItemId): boolean {
    return selectors.canItemBeSelected(this.state, itemId);
  }

  private canToggleItemExpansion(itemId: TreeItemId): boolean {
    return (
      !selectors.isItemDisabled(this.state, itemId) &&
      selectors.isItemExpandable(this.state, itemId)
    );
  }

  private createLabelMap(metaLookup: Record<string, TreeItemMeta>): Record<string, string> {
    const map: Record<string, string> = {};
    for (const itemId of Object.keys(metaLookup)) {
      const meta = metaLookup[itemId];
      if (meta.label) {
        map[itemId] = meta.label.toLowerCase();
      }
    }
    return map;
  }

  private getFirstItemMatchingTypeaheadQuery(
    itemId: TreeItemId,
    newKey: string,
  ): TreeItemId | null {
    const getNextItem = (idToCheck: TreeItemId): TreeItemId => {
      const nextId = getNextNavigableItem(this.state, idToCheck);
      return nextId ?? getFirstNavigableItem(this.state)!;
    };

    const getNextMatchingItemId = (query: string): TreeItemId | null => {
      let matchingItemId: TreeItemId | null = null;
      const checkedItems: Record<TreeItemId, true> = {};
      let currentItemId: TreeItemId = query.length > 1 ? itemId : getNextItem(itemId);
      while (matchingItemId == null && !checkedItems[currentItemId]) {
        if (
          this.labelMap[currentItemId]?.startsWith(query) &&
          selectors.canItemBeFocused(this.state, currentItemId)
        ) {
          matchingItemId = currentItemId;
        } else {
          checkedItems[currentItemId] = true;
          currentItemId = getNextItem(currentItemId);
        }
      }
      return matchingItemId;
    };

    const cleanNewKey = newKey.toLowerCase();
    const concatenatedQuery = `${this.typeaheadQuery}${cleanNewKey}`;

    const concatenatedMatch = getNextMatchingItemId(concatenatedQuery);
    if (concatenatedMatch != null) {
      this.typeaheadQuery = concatenatedQuery;
      return concatenatedMatch;
    }

    const singleKeyMatch = getNextMatchingItemId(cleanNewKey);
    if (singleKeyMatch != null) {
      this.typeaheadQuery = cleanNewKey;
      return singleKeyMatch;
    }

    this.typeaheadQuery = '';
    return null;
  }

  private handleKeyDown(event: React.KeyboardEvent, itemId: TreeItemId) {
    if (event.altKey) {
      return;
    }

    const ctrlPressed = event.ctrlKey || event.metaKey;
    const key = event.key;
    const isMulti = this.state.selectionMode === 'multiple';

    switch (true) {
      // Select the item when pressing "Space"
      case key === ' ' && this.canToggleItemSelection(itemId): {
        event.preventDefault();
        if (isMulti && event.shiftKey) {
          this.expandSelectionRange(itemId, REASONS.keyboard, event.nativeEvent);
        } else {
          this.setItemSelection({
            itemId,
            keepExistingSelection: isMulti,
            shouldBeSelected: undefined,
            reason: REASONS.keyboard,
            event: event.nativeEvent,
          });
        }
        break;
      }

      // Enter: for link items, let the browser handle native navigation.
      // For other items, expand/collapse or select.
      case key === 'Enter': {
        const isLink = (event.target as HTMLElement).hasAttribute('data-link');
        if (isLink) {
          // Let the browser follow the link natively (no preventDefault).
          // Still handle selection so the item becomes selected on navigation.
          if (this.canToggleItemSelection(itemId)) {
            this.setItemSelection({
              itemId,
              shouldBeSelected: true,
              reason: REASONS.keyboard,
              event: event.nativeEvent,
            });
          }
          break;
        }
        if (this.canToggleItemExpansion(itemId)) {
          this.setItemExpansion(itemId, undefined, REASONS.keyboard, event.nativeEvent);
          event.preventDefault();
        } else if (this.canToggleItemSelection(itemId)) {
          if (isMulti) {
            event.preventDefault();
            this.setItemSelection({
              itemId,
              keepExistingSelection: true,
              reason: REASONS.keyboard,
              event: event.nativeEvent,
            });
          } else if (!selectors.isItemSelected(this.state, itemId)) {
            this.setItemSelection({
              itemId,
              reason: REASONS.keyboard,
              event: event.nativeEvent,
            });
            event.preventDefault();
          }
        }
        break;
      }

      // Focus next item
      case key === 'ArrowDown': {
        const nextItem = getNextNavigableItem(this.state, itemId);
        if (nextItem) {
          event.preventDefault();
          this.focusItem(nextItem);
          if (isMulti && event.shiftKey && this.canToggleItemSelection(nextItem)) {
            this.selectItemFromArrowNavigation(
              itemId,
              nextItem,
              REASONS.keyboard,
              event.nativeEvent,
            );
          }
        }
        break;
      }

      // Focus previous item
      case key === 'ArrowUp': {
        const prevItem = getPreviousNavigableItem(this.state, itemId);
        if (prevItem) {
          event.preventDefault();
          this.focusItem(prevItem);
          if (isMulti && event.shiftKey && this.canToggleItemSelection(prevItem)) {
            this.selectItemFromArrowNavigation(
              itemId,
              prevItem,
              REASONS.keyboard,
              event.nativeEvent,
            );
          }
        }
        break;
      }

      // ArrowRight: expand or focus first child
      case (key === 'ArrowRight' && this.state.direction !== 'rtl') ||
        (key === 'ArrowLeft' && this.state.direction === 'rtl'): {
        if (ctrlPressed) {
          return;
        }
        if (selectors.isItemExpanded(this.state, itemId)) {
          const nextItemId = getNextNavigableItem(this.state, itemId);
          if (nextItemId) {
            this.focusItem(nextItemId);
            event.preventDefault();
          }
        } else if (this.canToggleItemExpansion(itemId)) {
          this.setItemExpansion(itemId, undefined, REASONS.keyboard, event.nativeEvent);
          event.preventDefault();
        }
        break;
      }

      // ArrowLeft: collapse or focus parent
      case (key === 'ArrowLeft' && this.state.direction !== 'rtl') ||
        (key === 'ArrowRight' && this.state.direction === 'rtl'): {
        if (ctrlPressed) {
          return;
        }
        if (this.canToggleItemExpansion(itemId) && selectors.isItemExpanded(this.state, itemId)) {
          this.setItemExpansion(itemId, undefined, REASONS.keyboard, event.nativeEvent);
          event.preventDefault();
        } else {
          const parent = selectors.itemParentId(this.state, itemId);
          if (parent) {
            this.focusItem(parent);
            event.preventDefault();
          }
        }
        break;
      }

      // Home: focus first item
      case key === 'Home': {
        if (this.canToggleItemSelection(itemId) && isMulti && ctrlPressed && event.shiftKey) {
          this.selectRangeFromStartToItem(itemId, REASONS.keyboard, event.nativeEvent);
        } else {
          const firstItem = getFirstNavigableItem(this.state);
          if (firstItem) {
            this.focusItem(firstItem);
          }
        }
        event.preventDefault();
        break;
      }

      // End: focus last item
      case key === 'End': {
        if (this.canToggleItemSelection(itemId) && isMulti && ctrlPressed && event.shiftKey) {
          this.selectRangeFromItemToEnd(itemId, REASONS.keyboard, event.nativeEvent);
        } else {
          const lastItem = getLastNavigableItem(this.state);
          if (lastItem) {
            this.focusItem(lastItem);
          }
        }
        event.preventDefault();
        break;
      }

      // Expand all siblings
      case key === '*': {
        this.expandAllSiblings(itemId, REASONS.keyboard, event.nativeEvent);
        event.preventDefault();
        break;
      }

      // Ctrl+A: select all
      case event.key.toUpperCase() === 'A' && ctrlPressed && isMulti: {
        this.selectAllNavigableItems(REASONS.keyboard, event.nativeEvent);
        event.preventDefault();
        break;
      }

      // Type-ahead
      case !ctrlPressed && !event.shiftKey && isPrintableKey(key): {
        const matchingItem = this.getFirstItemMatchingTypeaheadQuery(itemId, key);
        if (matchingItem != null) {
          this.focusItem(matchingItem);
          event.preventDefault();
        } else {
          this.typeaheadQuery = '';
        }

        this.timeoutManager.startTimeout('typeahead', TYPEAHEAD_TIMEOUT, () => {
          this.typeaheadQuery = '';
        });
        break;
      }

      default:
        break;
    }
  }

  // ===========================================================================
  // Static event handler objects (following TemporalFieldStore pattern)
  // ===========================================================================

  public readonly rootEventHandlers = {
    onFocus: (event: React.FocusEvent) => {
      // Only handle focus if it's on the root element itself (not bubbled from children)
      const defaultFocusableId = selectors.defaultFocusableItemId(this.state);
      if (event.target === event.currentTarget && defaultFocusableId != null) {
        this.focusItem(defaultFocusableId);
      }
    },
    onBlur: (event: React.FocusEvent) => {
      // Check if focus moved outside the tree entirely
      const rootElement = this.context.rootRef.current;
      if (rootElement && !rootElement.contains(event.relatedTarget as Node)) {
        this.set('focusedItemId', null);
      }
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      const focusedId = this.state.focusedItemId;
      if (focusedId != null) {
        this.handleKeyDown(event, focusedId);
      }
    },
  };

  private getItemIdFromEvent(event: React.SyntheticEvent): TreeItemId | null {
    return (event.currentTarget as HTMLElement).getAttribute('data-item-id');
  }

  public readonly itemEventHandlers = {
    onMouseDown: (event: React.MouseEvent) => {
      const itemId = this.getItemIdFromEvent(event);
      if (!itemId) {
        return;
      }
      // Prevent text selection when using modifier keys for multi-select
      // Also prevent default for disabled items that cannot be focused,
      // but allow it for disabled items with itemFocusableWhenDisabled.
      if (
        event.shiftKey ||
        event.ctrlKey ||
        event.metaKey ||
        !selectors.canItemBeFocused(this.state, itemId)
      ) {
        event.preventDefault();
      }
    },
    onClick: (event: React.MouseEvent) => {
      const itemId = this.getItemIdFromEvent(event);
      if (!itemId) {
        return;
      }
      // Handle focus - items that cannot be focused (disabled without itemFocusableWhenDisabled) are skipped
      if (selectors.canItemBeFocused(this.state, itemId)) {
        this.lastFocusReason = REASONS.itemPress;
        this.set('focusedItemId', itemId);
      }

      // Handle selection
      if (this.state.selectionMode !== 'none' && selectors.canItemBeSelected(this.state, itemId)) {
        const isMulti = this.state.selectionMode === 'multiple';
        if (isMulti && (event.ctrlKey || event.metaKey)) {
          this.setItemSelection({
            itemId,
            keepExistingSelection: true,
            reason: REASONS.itemPress,
            event: event.nativeEvent,
          });
          return;
        }
        if (isMulti && event.shiftKey) {
          this.expandSelectionRange(itemId, REASONS.itemPress, event.nativeEvent);
          return;
        }
        this.setItemSelection({
          itemId,
          shouldBeSelected: true,
          reason: REASONS.itemPress,
          event: event.nativeEvent,
        });
      }

      // Handle expansion (skipped for multi-select modifier clicks via early return above)
      if (this.state.expandOnClick && this.canToggleItemExpansion(itemId)) {
        this.setItemExpansion(itemId, undefined, REASONS.itemPress, event.nativeEvent);
      }
    },
    onFocus: (event: React.FocusEvent) => {
      const itemId = this.getItemIdFromEvent(event);
      if (!itemId) {
        return;
      }
      if (selectors.canItemBeFocused(this.state, itemId) && this.state.focusedItemId !== itemId) {
        this.set('focusedItemId', itemId);
        this.context.onItemFocus(
          itemId,
          createGenericEventDetails(this.lastFocusReason, event.nativeEvent),
        );
        this.lastFocusReason = REASONS.keyboard;
      }
    },
  };

  public readonly checkboxItemEventHandlers = {
    onMouseDown: (event: React.MouseEvent) => {
      const itemId = this.getItemIdFromEvent(event);
      if (!itemId) {
        return;
      }
      // Prevent text selection when using modifier keys for multi-select
      // Also prevent default for disabled items that cannot be focused,
      // but allow it for disabled items with itemFocusableWhenDisabled.
      if (
        event.shiftKey ||
        event.ctrlKey ||
        event.metaKey ||
        !selectors.canItemBeFocused(this.state, itemId)
      ) {
        event.preventDefault();
      }
    },
    onClick: (event: React.MouseEvent) => {
      const itemId = this.getItemIdFromEvent(event);
      if (!itemId) {
        return;
      }
      // Handle focus - items that cannot be focused (disabled without itemFocusableWhenDisabled) are skipped
      if (selectors.canItemBeFocused(this.state, itemId)) {
        this.lastFocusReason = REASONS.itemPress;
        this.set('focusedItemId', itemId);
      }

      // Handle selection (checkbox behavior: always toggle, keep existing in multi)
      if (selectors.canItemBeSelected(this.state, itemId)) {
        const isMulti = this.state.selectionMode === 'multiple';

        if (isMulti && event.shiftKey) {
          this.expandSelectionRange(itemId, REASONS.itemPress, event.nativeEvent);
          return;
        }

        this.setItemSelection({
          itemId,
          keepExistingSelection: isMulti,
          reason: REASONS.itemPress,
          event: event.nativeEvent,
        });
      }

      // Handle expansion
      if (this.state.expandOnClick && this.canToggleItemExpansion(itemId)) {
        this.setItemExpansion(itemId, undefined, REASONS.itemPress, event.nativeEvent);
      }
    },
    onFocus: (event: React.FocusEvent) => {
      const itemId = this.getItemIdFromEvent(event);
      if (!itemId) {
        return;
      }
      if (selectors.canItemBeFocused(this.state, itemId) && this.state.focusedItemId !== itemId) {
        this.set('focusedItemId', itemId);
        this.context.onItemFocus(
          itemId,
          createGenericEventDetails(this.lastFocusReason, event.nativeEvent),
        );
        this.lastFocusReason = REASONS.keyboard;
      }
    },
  };

  public readonly linkItemEventHandlers = {
    onMouseDown: (event: React.MouseEvent) => {
      const itemId = this.getItemIdFromEvent(event);
      if (!itemId) {
        return;
      }
      // Only prevent default for disabled items that cannot be focused.
      // Unlike regular items, we don't prevent default for modifier keys
      // so that Ctrl+click (open in new tab) and Shift+click (open in new window) work.
      if (!selectors.canItemBeFocused(this.state, itemId)) {
        event.preventDefault();
      }
    },
    onClick: (event: React.MouseEvent) => {
      const itemId = this.getItemIdFromEvent(event);
      if (!itemId) {
        return;
      }
      // Handle focus - items that cannot be focused (disabled without itemFocusableWhenDisabled) are skipped
      if (selectors.canItemBeFocused(this.state, itemId)) {
        this.lastFocusReason = REASONS.itemPress;
        this.set('focusedItemId', itemId);
      }

      // Handle selection (same as Tree.Item: replace semantics)
      if (this.state.selectionMode !== 'none' && selectors.canItemBeSelected(this.state, itemId)) {
        this.setItemSelection({
          itemId,
          shouldBeSelected: true,
          reason: REASONS.itemPress,
          event: event.nativeEvent,
        });
      }

      // expandOnClick is intentionally NOT handled for link items.
      // The primary action of a link is navigation, not expansion.
      // Expansion is done via ItemExpansionTrigger or ArrowRight/Left keys.
    },
    onFocus: (event: React.FocusEvent) => {
      const itemId = this.getItemIdFromEvent(event);
      if (!itemId) {
        return;
      }
      if (selectors.canItemBeFocused(this.state, itemId) && this.state.focusedItemId !== itemId) {
        this.set('focusedItemId', itemId);
        this.context.onItemFocus(
          itemId,
          createGenericEventDetails(this.lastFocusReason, event.nativeEvent),
        );
        this.lastFocusReason = REASONS.keyboard;
      }
    },
  };

  public readonly expansionTriggerEventHandlers = {
    onClick: (event: React.MouseEvent, itemId: TreeItemId) => {
      event.stopPropagation();
      this.setItemExpansion(itemId, undefined, REASONS.itemPress, event.nativeEvent);
    },
  };

  // ===========================================================================
  // Lazy loading helpers (called by the plugin)
  // ===========================================================================

  public setItemChildrenOverride(parentId: string, children: TItem[]) {
    this.set('lazyItems', {
      ...this.state.lazyItems,
      children: { ...this.state.lazyItems.children, [parentId]: children },
    });
  }

  public removeChildrenOverride(parentId: string) {
    const { [parentId]: removed, ...rest } = this.state.lazyItems.children;
    this.set('lazyItems', { ...this.state.lazyItems, children: rest });
  }

  public setItemExpandableOverrides(overrides: Record<TreeItemId, boolean>) {
    this.set('lazyItems', {
      ...this.state.lazyItems,
      expandable: { ...this.state.lazyItems.expandable, ...overrides },
    });
  }

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  public mountEffect = () => {
    // Attach lazy loading plugin on mount rather than in the constructor.
    // This correctly handles React Strict Mode's unmount/remount cycle:
    // destroy() nullifies the store reference, and attach() restores it.
    this.lazyLoading?.attach(this);

    return () => {
      this.timeoutManager.clearAll();
      this.lazyLoading?.destroy();
    };
  };

  // ===========================================================================
  // Actions (exposed via actionsRef)
  // ===========================================================================

  public getActions(): TreeRootActions<TItem> {
    return {
      focusItem: (itemId) => this.focusItem(itemId, REASONS.imperativeAction),
      getItem: (itemId) => selectors.itemModel(this.state, itemId) as TItem,
      getItemDOMElement: (itemId) => this.getItemDOMElement(itemId),
      getItemOrderedChildrenIds: (itemId) => selectors.itemOrderedChildrenIds(this.state, itemId),
      getItemTree: () => this.getItemTree(),
      getParentId: (itemId) => selectors.itemParentId(this.state, itemId),
      isItemExpanded: (itemId) => selectors.isItemExpanded(this.state, itemId),
      isItemSelected: (itemId) => selectors.isItemSelected(this.state, itemId),
      setItemExpansion: (itemId, isExpanded) =>
        this.setItemExpansion(itemId, isExpanded, REASONS.imperativeAction),
      setItemSelection: (itemId, isSelected) =>
        this.setItemSelection({
          itemId,
          shouldBeSelected: isSelected,
          shouldPropagate: true,
          reason: REASONS.imperativeAction,
        }),
      setIsItemDisabled: (itemId, isDisabled) => this.setIsItemDisabled(itemId, isDisabled),
      expandAll: () => this.expandAll(REASONS.imperativeAction),
      collapseAll: () => this.collapseAll(REASONS.imperativeAction),
      updateItemChildren: (itemId) => {
        if (!this.lazyLoading) {
          throw new Error(
            'Base UI Tree: updateItemChildren requires a lazyLoading plugin. ' +
              'Pass a lazyLoading prop to Tree.Root created via Tree.useLazyLoading().',
          );
        }
        return this.lazyLoading.updateItemChildren(itemId);
      },
    };
  }

  private getItemTree(): TItem[] {
    const getItemFromItemId = (itemId: TreeItemId): TItem => {
      const item = selectors.itemModel(this.state, itemId) as TItem;
      const itemToMutate = { ...item };
      const childrenIds = selectors.itemOrderedChildrenIds(this.state, itemId);
      if (childrenIds.length > 0) {
        (itemToMutate as any).children = childrenIds.map(getItemFromItemId);
      } else {
        delete (itemToMutate as any).children;
      }
      return itemToMutate;
    };

    return selectors.itemOrderedChildrenIds(this.state, null).map(getItemFromItemId);
  }
}
