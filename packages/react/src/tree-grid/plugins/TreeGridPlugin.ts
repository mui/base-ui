import type * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { activeElement, contains } from '@base-ui/utils/shadowDom';
import { REASONS } from '../../internals/reasons';
import type { TreeDefaultItem, TreeItemId, TreeSelectionMode } from '../../tree/store/types';
import type { TreeStore } from '../../tree/store/TreeStore';
import { selectors } from '../../tree/store/selectors';
import {
  getFirstNavigableItem,
  getLastNavigableItem,
  getNextNavigableItem,
  getPreviousNavigableItem,
} from '../../tree/store/treeNavigation';
import { isControlFocusable, sortInComposedOrder } from '../../tree/utils/focusability';
import { getItemIdKey } from '../../tree/utils/itemIdKey';
import type { TreeGridCellControlKeys } from '../cell-control/TreeGridCellControl';

interface RegisteredControl {
  element: HTMLElement;
  getKeys: () => Required<TreeGridCellControlKeys>;
  isDisabled: () => boolean;
}

/**
 * A place the arrows stop at inside a row: a control, or a cell without one in a
 * row of several cells.
 */
interface Stop {
  element: HTMLElement;
  control: RegisteredControl | null;
}

/** Where a stop sits in its row: its cell, and its index among the cell's stops. */
interface ColumnPosition {
  cellIndex: number;
  index: number;
}

const CONTROL_NAVIGATION_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'Escape',
]);

// A cell has no keys of its own.
const CELL_KEYS: Required<TreeGridCellControlKeys> = {
  horizontal: 'tree',
  vertical: 'tree',
  homeEnd: 'tree',
  escape: 'tree',
};

/**
 * Whether a horizontal arrow moves the caret of a text field instead of leaving
 * it: the field has a selection, or its caret is away from the edge the arrow
 * moves toward. Inputs without a selection API, such as `email` and `number`,
 * never keep it.
 */
function keepsHorizontalArrow(element: Element, key: string): boolean {
  if (element.localName !== 'input' && element.localName !== 'textarea') {
    return false;
  }
  const { selectionStart, selectionEnd, value } = element as HTMLInputElement | HTMLTextAreaElement;
  if (selectionStart == null) {
    return false;
  }
  if (selectionStart !== selectionEnd) {
    return true;
  }
  // The caret follows the text's direction, which can differ from the tree's.
  const isRtl = ownerWindow(element).getComputedStyle(element).direction === 'rtl';
  const forward = key === (isRtl ? 'ArrowLeft' : 'ArrowRight');
  return forward ? selectionStart < value.length : selectionStart > 0;
}

/**
 * Lets the keyboard reach the cells and controls of the rows, for `TreeGrid`:
 * the arrows move between a row and its stops, Up and Down stay in the column
 * of a row with several cells, and each control keeps the keys it uses.
 */
export class TreeGridPlugin<TItem = TreeDefaultItem> {
  /** Adds the grid navigation to a store. Installed by `TreeGrid.Root`. */
  static install(store: TreeStore<any, any>) {
    store.grid = new TreeGridPlugin(store);
  }

  declare private store: TreeStore<TreeSelectionMode | undefined, TItem>;

  /** Controls registered by the cell parts, keyed by item. */
  private controls = new Map<string, Set<RegisteredControl>>();

  /** Cells registered by `TreeGrid.Cell`, keyed by item. */
  private cells = new Map<string, Set<HTMLElement>>();

  /** Header cells registered by `TreeGrid.HeaderCell`. */
  private headerCells = new Set<HTMLElement>();

  constructor(store: TreeStore<TreeSelectionMode | undefined, TItem>) {
    this.store = store;
  }

