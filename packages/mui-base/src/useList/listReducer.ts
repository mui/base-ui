import { every, findIndex, some } from '../utils/iterable';
import { ListActionTypes } from './listActions.types';
import {
  ListState,
  ListReducerAction,
  ListActionContext,
  SelectionMode,
  ListItemMetadata,
} from './useList.types';

/**
 * Looks up the next valid item to highlight within the list.
 *
 * @param currentIndex The index of the start of the search.
 * @param lookupDirection Whether to look for the next or previous item.
 * @param items The array of items to search.
 * @param includeDisabledItems Whether to include disabled items in the search.
 * @param wrapAround Whether to wrap around the list when searching.
 * @returns The index of the next valid item to highlight or -1 if no valid item is found.
 */
function findValidItemToHighlight<ItemValue>(
  currentIndex: number,
  lookupDirection: 'next' | 'previous',
  items: Map<ItemValue, ListItemMetadata<ItemValue>>,
  includeDisabledItems: boolean,
  wrapAround: boolean,
): number {
  if (
    items.size === 0 ||
    (!includeDisabledItems && every(items.values(), (item) => item.disabled))
  ) {
    return -1;
  }

  let nextFocus = currentIndex;
  const valuesArray = Array.from(items.values());

  for (;;) {
    // No valid items found
    if (
      (!wrapAround && lookupDirection === 'next' && nextFocus === items.size) ||
      (!wrapAround && lookupDirection === 'previous' && nextFocus === -1)
    ) {
      return -1;
    }

    const nextFocusDisabled = includeDisabledItems
      ? false
      : valuesArray[nextFocus]?.disabled ?? false;
    if (nextFocusDisabled) {
      nextFocus += lookupDirection === 'next' ? 1 : -1;
      if (wrapAround) {
        nextFocus = (nextFocus + items.size) % items.size;
      }
    } else {
      return nextFocus;
    }
  }
}

/**
 * Gets the next item to highlight based on the current highlighted item and the search direction.
 *
 * @param previouslyHighlightedValue The item from which to start the search for the next candidate.
 * @param offset The offset from the previously highlighted item to search for the next candidate or a special named value ('reset', 'start', 'end').
 * @param context The list action context.
 *
 * @returns The next item to highlight or null if no item is valid.
 */
export function moveHighlight<ItemValue>(
  previouslyHighlightedValue: ItemValue | null,
  offset: number | 'reset' | 'start' | 'end',
  items: Map<ItemValue, ListItemMetadata<ItemValue>>,
  settings: ListActionContext<ItemValue>,
): ItemValue | null {
  const { disableListWrap, disabledItemsFocusable, focusManagement } = settings;

  // TODO: make this configurable
  // The always should be an item highlighted when focus is managed by the DOM
  // so that it's accessible by the `tab` key.
  const defaultHighlightedIndex = focusManagement === 'DOM' ? 0 : -1;
  const maxIndex = items.size - 1;

  const previouslyHighlightedIndex =
    previouslyHighlightedValue == null
      ? -1
      : findIndex(items.values(), (item) => item.value === previouslyHighlightedValue);

  let nextIndexCandidate: number;
  let lookupDirection: 'next' | 'previous';
  let wrapAround = !disableListWrap;

  switch (offset) {
    case 'reset':
      if (defaultHighlightedIndex === -1) {
        return null;
      }

      nextIndexCandidate = 0;
      lookupDirection = 'next';
      wrapAround = false;
      break;

    case 'start':
      nextIndexCandidate = 0;
      lookupDirection = 'next';
      wrapAround = false;
      break;

    case 'end':
      nextIndexCandidate = maxIndex;
      lookupDirection = 'previous';
      wrapAround = false;
      break;

    default: {
      const newIndex = previouslyHighlightedIndex + offset;

      if (newIndex < 0) {
        if ((!wrapAround && previouslyHighlightedIndex !== -1) || Math.abs(offset) > 1) {
          nextIndexCandidate = 0;
          lookupDirection = 'next';
        } else {
          nextIndexCandidate = maxIndex;
          lookupDirection = 'previous';
        }
      } else if (newIndex > maxIndex) {
        if (!wrapAround || Math.abs(offset) > 1) {
          nextIndexCandidate = maxIndex;
          lookupDirection = 'previous';
        } else {
          nextIndexCandidate = 0;
          lookupDirection = 'next';
        }
      } else {
        nextIndexCandidate = newIndex;
        lookupDirection = offset >= 0 ? 'next' : 'previous';
      }
    }
  }

  const nextIndex = findValidItemToHighlight(
    nextIndexCandidate,
    lookupDirection,
    items,
    disabledItemsFocusable,
    wrapAround,
  );

  // If there are no valid items to highlight, return the previously highlighted item (if it's still valid).
  if (
    nextIndex === -1 &&
    previouslyHighlightedValue !== null &&
    !isItemDisabled(previouslyHighlightedValue, previouslyHighlightedIndex)
  ) {
    return previouslyHighlightedValue;
  }

  return items[nextIndex] ?? null;
}

