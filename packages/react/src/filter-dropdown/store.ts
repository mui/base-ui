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
