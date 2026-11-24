import { REASONS } from '../../internals/reasons';

/** Reads the items a selection gesture selects from, by position. */
export interface SelectionItems {
  count: number;
  getValue: (index: number) => any;
  indexOfValue: (value: any) => number;
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
export type SelectionReason = typeof REASONS.itemPress | typeof REASONS.listNavigation;

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
  /**
   * Receives the next selected values. Called even when they're the same as the current ones.
   * Returns `false` when the change was rejected, such as when it was canceled.
   */
  commit: (nextValue: any[], reason: SelectionReason, event: E) => boolean | void;
}

/**
 * The selection gestures of a list of options, as the APG listbox pattern describes them. Turns
 * presses and keyboard commands into the next selected values, and remembers the item that
 * Shift+press extends a range from.
 */
/**
 * An item a range extends from. It's remembered by its value, so it's found again after items are
 * added or removed around it, and by its position, which tells items that share a value apart.
 */
export interface RangeAnchor {
  index: number;
  value: any;
}

export class ListSelection<E = Event> {
  declare private readonly parameters: ListSelectionParameters<E>;

  /** The last pressed or selected item, which Shift+press extends a range from. */
  private pressAnchor: RangeAnchor | null = null;

  /** The item that had focus when `pressAnchor` was last set or kept. */
  private anchorFocus: RangeAnchor | null = null;

  constructor(parameters: ListSelectionParameters<E>) {
    this.parameters = parameters;
  }

  /** A click, tap, or Enter/Space on an item. */
  press(index: number, modifiers: PressModifiers, event: E) {
    const { shiftKey = false, ctrlKey = false, touch = false } = modifiers;
    const multiple = this.parameters.getMultiple();
    const replaceOnPress = multiple === 'opt-in' && !touch;
    if (shiftKey && multiple && this.resolveAnchor(this.pressAnchor) === null) {
      this.pressAnchor = this.createAnchor(this.parameters.getDefaultAnchor());
    }
    const anchorIndex = this.resolveAnchor(this.pressAnchor);
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

    // A rejected change leaves the anchor where it was, with the selection it belongs to.
    if (this.parameters.commit(nextValue, REASONS.itemPress, event) === false) {
      return;
    }

    if (!keepsAnchor) {
      this.pressAnchor = this.createAnchor(index);
    }
    this.anchorFocus = this.createAnchor(index);
  }

  /** Remembers the item at a position as an anchor. */
  createAnchor(index: number | null): RangeAnchor | null {
    return index === null ? null : { index, value: this.parameters.getItems().getValue(index) };
  }

  /** Where an anchor's item is now, or `null` when there's no anchor or its item is gone. */
  resolveAnchor(anchor: RangeAnchor | null): number | null {
    if (anchor === null) {
      return null;
    }
    const items = this.parameters.getItems();
    if (Object.is(items.getValue(anchor.index), anchor.value)) {
      return anchor.index;
    }
    const index = items.indexOfValue(anchor.value);
    return index === -1 ? null : index;
  }

  /**
   * Where a Shift+Arrow range starts from the focused item: the press anchor while focus is still
   * on the item that set or kept it, so Shift+Arrow continues a Shift+press range, and the focused
   * item once focus has moved elsewhere.
   */
  getRangeAnchor(focusedIndex: number | null): number | null {
    const pressIndex = this.resolveAnchor(this.pressAnchor);
    return pressIndex !== null && this.resolveAnchor(this.anchorFocus) === focusedIndex
      ? pressIndex
      : focusedIndex;
  }

  /**
   * Moves the selection to an item, as focus moves to it in opt-in mode. A disabled item can't be
   * selected, so the selection stays where it was while focus is on one.
   */
  moveTo(index: number, event: E) {
    const { value, items } = this.read();
    const itemValue = enabledValueAt(items, index);
    if (
      itemValue !== undefined &&
      this.parameters.commit(
        replaceWith(value, items, [itemValue]),
        REASONS.listNavigation,
        event,
      ) === false
    ) {
      return;
    }
    this.pressAnchor = this.createAnchor(index);
    this.anchorFocus = this.createAnchor(index);
  }

  /**
   * Selects the range from an anchor to an item, replacing the rest of the selection, so the
   * range grows and shrinks as the item changes. The anchor becomes the one Shift+press extends
   * from, too.
   */
  extendTo(index: number, anchorIndex: number | null, event: E) {
    const { value, items } = this.read();
    if (
      this.parameters.commit(
        replaceWithRange(value, items, anchorIndex, index),
        REASONS.listNavigation,
        event,
      ) === false
    ) {
      return;
    }
    this.pressAnchor = this.createAnchor(anchorIndex);
    this.anchorFocus = this.createAnchor(index);
  }

  /** Adds a range to the selection. `anchorIndex` is where the next Shift+press extends from. */
  selectRange(from: number, to: number, anchorIndex: number, event: E) {
    const { value, items } = this.read();
    if (
      this.parameters.commit(addRange(value, items, from, to), REASONS.listNavigation, event) ===
      false
    ) {
      return;
    }
    this.pressAnchor = this.createAnchor(anchorIndex);
    this.anchorFocus = this.createAnchor(anchorIndex);
  }

  /** Disabled items keep their state: the selected ones stay selected, and the others aren't. */
  selectAll(event: E) {
    const { value, items } = this.read();
    const selected = new Set(value);
    const nextValue: any[] = [];
    for (let i = 0; i < items.count; i += 1) {
      const itemValue = items.getValue(i);
      if (itemValue !== undefined && (!items.isDisabled(i) || selected.has(itemValue))) {
        nextValue.push(itemValue);
      }
    }
    this.parameters.commit(nextValue, REASONS.listNavigation, event);
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
  if (!items.keepsDisabled || currentValue.length === 0) {
    return values;
  }
  let selectedDisabled: any[];
  if (currentValue.length < items.count) {
    selectedDisabled = currentValue.filter((v) => {
      const index = items.indexOfValue(v);
      return index !== -1 && items.isDisabled(index);
    });
  } else {
    // With most items selected, walking the items once is cheaper than looking each selected
    // value up, which scans the list when it has no `items`.
    const selected = new Set(currentValue);
    selectedDisabled = [];
    for (let i = 0; i < items.count; i += 1) {
      const itemValue = items.getValue(i);
      if (itemValue !== undefined && items.isDisabled(i) && selected.has(itemValue)) {
        selectedDisabled.push(itemValue);
      }
    }
  }
  return selectedDisabled.length === 0 ? values : [...values, ...selectedDisabled];
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
  if (currentValue.some((v) => Object.is(v, itemValue))) {
    return currentValue.filter((v) => !Object.is(v, itemValue));
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