  /**
   * Registers a control rendered inside an item's row so the row's keyboard
   * navigation can reach it. Returns the cleanup that unregisters it, to run
   * from a ref cleanup.
   */
  public registerControl = (
    itemId: TreeItemId,
    element: HTMLElement,
    getKeys: () => Required<TreeGridCellControlKeys>,
    isDisabled: () => boolean,
  ): (() => void) => {
    const control: RegisteredControl = { element, getKeys, isDisabled };
    return this.register(this.controls, itemId, control, element);
  };

  /** Registers a cell of an item's row. Returns the cleanup that unregisters it. */
  public registerCell = (itemId: TreeItemId, element: HTMLElement): (() => void) =>
    this.register(this.cells, itemId, element, element);

  /** Registers a header cell. Returns the cleanup that unregisters it. */
  public registerHeaderCell = (element: HTMLElement): (() => void) => {
    this.headerCells.add(element);
    return () => {
      this.headerCells.delete(element);
    };
  };

  private register<T>(
    registry: Map<string, Set<T>>,
    itemId: TreeItemId,
    entry: T,
    element: HTMLElement,
  ): () => void {
    const key = getItemIdKey(itemId);
    let itemEntries = registry.get(key);
    if (itemEntries == null) {
      itemEntries = new Set();
      registry.set(key, itemEntries);
    }
    itemEntries.add(entry);

    return () => {
      itemEntries.delete(entry);
      if (itemEntries.size === 0 && registry.get(key) === itemEntries) {
        registry.delete(key);
      }
      // React detaches a ref before it removes the node, so a focused control
      // or cell that unmounts or swaps its element (a retry button whose error
      // cleared) is still focused here. Once the node is gone, focus falls to
      // the document body.
      if (activeElement(ownerDocument(element)) === element) {
        this.store.interaction.recoverFocusFromRemovedControl(itemId);
      }
    };
  }

  /** The registration of `element` among an item's controls. The last registration wins. */
  public findControl(itemKey: string | null, element: Element): RegisteredControl | undefined {
    let control: RegisteredControl | undefined;
    for (const candidate of (itemKey == null ? null : this.controls.get(itemKey)) ?? EMPTY_ARRAY) {
      if (candidate.element === element) {
        control = candidate;
      }
    }
    return control;
  }

  /** The number of cells of an item's row, and the number of header cells. */
  public getCellCounts(itemId: TreeItemId): { cells: number; headerCells: number } {
    return {
      cells: this.cells.get(getItemIdKey(itemId))?.size ?? 0,
      headerCells: this.headerCells.size,
    };
  }

  /** The focusable registered controls of an item, in composed tree order. */
  private getControls(itemId: TreeItemId): RegisteredControl[] {
    const itemElement = this.store.items.getItemDOMElement(itemId);
    const itemControls = this.controls.get(getItemIdKey(itemId));
    if (itemElement == null || itemControls == null) {
      return [];
    }
    return sortInComposedOrder(
      itemElement,
      Array.from(itemControls).filter(
        (control) => !control.isDisabled() && isControlFocusable(control.element, itemElement),
      ),
    );
  }

  /** The cells of an item's row, in composed tree order. */
  private getCells(itemId: TreeItemId): HTMLElement[] {
    const itemElement = this.store.items.getItemDOMElement(itemId);
    const itemCells = this.cells.get(getItemIdKey(itemId));
    if (itemElement == null || itemCells == null) {
      return [];
    }
    return sortInComposedOrder(
      itemElement,
      Array.from(itemCells, (element) => ({ element })).filter(
        ({ element }) => element.isConnected && contains(itemElement, element),
      ),
    ).map(({ element }) => element);
  }

  /**
   * The stops of an item's row, in order. A row with several cells also stops at
   * each cell without a control, so the keyboard reaches every value.
   */
  private getStops(itemId: TreeItemId): Stop[] {
    const itemElement = this.store.items.getItemDOMElement(itemId);
    if (itemElement == null) {
      return [];
    }
    const controls = this.getControls(itemId);
    const stops: Stop[] = controls.map((control) => ({ element: control.element, control }));
    const cells = this.getCells(itemId);
    if (cells.length > 1) {
      for (const cell of cells) {
        if (!controls.some((control) => contains(cell, control.element))) {
          stops.push({ element: cell, control: null });
        }
      }
    }
    return sortInComposedOrder(itemElement, stops);
  }

