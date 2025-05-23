'use client';
import * as React from 'react';
import type { FloatingRootContext } from '@floating-ui/react';
import type { HTMLProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { TooltipOpenChangeReason } from './useTooltipRoot';

export interface TooltipRootContext {
  disabled: boolean;
  open: boolean;
  setOpen: (
    open: boolean,
    event: Event | undefined,
    reason: TooltipOpenChangeReason | undefined,
  ) => void;
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
