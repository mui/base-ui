import { EMPTY_ARRAY } from '@base-ui/utils/empty';

/**
 * What a selection gesture does to the selected values. `selectionReducer` computes the next
 * values from one.
 */
type SelectionAction =
  | { type: 'select'; index: number }
  | { type: 'moveSelection'; index: number }
  | { type: 'toggle'; index: number }
  | { type: 'extendTo'; index: number; anchorIndex: number | null }
  | { type: 'selectRange'; from: number; to: number }
  | { type: 'selectAll' }
  | { type: 'clear' };

/** Reads the items the reducer selects from, by position. */
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
export type SelectionSource = 'press' | 'keyboard' | 'escape';

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
  commit: (nextValue: any[], source: SelectionSource, event: E) => void;
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

    let action: SelectionAction;
    if (shiftKey && multiple) {
      if (replaceOnPress && ctrlKey) {
        // Ctrl/Cmd+Shift adds the range to the existing selection.
        action =
          anchorIndex === null
            ? { type: 'toggle', index }
            : { type: 'selectRange', from: anchorIndex, to: index };
      } else {
        action = { type: 'extendTo', index, anchorIndex };
      }
    } else if (multiple && (!replaceOnPress || ctrlKey)) {
      // `multiple` toggles on every press; opt-in mode toggles with Ctrl/Cmd.
      action = { type: 'toggle', index };
    } else {
      action = { type: 'select', index };
    }

    this.dispatch(action, 'press', event);

    // Extending a range keeps its anchor, so the next Shift+press extends from the same item.
    if (action.type !== 'extendTo') {
      this.pressAnchor = index;
    }
  }

  /** Moves the selection to an item, as focus moves to it in opt-in mode. */
  moveTo(index: number, event: E) {
    this.dispatch({ type: 'moveSelection', index }, 'keyboard', event);
    this.pressAnchor = index;
  }

  /**
   * Selects the range from an anchor to an item, replacing the rest of the selection, so the
   * range grows and shrinks as the item changes.
   */
  extendTo(index: number, anchorIndex: number | null, event: E) {
    this.dispatch({ type: 'extendTo', index, anchorIndex }, 'keyboard', event);
  }

  /** Adds a range to the selection. `anchorIndex` is where the next Shift+press extends from. */
  selectRange(from: number, to: number, anchorIndex: number, event: E) {
    this.dispatch({ type: 'selectRange', from, to }, 'keyboard', event);
    this.pressAnchor = anchorIndex;
  }

  selectAll(event: E) {
    this.dispatch({ type: 'selectAll' }, 'keyboard', event);
  }

  clear(event: E) {
    this.dispatch({ type: 'clear' }, 'escape', event);
  }

  private dispatch(action: SelectionAction, source: SelectionSource, event: E) {
    const { getValue, getItems, commit } = this.parameters;
    commit(selectionReducer(action, getValue(), getItems()), source, event);
  }
}

/**
 * Computes the next selected values from an action. It has no side effects.
 */
function selectionReducer(
  action: SelectionAction,
  currentValue: any[],
  items: SelectionItems,
): any[] {
  const { count, getValue, indexOfValue, isSameValue, isDisabled, keepsDisabled } = items;

  // Replaces the selection with `values`, which are never disabled. With multiple selection, the
  // selected disabled items stay selected, since users can't deselect them.
  function replaceWith(values: any[]): any[] {
    if (!keepsDisabled) {
      return values.length === 0 ? (EMPTY_ARRAY as any[]) : values;
    }
    const selectedDisabled = currentValue.filter((v) => {
      const index = indexOfValue(v);
      return index !== -1 && isDisabled(index);
    });
    const next = [...values, ...selectedDisabled];
    return next.length === 0 ? (EMPTY_ARRAY as any[]) : next;
  }

  switch (action.type) {
    case 'select': {
      const itemValue = getValue(action.index);
      if (itemValue === undefined || isDisabled(action.index)) {
        return currentValue;
      }
      return replaceWith([itemValue]);
    }

    // Moving focus in opt-in mode: the focused item becomes the selection, and a disabled one
    // can't be selected, so nothing is.
    case 'moveSelection': {
      const itemValue = getValue(action.index);
      if (itemValue === undefined || isDisabled(action.index)) {
        return replaceWith([]);
      }
      return replaceWith([itemValue]);
    }

    case 'toggle': {
      const itemValue = getValue(action.index);
      if (itemValue === undefined || isDisabled(action.index)) {
        return currentValue;
      }
      if (currentValue.some((v) => isSameValue(v, itemValue))) {
        return currentValue.filter((v) => !isSameValue(v, itemValue));
      }
      return [...currentValue, itemValue];
    }

    case 'extendTo': {
      const anchorIndex = action.anchorIndex;
      if (anchorIndex === null) {
        // No anchor — treat as a single select
        const itemValue = getValue(action.index);
        return itemValue !== undefined && !isDisabled(action.index)
          ? replaceWith([itemValue])
          : currentValue;
      }
      const start = Math.min(anchorIndex, action.index);
      const end = Math.max(anchorIndex, action.index);
      const rangeValues: any[] = [];
      for (let i = start; i <= end; i += 1) {
        const val = getValue(i);
        if (val !== undefined && !isDisabled(i)) {
          rangeValues.push(val);
        }
      }
      return replaceWith(rangeValues);
    }

    case 'selectRange': {
      const start = Math.min(action.from, action.to);
      const end = Math.max(action.from, action.to);
      const nextValue = [...currentValue];
      for (let i = start; i <= end; i += 1) {
        const val = getValue(i);
        if (val !== undefined && !isDisabled(i) && !nextValue.some((v) => isSameValue(v, val))) {
          nextValue.push(val);
        }
      }
      return nextValue;
    }

    // Disabled items keep their state: the selected ones stay selected, and the others aren't.
    case 'selectAll': {
      const nextValue: any[] = [];
      for (let i = 0; i < count; i += 1) {
        const val = getValue(i);
        if (
          val !== undefined &&
          (!isDisabled(i) || currentValue.some((v) => isSameValue(v, val)))
        ) {
          nextValue.push(val);
        }
      }
      return nextValue;
    }

    case 'clear': {
      return replaceWith([]);
    }

    default:
      return currentValue;
  }
}
