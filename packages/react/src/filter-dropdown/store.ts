import { Store } from '@base-ui/utils/store';

export type State = {
  visibleItemIds: ReadonlySet<symbol> | null;
};

export type FilterDropdownStore = Store<State>;

export type NavigationState = {
  activeIndex: number | null;
};

export type FilterDropdownNavigationStore = Store<NavigationState>;

export const selectors = {
  isEmpty: (state: State) => state.visibleItemIds !== null && state.visibleItemIds.size === 0,
  isItemVisible: (state: State, id: symbol) =>
    state.visibleItemIds === null || state.visibleItemIds.has(id),
  isItemActive: (
    state: NavigationState,
    itemRef: { current: HTMLElement | null },
    listRef: { current: Array<HTMLElement | null> },
  ) => itemRef.current === listRef.current[state.activeIndex ?? -1],
};
