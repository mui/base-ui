import { expect, vi, describe, it, afterEach } from 'vitest';
import { ListFocus } from './listFocus';

const EVENT = 'event';

function createFocusable(parent: HTMLElement) {
  const element = document.createElement('div');
  element.tabIndex = -1;
  parent.appendChild(element);
  return element;
}

function setup(renderedCount: number) {
  const list = createFocusable(document.body);
  const elements: Array<HTMLElement | null> = [];
  for (let index = 0; index < renderedCount; index += 1) {
    elements[index] = createFocusable(list);
  }

  const highlight = vi.fn();
  const focus = new ListFocus<string>({
    getElement: (index) => elements[index],
    getListElement: () => list,
    highlight,
  });

  /** Renders the item at a position, the way a virtualizer does after scrolling to it. */
  function mountItem(index: number) {
    const element = createFocusable(list);
    elements[index] = element;
    // The item reports that it has focus, like `Listbox.Item` does from its focus handler.
    element.addEventListener('focus', () => focus.itemFocused(index));
    focus.itemRendered(index, element);
    return element;
  }

  return { list, elements, highlight, focus, mountItem };
}

describe('ListFocus', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  describe('a rendered item', () => {
    it('highlights the item and focuses it', () => {
      const { elements, highlight, focus } = setup(3);

      focus.moveTo(1, EVENT);

      expect(highlight).toHaveBeenCalledWith(1, EVENT);
      expect(elements[1]).toHaveFocus();
      expect(focus.isPending()).toBe(false);
    });

    it('runs the callback right away', () => {
      const { focus } = setup(3);
      const onFocused = vi.fn();

      focus.moveTo(1, EVENT, onFocused);

      expect(onFocused).toHaveBeenCalledTimes(1);
    });
  });

  describe('an item that is not rendered', () => {
    it('highlights the item and holds focus on the list', () => {
      const { list, highlight, focus } = setup(3);

      focus.moveTo(10, EVENT);

      expect(highlight).toHaveBeenCalledWith(10, EVENT);
      expect(list).toHaveFocus();
      expect(focus.isPending()).toBe(true);
    });

    it('gives focus to the item once it renders', () => {
      const { focus, mountItem } = setup(3);
      focus.moveTo(10, EVENT);

      const item = mountItem(10);

      expect(item).toHaveFocus();
      expect(focus.isPending()).toBe(false);
    });

    it('runs the callback once the item has focus', () => {
      const { focus, mountItem } = setup(3);
      const onFocused = vi.fn();
      focus.moveTo(10, EVENT, onFocused);
      expect(onFocused).not.toHaveBeenCalled();

      mountItem(10);

      expect(onFocused).toHaveBeenCalledTimes(1);
    });

    it('leaves focus on the list when another item renders', () => {
      const { list, focus, mountItem } = setup(3);
      focus.moveTo(10, EVENT);

      mountItem(9);

      expect(list).toHaveFocus();
      expect(focus.isPending()).toBe(true);
    });

    it('does not take focus when focus has left the list', () => {
      const { focus, mountItem } = setup(3);
      const outside = createFocusable(document.body);
      focus.moveTo(10, EVENT);
      outside.focus();

      mountItem(10);

      expect(outside).toHaveFocus();
    });

    it('does not take focus after the wait is cancelled', () => {
      const { list, focus, mountItem } = setup(3);
      const onFocused = vi.fn();
      focus.moveTo(10, EVENT, onFocused);

      focus.cancel();
      mountItem(10);

      expect(list).toHaveFocus();
      expect(onFocused).not.toHaveBeenCalled();
    });

    it('waits for the latest item when focus moves again', () => {
      const { list, focus, mountItem } = setup(3);
      const onFirstFocused = vi.fn();
      focus.moveTo(10, EVENT, onFirstFocused);
      focus.moveTo(20, EVENT);

      mountItem(10);
      expect(list).toHaveFocus();
      const item = mountItem(20);

      expect(item).toHaveFocus();
      expect(onFirstFocused).not.toHaveBeenCalled();
    });

    it('stops waiting when another item receives focus', () => {
      const { elements, focus } = setup(3);
      const onFocused = vi.fn();
      focus.moveTo(10, EVENT, onFocused);

      elements[1]!.focus();
      focus.itemFocused(1);

      expect(focus.isPending()).toBe(false);
      expect(onFocused).not.toHaveBeenCalled();
    });
  });
});
