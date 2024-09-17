import * as React from 'react';
import type { FloatingRootContext, OpenChangeReason } from '@floating-ui/react';
import type { GenericHTMLProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

export interface TooltipRootContext {
  open: boolean;
  setOpen: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  triggerElement: Element | null;
  setTriggerElement: (el: Element | null) => void;
  positionerElement: HTMLElement | null;
  setPositionerElement: (el: HTMLElement | null) => void;
  popupRef: React.RefObject<HTMLElement | null>;
  delay: number;
  closeDelay: number;
  delayType: 'rest' | 'hover';
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  getRootTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getRootPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  floatingRootContext: FloatingRootContext;
  trackCursorAxis: 'none' | 'x' | 'y' | 'both';
  transitionStatus: TransitionStatus;
}

export const TooltipRootContext = React.createContext<TooltipRootContext | null>(null);

export function useTooltipRootContext() {
  const context = React.useContext(TooltipRootContext);
  if (context === null) {
    throw new Error('Tooltip components must be used within the <Tooltip.Root> component');
  }
  return context;
}