/**
 * Toggles the selection of an item.
 *
 * @param item Item to toggle.
 * @param selectedValues Already selected items.
 * @param selectionMode The number of items that can be simultanously selected.
 * @param itemComparer A custom item comparer function.
 *
 * @returns The new array of selected items.
 */
export function toggleSelection<ItemValue>(
  item: ItemValue,
  selectedValues: ItemValue[],
  selectionMode: SelectionMode,
  itemComparer: (item1: ItemValue, item2: ItemValue) => boolean,
) {
  if (selectionMode === 'none') {
    return [];
  }

  if (selectionMode === 'single') {
    // if the item to select has already been selected, return the original array
    if (itemComparer(selectedValues[0], item)) {
      return selectedValues;
    }

    return [item];
  }

  // The toggled item is selected; remove it from the selection.
  if (selectedValues.some((sv) => itemComparer(sv, item))) {
    return selectedValues.filter((sv) => !itemComparer(sv, item));
  }

  // The toggled item is not selected - add it to the selection.
  return [...selectedValues, item];
}

/**
 * Handles item selection in a list.
 *
 * @param item - The item to be selected.
 * @param state - The current state of the list.
 * @param context - The context of the list action.
 * @returns The new state of the list after the item has been selected, or the original state if the item is disabled.
 */
export function handleItemSelection<ItemValue, State extends ListState<ItemValue>>(
  itemId: ItemId,
  state: State,
): State {
  const { selectionMode, itemComparer } = state.settings;
  const { selectedValues, items } = state;

  const itemDefinition = items.get(itemId);

  if (itemDefinition == null || itemDefinition.disabled) {
    return state;
  }

  // if the item is already selected, remove it from the selection, otherwise add it
  const newSelectedValues = toggleSelection(
    itemDefinition.value,
    selectedValues,
    selectionMode,
    itemComparer,
  );

  return {
    ...state,
    selectedValues: newSelectedValues,
    highlightedValue: itemDefinition.value,
  };
}

function handleKeyDown<ItemValue, State extends ListState<ItemValue>>(
  key: string,
  state: State,
): State {
  const { highlightedValue: previouslySelectedValue, items, settings } = state;
  const { orientation, pageSize } = settings;

  switch (key) {
    case 'Home':
      return {
        ...state,
        highlightedValue: moveHighlight(previouslySelectedValue, 'start', items, settings),
      };

    case 'End':
      return {
        ...state,
        highlightedValue: moveHighlight(previouslySelectedValue, 'end', items, settings),
      };

    case 'PageUp':
      return {
        ...state,
        highlightedValue: moveHighlight(previouslySelectedValue, -pageSize, items, settings),
      };

    case 'PageDown':
      return {
        ...state,
        highlightedValue: moveHighlight(previouslySelectedValue, pageSize, items, settings),
      };

    case 'ArrowUp':
      if (orientation !== 'vertical') {
        break;
      }

      return {
        ...state,
        highlightedValue: moveHighlight(previouslySelectedValue, -1, items, settings),
      };

    case 'ArrowDown':
      if (orientation !== 'vertical') {
        break;
      }

      return {
        ...state,
        highlightedValue: moveHighlight(previouslySelectedValue, 1, items, settings),
      };

    case 'ArrowLeft': {
      if (orientation === 'vertical') {
        break;
      }

      const offset = orientation === 'horizontal-ltr' ? -1 : 1;

      return {
        ...state,
        highlightedValue: moveHighlight(previouslySelectedValue, offset, items, settings),
      };
    }

    case 'ArrowRight': {
      if (orientation === 'vertical') {
        break;
      }

      const offset = orientation === 'horizontal-ltr' ? 1 : -1;

      return {
        ...state,
        highlightedValue: moveHighlight(previouslySelectedValue, offset, items, settings),
      };
    }

    case 'Enter':
    case ' ':
      if (state.highlightedValue === null) {
        return state;
      }

      return handleItemSelection(state.highlightedValue, state);

    default:
      break;
  }

  return state;
}

