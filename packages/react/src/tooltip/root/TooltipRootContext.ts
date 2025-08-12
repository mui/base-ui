'use client';
import * as React from 'react';
import type { FloatingRootContext } from '../../floating-ui-react';
import type { HTMLProps, BaseUIEvent } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { BaseOpenChangeReason } from '../../utils/translateOpenChangeReason';

export type TooltipOpenChangeReason = BaseOpenChangeReason | 'disabled';

export interface TooltipOpenChangeEvent extends BaseUIEvent<React.SyntheticEvent> {
  reason?: TooltipOpenChangeReason;
}

export interface TooltipRootContext {
  open: boolean;
  setOpen: (open: boolean, event: TooltipOpenChangeEvent) => void;
  setTriggerElement: (el: Element | null) => void;
  positionerElement: HTMLElement | null;
  setPositionerElement: (el: HTMLElement | null) => void;
  popupRef: React.RefObject<HTMLElement | null>;
  delay: number;
  closeDelay: number;
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  triggerProps: HTMLProps;
  popupProps: HTMLProps;
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  floatingRootContext: FloatingRootContext;
  trackCursorAxis: 'none' | 'x' | 'y' | 'both';
  transitionStatus: TransitionStatus;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  hoverable: boolean;
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
