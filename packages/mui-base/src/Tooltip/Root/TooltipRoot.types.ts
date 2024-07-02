import type * as React from 'react';
import type { FloatingRootContext, OpenChangeReason } from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { GenericHTMLProps } from '../../utils/types';

export interface TooltipRootContextValue {
  open: boolean;
  setOpen: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  triggerElement: Element | null;
  setTriggerElement: (el: Element | null) => void;
  positionerElement: HTMLElement | null;
  setPositionerElement: (el: HTMLElement | null) => void;
  popupRef: React.RefObject<HTMLElement>;
  delay: number;
  closeDelay: number;
  delayType: 'rest' | 'hover';
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  getRootTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getRootPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  floatingRootContext: FloatingRootContext;
  followCursorAxis: 'none' | 'x' | 'y' | 'both';
  transitionStatus: TransitionStatus;
}

export interface TooltipRootProps {
  children: React.ReactNode;
  /**
   * If `true`, the tooltip popup is open. Use when controlled.
   */
  open?: boolean;
  /**
   * Callback fired when the tooltip popup is requested to be opened or closed. Use when
   * controlled.
   */
  onOpenChange?: (isOpen: boolean, event?: Event, reason?: OpenChangeReason) => void;
  /**
   * Specifies whether the tooltip is open initially when uncontrolled.
   */
  defaultOpen?: boolean;
  /**
   * The delay in milliseconds until the tooltip popup is opened.
   * @default 600
   */
  delay?: number;
  /**
   * The delay in milliseconds until the tooltip popup is closed.
   * @default 0
   */
  closeDelay?: number;
  /**
   * The delay type to use. `rest` means the `delay` represents how long the user's cursor must
   * rest on the trigger before the tooltip popup is opened. `hover` means the `delay` represents
   * how long to wait as soon as the user's cursor has entered the trigger.
   * @default 'rest'
   */
  delayType?: 'rest' | 'hover';
  /**
   * Whether the user can move their cursor from the trigger to the tooltip popup without it
   * closing.
   * @default true
   */
  hoverable?: boolean;
  /**
   * Whether the tooltip can animate, adding animation-related attributes and allowing for exit
   * animations to play. Useful to disable in tests to remove async behavior.
   * @default true
   */
  animated?: boolean;
  /**
   * Determines which axis the tooltip should follow the cursor on.
   * @default 'none'
   */
  followCursorAxis?: 'none' | 'x' | 'y' | 'both';
}
