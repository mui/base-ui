import { Store } from '@base-ui/utils/store';

export type State = {
  visibleItemIds: ReadonlySet<symbol> | null;
  registeredItemCount: number;
  itemIds: readonly string[];
};

export type FilterDropdownStore = Store<State>;

export const selectors = {
  // A null `visibleItemIds` means no query, so fall back to whether anything registered.
  isEmpty: (state: State) =>
    state.visibleItemIds === null
      ? state.registeredItemCount === 0
      : state.visibleItemIds.size === 0,
  isItemVisible: (state: State, id: symbol) =>
    state.visibleItemIds === null || state.visibleItemIds.has(id),
  activeItemId: (state: State, index: number | null) => state.itemIds[index ?? -1],
};

/**
 * Stand-in for an item whose owning dropdown is absent, such as a filterable submenu's trigger
 * inside a plain parent menu. Nothing registers and every item stays visible.
 */
export const DETACHED_OWNER = {
  registerItem: () => () => {},
  store: new Store<State>({ visibleItemIds: null, registeredItemCount: 0, itemIds: [] }),
};
