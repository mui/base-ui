import { Store, createSelector } from '@base-ui-components/utils/store';
import type { TransitionStatus } from '../utils/useTransitionStatus';
import type { HTMLProps } from '../utils/types';

export type State = {
  id: string | undefined;
  modal: boolean;

  items:
    | Record<string, React.ReactNode>
    | Array<{ label: React.ReactNode; value: any }>
    | undefined;
  value: any;
  label: string;

  open: boolean;
  mounted: boolean;
  forceMount: boolean;
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
};

export type SelectStore = Store<State>;

export const selectors = {
  id: createSelector((state: State) => state.id),
  modal: createSelector((state: State) => state.modal),

  items: createSelector((state: State) => state.items),
  value: createSelector((state: State) => state.value),
  label: createSelector((state: State) => state.label),

  open: createSelector((state: State) => state.open),
  mounted: createSelector((state: State) => state.mounted),
  forceMount: createSelector((state: State) => state.forceMount),
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
};
