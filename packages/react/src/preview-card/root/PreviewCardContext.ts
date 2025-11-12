'use client';
import * as React from 'react';
import type { FloatingRootContext } from '../../floating-ui-react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { HTMLProps } from '../../utils/types';
import type { PreviewCardRoot } from './PreviewCardRoot';

export interface PreviewCardTriggerDelayConfig {
  delay?: number;
  closeDelay?: number;
}

export interface PreviewCardRootContext {
  open: boolean;
  setOpen: (open: boolean, eventDetails: PreviewCardRoot.ChangeEventDetails) => void;
  setTriggerElement: (el: Element | null) => void;
  positionerElement: HTMLElement | null;
  setPositionerElement: (el: HTMLElement | null) => void;
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  triggerProps: HTMLProps;
  popupProps: HTMLProps;
  floatingRootContext: FloatingRootContext;
  transitionStatus: TransitionStatus;
  popupRef: React.RefObject<HTMLElement | null>;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  writeDelayRefs: (config: PreviewCardTriggerDelayConfig) => void;
}

export const PreviewCardRootContext = React.createContext<PreviewCardRootContext | undefined>(
  undefined,
);

export function usePreviewCardRootContext() {
  const context = React.useContext(PreviewCardRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: PreviewCardRootContext is missing. PreviewCard parts must be placed within <PreviewCard.Root>.',
    );
  }

  return context;
}
