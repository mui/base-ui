import type * as React from 'react';
import { ReactStore, createSelector } from '@base-ui/utils/store';
import type { ListboxRoot } from './root/ListboxRoot';
import type { ListboxItems } from './items/createItems';
import { REASONS } from '../internals/reasons';
import { createChangeEventDetails } from '../internals/createBaseUIEventDetails';
import { ListFocus } from './utils/listFocus';
import { ListSelection } from './utils/listSelection';
import type { SelectionItems } from './utils/listSelection';

export type State = {
  id: string | undefined;
  labelId: string | undefined;
  /** `'opt-in'` when pressing an item without a modifier replaces the selection. */
  multiple: boolean | 'opt-in';

  /** The selected values. An array even when `multiple` is `false`. */
  value: any[];

  /** The item that holds the tab stop. It stays set when focus leaves the list. */
  activeIndex: number | null;
  /** Whether an item has focus. Only then is the active item highlighted. */
  itemFocused: boolean;
  /** The item under the pointer. It's highlighted until a key press or focus leaving clears it. */
  hoveredIndex: number | null;
  /**
   * Every item, including those that aren't rendered, when they're passed to `Listbox.Root`.
   */
  items: ListboxItems | undefined;
  /** Whether the item that holds the tab stop is rendered. */
  activeItemRendered: boolean;

  listElement: HTMLElement | null;

  orientation: 'vertical' | 'horizontal';

  disabled: boolean;
  highlightItemOnHover: boolean;
};

export type Context = {
  valuesRef: React.RefObject<Array<any>>;
  labelsRef: React.RefObject<Array<string | null>>;
  /** The rendered items' disabled states. Not used with `items`, where the data decides. */
  disabledItemsRef: React.RefObject<Array<boolean | undefined>>;
  typingRef: React.RefObject<boolean>;
  setValue: (nextValue: any, eventDetails: ListboxRoot.ChangeEventDetails) => void;
  /** The event that caused the current `activeIndex` update, read by `onItemHighlighted`. */
  highlightEvent: Event | undefined;
  /** The rendered items' elements, by position. */
  elementsRef: React.RefObject<Array<HTMLElement | null>>;
};

/**
 * The highlighted item: the item under the pointer, or the focused item when the pointer isn't
 * over an item.
 */
export function getHighlightedIndex(state: State) {
  return state.hoveredIndex ?? (state.itemFocused ? state.activeIndex : null);
}

const SELECTION_REASONS = {
  press: REASONS.itemPress,
  keyboard: REASONS.listNavigation,
  escape: REASONS.escapeKey,
} as const;

export const selectors = {
  id: createSelector((state: State) => state.id),
  labelId: createSelector((state: State) => state.labelId),
  multiple: createSelector((state: State) => state.multiple),

  value: createSelector((state: State) => state.value),

  activeIndex: createSelector((state: State) => state.activeIndex),
  isActive: createSelector((state: State, index: number) => state.activeIndex === index),
  isHighlighted: createSelector(
    (state: State, index: number) => getHighlightedIndex(state) === index,
  ),

  isSelected: createSelector((state: State, itemValue: any) =>
    state.value.some((selectedValue) => Object.is(selectedValue, itemValue)),
  ),

  listElement: createSelector((state: State) => state.listElement),
  items: createSelector((state: State) => state.items),
  activeItemRendered: createSelector((state: State) => state.activeItemRendered),

  orientation: createSelector((state: State) => state.orientation),

  disabled: createSelector((state: State) => state.disabled),
  highlightItemOnHover: createSelector((state: State) => state.highlightItemOnHover),
};

export class ListboxStore extends ReactStore<Readonly<State>, Context, typeof selectors> {
  constructor(initialState?: Partial<State>, context?: Partial<Context>) {
    super(
      { ...createInitialState(), ...initialState },
      { ...createInitialContext(), ...context },
      selectors,
    );
  }

  /** The selection gestures. They commit the next selected values through `setValue`. */
  selection = new ListSelection<MouseEvent | KeyboardEvent>({
    getValue: () => this.state.value,
    getItems: () => this.getSelectionItems(),
    getMultiple: () => this.state.multiple,
    getDefaultAnchor: () => this.getTabStopIndex(),
    commit: (nextValue, source, event) => {
      this.context.setValue(nextValue, createChangeEventDetails(SELECTION_REASONS[source], event));
    },
  });

