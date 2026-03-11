import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
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
} from './types';
import { TREE_VIEW_ROOT_PARENT_ID } from './types';
import { selectors } from './selectors';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
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

export interface TreeStoreParameters<Multiple extends boolean | undefined = false> {
  items: readonly TreeItemModel[];

  // Expansion
  expandedItems?: readonly TreeItemId[] | undefined;
  defaultExpandedItems?: readonly TreeItemId[] | undefined;
  onExpandedItemsChange?:
    | ((expandedItems: TreeItemId[], eventDetails: TreeRootExpansionChangeEventDetails) => void)
    | undefined;
  onItemExpansionToggle?: ((itemId: TreeItemId, isExpanded: boolean) => void) | undefined;

  // Selection
  selectedItems?:
    | TreeSelectedItemsType<Multiple>
    | (Multiple extends true ? never : null)
    | undefined;
  defaultSelectedItems?:
    | TreeSelectedItemsType<Multiple>
    | (Multiple extends true ? never : null)
    | undefined;
  onSelectedItemsChange?:
    | ((
        selectedItems: TreeSelectedItemsType<Multiple> | (Multiple extends true ? never : null),
        eventDetails: TreeRootSelectionChangeEventDetails,
      ) => void)
    | undefined;
  onItemSelectionToggle?: ((itemId: TreeItemId, isSelected: boolean) => void) | undefined;
  multiple?: Multiple | undefined;
  disableSelection?: boolean | undefined;
  selectionPropagation?:
    | { parents?: boolean | undefined; descendants?: boolean | undefined }
    | undefined;

  // Focus
  disabledItemsFocusable?: boolean | undefined;
  onItemFocus?: ((itemId: TreeItemId) => void) | undefined;

  // Item accessors
  getItemId?: ((item: TreeItemModel) => TreeItemId) | undefined;
  getItemLabel?: ((item: TreeItemModel) => string) | undefined;
  getItemChildren?: ((item: TreeItemModel) => TreeItemModel[] | undefined) | undefined;
  isItemDisabled?: ((item: TreeItemModel) => boolean) | undefined;
  isItemSelectionDisabled?: ((item: TreeItemModel) => boolean) | undefined;
  isItemEditable?: boolean | ((item: TreeItemModel) => boolean) | undefined;

  // Other
  onItemClick?: ((event: React.MouseEvent, itemId: TreeItemId) => void) | undefined;
  onItemLabelChange?: ((itemId: TreeItemId, newLabel: string) => void) | undefined;
  isRtl?: boolean | undefined;
  treeId?: string | undefined;
  rootRef: React.RefObject<HTMLElement | null>;
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

export class TreeStore<Multiple extends boolean | undefined = false> extends ReactStore<TreeState, TreeStoreContext, typeof selectors> {
  // Selection tracking
  private lastSelectedItem: TreeItemId | null = null;

  private lastSelectedRange: Record<string, boolean> = {};

  // Typeahead
  private typeaheadQuery = '';

  private typeaheadTimeout: ReturnType<typeof setTimeout> | null = null;

  private labelMap: Record<string, string> = {};

  constructor(parameters: TreeStoreParameters<Multiple>) {
    const itemsState = TreeStore.buildItemsState(
      parameters.items,
      parameters.getItemId ?? ((item) => item.id),
      parameters.getItemLabel ?? ((item) => item.label),
      parameters.getItemChildren ?? ((item) => item.children),
      parameters.isItemDisabled ?? (() => false),
      parameters.isItemSelectionDisabled ?? (() => false),
    );

    super(
      {
        ...itemsState,
        expandedItems: parameters.expandedItems ?? parameters.defaultExpandedItems ?? [],
        selectedItems:
          parameters.selectedItems ??
          parameters.defaultSelectedItems ??
          (parameters.multiple ? [] : null),
        disableSelection: parameters.disableSelection ?? false,
        multiple: parameters.multiple ?? false,
        selectionPropagation: parameters.selectionPropagation ?? {},
        focusedItemId: null,
        disabledItemsFocusable: parameters.disabledItemsFocusable ?? false,
        editedItemId: null,
        lazyLoadedItems: undefined,
        treeId: parameters.treeId,
      },
      {
        onExpandedItemsChange: parameters.onExpandedItemsChange ?? (() => {}),
        onSelectedItemsChange:
          (parameters.onSelectedItemsChange as TreeStoreContext['onSelectedItemsChange']) ??
          (() => {}),
        onItemFocus: parameters.onItemFocus ?? (() => {}),
        onItemClick: parameters.onItemClick ?? (() => {}),
        onItemLabelChange: parameters.onItemLabelChange ?? (() => {}),
        getItemId: parameters.getItemId ?? ((item) => item.id),
        getItemLabel: parameters.getItemLabel ?? ((item) => item.label),
        getItemChildren: parameters.getItemChildren ?? ((item) => item.children),
        isItemDisabled: parameters.isItemDisabled ?? (() => false),
        isItemSelectionDisabled: parameters.isItemSelectionDisabled ?? (() => false),
        isItemEditable: parameters.isItemEditable ?? false,
        fetchChildren: undefined,
        isRtl: parameters.isRtl ?? false,
        rootRef: parameters.rootRef,
      },
      selectors,
    );

    // Build initial label map
    this.labelMap = this.createLabelMap(itemsState.itemMetaLookup);

    // Observe items changes to keep focus valid and update label map
    let previousState = this.state;
    this.subscribe((newState) => {
      if (newState.itemMetaLookup === previousState.itemMetaLookup) {
        previousState = newState;
        return;
      }

      this.labelMap = this.createLabelMap(newState.itemMetaLookup);

      // If focused item was removed, focus the closest neighbor
      const focusedId = newState.focusedItemId;
      if (focusedId != null && !newState.itemMetaLookup[focusedId]) {
        const checkItemInNewTree = (itemId: TreeItemId | null) =>
          itemId == null || !newState.itemMetaLookup[itemId] ? null : itemId;

        // Use previous state for navigation (to find neighbors of removed item)
        const itemToFocusId =
          checkItemInNewTree(getNextNavigableItem(previousState, focusedId)) ??
          checkItemInNewTree(getPreviousNavigableItem(previousState, focusedId)) ??
          getFirstNavigableItem(newState);

        if (itemToFocusId == null) {
          this.set('focusedItemId', null);
        } else {
          this.focusItem(itemToFocusId);
        }
      }

      previousState = newState;
    });
  }

