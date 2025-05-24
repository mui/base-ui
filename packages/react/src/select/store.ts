import { Store, createSelector } from '../utils/store';

export type State = {
  activeIndex: number | null;
  selectedIndex: number | null;
};

export type SelectState = State;
export type SelectStore = Store<State>;

export function createStore() {
  return new Store<State>({
    activeIndex: null,
    selectedIndex: null,
  });
}

export const selectors = {
  isActive: createSelector((state: State, index: number) => state.activeIndex === index),
  isSelected: createSelector((state: State, index: number) => state.selectedIndex === index),
  activeIndex: createSelector((state: State) => state.activeIndex),
  selectedIndex: createSelector((state: State) => state.selectedIndex),
};
