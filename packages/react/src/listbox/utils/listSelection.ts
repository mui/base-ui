import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { REASONS } from '../../internals/reasons';

/** Reads the items a selection gesture selects from, by position. */
export interface SelectionItems {
  count: number;
  getValue: (index: number) => any;
  indexOfValue: (value: any) => number;
  isSameValue: (a: any, b: any) => boolean;
  isDisabled: (index: number) => boolean;
  /**
   * Whether replacing the selection keeps the selected disabled items, which users can't
   * deselect. Set with multiple selection, where other items can be selected alongside them.
   */
  keepsDisabled: boolean;
}

/** Which modifiers were held during a press, and whether it was a touch. */
export interface PressModifiers {
  shiftKey?: boolean | undefined;
  /** Ctrl, or Cmd on macOS. */
  ctrlKey?: boolean | undefined;
  /** Touch has no modifier keys, so opt-in multiple selection toggles on tap. */
  touch?: boolean | undefined;
}

/** What caused a selection change. */
export type SelectionReason =
  typeof REASONS.itemPress | typeof REASONS.listNavigation | typeof REASONS.escapeKey;

export interface ListSelectionParameters<E> {
  /** The selected values. */
  getValue: () => any[];
  /** The items to select from. */
  getItems: () => SelectionItems;
  /**
   * `false` for single selection, `true` when each item is toggled independently, and `'opt-in'`
   * when a press without a modifier replaces the selection.
   */
  getMultiple: () => boolean | 'opt-in';
  /**
   * The item a Shift+press extends a range from when nothing was pressed or selected before it.
   */
  getDefaultAnchor: () => number;
  /** Receives the next selected values. Called even when they're the same as the current ones. */
  commit: (nextValue: any[], reason: SelectionReason, event: E) => void;
}

/**
 * The selection gestures of a list of options, as the APG listbox pattern describes them. Turns
 * presses and keyboard commands into the next selected values, and remembers the item that
 * Shift+press extends a range from.
 */
export class ListSelection<E = Event> {
  declare private readonly parameters: ListSelectionParameters<E>;

  /** The last pressed or selected item, which Shift+press extends a range from. */
  private pressAnchor: number | null = null;

  constructor(parameters: ListSelectionParameters<E>) {
    this.parameters = parameters;
  }

  /** A click, tap, or Enter/Space on an item. */
  press(index: number, modifiers: PressModifiers, event: E) {
    const { shiftKey = false, ctrlKey = false, touch = false } = modifiers;
    const multiple = this.parameters.getMultiple();
    const replaceOnPress = multiple === 'opt-in' && !touch;
    if (shiftKey && multiple && this.pressAnchor === null) {
      this.pressAnchor = this.parameters.getDefaultAnchor();
    }
    const anchorIndex = this.pressAnchor;
    const { value, items } = this.read();

    let nextValue: any[];
    // Extending a range keeps its anchor, so the next Shift+press extends from the same item.
    let keepsAnchor = false;
    if (shiftKey && multiple) {
      if (replaceOnPress && ctrlKey) {
        // Ctrl/Cmd+Shift adds the range to the existing selection.
        nextValue =
          anchorIndex === null
            ? toggle(value, items, index)
            : addRange(value, items, anchorIndex, index);
      } else {
        nextValue = replaceWithRange(value, items, anchorIndex, index);
        keepsAnchor = true;
      }
    } else if (multiple && (!replaceOnPress || ctrlKey)) {
      // `multiple` toggles on every press; opt-in mode toggles with Ctrl/Cmd.
      nextValue = toggle(value, items, index);
    } else {
      nextValue = select(value, items, index);
    }

    this.parameters.commit(nextValue, REASONS.itemPress, event);

    if (!keepsAnchor) {
      this.pressAnchor = index;
    }
  }

  /**
   * Selects or deselects one item and leaves the rest of the selection as it is. The next
   * Shift+press extends a range from the item.
   */
  setSelected(index: number, selected: boolean, event: E) {
    const { value, items } = this.read();
    const itemValue = enabledValueAt(items, index);
    if (itemValue === undefined) {
      return;
    }
    if (value.some((v) => items.isSameValue(v, itemValue)) !== selected) {
      this.parameters.commit(toggle(value, items, index), REASONS.itemPress, event);
    }
    this.pressAnchor = index;
  }