  /**
   * The stops of one cell of an item's row, or `null` when the row doesn't have
   * several cells, and so no columns to stay in.
   */
  private getCellStops(itemId: TreeItemId, cellIndex: number): Stop[] | null {
    const cells = this.getCells(itemId);
    const cell = cells[cellIndex];
    if (cells.length < 2 || cell == null) {
      return null;
    }
    return this.getStops(itemId).filter((stop) => contains(cell, stop.element));
  }

  /** Where `element` sits in the columns of its row, or `null` in a row of a single cell. */
  private getColumnPosition(itemId: TreeItemId, element: HTMLElement): ColumnPosition | null {
    const cells = this.getCells(itemId);
    if (cells.length < 2) {
      return null;
    }
    const cellIndex = cells.findIndex((cell) => contains(cell, element));
    if (cellIndex === -1) {
      return null;
    }
    const cellStops = this.getCellStops(itemId, cellIndex) ?? EMPTY_ARRAY;
    return {
      cellIndex,
      index: Math.max(
        0,
        cellStops.findIndex((stop) => stop.element === element),
      ),
    };
  }

  /** Focuses the first stop of an item. Returns whether the item has one. */
  public focusFirstStop(itemId: TreeItemId): boolean {
    const stops = this.getStops(itemId);
    if (stops.length === 0) {
      return false;
    }
    this.focusStop(stops[0]);
    return true;
  }

  /** The link among an item's controls. */
  public getLink(itemId: TreeItemId): HTMLElement | undefined {
    return this.getControls(itemId).find(
      (control) => control.element.localName === 'a' && control.element.hasAttribute('href'),
    )?.element;
  }

  /**
   * Focuses a stop without the browser's focus scroll, which scrolls every
   * ancestor. The list only scrolls rows into view vertically, so bring the
   * stop into view horizontally.
   */
  private focusStop(stop: Stop, event?: KeyboardEvent) {
    const element = stop.element;
    // A cell only takes focus while the keyboard is on it, so a click on its
    // text still focuses the row.
    if (stop.control == null && !element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
      element.addEventListener('blur', () => element.removeAttribute('tabindex'), { once: true });
    }
    this.store.interaction.focusElement(element, REASONS.keyboard, event);
    this.store.items.revealHorizontally(element);
  }

  /**
   * Moves to the stop at `position` in the row of `itemId`: the stop at the same
   * index in the same cell, or the last one before it. Falls back to the row
   * when it has no such cell.
   */
  private focusColumn(itemId: TreeItemId, position: ColumnPosition, event: KeyboardEvent) {
    const cellStops = selectors.isItemDisabled(this.store.state, itemId)
      ? null
      : this.getCellStops(itemId, position.cellIndex);
    if (cellStops == null || cellStops.length === 0) {
      this.store.interaction.focusItem(itemId, REASONS.keyboard, event);
      return;
    }
    this.focusStop(cellStops[Math.min(position.index, cellStops.length - 1)], event);
  }

