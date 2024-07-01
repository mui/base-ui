import type * as React from 'react';
import type { FloatingRootContext, OpenChangeReason } from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { GenericHTMLProps } from '../../utils/types';

export interface UseTooltipRootParameters {
  /**
   * Whether the tooltip popup is open by default. Use when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Whether the tooltip popup is open. Use when controlled.
   * @default false
   */
  open?: boolean;
  /**
   * Callback fired when the tooltip popup is requested to be opened or closed.
   */
  onOpenChange?: (isOpen: boolean, event?: Event, reason?: OpenChangeReason) => void;
  /**
   * Whether the can move their cursor from the trigger element toward the tooltip popup element
   * without it closing using a "safe polygon" technique.
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
  /**
   * The delay in milliseconds until the tooltip popup is opened.
   * @default 300
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
   * Whether the tooltip popup element stays mounted in the DOM when closed.
   * @default false
   */
  keepMounted?: boolean;
}

export interface UseTooltipRootReturnValue {
  open: boolean;
  setOpen: (value: boolean, event?: Event, reason?: OpenChangeReason) => void;
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  getRootTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getRootPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  floatingRootContext: FloatingRootContext;
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  transitionStatus: TransitionStatus;
  triggerElement: Element | null;
  positionerElement: HTMLElement | null;
  setTriggerElement: React.Dispatch<React.SetStateAction<Element | null>>;
  setPositionerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  popupRef: React.RefObject<HTMLElement>;
}
