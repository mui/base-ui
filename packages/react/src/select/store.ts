import { Store, createSelector } from '../utils/store';

export type State = {
  open: boolean;
  mounted: boolean;
  activeIndex: number | null;
  selectedIndex: number | null;
};

export type SelectStore = Store<State>;

export const selectors = {
  isOpen: createSelector((state: State) => state.open),
  isMounted: createSelector((state: State) => state.mounted),
  isActive: createSelector((state: State, index: number) => state.activeIndex === index),
  isSelected: createSelector((state: State, index: number) => state.selectedIndex === index),
  activeIndex: createSelector((state: State) => state.activeIndex),
  selectedIndex: createSelector((state: State) => state.selectedIndex),
};
