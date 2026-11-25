import { expect, vi, describe, it, afterEach } from 'vitest';
import { ListFocus } from './listFocus';

const EVENT = 'event';

function createFocusable(parent: HTMLElement) {
  const element = document.createElement('div');
  element.tabIndex = -1;
  parent.appendChild(element);
  return element;
}

/**
 * A list over `values`, of which only the positions in `rendered` have an element, like a
 * virtualized list.
 */
function setup(options: { values?: string[]; rendered?: number[]; tabStop?: number } = {}) {
  let values = options.values ?? Array.from({ length: 30 }, (_, index) => `item ${index}`);
  const list = createFocusable(document.body);
  let elements = new Map<string, HTMLElement>();
  const state = { itemFocused: false, activeIndex: null as number | null };
  let tabStop = options.tabStop ?? 0;

  const highlight = vi.fn((index: number) => {
    state.activeIndex = index;
    state.itemFocused = true;
  });
  const onNavigate = vi.fn();

  const focus = new ListFocus<string>({
    getElement: (index) => elements.get(values[index]),
    getListElement: () => list,
    highlight,
    onNavigate,
    hasFocusedItem: () => state.itemFocused,
    getActiveIndex: () => state.activeIndex,
    setActiveIndex: (index) => {
      state.activeIndex = index;
    },
    getTabStopIndex: () => tabStop,
    getDataCount: () => values.length,
    getValue: (index) => values[index],
    indexOfValue: (value) => values.indexOf(value),
  });

  function getIndex(element: Element) {
    const entry = [...elements].find(([, itemElement]) => itemElement === element);
    return entry ? values.indexOf(entry[0]) : undefined;
  }

  /** Renders the item at a position, the way a virtualizer does after scrolling to it. */
  function mountItem(index: number) {
    const value = values[index];
    const element = createFocusable(list);
    elements.set(value, element);
    // The item reports that it has focus, like `Listbox.Item` does from its focus handler.
    element.addEventListener('focus', () => {
      highlight(values.indexOf(value));
      focus.itemFocused(values.indexOf(value));
    });
    focus.itemMounted(index, element);
    return element;
  }

  /** Stops rendering the item at a position. */
  function unmountItem(index: number) {
    const value = values[index];
    const element = elements.get(value)!;
    focus.itemUnmounting(element, value);
    elements.delete(value);
    element.remove();
  }

  /** Replaces the data, keeping the elements of the items that are still in it. */
  function setValues(nextValues: string[]) {
    values = nextValues;
    elements = new Map([...elements].filter(([value]) => nextValues.includes(value)));
    focus.itemsChanged(getIndex);
  }

  for (const index of options.rendered ?? [0, 1, 2]) {
    mountItem(index);
  }

  return {
    list,
    element: (index: number) => elements.get(values[index])!,
    state,
    highlight,
    onNavigate,
    focus,
    mountItem,
    unmountItem,
    setValues,
    setTabStop(index: number) {
      tabStop = index;
    },
  };
}

