import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import { TimeoutManager } from '@base-ui/utils/TimeoutManager';
import type {
  TreeState,
  TreeStoreContext,
  TreeItemId,
  TreeItemModel,
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
  TreeItemSelectionToggleEventDetails,
  TreeItemFocusEventDetails,
  TreeItemClickEventDetails,
  TreeItemLabelChangeEventDetails,
  TreeItemLabelChangeEventReason,
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

export interface TreeStoreParameters<Mode extends TreeSelectionMode | undefined = undefined> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * The items to render.
   * Each item must have a unique identifier.
   */
  items: readonly TreeItemModel[];
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
    | ((
        itemId: TreeItemId,
        isExpanded: boolean,
        details: TreeItemExpansionToggleEventDetails,
      ) => void)
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
    | ((
        itemId: TreeItemId,
        isSelected: boolean,
        details: TreeItemSelectionToggleEventDetails,
      ) => void)
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
   * When `selectionPropagation.descendants` is set to `true`:
   * - Selecting a parent selects all its descendants automatically.
   * - Deselecting a parent deselects all its descendants automatically.
   *
   * When `selectionPropagation.parents` is set to `true`:
   * - Selecting all descendants of a parent selects the parent automatically.
   * - Deselecting a descendant of a selected parent deselects the parent automatically.
   *
   * @default { parents: false, descendants: false }
   */
  selectionPropagation?:
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
  getItemId?: ((item: TreeItemModel) => TreeItemId) | undefined;
  /**
   * Used to determine the string label of a given item.
   * @default (item) => item.label
   */
  getItemLabel?: ((item: TreeItemModel) => string) | undefined;
  /**
   * Used to determine the children of a given item.
   * @default (item) => item.children
   */
  getItemChildren?: ((item: TreeItemModel) => TreeItemModel[] | undefined) | undefined;
  /**
   * Used to determine if a given item should be disabled.
   * @default () => false
   */
  isItemDisabled?: ((item: TreeItemModel) => boolean) | undefined;
  /**
   * Used to determine if a given item should have selection disabled.
   * @default () => false
   */
  isItemSelectionDisabled?: ((item: TreeItemModel) => boolean) | undefined;
  /**
   * Used to determine if a given item should be editable.
   * If a boolean is provided, all items will be editable or non-editable.
   * @default false
   */
  isItemEditable?: boolean | ((item: TreeItemModel) => boolean) | undefined;
  /**
   * Event handler called when an item is clicked.
   */
  onItemClick?: ((itemId: TreeItemId, details: TreeItemClickEventDetails) => void) | undefined;
  /**
   * Event handler called when the label of an item changes.
   */
  onItemLabelChange?:
    | ((itemId: TreeItemId, newLabel: string, details: TreeItemLabelChangeEventDetails) => void)
    | undefined;
  /**
   * The direction of the tree layout.
   */
  direction: 'ltr' | 'rtl';
  /**
   * This prop is used to help implement the accessibility logic.
   * If you don't provide this prop, it falls back to a randomly generated id.
   */
  treeId?: string | undefined;
  /**
   * A ref to the root element of the tree.
   */
  rootRef: React.RefObject<HTMLElement | null>;
  /**
   * The lazy loading plugin instance, used to load items on demand when expanding a parent item.
   */
  lazyLoading?: TreeLazyLoading | undefined;
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

export interface TreeLazyLoading {
  attach(store: TreeStore): void;
  onBeforeExpand(
    itemId: TreeItemId,
    reason: TreeRootExpansionChangeEventReason,
    event?: Event,
  ): Promise<void>;
  updateItemChildren(itemId: TreeItemId | null): Promise<void>;
  destroy(): void;
}

export class TreeStore<Mode extends TreeSelectionMode | undefined = undefined> extends ReactStore<
  TreeState,
  TreeStoreContext,
  typeof selectors
> {
  // Focus reason tracking — default to 'keyboard' since tab focus is keyboard-like
  private lastFocusReason: TreeItemFocusEventReason = REASONS.keyboard;

  // Selection tracking
  private lastSelectedItem: TreeItemId | null = null;

  private lastSelectedRange: Record<string, boolean> = {};

  // Typeahead
  private typeaheadQuery = '';

  private timeoutManager = new TimeoutManager();

  private labelMap: Record<string, string> = {};

  public lazyLoading: TreeLazyLoading | undefined;

  constructor(parameters: TreeStoreParameters<Mode>) {
    const selectionMode: TreeSelectionMode = parameters.selectionMode ?? 'single';
    const getItemId = parameters.getItemId ?? ((item: TreeItemModel) => item.id);
    const getItemLabel = parameters.getItemLabel ?? ((item: TreeItemModel) => item.label);
    const getItemChildren = parameters.getItemChildren ?? ((item: TreeItemModel) => item.children);
    const isItemDisabled = parameters.isItemDisabled ?? (() => false);
    const isItemSelectionDisabled = parameters.isItemSelectionDisabled ?? (() => false);
    const isItemEditable = parameters.isItemEditable ?? false;

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
        selectionPropagation: parameters.selectionPropagation ?? EMPTY_OBJECT,
        focusedItemId: null,
        itemFocusableWhenDisabled: parameters.itemFocusableWhenDisabled ?? false,
        editedItemId: null,
        lazyLoadedItems: undefined,
        treeId: parameters.treeId,
        getItemId,
        getItemLabel,
        getItemChildren,
        isItemDisabled,
        isItemSelectionDisabled,
        isItemEditable,
        direction: parameters.direction,
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
        onItemClick: parameters.onItemClick ?? (() => {}),
        onItemLabelChange: parameters.onItemLabelChange ?? (() => {}),
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
        let candidate =
          getNextNavigableItem(previousState, focusedId) ??
          getPreviousNavigableItem(previousState, focusedId);

        // If the candidate was also removed, fall back to the first navigable item in the new state
        if (candidate != null && !newMetaLookup[candidate]) {
          candidate = null;
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
      itemId,
      shouldBeExpanded,
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
          expandedItemId,
          true,
          createGenericEventDetails(reason, event),
        );
      }
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
  ) {
    const oldModel = this.state.selectedItems;
    const isMulti = this.state.selectionMode === 'multiple';

    let cleanModel: TreeItemId[] | TreeItemId | null;

    if (
      isMulti &&
      (this.state.selectionPropagation.descendants || this.state.selectionPropagation.parents)
    ) {
      cleanModel = this.propagateSelection(
        newModel as TreeItemId[],
        Array.isArray(oldModel) ? oldModel : normalizeSelectedItems(oldModel),
        additionalItemsToPropagate,
      );
    } else {
      cleanModel = newModel;
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
        this.context.onItemSelectionToggle(itemId, true, selectionDetails);
      }
    }
    for (const itemId of normalizedOld) {
      if (!normalizedNew.has(itemId)) {
        this.context.onItemSelectionToggle(itemId, false, selectionDetails);
      }
    }
  }

  private propagateSelection(
    newModel: TreeItemId[],
    oldModel: TreeItemId[],
    additionalItemsToPropagate?: TreeItemId[],
  ): TreeItemId[] {
    const { selectionPropagation } = this.state;
    if (!selectionPropagation.descendants && !selectionPropagation.parents) {
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
      if (selectionPropagation.descendants) {
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

      if (selectionPropagation.parents) {
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
      if (selectionPropagation.parents) {
        let parentId = selectors.itemParentId(this.state, removedItemId);
        while (parentId != null) {
          if (newModelLookup[parentId]) {
            flags.shouldRegenerateModel = true;
            delete newModelLookup[parentId];
          }
          parentId = selectors.itemParentId(this.state, parentId);
        }
      }

      if (selectionPropagation.descendants) {
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
    reason,
    event,
  }: {
    itemId: TreeItemId;
    keepExistingSelection?: boolean | undefined;
    shouldBeSelected?: boolean | undefined;
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

    this.setSelectedItems(newSelected, reason, event, [itemId]);
    this.lastSelectedItem = itemId;
    this.lastSelectedRange = {};
  }

  public selectAllNavigableItems(reason: TreeRootSelectionChangeEventReason, event?: Event) {
    if (this.state.selectionMode !== 'multiple') {
      return;
    }

    const navigableItems = getAllNavigableItems(this.state);
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

  public focusItem(itemId: TreeItemId) {
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
      // Calling .focus() synchronously triggers the onFocus handler,
      // which already updates focusedItemId and calls onItemFocus.
      this.getItemDOMElement(itemId)?.focus();
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

  // ===========================================================================
  // Label editing
  // ===========================================================================

  public setEditedItem(itemId: TreeItemId | null) {
    if (itemId != null && !this.isItemEditable(itemId)) {
      return;
    }
    this.set('editedItemId', itemId);
  }

  public updateItemLabel(
    itemId: TreeItemId,
    newLabel: string,
    reason: TreeItemLabelChangeEventReason = REASONS.keyboard,
  ) {
    this.update({
      itemMetaPatches: {
        ...this.state.itemMetaPatches,
        [itemId]: { ...this.state.itemMetaPatches[itemId], label: newLabel },
      },
    });

    this.context.onItemLabelChange(itemId, newLabel, createGenericEventDetails(reason));
    this.setEditedItem(null);
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

  private isItemEditable(itemId: TreeItemId): boolean {
    const { isItemEditable } = this.state;
    if (typeof isItemEditable === 'boolean') {
      return isItemEditable;
    }
    const model = selectors.itemModel(this.state, itemId);
    return model ? isItemEditable(model) : false;
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

      // Enter: expand/collapse, start editing, or select
      case key === 'Enter': {
        if (this.isItemEditable(itemId) && !selectors.isItemBeingEdited(this.state, itemId)) {
          this.setEditedItem(itemId);
        } else if (this.canToggleItemExpansion(itemId)) {
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
      if (
        event.shiftKey ||
        event.ctrlKey ||
        event.metaKey ||
        selectors.isItemDisabled(this.state, itemId)
      ) {
        event.preventDefault();
      }
    },
    onClick: (event: React.MouseEvent) => {
      const itemId = this.getItemIdFromEvent(event);
      if (!itemId) {
        return;
      }
      this.context.onItemClick(
        itemId,
        createGenericEventDetails(REASONS.itemPress, event.nativeEvent),
      );

      // Handle focus - disabled items cannot be focused by mouse click
      if (!selectors.isItemDisabled(this.state, itemId)) {
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
      if (
        event.shiftKey ||
        event.ctrlKey ||
        event.metaKey ||
        selectors.isItemDisabled(this.state, itemId)
      ) {
        event.preventDefault();
      }
    },
    onClick: (event: React.MouseEvent) => {
      const itemId = this.getItemIdFromEvent(event);
      if (!itemId) {
        return;
      }
      this.context.onItemClick(
        itemId,
        createGenericEventDetails(REASONS.itemPress, event.nativeEvent),
      );

      // Handle focus - disabled items cannot be focused by mouse click
      if (!selectors.isItemDisabled(this.state, itemId)) {
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

  public readonly expansionTriggerEventHandlers = {
    onClick: (event: React.MouseEvent, itemId: TreeItemId) => {
      event.stopPropagation();
      this.setItemExpansion(itemId, undefined, REASONS.itemPress, event.nativeEvent);
    },
  };

  // ===========================================================================
  // Lazy loading helpers (called by the plugin)
  // ===========================================================================

  public setItemChildrenOverride(parentId: string, children: TreeItemModel[]) {
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

  public getActions(): TreeRootActions {
    return {
      focusItem: (itemId) => {
        this.lastFocusReason = REASONS.imperativeAction;
        this.focusItem(itemId);
      },
      getItem: (itemId) => selectors.itemModel(this.state, itemId),
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
          reason: REASONS.imperativeAction,
        }),
      setEditedItem: (itemId) => this.setEditedItem(itemId),
      setIsItemDisabled: (itemId, isDisabled) => this.setIsItemDisabled(itemId, isDisabled),
      updateItemLabel: (itemId, newLabel) =>
        this.updateItemLabel(itemId, newLabel, REASONS.imperativeAction),
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

  private getItemTree(): TreeItemModel[] {
    const getItemFromItemId = (itemId: TreeItemId): TreeItemModel => {
      const item = selectors.itemModel(this.state, itemId);
      const itemToMutate = { ...item };
      const childrenIds = selectors.itemOrderedChildrenIds(this.state, itemId);
      if (childrenIds.length > 0) {
        itemToMutate.children = childrenIds.map(getItemFromItemId);
      } else {
        delete itemToMutate.children;
      }
      return itemToMutate;
    };

    return selectors.itemOrderedChildrenIds(this.state, null).map(getItemFromItemId);
  }
}
