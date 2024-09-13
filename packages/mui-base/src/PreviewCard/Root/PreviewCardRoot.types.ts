import type * as React from 'react';
import type { FloatingRootContext, OpenChangeReason } from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { GenericHTMLProps } from '../../utils/types';

export interface PreviewCardRootContextValue {
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

export type PreviewCardRootOwnerState = {};

export interface PreviewCardRootProps {
  children: React.ReactNode;
  /**
   * Whether the preview card popup is open. Use when controlled.
   * @default false
   */
  open?: boolean;
  /**
   * Callback fired when the preview card popup is requested to be opened or closed. Use when
   * controlled.
   */
  onOpenChange?: (isOpen: boolean, event?: Event, reason?: OpenChangeReason) => void;
  /**
   * Whether the preview card popup is open by default. Use when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * The delay in milliseconds until the preview card popup is opened.
   * @default 600
   */
  delay?: number;
  /**
   * The delay in milliseconds until the preview card popup is closed.
   * @default 300
   */
  closeDelay?: number;
  /**
   * The delay type to use when the preview card is triggered by hover. `rest` means the `delay`
   * represents how long the user's cursor must rest on the trigger before the preview card popup is
   * opened. `hover` means the `delay` represents how long to wait as soon as the user's cursor has
   * entered the trigger.
   * @default 'rest'
   */
  delayType?: 'rest' | 'hover';
  /**
   * Whether the preview card can animate, adding animation-related attributes and allowing for exit
   * animations to play. Useful to disable in tests to remove async behavior.
   * @default true
   */
  animated?: boolean;
}
