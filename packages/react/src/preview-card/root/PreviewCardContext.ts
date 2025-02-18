'use client';
import * as React from 'react';
import type { FloatingRootContext } from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { GenericHTMLProps } from '../../utils/types';
import type { OpenChangeReason } from '../../utils/translateOpenChangeReason';

export interface PreviewCardRootContext {
  open: boolean;
  setOpen: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  setTriggerElement: (el: Element | null) => void;
  positionerElement: HTMLElement | null;
  setPositionerElement: (el: HTMLElement | null) => void;
  delay: number;
  closeDelay: number;
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  getRootTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getRootPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  floatingRootContext: FloatingRootContext;
  transitionStatus: TransitionStatus;
  popupRef: React.RefObject<HTMLElement | null>;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
}

export const PreviewCardRootContext = React.createContext<PreviewCardRootContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  PreviewCardRootContext.displayName = 'PreviewCardRootContext';
}

export function usePreviewCardRootContext() {
  const context = React.useContext(PreviewCardRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: PreviewCardRootContext is missing. PreviewCard parts must be placed within <PreviewCard.Root>.',
    );
  }

  return context;
}
