import type * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { activeElement, contains } from '@base-ui/utils/shadowDom';
import { warn } from '@base-ui/utils/warn';
import { REASONS } from '../../internals/reasons';
import type { TreeDefaultItem, TreeItemId, TreeMultiple } from '../../tree/store/types';
import type { TreeStore } from '../../tree/store/TreeStore';
import { selectors } from '../../tree/store/selectors';
import { isControlFocusable, sortInComposedOrder } from '../../tree/utils/focusability';
import { getItemIdKey } from '../../tree/utils/itemIdKey';
import type { TreeGridCellControlKeys } from '../cell-control/TreeGridCellControl';
import { getStopKeyIntent, isStopKey } from '../utils/getStopKeyIntent';

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
  isCell: boolean;
}

/** The cells and stops of a row, read once per key press. */
interface RowLayout {
  /** The cells, hidden ones included, so column indexes line up across rows. */
  cells: HTMLElement[];
  stops: Stop[];
}

/** Where a stop sits in its row: its cell, and its index among the cell's stops. */
interface ColumnPosition {
  cellIndex: number;
  index: number;
}

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
  // A selection, or a caret inside the text, keeps either arrow.
  if (selectionStart !== selectionEnd || (selectionStart > 0 && selectionStart < value.length)) {
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

  declare private store: TreeStore<TreeMultiple | undefined, TItem>;

  /** Controls registered by the cell parts, keyed by item. */
  private controls = new Map<string, Set<RegisteredControl>>();

  /** Cells registered by `TreeGrid.Cell`, keyed by item. */
  private cells = new Map<string, Set<HTMLElement>>();

  /** The number of mounted `TreeGrid.HeaderCell` parts. */
  private headerCellCount = 0;

  /** The number of mounted `TreeGrid.RowCheckbox` parts, keyed by item. */
  private rowCheckboxCounts = new Map<string, number>();

  constructor(store: TreeStore<TreeMultiple | undefined, TItem>) {
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

  /** Counts a row's checkbox. Returns the cleanup that uncounts it. */
  public registerRowCheckbox = (itemId: TreeItemId): (() => void) => {
    const key = getItemIdKey(itemId);
    this.rowCheckboxCounts.set(key, (this.rowCheckboxCounts.get(key) ?? 0) + 1);
    return () => {
      const count = this.rowCheckboxCounts.get(key)! - 1;
      if (count === 0) {
        this.rowCheckboxCounts.delete(key);
      } else {
        this.rowCheckboxCounts.set(key, count);
      }
    };
  };

  /** Whether an item's row renders a `TreeGrid.RowCheckbox`. */
  public hasRowCheckbox(itemId: TreeItemId): boolean {
    return this.rowCheckboxCounts.has(getItemIdKey(itemId));
  }

  /** Counts a header cell. Returns the cleanup that uncounts it. */
  public registerHeaderCell = (): (() => void) => {
    this.headerCellCount += 1;
    return () => {
      this.headerCellCount -= 1;
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

  /**
   * Warns in development when screen readers can't read or name the cells of
   * an item's row.
   */
  public warnAboutCells(itemId: TreeItemId) {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    const cells = this.cells.get(getItemIdKey(itemId))?.size ?? 0;
    if (cells === 0) {
      warn(
        'A <TreeGrid.Row> renders no cell.',
        'Each row of the treegrid needs one for assistive technology to read its content.',
        'Render the content of the item inside <TreeGrid.Cell>.',
      );
      return;
    }
    const headerCells = this.headerCellCount;
    if (cells > 1 && headerCells === 0) {
      warn(
        'A <TreeGrid.Row> renders several cells, but the tree grid has no column headers.',
        'Screen readers then cannot name the column of a cell.',
        'Render a <TreeGrid.HeaderRow> with a <TreeGrid.HeaderCell> for each column, visually hidden if needed.',
      );
    } else if (headerCells > 0 && cells !== headerCells) {
      warn(
        `A <TreeGrid.Row> renders ${cells} cells, but the header row has ${headerCells}.`,
        'Screen readers then announce the wrong column header for the cells after the gap.',
        'Render a <TreeGrid.Cell> for each <TreeGrid.HeaderCell>, empty if needed.',
      );
    }
  }

  /** The focusable registered controls of an item, in composed tree order. */
  private getControls(itemId: TreeItemId, itemElement: HTMLElement): RegisteredControl[] {
    const itemControls = this.controls.get(getItemIdKey(itemId));
    if (itemControls == null) {
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
  private getCells(itemId: TreeItemId, itemElement: HTMLElement): HTMLElement[] {
    const itemCells = this.cells.get(getItemIdKey(itemId));
    if (itemCells == null) {
      return [];
    }
    const cells = Array.from(itemCells).filter(
      (element) => element.isConnected && contains(itemElement, element),
    );
    return sortInComposedOrder(
      itemElement,
      cells.map((element) => ({ element })),
    ).map(({ element }) => element);
  }

  /**
   * The cells and stops of an item's row. A row with several cells also stops at
   * each cell without a control, so the keyboard reaches every value.
   */
  private getLayout(itemId: TreeItemId): RowLayout {
    const itemElement = this.store.items.getItemDOMElement(itemId);
    if (itemElement == null) {
      return { cells: [], stops: [] };
    }
    const controls = this.getControls(itemId, itemElement);
    const stops: Stop[] = controls.map((control) => ({ element: control.element, isCell: false }));
    const cells = this.getCells(itemId, itemElement);
    if (cells.length < 2) {
      return { cells, stops };
    }
    const controlCount = stops.length;
    for (const cell of cells) {
      // A hidden cell can't take focus, so it isn't a stop.
      if (
        isControlFocusable(cell, itemElement) &&
        !controls.some((control) => contains(cell, control.element))
      ) {
        stops.push({ element: cell, isCell: true });
      }
    }
    return {
      cells,
      stops: stops.length === controlCount ? stops : sortInComposedOrder(itemElement, stops),
    };
  }

  /** Focuses the first stop of an item. Returns whether the item has one. */
  public focusFirstStop(itemId: TreeItemId): boolean {
    this.store.expansion.settleItem(itemId);
    const stops = this.getLayout(itemId).stops;
    if (stops.length === 0) {
      return false;
    }
    this.focusStop(stops[0]);
    return true;
  }

  /** The link among an item's controls. */
  public getLink(itemId: TreeItemId): HTMLElement | undefined {
    const itemElement = this.store.items.getItemDOMElement(itemId);
    if (itemElement == null) {
      return undefined;
    }
    return this.getControls(itemId, itemElement).find(
      (control) => control.element.localName === 'a' && control.element.hasAttribute('href'),
    )?.element;
  }

  /**
   * Focuses a stop without the browser's focus scroll, which scrolls every
   * ancestor. The list only reveals a row when focus moves to another one, so
   * bring the stop itself into view: it can sit outside the visible part of its
   * row, or the row may have been scrolled away.
   */
  private focusStop(stop: Stop, event?: KeyboardEvent) {
    const element = stop.element;
    // A cell only takes focus while the keyboard is on it, so a click on its
    // text still focuses the row.
    if (stop.isCell && !element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
      element.addEventListener('blur', () => element.removeAttribute('tabindex'), { once: true });
    }
    this.store.interaction.focusElement(element, event);
    this.store.items.revealElement(element);
  }

  /**
   * Moves to `position` in the row of `targetItem`: to the stop at the same index
   * in the cell, or the last one before it, or to the row when it has no stop there.
   */
  private moveInColumn(position: ColumnPosition, targetItem: TreeItemId, event: KeyboardEvent) {
    this.store.expansion.settleItem(targetItem);
    const targetStops = selectors.isItemDisabled(this.store.state, targetItem)
      ? EMPTY_ARRAY
      : getCellStops(this.getLayout(targetItem), position.cellIndex);
    if (targetStops.length === 0) {
      this.store.interaction.focusItem(targetItem, event);
    } else {
      this.focusStop(targetStops[Math.min(position.index, targetStops.length - 1)], event);
    }
  }

  /**
   * Keys pressed on a registered control, or on a cell that has focus: reads the
   * row, then applies what `getStopKeyIntent` decides.
   * Returns whether the row should handle the key as if pressed on itself.
   */
  public handleControlKeyDown(
    event: React.KeyboardEvent,
    itemId: TreeItemId,
    itemElement: HTMLElement,
    target: Element,
  ): boolean {
    if (!isStopKey(event.key)) {
      return false;
    }
    const itemKey = getItemIdKey(itemId);
    const element = target as HTMLElement;
    const control = this.findControl(itemKey, element);
    const isCell = control == null && this.cells.get(itemKey)?.has(element) === true;
    if (control == null && !isCell) {
      return false;
    }
    const disabledFocusable = element.getAttribute('aria-disabled') === 'true';
    // A disabled control can't act on any key, so the navigation keys move
    // focus away from it, including from one that stays focusable.
    const unavailable =
      control != null &&
      (disabledFocusable ||
        control.isDisabled() ||
        !isControlFocusable(control.element, itemElement));
    const layout = this.getLayout(itemId);
    const position = getColumnPosition(layout, element);
    const intent = getStopKeyIntent(event, {
      isRtl: this.store.state.direction === 'rtl',
      isCell,
      disabledFocusable,
      keys: control != null && !unavailable ? control.getKeys() : {},
      keepsCaret:
        !unavailable &&
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
        keepsHorizontalArrow(element, event.key),
      index: layout.stops.findIndex((stop) => stop.element === element),
      count: layout.stops.length,
      inColumn: position != null,
    });

    switch (intent.type) {
      case 'control':
        return false;
      case 'row':
        return true;
      case 'stop':
        this.focusStop(layout.stops[intent.index]);
        break;
      case 'focus-row':
        if (intent.stopPropagation) {
          event.stopPropagation();
        }
        this.store.interaction.focusElement(itemElement, event.nativeEvent);
        break;
      case 'column': {
        const targetItem = intent.row(this.store.state, itemId);
        if (targetItem != null && position != null) {
          this.moveInColumn(position, targetItem, event.nativeEvent);
          // As on the row, the selection follows an unmodified vertical arrow with `multiple="opt-in"`.
          if (
            this.store.state.multiple === 'opt-in' &&
            (event.key === 'ArrowDown' || event.key === 'ArrowUp')
          ) {
            this.store.selection.moveTo(targetItem, REASONS.keyboard, event.nativeEvent);
          }
        }
        break;
      }
      default:
        break;
    }
    event.preventDefault();
    return false;
  }
}

/** The stops of one cell of a row, or none when the row doesn't have several cells. */
function getCellStops(layout: RowLayout, cellIndex: number): readonly Stop[] {
  const cell = layout.cells[cellIndex];
  if (layout.cells.length < 2 || cell == null) {
    return EMPTY_ARRAY;
  }
  return layout.stops.filter((stop) => contains(cell, stop.element));
}

/** Where `element` sits in the columns of its row, or `null` in a row of a single cell. */
function getColumnPosition(layout: RowLayout, element: HTMLElement): ColumnPosition | null {
  const cellIndex = layout.cells.findIndex((cell) => contains(cell, element));
  if (layout.cells.length < 2 || cellIndex === -1) {
    return null;
  }
  const index = getCellStops(layout, cellIndex).findIndex((stop) => stop.element === element);
  return { cellIndex, index: Math.max(0, index) };
}
