'use client';
import * as React from 'react';
import type { OpenChangeReason, FloatingRootContext } from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { GenericHTMLProps } from '../../utils/types';

export interface PreviewCardRootContext {
  open: boolean;
  setOpen: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  triggerElement: Element | null;
  setTriggerElement: (el: Element | null) => void;
  positionerElement: HTMLElement | null;
  setPositionerElement: (el: HTMLElement | null) => void;
  delay: number;
  closeDelay: number;
  delayType: 'rest' | 'hover';
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  getRootTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getRootPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  floatingRootContext: FloatingRootContext;
  transitionStatus: TransitionStatus;
  popupRef: React.RefObject<HTMLElement | null>;
}

export const PreviewCardRootContext = React.createContext<PreviewCardRootContext | null>(null);

export function usePreviewCardRootContext() {
  const context = React.useContext(PreviewCardRootContext);
  if (context === null) {
    throw new Error('PreviewCard components must be used within the <PreviewCard.Root> component');
  }
  return context;
}
