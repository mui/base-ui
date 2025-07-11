import { Store, createSelector } from '@base-ui-components/utils/store';
import type { TransitionStatus } from '../utils/useTransitionStatus';
import type { HTMLProps } from '../utils/types';

export type State = {
  id: string | undefined;

  query: string;

  initialList: any[];

  filter: (item: any, query: string) => boolean;

  selectedValue: any;
  inputValue: React.ComponentProps<'input'>['value'];

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
  listElement: HTMLElement | null;
};

export type ComboboxStore = Store<State>;

export const selectors = {
  id: createSelector((state: State) => state.id),

  query: createSelector((state: State) => state.query),

  initialList: createSelector((state: State) => state.initialList),

  selectedValue: createSelector((state: State) => state.selectedValue),
  inputValue: createSelector((state: State) => state.inputValue),

  open: createSelector((state: State) => state.open),
  mounted: createSelector((state: State) => state.mounted),

  inline: createSelector((state: State) => state.inline),

  activeIndex: createSelector((state: State) => state.activeIndex),
  selectedIndex: createSelector((state: State) => state.selectedIndex),
  isActive: createSelector((state: State, index: number) => state.activeIndex === index),
  isSelected: createSelector((state: State, selectedValue: any) => {
    if (Array.isArray(state.selectedValue)) {
      return state.selectedValue.includes(selectedValue);
    }
    return state.selectedValue === selectedValue;
  }),

  popupProps: createSelector((state: State) => state.popupProps),
  triggerProps: createSelector((state: State) => state.triggerProps),
  triggerElement: createSelector((state: State) => state.triggerElement),
  positionerElement: createSelector((state: State) => state.positionerElement),
  listElement: createSelector((state: State) => state.listElement),
};
