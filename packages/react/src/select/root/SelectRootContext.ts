import * as React from 'react';
import { useFloatingRootContext } from '@floating-ui/react';
import { Store, createSelector } from '../../utils/store';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import type { HTMLProps } from '../../utils/types';
import type { SelectOpenChangeReason } from './useSelectRoot';

type State = {
  activeIndex: number;
  selectedIndex: number;
};

export function createStore() {
  return new Store<State>({
    activeIndex: -1,
    selectedIndex: -1,
  });
}

export const selectors = {
  isActive: createSelector((state: State, index: number) => state.activeIndex === index),
  isSelected: createSelector((state: State, index: number) => state.selectedIndex === index),
  activeIndex: createSelector((state: State) => state.activeIndex),
  selectedIndex: createSelector((state: State) => state.selectedIndex),
};

export interface SelectRootContext {
  store: Store<State>;
  name: string | undefined;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  value: any;
  setValue: (nextValue: any, event?: Event) => void;
  open: boolean;
  setOpen: (
    open: boolean,
    event: Event | undefined,
    reason: SelectOpenChangeReason | undefined,
  ) => void;
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  transitionStatus: TransitionStatus;
  triggerElement: HTMLElement | null;
  setTriggerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  positionerElement: HTMLElement | null;
  setPositionerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  listRef: React.MutableRefObject<Array<HTMLElement | null>>;
  popupRef: React.MutableRefObject<HTMLDivElement | null>;
  triggerProps: HTMLProps;
  popupProps: HTMLProps;
  getItemProps: (
    props?: HTMLProps & { active?: boolean; selected?: boolean },
  ) => Record<string, unknown>;
  floatingRootContext: ReturnType<typeof useFloatingRootContext>;
  label: string;
  setLabel: React.Dispatch<React.SetStateAction<string>>;
  valuesRef: React.MutableRefObject<Array<any>>;
  valueRef: React.MutableRefObject<HTMLSpanElement | null>;
  selectedItemTextRef: React.MutableRefObject<HTMLSpanElement | null>;
  labelsRef: React.MutableRefObject<Array<string | null>>;
  touchModality: boolean;
  setTouchModality: React.Dispatch<React.SetStateAction<boolean>>;
  typingRef: React.MutableRefObject<boolean>;
  selectionRef: React.MutableRefObject<{
    allowUnselectedMouseUp: boolean;
    allowSelectedMouseUp: boolean;
    allowSelect: boolean;
  }>;
  id: string | undefined;
  fieldControlValidation: ReturnType<typeof useFieldControlValidation>;
  modal: boolean;
  registerSelectedItem: (index: number) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  keyboardActiveRef: React.MutableRefObject<boolean>;
  alignItemWithTriggerActiveRef: React.RefObject<boolean>;
  typeaheadReady: boolean;
  setTypeaheadReady: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SelectRootContext = React.createContext<SelectRootContext | null>(null);

export function useSelectRootContext() {
  const context = React.useContext(SelectRootContext);
  if (context === null) {
    throw new Error('useSelectRootContext must be used within a SelectRoot');
  }
  return context;
}