  // ===========================================================================
  // Items management
  // ===========================================================================

  public static buildItemsState(
    items: readonly TreeItemModel[],
    getItemId: (item: TreeItemModel) => TreeItemId,
    getItemLabel: (item: TreeItemModel) => string,
    getItemChildren: (item: TreeItemModel) => TreeItemModel[] | undefined,
    isItemDisabled: (item: TreeItemModel) => boolean,
    isItemSelectionDisabled: (item: TreeItemModel) => boolean,
  ): Pick<
    TreeState,
    | 'itemModelLookup'
    | 'itemMetaLookup'
    | 'itemOrderedChildrenIdsLookup'
    | 'itemChildrenIndexesLookup'
  > {
    const itemMetaLookup: Record<TreeItemId, TreeItemMeta> = {};
    const itemModelLookup: Record<TreeItemId, TreeItemModel> = {};
    const itemOrderedChildrenIdsLookup: Record<string, TreeItemId[]> = {};
    const itemChildrenIndexesLookup: Record<string, Record<TreeItemId, number>> = {};

    function processSiblings(
      siblings: readonly TreeItemModel[],
      parentId: TreeItemId | null,
      depth: number,
    ) {
      const parentKey = parentId ?? TREE_VIEW_ROOT_PARENT_ID;
      const orderedChildrenIds: TreeItemId[] = [];
      const childrenIndexes: Record<TreeItemId, number> = {};

      for (let i = 0; i < siblings.length; i += 1) {
        const item = siblings[i];
        const itemId = getItemId(item);
        const children = getItemChildren(item);
        const expandable = !!children && children.length > 0;

        orderedChildrenIds.push(itemId);
        childrenIndexes[itemId] = i;

        itemModelLookup[itemId] = item;
        itemMetaLookup[itemId] = {
          id: itemId,
          parentId,
          depth,
          expandable,
          disabled: isItemDisabled(item),
          selectable: !isItemSelectionDisabled(item),
          label: getItemLabel(item),
        };

        if (children && children.length > 0) {
          processSiblings(children, itemId, depth + 1);
        }
      }

      itemOrderedChildrenIdsLookup[parentKey] = orderedChildrenIds;
      itemChildrenIndexesLookup[parentKey] = childrenIndexes;
    }

    processSiblings(items, null, 0);

    return {
      itemMetaLookup,
      itemModelLookup,
      itemOrderedChildrenIdsLookup,
      itemChildrenIndexesLookup,
    };
  }

  public rebuildItemsState(items: readonly TreeItemModel[]) {
    const newState = TreeStore.buildItemsState(
      items,
      this.context.getItemId,
      this.context.getItemLabel,
      this.context.getItemChildren,
      this.context.isItemDisabled,
      this.context.isItemSelectionDisabled,
    );

    this.update(newState);
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
    this.set('expandedItems', newExpanded);
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
    const isMulti = this.state.multiple;

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
    if (this.state.disableSelection) {
      return;
    }

    const isMulti = this.state.multiple;
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

    this.setSelectedItems(newSelected, reason, event, [itemId]);
    this.lastSelectedItem = itemId;
    this.lastSelectedRange = {};
  }

