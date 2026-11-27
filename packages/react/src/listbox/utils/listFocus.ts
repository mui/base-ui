import { ownerDocument } from '@base-ui/utils/owner';
import { activeElement } from '@base-ui/utils/shadowDom';
import { createItemReference, resolveItemReference } from './itemReference';
import type { ItemReference, ItemReferenceSource } from './itemReference';

export interface ListFocusParameters<E> extends ItemReferenceSource {
  /** The element of the item at a position, when it's rendered. */
  getElement: (index: number) => HTMLElement | null | undefined;
  getListElement: () => HTMLElement | null;
  /** Highlights the item that is about to receive focus. */
  highlight: (index: number, event: E | undefined) => void;
  /** Called once an item that the user navigated to has focus. */
  onNavigate: (index: number, event: E) => void;
  /** Whether an item has focus, or the list holds focus for one. */
  hasFocusedItem: () => boolean;
  /** The position of the item that holds the tab stop. */
  getActiveIndex: () => number | null;
  setActiveIndex: (index: number) => void;
  /** The item that receives focus when the list does. */
  getTabStopIndex: () => number;
  /** How many items the list knows from its data, including those that aren't rendered. */
  getDataCount: () => number;
}

interface PendingFocus<E> {
  /** The item the list holds focus for. */
  item: ItemReference;
  /** Where the item last was, which is where focus stays when the item is removed. */
  lastIndex: number;
  /** Set when the user navigated to the item, to report it once the item has focus. */
  event: E | undefined;
  /**
   * Whether the item had focus and stopped rendering, as opposed to focus moving to an item that
   * isn't rendered yet.
   */
  held: boolean;
}

/**
 * Decides where focus and the tab stop go in a list whose items come and go.
 *
 * A virtualized list renders only some of its items. When focus moves to one that isn't rendered,
 * or the focused item stops rendering, the list holds focus in its place and the item takes it
 * once it renders. When items are added, removed or reordered, focus and the tab stop follow the
 * item they were on. When that item is removed, focus stays at its position, and the tab stop
 * falls back to the item that receives focus by default.
 */
export class ListFocus<E = Event> {
  declare private readonly parameters: ListFocusParameters<E>;

  private pending: PendingFocus<E> | null = null;

  /** The position of the item that focus is being moved to, while its element takes focus. */
  private focusingIndex: number | null = null;

  constructor(parameters: ListFocusParameters<E>) {
    this.parameters = parameters;
  }

  /**
   * Moves focus to an item the user navigated to, such as with an arrow key or by typing.
   * `onNavigate` runs once the item has focus, which is right away when it's rendered.
   */
  navigateTo(index: number, event: E) {
    this.focusItem(index, event, true);
  }

  /** Moves focus to an item without it counting as navigation. */
  moveTo(index: number, event: E | undefined) {
    this.focusItem(index, event, false);
  }

  private focusItem(index: number, event: E | undefined, navigation: boolean) {
    const { getElement, getListElement, highlight, onNavigate } = this.parameters;
    this.pending = null;
    highlight(index, event);

    const element = getElement(index);
    if (element) {
      this.focusElement(element, index);
      if (navigation) {
        onNavigate(index, event as E);
      }
      return;
    }

    this.pending = {
      item: createItemReference(this.parameters, index),
      lastIndex: index,
      event: navigation ? event : undefined,
      held: false,
    };
    getListElement()?.focus({ preventScroll: true });
  }

  /**
   * The list element received focus, such as from a label press, or from a press on a gap between
   * items. Focus passes on to the item that holds the tab stop. A press leaves the list where it's
   * scrolled to.
   */
  listFocused(event: E, fromPress: boolean) {
    // The list holds focus until the item it's waiting for renders.
    if (this.pending) {
      return;
    }
    const { getActiveIndex, getTabStopIndex, getElement, getDataCount } = this.parameters;
    const index = getActiveIndex() ?? getTabStopIndex();
    const element = getElement(index);
    if (element) {
      focusAndReveal(element, fromPress);
    } else if (!fromPress && getDataCount() > 0) {
      // The item isn't rendered, so highlight it to have it scrolled into view.
      this.moveTo(index, event);
    }
  }

  /** Whether the list holds focus for an item that isn't rendered. */
  isPending() {
    return this.pending !== null;
  }

  /** An item rendered. It takes focus when the list held it for that item. */
  itemMounted(index: number, element: HTMLElement | null) {
    const pending = this.pending;
    // Another item may have taken the position of the one the list holds focus for.
    if (!pending || this.resolvePending() !== index || !element) {
      return;
    }
    const listElement = this.parameters.getListElement();
    if (activeElement(ownerDocument(listElement)) !== listElement) {
      return;
    }
    // The user didn't ask to go back to an item that the list held focus for, so the list stays
    // where it was scrolled to.
    this.focusElement(element, index, pending.held);
  }

  private focusElement(element: HTMLElement, index: number, preventScroll = false) {
    this.focusingIndex = index;
    focusAndReveal(element, preventScroll);
    this.focusingIndex = null;
  }

  /**
   * The position of an item that is receiving focus. An item that moved when the items changed
   * can take focus before it renders with its new position, which `index` is then behind.
   */
  getFocusedIndex(index: number) {
    return this.focusingIndex ?? index;
  }