  /**
   * Moves the selection to an item, as focus moves to it in opt-in mode. A disabled item can't be
   * selected, so nothing is.
   */
  moveTo(index: number, event: E) {
    const { value, items } = this.read();
    const itemValue = enabledValueAt(items, index);
    this.parameters.commit(
      replaceWith(value, items, itemValue === undefined ? [] : [itemValue]),
      REASONS.listNavigation,
      event,
    );
    this.pressAnchor = index;
  }

  /**
   * Selects the range from an anchor to an item, replacing the rest of the selection, so the
   * range grows and shrinks as the item changes.
   */
  extendTo(index: number, anchorIndex: number | null, event: E) {
    const { value, items } = this.read();
    this.parameters.commit(
      replaceWithRange(value, items, anchorIndex, index),
      REASONS.listNavigation,
      event,
    );
  }

  /** Adds a range to the selection. `anchorIndex` is where the next Shift+press extends from. */
  selectRange(from: number, to: number, anchorIndex: number, event: E) {
    const { value, items } = this.read();
    this.parameters.commit(addRange(value, items, from, to), REASONS.listNavigation, event);
    this.pressAnchor = anchorIndex;
  }

  /** Disabled items keep their state: the selected ones stay selected, and the others aren't. */
  selectAll(event: E) {
    const { value, items } = this.read();
    const nextValue: any[] = [];
    for (let i = 0; i < items.count; i += 1) {
      const itemValue = items.getValue(i);
      if (
        itemValue !== undefined &&
        (!items.isDisabled(i) || value.some((v) => items.isSameValue(v, itemValue)))
      ) {
        nextValue.push(itemValue);
      }
    }
    this.parameters.commit(nextValue, REASONS.listNavigation, event);
  }

  clear(event: E) {
    const { value, items } = this.read();
    this.parameters.commit(replaceWith(value, items, []), REASONS.escapeKey, event);
  }

  private read() {
    return { value: this.parameters.getValue(), items: this.parameters.getItems() };
  }
}

/** The value of an item that can be selected, or `undefined` when it's disabled or missing. */
function enabledValueAt(items: SelectionItems, index: number): any {
  const itemValue = items.getValue(index);
  return itemValue === undefined || items.isDisabled(index) ? undefined : itemValue;
}

/** The values of the items between two positions that can be selected. */
function enabledValuesBetween(items: SelectionItems, from: number, to: number): any[] {
  const values: any[] = [];
  const end = Math.max(from, to);
  for (let i = Math.min(from, to); i <= end; i += 1) {
    const itemValue = enabledValueAt(items, i);
    if (itemValue !== undefined) {
      values.push(itemValue);
    }
  }
  return values;
}

/**
 * Replaces the selection with `values`, which are never disabled. With multiple selection, the
 * selected disabled items stay selected, since users can't deselect them.
 */
function replaceWith(currentValue: any[], items: SelectionItems, values: any[]): any[] {
  let next = values;
  if (items.keepsDisabled) {
    const selectedDisabled = currentValue.filter((v) => {
      const index = items.indexOfValue(v);
      return index !== -1 && items.isDisabled(index);
    });
    next = [...values, ...selectedDisabled];
  }
  return next.length === 0 ? (EMPTY_ARRAY as any[]) : next;
}

/** Makes an item the selection. Nothing changes when it can't be selected. */
function select(currentValue: any[], items: SelectionItems, index: number): any[] {
  const itemValue = enabledValueAt(items, index);
  return itemValue === undefined ? currentValue : replaceWith(currentValue, items, [itemValue]);
}

function toggle(currentValue: any[], items: SelectionItems, index: number): any[] {
  const itemValue = enabledValueAt(items, index);
  if (itemValue === undefined) {
    return currentValue;
  }
  if (currentValue.some((v) => items.isSameValue(v, itemValue))) {
    return currentValue.filter((v) => !items.isSameValue(v, itemValue));
  }
  return [...currentValue, itemValue];
}

/** Makes the range from an anchor to an item the selection, or just the item without an anchor. */
function replaceWithRange(
  currentValue: any[],
  items: SelectionItems,
  anchorIndex: number | null,
  index: number,
): any[] {
  return anchorIndex === null
    ? select(currentValue, items, index)
    : replaceWith(currentValue, items, enabledValuesBetween(items, anchorIndex, index));
}

/** Adds the items between two positions to the selection. */
function addRange(currentValue: any[], items: SelectionItems, from: number, to: number): any[] {
  const nextValue = [...currentValue];
  const selectedValues = new Set(currentValue);
  for (const itemValue of enabledValuesBetween(items, from, to)) {
    if (!selectedValues.has(itemValue)) {
      selectedValues.add(itemValue);
      nextValue.push(itemValue);
    }
  }
  return nextValue;
}