  /**
   * Keys pressed on a registered control, or on a cell that has focus. The
   * control keeps every key it declares as its own; the remaining navigation
   * keys move through the row and the tree. Modified keys stay with the control
   * and the browser, except Ctrl+Home and Ctrl+End in a row of several cells.
   * Returns whether the row should handle the key as if pressed on itself.
   */
  public handleControlKeyDown(
    event: React.KeyboardEvent,
    itemId: TreeItemId,
    itemElement: HTMLElement,
    target: Element,
  ): boolean {
    const itemKey = getItemIdKey(itemId);
    const control = this.findControl(itemKey, target);
    const cell =
      control == null && this.cells.get(itemKey)?.has(target as HTMLElement)
        ? (target as HTMLElement)
        : null;
    if (control == null && cell == null) {
      return false;
    }
    // A cell has no action of its own, so Space selects its row as on the row.
    if (cell != null && event.key === ' ' && !hasModifier(event)) {
      return true;
    }
    if (!CONTROL_NAVIGATION_KEYS.has(event.key)) {
      return false;
    }
    // A disabled control that stays focusable prevents every key to block its
    // activation. Navigation keys still apply to it.
    const disabledFocusable = target.getAttribute('aria-disabled') === 'true';
    const columnEdgeKey =
      (event.key === 'Home' || event.key === 'End') &&
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey;
    if (
      (event.defaultPrevented && !disabledFocusable) ||
      (hasModifier(event) && !columnEdgeKey) ||
      event.nativeEvent.isComposing
    ) {
      return false;
    }

    // A disabled control can't act on any key, so the navigation keys move
    // focus away from it, including from one that stays focusable.
    const unavailable =
      control != null &&
      (disabledFocusable ||
        control.isDisabled() ||
        !isControlFocusable(control.element, itemElement));
    let keys: TreeGridCellControlKeys = CELL_KEYS;
    if (control != null) {
      keys = unavailable ? {} : control.getKeys();
    }
    const isRtl = this.store.state.direction === 'rtl';
    const forwardKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const backwardKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
    const element = target as HTMLElement;

    switch (event.key) {
      case forwardKey:
      case backwardKey: {
        if (
          keys.horizontal === 'control' ||
          (!unavailable && keepsHorizontalArrow(target, event.key))
        ) {
          return false;
        }
        event.preventDefault();
        const stops = this.getStops(itemId);
        const index = stops.findIndex((stop) => stop.element === element);
        // Bounded: backward from the first stop returns to the row, forward
        // from the last one stays put.
        if (event.key === backwardKey) {
          if (index > 0) {
            this.focusStop(stops[index - 1], event.nativeEvent);
          } else {
            itemElement.focus({ preventScroll: true });
          }
        } else if (index < stops.length - 1) {
          this.focusStop(stops[index + 1], event.nativeEvent);
        }
        return false;
      }
      case 'ArrowDown':
      case 'ArrowUp': {
        if (keys.vertical === 'control') {
          return false;
        }
        // In a row of a single cell, the row moves on to the next row.
        const position = this.getColumnPosition(itemId, element);
        if (position == null) {
          return true;
        }
        event.preventDefault();
        const targetItem = (
          event.key === 'ArrowDown' ? getNextNavigableItem : getPreviousNavigableItem
        )(this.store.state, itemId);
        if (targetItem != null) {
          this.focusColumn(targetItem, position, event.nativeEvent);
        }
        return false;
      }
      case 'Home':
      case 'End': {
        if (keys.homeEnd === 'control') {
          return false;
        }
        if (columnEdgeKey) {
          const position = this.getColumnPosition(itemId, element);
          if (position == null) {
            return false;
          }
          event.preventDefault();
          const targetItem = (event.key === 'Home' ? getFirstNavigableItem : getLastNavigableItem)(
            this.store.state,
          );
          if (targetItem != null) {
            this.focusColumn(targetItem, position, event.nativeEvent);
          }
          return false;
        }
        event.preventDefault();
        const stops = this.getStops(itemId);
        if (stops.length === 0) {
          itemElement.focus({ preventScroll: true });
        } else {
          this.focusStop(event.key === 'Home' ? stops[0] : stops[stops.length - 1]);
        }
        return false;
      }
      case 'Escape': {
        if (keys.escape === 'control') {
          return false;
        }
        // Consumed so an enclosing dialog stays open; Escape on the row itself
        // is left to the containing UI.
        event.preventDefault();
        event.stopPropagation();
        itemElement.focus({ preventScroll: true });
        return false;
      }
      default:
        return false;
    }
  }
}

function hasModifier(event: React.KeyboardEvent): boolean {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}