  /**
   * An item is about to stop rendering. When it has focus, the list takes it and holds it until
   * the item renders again, or another item takes its place.
   */
  itemUnmounting(element: HTMLElement | null, value: any) {
    const listElement = this.parameters.getListElement();
    if (!element || !listElement || activeElement(ownerDocument(element)) !== element) {
      return;
    }
    const index = this.parameters.indexOfValue(value);
    this.pending = {
      item: { index, value },
      // A rendered item that isn't in the data has already given up its position, which is the
      // tab stop's, since the item has focus.
      lastIndex: index === -1 ? (this.parameters.getActiveIndex() ?? -1) : index,
      event: undefined,
      held: true,
    };
    listElement.focus({ preventScroll: true });
    // A list that can't take focus, such as a disabled one, has nothing to hold.
    if (activeElement(ownerDocument(listElement)) !== listElement) {
      this.pending = null;
    }
  }

  /** An item received focus, however it got there. */
  itemFocused(index: number) {
    const pending = this.pending;
    const pendingIndex = this.resolvePending();
    this.pending = null;
    if (pending?.event !== undefined && pendingIndex === index) {
      this.parameters.onNavigate(index, pending.event);
    }
  }

  /** Stops waiting for an item, such as when focus leaves the list. */
  cancel() {
    this.pending = null;
  }

  /**
   * The rendered items, the data or the selection changed. Keeps the tab stop on an item that
   * exists: the item that receives focus by default while no item has focus, and the focused item
   * otherwise, wherever it moved to. `getIndex` returns the position of a rendered item's element.
   */
  itemsChanged(getIndex: (element: Element) => number | undefined) {
    const { getElement, getListElement, getActiveIndex, setActiveIndex, getTabStopIndex } =
      this.parameters;

    if (!this.parameters.hasFocusedItem()) {
      setActiveIndex(getTabStopIndex());
      return;
    }

    // Items can move around the focused item, such as when reordering them, so the tab stop
    // follows the focused item to its new position.
    const listElement = getListElement();
    const focusedElement = listElement ? activeElement(ownerDocument(listElement)) : null;
    const focusedIndex = focusedElement ? getIndex(focusedElement) : undefined;
    if (focusedIndex != null) {
      setActiveIndex(focusedIndex);
      return;
    }

    const listHasFocus = focusedElement != null && focusedElement === listElement;
    // The list holds focus for an item that isn't rendered, and items were added or removed
    // around it, so the tab stop follows it to its new position.
    const pending = this.pending;
    const pendingIndex = listHasFocus ? this.resolvePending() : undefined;
    if (pending && pendingIndex === -1) {
      this.pending = null;
      // The item was removed, so focus goes to the one that took its position, or to the last
      // item when it was the last one.
      const neighborIndex = this.findItemAtOrBefore(pending.lastIndex);
      if (neighborIndex !== null) {
        this.moveTo(neighborIndex, undefined);
        return;
      }
    } else if (pendingIndex != null && pendingIndex !== getActiveIndex()) {
      setActiveIndex(pendingIndex);
      this.itemMounted(pendingIndex, getElement(pendingIndex) ?? null);
      return;
    }

    const activeIndex = pendingIndex === -1 ? -1 : (getActiveIndex() ?? -1);
    if (getElement(activeIndex)) {
      // The list held focus for this item, which rendered at another position.
      if (listHasFocus) {
        this.moveTo(activeIndex, undefined);
      }
      return;
    }
    // An item in the data that isn't rendered still exists.
    const dataCount = this.parameters.getDataCount();
    if (activeIndex >= 0 && activeIndex < dataCount) {
      return;
    }

    // The item that held the tab stop was removed and nothing took its position.
    const tabStopIndex = getTabStopIndex();
    if (listHasFocus && (dataCount > 0 || getElement(tabStopIndex))) {
      this.moveTo(tabStopIndex, undefined);
    } else {
      this.pending = null;
      setActiveIndex(tabStopIndex);
    }
  }

  /** The position of the item at `index`, or of the closest one before it, or `null`. */
  private findItemAtOrBefore(index: number): number | null {
    const { getDataCount, getElement } = this.parameters;
    if (index < 0) {
      return null;
    }
    const dataCount = getDataCount();
    if (dataCount > 0) {
      return Math.min(index, dataCount - 1);
    }
    // Without data, the rendered items are the whole list.
    for (let position = index; position >= 0; position -= 1) {
      if (getElement(position)) {
        return position;
      }
    }
    return null;
  }

  /**
   * Looks up where the item that the list holds focus for is now. Returns its position, `-1` when
   * it was removed, or `undefined` when the list isn't holding focus for an item.
   */
  private resolvePending(): number | undefined {
    const pending = this.pending;
    if (!pending) {
      return undefined;
    }
    pending.item.index = resolveItemReference(this.parameters, pending.item);
    if (pending.item.index !== -1) {
      pending.lastIndex = pending.item.index;
    }
    return pending.item.index;
  }
}

/**
 * Focuses an item and scrolls it into view by the smallest amount, since browsers choose their own
 * position for an element that `focus()` reveals, such as the middle of the list.
 */
function focusAndReveal(element: HTMLElement, preventScroll: boolean) {
  element.focus({ preventScroll: true });
  if (!preventScroll) {
    // Not available in JSDOM.
    element.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }
}
