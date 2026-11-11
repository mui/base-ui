import { ownerDocument } from '@base-ui/utils/owner';
import { activeElement } from '@base-ui/utils/shadowDom';

export interface ListFocusParameters<E> {
  /** The element of the item at a position, when it's rendered. */
  getElement: (index: number) => HTMLElement | null | undefined;
  getListElement: () => HTMLElement | null;
  /** Highlights the item that is about to receive focus. */
  highlight: (index: number, event: E | undefined) => void;
}

interface PendingFocus {
  index: number;
  onFocused: (() => void) | undefined;
  /**
   * Set while the list holds focus for an item that stopped rendering. Returns the item's current
   * position, or `-1` once it's gone.
   */
  getHeldIndex: (() => number) | undefined;
}

/**
 * Moves focus to items, including those that aren't rendered yet.
 *
 * A virtualized list renders only some of its items. When focus moves to one that isn't rendered,
 * the list holds focus until the item renders, and the item then takes focus from the list.
 */
export class ListFocus<E = Event> {
  declare private readonly parameters: ListFocusParameters<E>;

  private pending: PendingFocus | null = null;

  constructor(parameters: ListFocusParameters<E>) {
    this.parameters = parameters;
  }

  /**
   * Highlights an item and moves focus to it. `onFocused` runs once the item has focus, which is
   * right away when it's rendered.
   */
  moveTo(index: number, event: E | undefined, onFocused?: () => void) {
    const { getElement, getListElement, highlight } = this.parameters;
    this.pending = null;
    highlight(index, event);

    const element = getElement(index);
    if (element) {
      element.focus();
      onFocused?.();
      return;
    }

    this.pending = { index, onFocused, getHeldIndex: undefined };
    getListElement()?.focus({ preventScroll: true });
  }

  /**
   * Moves focus from an item that is about to stop rendering to the list, which holds it until
   * the item renders again. `getIndex` returns the item's current position, or `-1` once it's
   * gone, since items can be added or removed around it in the meantime.
   */
  hold(getIndex: () => number) {
    const listElement = this.parameters.getListElement();
    if (!listElement) {
      return;
    }
    this.pending = { index: getIndex(), onFocused: undefined, getHeldIndex: getIndex };
    listElement.focus({ preventScroll: true });
    // A list that can't take focus, such as a disabled one, has nothing to hold.
    if (activeElement(ownerDocument(listElement)) !== listElement) {
      this.pending = null;
    }
  }

  /**
   * Looks up where the item that the list holds focus for is now. Returns its position, `-1` when
   * it was removed, or `undefined` when the list isn't holding focus for an item.
   */
  updateHeldIndex(): number | undefined {
    const pending = this.pending;
    if (!pending?.getHeldIndex) {
      return undefined;
    }
    pending.index = pending.getHeldIndex();
    return pending.index;
  }

  /** Whether the list holds focus for an item that isn't rendered yet. */
  isPending() {
    return this.pending !== null;
  }

  /** Gives focus to an item that rendered while the list held focus for it. */
  itemRendered(index: number, element: HTMLElement | null) {
    // Another item may have taken the position of the one the list holds focus for.
    this.updateHeldIndex();
    if (this.pending?.index !== index || !element) {
      return;
    }
    const listElement = this.parameters.getListElement();
    if (activeElement(ownerDocument(listElement)) !== listElement) {
      return;
    }
    // The user didn't ask to go back to an item that the list held focus for, so the list stays
    // where it was scrolled to.
    element.focus({ preventScroll: this.pending.getHeldIndex != null });
  }

  /** Called when an item receives focus, however it got there. */
  itemFocused(index: number) {
    const pending = this.pending;
    this.pending = null;
    if (pending?.index === index) {
      pending.onFocused?.();
    }
  }

  /** Stops waiting for an item, such as when focus leaves the list. */
  cancel() {
    this.pending = null;
  }
}