function handleBlur<ItemValue, State extends ListState<ItemValue>>(state: State): State {
  if (state.settings.focusManagement === 'DOM') {
    return state;
  }

  return {
    ...state,
    highlightedValue: null,
  };
}

function textCriteriaMatches<ItemId, ItemValue>(
  nextFocus: ListItemMetadata<ItemId, ItemValue>,
  searchString: string,
) {
  const text = nextFocus?.valueAsString?.trim()?.toLowerCase();

  if (!text || text.length === 0) {
    // Make item not navigable if stringification fails or results in empty string.
    return false;
  }

  return text.indexOf(searchString) === 0;
}

function handleTextNavigation<ItemValue, State extends ListState<ItemValue>>(
  state: State,
  searchString: string,
): State {
  const { items, settings } = state;
  const { disabledItemsFocusable } = settings;

  const startWithCurrentItem = searchString.length > 1;

  let nextItem = startWithCurrentItem
    ? state.highlightedValue
    : moveHighlight(state.highlightedValue, 1, items, settings);

  for (let index = 0; index < items.size; index += 1) {
    // Return un-mutated state if looped back to the currently highlighted value
    if (!nextItem || (!startWithCurrentItem && state.highlightedValue === nextItem)) {
      return state;
    }

    if (
      textCriteriaMatches(nextItem, searchString) &&
      (!isItemDisabled(nextItem, items.indexOf(nextItem)) || disabledItemsFocusable)
    ) {
      // The nextItem is the element to be highlighted
      return {
        ...state,
        highlightedValue: nextItem,
      };
    }
    // Move to the next element.
    nextItem = moveHighlight(nextItem, 1, items, settings);
  }

  // No item matches the text search criteria
  return state;
}

function handleItemsChange<ItemValue, State extends ListState<ItemValue>>(
  items: Map<ItemValue, ListItemMetadata<ItemValue>>,
  previousItems: ItemValue[],
  state: State,
): State {
  const { focusManagement } = state.settings;

  let newHighlightedValue: ItemValue | null = null;

  if (state.highlightedValue != null) {
    newHighlightedValue = items.get(state.highlightedValue)?.value ?? null;
  } else if (focusManagement === 'DOM' && previousItems.length === 0) {
    newHighlightedValue = moveHighlight(null, 'reset', items, state.settings);
  }

  // exclude selected values that are no longer in the items list
  const selectedValues = state.selectedValues ?? [];
  const newSelectedValues = selectedValues.filter((selectedValue) =>
    some(items.values(), (item) => item.value === selectedValue),
  );

  return {
    ...state,
    highlightedValue: newHighlightedValue,
    selectedValues: newSelectedValues,
  };
}

function handleResetHighlight<ItemValue, State extends ListState<ItemValue>>(state: State) {
  return {
    ...state,
    highlightedValue: moveHighlight(null, 'reset', state.items, state.settings),
  };
}

function handleHighlightLast<ItemValue, State extends ListState<ItemValue>>(state: State) {
  return {
    ...state,
    highlightedValue: moveHighlight(null, 'end', state.items, state.settings),
  };
}

function handleClearSelection<ItemValue, State extends ListState<ItemValue>>(state: State) {
  return {
    ...state,
    selectedValues: [],
    highlightedValue: moveHighlight(null, 'reset', state.items, state.settings),
  };
}

export function listReducer<ItemValue, State extends ListState<ItemValue>>(
  state: State,
  action: ListReducerAction<ItemValue>,
): State {
  const { type } = action;

  switch (type) {
    case ListActionTypes.keyDown:
      return handleKeyDown(action.key, state);
    case ListActionTypes.itemClick:
      return handleItemSelection(action.item, state);
    case ListActionTypes.blur:
      return handleBlur(state);
    case ListActionTypes.textNavigation:
      return handleTextNavigation(state, action.searchString);
    case ListActionTypes.itemsChange:
      return handleItemsChange(action.items, action.previousItems, state);
    case ListActionTypes.resetHighlight:
      return handleResetHighlight(state);
    case ListActionTypes.highlightLast:
      return handleHighlightLast(state);
    case ListActionTypes.clearSelection:
      return handleClearSelection(state);
    default:
      return state;
  }
}
