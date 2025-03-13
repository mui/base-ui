'use client';
import * as React from 'react';
import type { FloatingRootContext } from '@floating-ui/react';
import type { GenericHTMLProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { OpenChangeReason } from '../../utils/translateOpenChangeReason';

export interface TooltipRootContext {
  open: boolean;
  setOpen: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  setTriggerElement: (el: Element | null) => void;
  positionerElement: HTMLElement | null;
  setPositionerElement: (el: HTMLElement | null) => void;
  popupRef: React.RefObject<HTMLElement | null>;
  delay: number;
  closeDelay: number;
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  triggerProps: GenericHTMLProps;
  getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  floatingRootContext: FloatingRootContext;
  trackCursorAxis: 'none' | 'x' | 'y' | 'both';
  transitionStatus: TransitionStatus;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
}

export const TooltipRootContext = React.createContext<TooltipRootContext | undefined>(undefined);

export function useTooltipRootContext() {
  const context = React.useContext(TooltipRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TooltipRootContext is missing. Tooltip parts must be placed within <Tooltip.Root>.',
    );
  }

  return context;
}
