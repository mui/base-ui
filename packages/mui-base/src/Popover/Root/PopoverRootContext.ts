'use client';
import * as React from 'react';
import type { OpenChangeReason, FloatingRootContext } from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { GenericHTMLProps } from '../../utils/types';

export interface PopoverRootContext {
  open: boolean;
  openOnHover: boolean;
  setOpen: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  setTriggerElement: (el: Element | null) => void;
  positionerElement: HTMLElement | null;
  setPositionerElement: (el: HTMLElement | null) => void;
  popupRef: React.RefObject<HTMLElement | null>;
  delay: number;
  closeDelay: number;
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

export const PopoverRootContext = React.createContext<PopoverRootContext | null>(null);

export function usePopoverRootContext() {
  const context = React.useContext(PopoverRootContext);
  if (context === null) {
    throw new Error('Popover components must be used within the <Popover.Root> component');
  }
  return context;
}
