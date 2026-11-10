export interface ListKey {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

export interface ListKeyContext {
  orientation: 'vertical' | 'horizontal';
  rtl: boolean;
  /** The index of the item that holds the tab stop. */
  currentIndex: number | null;
  /** How many items the list has, including those that aren't rendered. */
  count: number;
  multiple: boolean | 'opt-in';
  /** Whether the platform is macOS, which reserves Ctrl+Arrow and Cmd+Arrow. */
  mac: boolean;
}

export type ListKeyCommand =
  /** Moves focus to an item. With `select`, the selection moves to it too. */
  | { type: 'move'; index: number; select: boolean }
  /** Moves focus to an item and selects the range from the range anchor to it. */
  | { type: 'extend'; index: number }
  /** Selects a range and moves focus to `focusIndex`, which also becomes the range anchor. */
  | { type: 'selectRange'; from: number; to: number; focusIndex: number }
  | { type: 'selectAll' }
  | { type: 'clear' }
  /** The list owns the key, but there's nothing to do, such as an arrow key at the end. */
  | { type: 'none' };

/**
 * Resolves a key press on the list to what it does, following the APG listbox pattern.
 * Returns `null` for keys that the list doesn't handle.
 */
export function resolveListKeyCommand(
  key: ListKey,
  context: ListKeyContext,
): ListKeyCommand | null {
  const { currentIndex, count, multiple, mac } = context;
  const { shiftKey, ctrlKey, metaKey, altKey } = key;
  const optIn = multiple === 'opt-in';
  const step = getArrowStep(key.key, context);

  if (!shiftKey && !ctrlKey && !metaKey && !altKey) {
    if (key.key === 'Escape') {
      return multiple ? { type: 'clear' } : null;
    }
    if (count === 0) {
      return null;
    }

    const fromIndex = currentIndex ?? 0;
    let index: number;
    if (step !== 0) {
      index = Math.min(Math.max(fromIndex + step, 0), count - 1);
    } else if (key.key === 'Home') {
      index = 0;
    } else if (key.key === 'End') {
      index = count - 1;
    } else {
      return null;
    }

    if (index === fromIndex) {
      return { type: 'none' };
    }
    // In opt-in mode, the selection follows focus (the APG alternative multiple selection model).
    return { type: 'move', index, select: optIn && step !== 0 };
  }

  if (!multiple) {
    return null;
  }

  if (key.key === 'Escape') {
    return { type: 'clear' };
  }

  const ctrlOrMeta = ctrlKey || metaKey;

  // Opt-in mode: Ctrl+Arrow moves focus without changing the selection. macOS reserves
  // Ctrl+Arrow and uses Cmd+Arrow to jump to the ends, so Option+Arrow does it there.
  const moveWithoutSelecting = mac ? altKey && !ctrlOrMeta : ctrlOrMeta;
  if (optIn && moveWithoutSelecting && !shiftKey && step !== 0 && currentIndex != null) {
    const index = currentIndex + step;
    return isInList(index, count) ? { type: 'move', index, select: false } : { type: 'none' };
  }

  if (shiftKey && !ctrlOrMeta && step !== 0 && currentIndex != null) {
    const index = currentIndex + step;
    return isInList(index, count) ? { type: 'extend', index } : null;
  }

  if (ctrlOrMeta && shiftKey && (key.key === 'Home' || key.key === 'End')) {
    if (currentIndex == null) {
      return { type: 'none' };
    }
    return key.key === 'Home'
      ? { type: 'selectRange', from: 0, to: currentIndex, focusIndex: 0 }
      : { type: 'selectRange', from: currentIndex, to: count - 1, focusIndex: count - 1 };
  }

  // The APG makes deselecting a fully selected list optional, and Escape already clears the
  // selection.
  if (ctrlOrMeta && (key.key === 'a' || key.key === 'A')) {
    return { type: 'selectAll' };
  }

  return null;
}

/** `1` for the arrow key that moves forward, `-1` for the one that moves backward, else `0`. */
function getArrowStep(key: string, context: ListKeyContext): -1 | 0 | 1 {
  let forwardKey = 'ArrowDown';
  let backwardKey = 'ArrowUp';
  if (context.orientation === 'horizontal') {
    forwardKey = context.rtl ? 'ArrowLeft' : 'ArrowRight';
    backwardKey = context.rtl ? 'ArrowRight' : 'ArrowLeft';
  }
  if (key === forwardKey) {
    return 1;
  }
  return key === backwardKey ? -1 : 0;
}

function isInList(index: number, count: number) {
  return index >= 0 && index < count;
}