  public selectAllNavigableItems(reason: TreeRootSelectionChangeEventReason, event?: Event) {
    if (!this.state.multiple) {
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
    if (!this.state.multiple) {
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
    if (!this.state.multiple) {
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
      const meta = this.state.itemMetaLookup[id];
      return meta?.selectable !== false;
    });
    const itemsToAdd = range.filter((id) => !selectedItemsLookup[id]);
    newSelectedItems = newSelectedItems.concat(itemsToAdd);

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
      this.getItemDOMElement(itemId)?.focus();
      this.set('focusedItemId', itemId);
      this.context.onItemFocus(itemId);
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

  public updateItemLabel(itemId: TreeItemId, newLabel: string) {
    const newItemMetaLookup = { ...this.state.itemMetaLookup };
    newItemMetaLookup[itemId] = { ...newItemMetaLookup[itemId], label: newLabel };

    const newItemModelLookup = { ...this.state.itemModelLookup };
    newItemModelLookup[itemId] = { ...newItemModelLookup[itemId], label: newLabel };

    this.update({ itemMetaLookup: newItemMetaLookup, itemModelLookup: newItemModelLookup });

    this.context.onItemLabelChange(itemId, newLabel);
    this.setEditedItem(null);
  }

  // ===========================================================================
  // Item DOM element
  // ===========================================================================

  public getItemDOMElement(itemId: TreeItemId): HTMLElement | null {
    const rootElement = this.context.rootRef.current;
    if (!rootElement) {
      return null;
    }
    return rootElement.querySelector(`[data-item-id="${itemId}"]`);
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
    const { isItemEditable } = this.context;
    if (typeof isItemEditable === 'boolean') {
      return isItemEditable;
    }
    const model = this.state.itemModelLookup[itemId];
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
    const isMulti = this.state.multiple;

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
      case (key === 'ArrowRight' && !this.context.isRtl) ||
        (key === 'ArrowLeft' && this.context.isRtl): {
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
      case (key === 'ArrowLeft' && !this.context.isRtl) ||
        (key === 'ArrowRight' && this.context.isRtl): {
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
      case String.fromCharCode(event.keyCode) === 'A' &&
        ctrlPressed &&
        isMulti &&
        !this.state.disableSelection: {
        this.selectAllNavigableItems(REASONS.keyboard, event.nativeEvent);
        event.preventDefault();
        break;
      }

      // Type-ahead
      case !ctrlPressed && !event.shiftKey && isPrintableKey(key): {
        if (this.typeaheadTimeout) {
          clearTimeout(this.typeaheadTimeout);
        }

        const matchingItem = this.getFirstItemMatchingTypeaheadQuery(itemId, key);
        if (matchingItem != null) {
          this.focusItem(matchingItem);
          event.preventDefault();
        } else {
          this.typeaheadQuery = '';
        }

        this.typeaheadTimeout = setTimeout(() => {
          this.typeaheadQuery = '';
        }, TYPEAHEAD_TIMEOUT);
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

  public readonly itemEventHandlers = {
    onClick: (event: React.MouseEvent, itemId: TreeItemId, clickToExpand: boolean, clickToSelect: boolean) => {
      this.context.onItemClick(event, itemId);

      // Handle focus - disabled items cannot be focused by mouse click
      if (!selectors.isItemDisabled(this.state, itemId)) {
        this.set('focusedItemId', itemId);
      }

      // Handle selection
      if (!this.state.disableSelection && selectors.canItemBeSelected(this.state, itemId)) {
        if (clickToSelect) {
          const isMulti = this.state.multiple;
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
      }

      // Handle expansion (skipped for multi-select modifier clicks via early return above)
      if (clickToExpand && this.canToggleItemExpansion(itemId)) {
        this.setItemExpansion(itemId, undefined, REASONS.itemPress, event.nativeEvent);
      }
    },
    onFocus: (_event: React.FocusEvent, itemId: TreeItemId) => {
      if (selectors.canItemBeFocused(this.state, itemId)) {
        this.set('focusedItemId', itemId);
        this.context.onItemFocus(itemId);
      }
    },
  };

  public readonly checkboxItemEventHandlers = {
    onClick: (event: React.MouseEvent, itemId: TreeItemId, clickToExpand: boolean) => {
      this.context.onItemClick(event, itemId);

      // Handle focus - disabled items cannot be focused by mouse click
      if (!selectors.isItemDisabled(this.state, itemId)) {
        this.set('focusedItemId', itemId);
      }

      // Handle selection (checkbox behavior: always toggle, keep existing in multi)
      if (selectors.canItemBeSelected(this.state, itemId)) {
        const isMulti = this.state.multiple;

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
        return;
      }

      // Handle expansion (only when selection was not toggled)
      if (clickToExpand && this.canToggleItemExpansion(itemId)) {
        this.setItemExpansion(itemId, undefined, REASONS.itemPress, event.nativeEvent);
      }
    },
    onFocus: (_event: React.FocusEvent, itemId: TreeItemId) => {
      if (selectors.canItemBeFocused(this.state, itemId)) {
        this.set('focusedItemId', itemId);
        this.context.onItemFocus(itemId);
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
  // Actions (exposed via actionsRef)
  // ===========================================================================

  public getActions(): TreeRootActions {
    return {
      focusItem: (itemId) => this.focusItem(itemId),
      getItem: (itemId) => this.state.itemModelLookup[itemId],
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
      updateItemLabel: (itemId, newLabel) => this.updateItemLabel(itemId, newLabel),
    };
  }

  private getItemTree(): TreeItemModel[] {
    const getItemFromItemId = (itemId: TreeItemId): TreeItemModel => {
      const item = this.state.itemModelLookup[itemId];
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
