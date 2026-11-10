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

    this.pending = { index, onFocused };
    getListElement()?.focus({ preventScroll: true });
  }

  /** Whether the list holds focus for an item that isn't rendered yet. */
  isPending() {
    return this.pending !== null;
  }

  /** Gives focus to an item that rendered while the list held focus for it. */
  itemRendered(index: number, element: HTMLElement | null) {
    if (this.pending?.index !== index || !element) {
      return;
    }
    const listElement = this.parameters.getListElement();
    if (activeElement(ownerDocument(listElement)) !== listElement) {
      return;
    }
    element.focus();
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
