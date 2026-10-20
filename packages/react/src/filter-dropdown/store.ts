import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_OBJECT, NOOP } from '@base-ui/utils/empty';

export type State = {
  visibleItemIds: ReadonlySet<symbol> | null;
  registeredItemCount: number;
  /** The host's own count of matching items, for a list that mounts only some of them. */
  itemCount: number | null;
};

export const selectors = {
  isEmpty(state: State) {
    if (state.itemCount !== null) {
      return state.itemCount === 0;
    }
    // A null `visibleItemIds` means no query, so fall back to whether anything registered.
    return state.visibleItemIds === null
      ? state.registeredItemCount === 0
      : state.visibleItemIds.size === 0;
  },
  isItemVisible: (state: State, id: symbol) =>
    state.visibleItemIds === null || state.visibleItemIds.has(id),
};

export class FilterDropdownStore extends ReactStore<Readonly<State>, object, typeof selectors> {
  constructor() {
    super(
      { visibleItemIds: null, registeredItemCount: 0, itemCount: null },
      EMPTY_OBJECT,
      selectors,
    );
  }
}

/**
 * Stand-in for an item whose owning dropdown is absent, such as a filterable submenu's trigger
 * inside a plain parent menu. Nothing registers and every item stays visible.
 */
export const DETACHED_OWNER = {
  registerItem: () => NOOP,
  store: new FilterDropdownStore(),
};