describe('ListFocus', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  describe('moving focus to a rendered item', () => {
    it('highlights the item and focuses it', () => {
      const { element, highlight, focus } = setup();

      focus.moveTo(1, EVENT);

      expect(highlight).toHaveBeenCalledWith(1, EVENT);
      expect(element(1)).toHaveFocus();
      expect(focus.isPending()).toBe(false);
    });

    it.each([
      { name: 'reports navigation', method: 'navigateTo' as const, calls: 1 },
      { name: 'does not report a plain move', method: 'moveTo' as const, calls: 0 },
    ])('$name right away', ({ method, calls }) => {
      const { focus, onNavigate } = setup();

      focus[method](1, EVENT);

      expect(onNavigate).toHaveBeenCalledTimes(calls);
    });
  });

  describe('the position of an item that receives focus', () => {
    it('is the position focus moves to, which the item may not have rendered with yet', () => {
      const { element, focus } = setup();
      let focusedIndex: number | undefined;
      // The item still reports the position it rendered with.
      element(1).addEventListener('focus', () => {
        focusedIndex = focus.getFocusedIndex(0);
      });

      focus.moveTo(1, EVENT);

      expect(focusedIndex).toBe(1);
    });

    it("is the item's own position once the move has ended", () => {
      const { focus } = setup();

      focus.moveTo(1, EVENT);

      expect(focus.getFocusedIndex(0)).toBe(0);
    });
  });

  describe('moving focus to an item that is not rendered', () => {
    it('highlights the item and holds focus on the list', () => {
      const { list, highlight, focus } = setup();

      focus.moveTo(10, EVENT);

      expect(highlight).toHaveBeenCalledWith(10, EVENT);
      expect(list).toHaveFocus();
      expect(focus.isPending()).toBe(true);
    });

    it('gives focus to the item once it renders', () => {
      const { focus, mountItem } = setup();
      focus.moveTo(10, EVENT);

      const item = mountItem(10);

      expect(item).toHaveFocus();
      expect(focus.isPending()).toBe(false);
    });

    it('reports navigation once the item has focus', () => {
      const { focus, mountItem, onNavigate } = setup();
      focus.navigateTo(10, EVENT);
      expect(onNavigate).not.toHaveBeenCalled();

      mountItem(10);

      expect(onNavigate.mock.calls).toEqual([[10, EVENT]]);
    });

    it('does not report a plain move once the item has focus', () => {
      const { focus, mountItem, onNavigate } = setup();
      focus.moveTo(10, EVENT);

      mountItem(10);

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('leaves focus on the list when another item renders', () => {
      const { list, focus, mountItem } = setup();
      focus.moveTo(10, EVENT);

      mountItem(9);

      expect(list).toHaveFocus();
      expect(focus.isPending()).toBe(true);
    });

    it('does not take focus when focus has left the list', () => {
      const { focus, mountItem } = setup();
      const outside = createFocusable(document.body);
      focus.moveTo(10, EVENT);
      outside.focus();

      mountItem(10);

      expect(outside).toHaveFocus();
    });

    it('does not take focus after the wait is cancelled', () => {
      const { list, focus, mountItem, onNavigate } = setup();
      focus.navigateTo(10, EVENT);

      focus.cancel();
      mountItem(10);

      expect(list).toHaveFocus();
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('waits for the latest item when focus moves again', () => {
      const { list, focus, mountItem, onNavigate } = setup();
      focus.navigateTo(10, EVENT);
      focus.moveTo(20, EVENT);

      mountItem(10);
      expect(list).toHaveFocus();
      const item = mountItem(20);

      expect(item).toHaveFocus();
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('stops waiting when another item receives focus', () => {
      const { element, focus, onNavigate } = setup();
      focus.navigateTo(10, EVENT);

      element(1).focus();

      expect(focus.isPending()).toBe(false);
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('follows the item when items are added before it while the list waits', () => {
      const { focus, mountItem, setValues, state, onNavigate } = setup({
        values: ['a', 'b', 'c', 'd', 'e'],
        rendered: [0],
      });
      focus.navigateTo(3, EVENT);

      setValues(['new', 'a', 'b', 'c', 'd', 'e']);
      expect(state.activeIndex).toBe(4);

      // The item that took the old position doesn't take focus.
      mountItem(3);
      expect(focus.isPending()).toBe(true);

      const item = mountItem(4);
      expect(item).toHaveFocus();
      expect(onNavigate.mock.calls).toEqual([[4, EVENT]]);
    });
  });

  describe('an item that stops rendering', () => {
    it('holds focus on the list when the item had focus', () => {
      const { list, element, focus, unmountItem } = setup();
      element(1).focus();

      unmountItem(1);

      expect(list).toHaveFocus();
      expect(focus.isPending()).toBe(true);
    });

    it('holds nothing when the item did not have focus', () => {
      const { element, focus, unmountItem } = setup();
      element(0).focus();

      unmountItem(1);

      expect(element(0)).toHaveFocus();
      expect(focus.isPending()).toBe(false);
    });

    it('holds nothing when the list cannot take focus', () => {
      const { list, element, focus, unmountItem } = setup();
      element(1).focus();
      list.removeAttribute('tabindex');

      unmountItem(1);

      expect(focus.isPending()).toBe(false);
    });

    it('gives focus back without scrolling once the item renders again', () => {
      const { element, mountItem, unmountItem } = setup();
      element(1).focus();
      unmountItem(1);
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');

      try {
        const item = mountItem(1);

        expect(item).toHaveFocus();
        expect(focusSpy).toHaveBeenLastCalledWith({ preventScroll: true });
      } finally {
        focusSpy.mockRestore();
      }
    });
  });

  describe('when the items change', () => {
    it('puts the tab stop on the default item while no item has focus', () => {
      const { state, setValues, setTabStop } = setup({ values: ['a', 'b', 'c'] });
      setTabStop(2);

      setValues(['a', 'b', 'c']);

      expect(state.activeIndex).toBe(2);
    });

    it('moves the tab stop with the focused item to its new position', () => {
      const { element, state, setValues } = setup({ values: ['a', 'b', 'c'] });
      element(1).focus();

      setValues(['c', 'a', 'b']);

      expect(state.activeIndex).toBe(2);
    });

    it('follows an item the list holds focus for to its new position', () => {
      const { element, state, setValues, unmountItem, mountItem } = setup({
        values: ['a', 'b', 'c'],
      });
      element(1).focus();
      unmountItem(1);

      setValues(['new', 'a', 'b', 'c']);
      expect(state.activeIndex).toBe(2);

      const item = mountItem(2);
      expect(item).toHaveFocus();
    });

    it('gives focus to the item the list waits for when it rendered while focus was elsewhere', () => {
      const { list, focus, mountItem, setValues } = setup({
        values: ['a', 'b', 'c', 'd', 'e'],
        rendered: [0],
      });
      const outside = createFocusable(document.body);
      focus.moveTo(3, EVENT);
      outside.focus();
      const item = mountItem(3);
      list.focus();
      expect(list).toHaveFocus();

      setValues(['a', 'b', 'c', 'd', 'e']);

      expect(item).toHaveFocus();
    });

    it('moves focus to the default item when the item the list holds focus for is removed', () => {
      const { element, state, setValues, unmountItem, focus } = setup({
        values: ['a', 'b', 'c'],
      });
      element(1).focus();
      unmountItem(1);

      setValues(['a', 'c']);

      expect(element(0)).toHaveFocus();
      expect(state.activeIndex).toBe(0);
      expect(focus.isPending()).toBe(false);
    });
  });

  describe('when the list element receives focus', () => {
    it.each([
      { name: 'without scrolling after a press', fromPress: true },
      { name: 'scrolling to it otherwise', fromPress: false },
    ])('passes focus to the item that holds the tab stop, $name', ({ fromPress }) => {
      const { list, element, focus, setTabStop } = setup();
      setTabStop(2);
      const focusSpy = vi.spyOn(element(2), 'focus');
      list.focus();

      focus.listFocused(EVENT, fromPress);

      expect(element(2)).toHaveFocus();
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: fromPress });
    });

    it('highlights a tab-stop item that is not rendered, to have it scrolled into view', () => {
      const { list, focus, highlight, setTabStop } = setup();
      setTabStop(10);
      list.focus();

      focus.listFocused(EVENT, false);

      expect(highlight).toHaveBeenCalledWith(10, EVENT);
      expect(focus.isPending()).toBe(true);
    });

    it('leaves the list where it is after a press when the tab-stop item is not rendered', () => {
      const { list, focus, highlight, setTabStop } = setup();
      setTabStop(10);
      list.focus();

      focus.listFocused(EVENT, true);

      expect(highlight).not.toHaveBeenCalled();
      expect(focus.isPending()).toBe(false);
    });

    it('keeps waiting for an item that is not rendered yet', () => {
      const { list, focus } = setup();
      focus.moveTo(10, EVENT);
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');

      try {
        focus.listFocused(EVENT, false);

        expect(focusSpy).not.toHaveBeenCalled();
        expect(list).toHaveFocus();
      } finally {
        focusSpy.mockRestore();
      }
    });
  });
});
