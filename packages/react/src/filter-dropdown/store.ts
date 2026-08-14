import { Store } from '@base-ui/utils/store';

export type State = {
  visibleItemIds: ReadonlySet<symbol> | null;
};

export type FilterDropdownStore = Store<State>;

export const selectors = {
  isEmpty: (state: State) => state.visibleItemIds !== null && state.visibleItemIds.size === 0,
  isItemVisible: (state: State, id: symbol) =>
    state.visibleItemIds === null || state.visibleItemIds.has(id),
};

/**
 * Stand-in for an item whose owning dropdown is absent, such as a filterable submenu's trigger
 * inside a plain parent menu. Nothing registers and every item stays visible.
 */
export const DETACHED_OWNER = {
  registerItem: () => () => {},
  store: new Store<State>({ visibleItemIds: null }),
};
