import * as React from 'react';
import { useFloatingRootContext } from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import type { GenericHTMLProps } from '../../utils/types';

export interface SelectRootContext {
  name: string | undefined;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  value: any;
  setValue: (nextValue: any, event?: Event) => void;
  open: boolean;
  setOpen: (nextOpen: boolean, event?: Event) => void;
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  transitionStatus: TransitionStatus;
  triggerElement: HTMLElement | null;
  setTriggerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  positionerElement: HTMLElement | null;
  setPositionerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  scrollUpArrowVisible: boolean;
  setScrollUpArrowVisible: React.Dispatch<React.SetStateAction<boolean>>;
  scrollDownArrowVisible: boolean;
  setScrollDownArrowVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setcontrolledAlignItemToTrigger: React.Dispatch<React.SetStateAction<boolean>>;
  listRef: React.MutableRefObject<Array<HTMLElement | null>>;
  popupRef: React.MutableRefObject<HTMLDivElement | null>;
  getRootTriggerProps: (props?: GenericHTMLProps) => GenericHTMLProps;
  getRootPositionerProps: (props?: GenericHTMLProps) => GenericHTMLProps;
  getItemProps: (
    props?: GenericHTMLProps & { active?: boolean; selected?: boolean },
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
  alignItemToTrigger: boolean;
  typingRef: React.MutableRefObject<boolean>;
  selectionRef: React.MutableRefObject<{
    allowUnselectedMouseUp: boolean;
    allowSelectedMouseUp: boolean;
    allowSelect: boolean;
  }>;
  id: string | undefined;
  fieldControlValidation: ReturnType<typeof useFieldControlValidation>;
  trap: 'none' | 'scroll-pointer';
  registerSelectedItem: (index: number) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  keyboardActiveRef: React.MutableRefObject<boolean>;
}

export const SelectRootContext = React.createContext<SelectRootContext | null>(null);

export function useSelectRootContext() {
  const context = React.useContext(SelectRootContext);
  if (context === null) {
    throw new Error('useSelectRootContext must be used within a SelectRoot');
  }
  return context;
}
