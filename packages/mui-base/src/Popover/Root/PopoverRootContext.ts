'use client';
import * as React from 'react';
import type { OpenChangeReason, FloatingRootContext } from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { GenericHTMLProps } from '../../utils/types';

export interface PopoverRootContext {
  open: boolean;
  openOnHover: boolean;
  setOpen: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  triggerElement: Element | null;
  setTriggerElement: (el: Element | null) => void;
  positionerElement: HTMLElement | null;
  setPositionerElement: (el: HTMLElement | null) => void;
  popupRef: React.RefObject<HTMLElement | null>;
  delay: number;
  closeDelay: number;
  delayType: 'rest' | 'hover';
  instantType: 'dismiss' | 'click' | undefined;
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  transitionStatus: TransitionStatus;
  titleId: string | undefined;
  setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
  descriptionId: string | undefined;
  setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  floatingRootContext: FloatingRootContext;
  getRootTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getRootPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}

export const PopoverRootContext = React.createContext<PopoverRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  PopoverRootContext.displayName = 'PopoverRootContext';
}

export function usePopoverRootContext() {
  const context = React.useContext(PopoverRootContext);
  if (context === undefined) {
    throw new Error('Base UI: PopoverRootContext is not defined.');
  }

  return context;
}