  /** Moves focus to items, waiting for those that aren't rendered yet. */
  focus = new ListFocus<Event>({
    getElement: (index) => this.context.elementsRef.current[index],
    getListElement: () => this.state.listElement,
    highlight: (index, event) => this.highlightItem(index, event),
  });

  /**
   * The item that receives focus when the list does: the first selected item, or the first item
   * when nothing is selected, as the APG listbox pattern describes.
   */
  getTabStopIndex(): number {
    let tabStopIndex = -1;
    for (const selectedValue of this.state.value) {
      const index = this.indexOfValue(selectedValue);
      if (index !== -1 && (tabStopIndex === -1 || index < tabStopIndex)) {
        tabStopIndex = index;
      }
    }
    return tabStopIndex === -1 ? 0 : tabStopIndex;
  }

  /** Puts the tab stop back on the item that should hold it, unless an item has focus. */
  syncTabStop() {
    if (!this.state.itemFocused) {
      this.setActiveIndex(this.getTabStopIndex());
    }
  }

  /**
   * Moves the tab stop without changing whether an item has focus, and records the event that
   * caused it, so `onItemHighlighted` can report the reason.
   */
  setActiveIndex(index: number | null, event?: Event) {
    this.context.highlightEvent = event;
    this.set('activeIndex', index);
    this.context.highlightEvent = undefined;
  }

  /**
   * The items the selection reducer selects from: the rendered items' values and disabled states,
   * and, with `items`, those of the items that aren't rendered.
   */
  getSelectionItems(): SelectionItems {
    const { items, disabled, multiple } = this.state;
    const disabledItems = this.context.disabledItemsRef.current;
    return {
      count: items ? items.size : this.context.valuesRef.current.length,
      getValue: (index) => this.getValueAt(index),
      indexOfValue: (value) => this.indexOfValue(value),
      isSameValue: Object.is,
      // With `items`, the data decides, so the answer is the same whether or not an item is
      // rendered.
      isDisabled: (index) =>
        items ? disabled || items.getDisabled(index) : (disabledItems[index] ?? false),

      keepsDisabled: multiple !== false,
    };
  }

  /** The value of the item at a position. */
  getValueAt(index: number): any {
    const { items } = this.state;
    return items ? items.valueAt(index) : this.context.valuesRef.current[index];
  }

  /** How many items the list has, including those that aren't rendered. */
  getCount(): number {
    const { items } = this.state;
    return items ? items.size : this.context.labelsRef.current.length;
  }

  /** The label of the item at a position, used by typeahead. */
  getLabelAt(index: number): string | null {
    const { items } = this.state;
    return items ? items.getLabel(index) : (this.context.labelsRef.current[index] ?? null);
  }

  /** The position of the item with a value, or `-1`. */
  indexOfValue(value: any): number {
    const { items } = this.state;
    if (items) {
      return items.indexOf(value);
    }
    return this.context.valuesRef.current.findIndex((itemValue) => Object.is(itemValue, value));
  }

  /**
   * Highlights the item that has focus, or is about to receive it. The highlight moves with focus,
   * so the hovered item is forgotten until the pointer moves again.
   */
  highlightItem(index: number, event?: Event) {
    this.context.highlightEvent = event;
    this.update({ activeIndex: index, itemFocused: true, hoveredIndex: null });
    this.context.highlightEvent = undefined;
  }

  /**
   * Records the item under the pointer, or `null` when the pointer leaves the list.
   */
  hoverItem(index: number | null, event?: Event) {
    this.context.highlightEvent = event;
    this.set('hoveredIndex', index);
    this.context.highlightEvent = undefined;
  }

  /**
   * Removes the highlight when focus leaves the items. The hovered item is forgotten too, so
   * nothing is highlighted until the pointer moves again.
   */
  unhighlightItem(event?: Event) {
    this.context.highlightEvent = event;
    this.update({ itemFocused: false, hoveredIndex: null });
    this.context.highlightEvent = undefined;
  }
}

function createInitialState(): State {
  return {
    id: undefined,
    labelId: undefined,
    multiple: false,
    value: [],
    activeIndex: null,
    itemFocused: false,
    hoveredIndex: null,
    items: undefined,
    activeItemRendered: false,
    listElement: null,
    orientation: 'vertical',
    disabled: false,
    highlightItemOnHover: true,
  };
}

function createInitialContext(): Context {
  return {
    valuesRef: { current: [] },
    labelsRef: { current: [] },
    disabledItemsRef: { current: [] },
    typingRef: { current: false },
    setValue: () => {},
    highlightEvent: undefined,
    elementsRef: { current: [] },
  };
}
