import type * as React from 'react';
import type { FloatingRootContext, OpenChangeReason } from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { GenericHTMLProps } from '../../utils/types';

export interface UsePreviewCardRootParameters {
  /**
   * Whether the preview card popup is open by default. Use when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean;
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
   * Whether the preview card popup opens when the trigger is hovered after the provided `delay`.
   * @default false
   */
  openOnHover?: boolean;
  /**
   * The delay in milliseconds until the preview card popup is opened when `openOnHover` is `true`.
   * @default 600
   */
  delay?: number;
  /**
   * The delay in milliseconds until the preview card popup is closed when `openOnHover` is `true`.
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
   * Whether the preview card popup element stays mounted in the DOM when closed.
   * @default false
   */
  keepMounted?: boolean;
  /**
   * Whether the preview card can animate, adding animation-related attributes and allowing for exit
   * animations to play. Useful to disable in tests to remove async behavior.
   * @default true
   */
  animated?: boolean;
}

export interface UsePreviewCardRootReturnValue {
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
  setTriggerElement: React.Dispatch<React.SetStateAction<Element | null>>;
  positionerElement: HTMLElement | null;
  setPositionerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  popupRef: React.RefObject<HTMLDivElement>;
}
