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
   * The trigger element that opens the tooltip popup. Store in state.
   * @default null
   */
  triggerElement?: Element | null;
  /**
   * The element that positioners the tooltip popup. Store in state.
   * @default null
   */
  positionerElement?: HTMLElement | null;
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
  /**
   * Whether the tooltip is open.
   */
  open: boolean;
  /**
   * Sets the open state of the tooltip.
   */
  setOpen: (value: boolean, event?: Event, reason?: OpenChangeReason) => void;
  /**
   * Whether the tooltip is mounted to the DOM.
   */
  mounted: boolean;
  /**
   * Sets the mounted state of the tooltip.
   */
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Prop getter to spread props on the trigger element.
   */
  getRootTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * Prop getter to spread root props on the positioner element.
   */
  getRootPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * The root context object.
   */
  floatingRootContext: FloatingRootContext;
  /**
   * The type of instant phase the tooltip is in to remove animations.
   */
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  /**
   * The transition status of the tooltip.
   */
  transitionStatus: TransitionStatus;
}
