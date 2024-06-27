import type { FloatingRootContext, OpenChangeReason } from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { GenericHTMLProps } from '../../utils/types';

export interface UseHoverCardRootParameters {
  /**
   * If `true`, the hover card popup will be open by default. Use when uncontrolled.
   */
  defaultOpen?: boolean;
  /**
   * If `true`, the hover card popup will be open. Use when controlled.
   */
  open?: boolean;
  /**
   * Callback fired when the hover card popup is requested to be opened or closed.
   */
  onOpenChange?: (isOpen: boolean, event?: Event, reason?: OpenChangeReason) => void;
  /**
   * The trigger element. Store in state.
   * @default null
   */
  triggerElement?: Element | null;
  /**
   * The positioner element. Store in state.
   * @default null
   */
  positionerElement?: HTMLElement | null;
  /**
   * If `true`, the user can move from the trigger toward the hover card without it closing.
   * @default true
   */
  hoverable?: boolean;
  /**
   * Whether the hover card can animate, adding animation-related attributes and allowing for exit
   * animations to play. Useful to disable in tests to remove async behavior.
   * @default true
   */
  animated?: boolean;
  /**
   * Determines which axis the hover card should follow the cursor on.
   * @default 'none'
   */
  followCursorAxis?: 'none' | 'x' | 'y' | 'both';
  /**
   * The delay in milliseconds until the hover card popup is opened.
   * @default 300
   */
  delay?: number;
  /**
   * The delay in milliseconds until the hover card popup is closed.
   * @default 0
   */
  closeDelay?: number;
  /**
   * The delay type to use. `rest` means the `delay` represents how long the user's cursor must
   * rest on the trigger before the hover card popup is opened. `hover` means the `delay` represents
   * how long to wait as soon as the user's cursor has entered the trigger.
   * @default 'rest'
   */
  delayType?: 'rest' | 'hover';
  /**
   * If `true`, the hover card popup remains mounted in the DOM even when closed.
   * @default false
   */
  keepMounted?: boolean;
}

export interface UseHoverCardRootReturnValue {
  /**
   * If `true`, the hover card is open.
   */
  open: boolean;
  /**
   * Sets the open state of the hover card.
   */
  setOpen: (value: boolean, event?: Event, reason?: OpenChangeReason) => void;
  /**
   * If `true`, the hover card is mounted.
   */
  mounted: boolean;
  /**
   * Sets the mounted state of the hover card.
   */
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Prop getter to spread props on the trigger element.
   */
  getRootTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * Prop getter to spread root props on the popup element.
   */
  getRootPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * The root context object.
   */
  floatingRootContext: FloatingRootContext;
  /**
   * The type of instant phase the hover card is in to remove animations.
   */
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  /**
   * The transition status of the hover card.
   */
  transitionStatus: TransitionStatus;
}
