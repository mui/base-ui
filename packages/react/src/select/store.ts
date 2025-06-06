import { Store, createSelector } from '../utils/store';
import type { TransitionStatus } from '../utils/useTransitionStatus';
import type { HTMLProps } from '../utils/types';

export type State = {
  id: string | undefined;
  modal: boolean;

  value: any;
  label: string;

  open: boolean;
  mounted: boolean;
  typeaheadReady: boolean;
  transitionStatus: TransitionStatus;
  touchModality: boolean;

  activeIndex: number | null;
  selectedIndex: number | null;

  popupProps: HTMLProps;
  triggerProps: HTMLProps;
  triggerElement: HTMLElement | null;
  positionerElement: HTMLElement | null;

  scrollUpArrowVisible: boolean;
  scrollDownArrowVisible: boolean;
  controlledItemAnchor: boolean;
  alignItemWithTriggerActive: boolean;
};

export type SelectStore = Store<State>;

export const selectors = {
  id: createSelector((state: State) => state.id),
  modal: createSelector((state: State) => state.modal),

  value: createSelector((state: State) => state.value),
  label: createSelector((state: State) => state.label),

  open: createSelector((state: State) => state.open),
  mounted: createSelector((state: State) => state.mounted),
  typeaheadReady: createSelector((state: State) => state.typeaheadReady),
  transitionStatus: createSelector((state: State) => state.transitionStatus),
  touchModality: createSelector((state: State) => state.touchModality),

  activeIndex: createSelector((state: State) => state.activeIndex),
  selectedIndex: createSelector((state: State) => state.selectedIndex),
  isActive: createSelector((state: State, index: number) => state.activeIndex === index),
  isSelected: createSelector(
    (state: State, index: number, value: any) =>
      // `selectedIndex` is only updated after the items mount for the first time,
      // the value check avoids a re-render for the initially selected item.
      state.selectedIndex === index || state.value === value,
  ),

  popupProps: createSelector((state: State) => state.popupProps),
  triggerProps: createSelector((state: State) => state.triggerProps),
  triggerElement: createSelector((state: State) => state.triggerElement),
  positionerElement: createSelector((state: State) => state.positionerElement),

  scrollUpArrowVisible: createSelector((state: State) => state.scrollUpArrowVisible),
  scrollDownArrowVisible: createSelector((state: State) => state.scrollDownArrowVisible),
  controlledItemAnchor: createSelector((state: State) => state.controlledItemAnchor),
  alignItemWithTriggerActive: createSelector((state: State) => state.alignItemWithTriggerActive),
};
