import { Store, createSelector } from '../utils/store';
import type { TransitionStatus } from '../utils/useTransitionStatus';
import type { HTMLProps } from '../utils/types';

export type State = {
  id: string | undefined;

  value: any;

  open: boolean;
  mounted: boolean;
  transitionStatus: TransitionStatus;

  inline: boolean;

  activeIndex: number | null;
  selectedIndex: number | null;

  popupProps: HTMLProps;
  triggerProps: HTMLProps;
  triggerElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
};

export type ComboboxStore = Store<State>;

export const selectors = {
  id: createSelector((state: State) => state.id),

  value: createSelector((state: State) => state.value),

  open: createSelector((state: State) => state.open),
  mounted: createSelector((state: State) => state.mounted),

  inline: createSelector((state: State) => state.inline),

  activeIndex: createSelector((state: State) => state.activeIndex),
  selectedIndex: createSelector((state: State) => state.selectedIndex),
  isActive: createSelector((state: State, index: number) => state.activeIndex === index),
  isSelected: createSelector((state: State, value: any) => state.value === value),

  popupProps: createSelector((state: State) => state.popupProps),
  triggerProps: createSelector((state: State) => state.triggerProps),
  triggerElement: createSelector((state: State) => state.triggerElement),
  positionerElement: createSelector((state: State) => state.positionerElement),
};
