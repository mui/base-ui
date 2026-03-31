import { compareItemEquality, removeItem } from '../../utils/itemEquality';
import { EMPTY_ARRAY } from '../../utils/constants';

/**
 * The selection mode determines how user interactions (clicks, keyboard)
 * affect the selected items in the listbox.
 *
 * - `'none'`  — Items cannot be selected.
 * - `'single'`  — Only one item can be selected at a time. Clicking replaces the selection.
 * - `'multiple'`  — Clicking toggles items. Shift+Click selects a range.
 * - `'explicit-multiple'`  — Like a file browser: clicking replaces the selection,
 *    Ctrl/Cmd+Click toggles individual items, Shift+Click selects a range.
 */
export type SelectionMode = 'none' | 'single' | 'multiple' | 'explicit-multiple';

/**
 * Typed actions that describe selection intent. Both click handlers and
 * keyboard handlers produce these; the pure `selectionReducer` computes
 * the next value array.
 */
export type SelectionAction =
  | { type: 'select'; index: number }
  | { type: 'toggle'; index: number }
  | { type: 'extendTo'; index: number; anchorIndex: number | null }
  | { type: 'selectRange'; from: number; to: number }
  | { type: 'selectAll' }
  | { type: 'clear' };

/**
 * Pure reducer that computes the next selection value from an action.
 * Has no side effects — does not touch refs, store, or DOM.
 *
 * @param action - What the user intends to do.
 * @param currentValue - The current selected values array.
 * @param valuesRef - The flat array of all registered item values (indexed by composite position).
 * @param disabledItemsRef - The flat array of disabled item flags (indexed by composite position).
 * @param isItemEqualToValue - Custom equality comparator.
 * @returns The new selected values array.
 */
export function selectionReducer(
  action: SelectionAction,
  currentValue: any[],
  valuesRef: any[],
  disabledItemsRef: Array<boolean | undefined>,
  isItemEqualToValue: (a: any, b: any) => boolean,
): any[] {
  switch (action.type) {
    case 'select': {
      const itemValue = valuesRef[action.index];
      if (itemValue === undefined || disabledItemsRef[action.index]) {
        return currentValue;
      }
      return [itemValue];
    }

    case 'toggle': {
      const itemValue = valuesRef[action.index];
      if (itemValue === undefined || disabledItemsRef[action.index]) {
        return currentValue;
      }
      const isSelected = currentValue.some((v) =>
        compareItemEquality(v, itemValue, isItemEqualToValue),
      );
      if (isSelected) {
        return removeItem(currentValue, itemValue, isItemEqualToValue);
      }
      return [...currentValue, itemValue];
    }

    case 'extendTo': {
      const anchorIndex = action.anchorIndex;
      if (anchorIndex === null) {
        // No anchor — treat as a single select
        const itemValue = valuesRef[action.index];
        return itemValue !== undefined && !disabledItemsRef[action.index]
          ? [itemValue]
          : currentValue;
      }
      const start = Math.min(anchorIndex, action.index);
      const end = Math.max(anchorIndex, action.index);
      const rangeValues: any[] = [];
      for (let i = start; i <= end; i += 1) {
        const val = valuesRef[i];
        if (val !== undefined && !disabledItemsRef[i]) {
          rangeValues.push(val);
        }
      }
      // Keep existing selections outside the range, then add the range
      const outsideRange = currentValue.filter((v) => {
        const idx = valuesRef.findIndex((rv: any) =>
          compareItemEquality(v, rv, isItemEqualToValue),
        );
        return idx < start || idx > end;
      });
      return [...outsideRange, ...rangeValues];
    }

    case 'selectRange': {
      const start = Math.min(action.from, action.to);
      const end = Math.max(action.from, action.to);
      const nextValue = [...currentValue];
      for (let i = start; i <= end; i += 1) {
        const val = valuesRef[i];
        if (
          val !== undefined &&
          !disabledItemsRef[i] &&
          !nextValue.some((v) => compareItemEquality(v, val, isItemEqualToValue))
        ) {
          nextValue.push(val);
        }
      }
      return nextValue;
    }

    case 'selectAll': {
      return valuesRef.filter((v, index) => v !== undefined && !disabledItemsRef[index]);
    }

    case 'clear': {
      return EMPTY_ARRAY as any[];
    }

    default:
      return currentValue;
  }
}

/**
 * Returns true if the given selection mode supports multiple selected items.
 */
export function isMultipleSelectionMode(mode: SelectionMode): boolean {
  return mode === 'multiple' || mode === 'explicit-multiple';
}
