import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '@base-ui/utils/empty';
import type { HTMLProps } from '../internals/types';

export type State = {
  visibleItemIds: ReadonlySet<symbol> | null;
  registeredItemCount: number;
  itemIds: readonly string[];
  activeIndex: number | null;
  inputProps: HTMLProps;
};

export const selectors = {
  // A null `visibleItemIds` means no query, so fall back to whether anything registered.
  isEmpty: (state: State) =>
    state.visibleItemIds === null
      ? state.registeredItemCount === 0
      : state.visibleItemIds.size === 0,
  isItemVisible: (state: State, id: symbol) =>
    state.visibleItemIds === null || state.visibleItemIds.has(id),
  activeIndex: (state: State) => state.activeIndex,
  activeItemId: (state: State) => state.itemIds[state.activeIndex ?? -1],
  inputProps: (state: State) => state.inputProps,
};

export class FilterDropdownStore extends ReactStore<Readonly<State>, object, typeof selectors> {
  constructor(initialState?: Partial<State>) {
    super(
      {
        visibleItemIds: null,
        registeredItemCount: 0,
        itemIds: EMPTY_ARRAY,
        activeIndex: null,
        inputProps: EMPTY_OBJECT,
        ...initialState,
      },
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
  grid: false,
  registerItem: () => () => {},
  store: new FilterDropdownStore(),
};
