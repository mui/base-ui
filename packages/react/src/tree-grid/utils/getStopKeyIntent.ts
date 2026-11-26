import {
  getFirstNavigableItem,
  getLastNavigableItem,
  getNextNavigableItem,
  getPreviousNavigableItem,
} from '../../tree/store/treeNavigation';
import type { TreeItemId, TreeState } from '../../tree/store/types';
import type { TreeGridCellControlKeys } from '../cell-control/TreeGridCellControl';

/** Finds the row a move in the column goes to, from the row the key was pressed in. */
export type StopKeyTargetRow = (state: TreeState, itemId: TreeItemId) => TreeItemId | null;

/** What a key pressed on a stop of a row does. */
export type StopKeyIntent =
  /** The control or the browser keeps the key. */
  | { type: 'control' }
  /** The row handles the key as if it was pressed on the row. */
  | { type: 'row' }
  /** Focus moves to another stop of the row. */
  | { type: 'stop'; index: number }
  /** Focus returns to the row. Escape also stops there, so an enclosing dialog stays open. */
  | { type: 'focus-row'; stopPropagation: boolean }
  /** Focus moves to the same column in another row. */
  | { type: 'column'; row: StopKeyTargetRow }
  /** The key is consumed and focus stays, such as forward from the last stop. */
  | { type: 'none' };

/** The parts of the keyboard event the decision reads, as a React keyboard event has them. */
export interface StopKeyEvent {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  defaultPrevented: boolean;
  nativeEvent: { isComposing: boolean };
}

/** What the grid knows about the focused stop and its row. */
export interface StopKeyFacts {
  isRtl: boolean;
  /** Whether a cell has focus, rather than a control. */
  isCell: boolean;
  /**
   * Whether the control is disabled but stays focusable. It prevents every key to
   * block its activation, while the navigation keys still apply.
   */
  disabledFocusable: boolean;
  /** The keys the control keeps: none for a cell, or for a control that can't act on keys. */
  keys: TreeGridCellControlKeys;
  /** Whether a text field moves its caret with the horizontal arrow pressed. */
  keepsCaret: boolean;
  /** The index of the focused element among the row's stops, `-1` when it isn't one. */
  index: number;
  /** The number of stops of the row. */
  count: number;
  /** Whether the row has several cells, so the vertical keys stay in the column. */
  inColumn: boolean;
}

const NAVIGATION_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'Escape',
]);

/** Whether a key pressed on a stop can do anything else than reach the control. */
export function isStopKey(key: string): boolean {
  return key === ' ' || NAVIGATION_KEYS.has(key);
}

const CONTROL: StopKeyIntent = { type: 'control' };
const ROW: StopKeyIntent = { type: 'row' };
const NONE: StopKeyIntent = { type: 'none' };

/**
 * Decides what a key pressed on a control or a cell of a tree grid row does. The
 * control keeps every key it declares as its own; the remaining navigation keys
 * move through the row and the tree. Modified keys stay with the control and the
 * browser, except Ctrl+Home and Ctrl+End in a row of several cells.
 */
export function getStopKeyIntent(event: StopKeyEvent, stop: StopKeyFacts): StopKeyIntent {
  const { key } = event;
  const { keys, index, count } = stop;
  const modified = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
  if (key === ' ') {
    // A cell has no action of its own, so Space selects its row as on the row.
    return stop.isCell && !modified ? ROW : CONTROL;
  }
  if (!NAVIGATION_KEYS.has(key)) {
    return CONTROL;
  }
  const columnEdgeKey =
    (key === 'Home' || key === 'End') &&
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey;
  if (
    (event.defaultPrevented && !stop.disabledFocusable) ||
    (modified && !columnEdgeKey) ||
    event.nativeEvent.isComposing
  ) {
    return CONTROL;
  }

  const forwardKey = stop.isRtl ? 'ArrowLeft' : 'ArrowRight';
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowRight':
      if (keys.horizontal === 'control' || stop.keepsCaret) {
        return CONTROL;
      }
      // Bounded: backward from the first stop returns to the row, forward from
      // the last one stays put.
      if (key === forwardKey) {
        return index < count - 1 ? { type: 'stop', index: index + 1 } : NONE;
      }
      return index > 0
        ? { type: 'stop', index: index - 1 }
        : { type: 'focus-row', stopPropagation: false };
    case 'ArrowDown':
    case 'ArrowUp':
      if (keys.vertical === 'control') {
        return CONTROL;
      }
      // In a row of a single cell, the row moves on to the next row.
      if (!stop.inColumn) {
        return ROW;
      }
      return {
        type: 'column',
        row: key === 'ArrowDown' ? getNextNavigableItem : getPreviousNavigableItem,
      };
    case 'Home':
    case 'End':
      if (keys.homeEnd === 'control') {
        return CONTROL;
      }
      if (columnEdgeKey) {
        return stop.inColumn
          ? { type: 'column', row: key === 'Home' ? getFirstNavigableItem : getLastNavigableItem }
          : CONTROL;
      }
      if (count === 0) {
        return { type: 'focus-row', stopPropagation: false };
      }
      return { type: 'stop', index: key === 'Home' ? 0 : count - 1 };
    default:
      // Escape. Escape on the row itself is left to the containing UI.
      return keys.escape === 'control' ? CONTROL : { type: 'focus-row', stopPropagation: true };
  }
}
