import type { FloatingRootContext, OpenChangeReason } from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { GenericHTMLProps } from '../../utils/types';

export interface UsePreviewCardRootParameters {
  /**
   * If `true`, the preview card popup will be open by default. Use when uncontrolled.
   */
  defaultOpen?: boolean;
  /**
   * If `true`, the preview card popup will be open. Use when controlled.
   */
  open?: boolean;
  /**
   * Callback fired when the preview card popup is requested to be opened or closed.
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
   * Whether the preview card can animate, adding animation-related attributes and allowing for exit
   * animations to play. Useful to disable in tests to remove async behavior.
   * @default true
   */
  animated?: boolean;
  /**
   * The delay in milliseconds until the preview card popup is opened.
   * @default 400
   */
  delay?: number;
  /**
   * The delay in milliseconds until the preview card popup is closed.
   * @default 300
   */
  closeDelay?: number;
  /**
   * The delay type to use. `rest` means the `delay` represents how long the user's cursor must
   * rest on the trigger before the preview card popup is opened. `hover` means the `delay` represents
   * how long to wait as soon as the user's cursor has entered the trigger.
   * @default 'rest'
   */
  delayType?: 'rest' | 'hover';
  /**
   * If `true`, the preview card popup remains mounted in the DOM even when closed.
   * @default false
   */
  keepMounted?: boolean;
}

export interface UsePreviewCardRootReturnValue {
  /**
   * If `true`, the preview card is open.
   */
  open: boolean;
  /**
   * Sets the open state of the preview card.
   */
  setOpen: (value: boolean, event?: Event, reason?: OpenChangeReason) => void;
  /**
   * If `true`, the preview card is mounted.
   */
  mounted: boolean;
  /**
   * Sets the mounted state of the preview card.
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
   * The type of instant phase the preview card is in to remove animations.
   */
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  /**
   * The transition status of the preview card.
   */
  transitionStatus: TransitionStatus;
}
