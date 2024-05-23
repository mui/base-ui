import type {
  FloatingRootContext,
  OpenChangeReason,
  UseInteractionsReturn,
} from '@floating-ui/react';
import type { TransitionStatus } from '../../useTransitionStatus';

export interface UseTooltipRootParameters {
  /**
   * If `true`, the tooltip will be open by default. Use when uncontrolled.
   */
  defaultOpen?: boolean;
  /**
   * If `true`, the tooltip will be open. Use when controlled.
   */
  open?: boolean;
  /**
   * Callback fired when the tooltip is requested to be opened or closed.
   */
  onOpenChange?: (isOpen: boolean, event?: Event, reason?: OpenChangeReason) => void;
  /**
   * The trigger element. Store in state.
   * @default null
   */
  triggerEl?: Element | null;
  /**
   * The popup element. Store in state.
   * @default null
   */
  popupEl?: HTMLElement | null;
  /**
   * Whether you can move from the trigger to the tooltip without it closing.
   * @default true
   */
  hoverable?: boolean;
  /**
   * Whether the tooltip can animate. Useful to disable in tests.
   * @default true
   */
  animated?: boolean;
  /**
   * Determines which axis the tooltip should follow the cursor on.
   * @default 'none'
   */
  followCursorAxis?: 'none' | 'x' | 'y' | 'both';
  /**
   * The delay in milliseconds until the tooltip content is opened.
   * @default 200
   */
  delay?: number;
  /**
   * The delay in milliseconds until the tooltip content is closed.
   * @default 0
   */
  closeDelay?: number;
  /**
   * The delay type to use. `rest` means the `delay` represents how long the user's cursor must
   * rest on the trigger before the tooltip content is opened. `hover` means the `delay` represents
   * how long to wait once the user's cursor has entered the trigger.
   * @default 'rest'
   */
  delayType?: 'rest' | 'hover';
  /**
   * If `true`, the tooltip will remain mounted in the DOM.
   * @default false
   */
  keepMounted?: boolean;
}

export interface UseTooltipRootReturnValue {
  /**
   * If `true`, the tooltip is open.
   */
  open: boolean;
  /**
   * Sets the open state of the tooltip.
   */
  setOpen: (value: boolean, event?: Event, reason?: OpenChangeReason) => void;
  /**
   * If `true`, the tooltip is mounted.
   */
  mounted: boolean;
  /**
   * Sets the mounted state of the tooltip.
   */
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Prop getter to spread props on the trigger element.
   */
  getTriggerProps: UseInteractionsReturn['getReferenceProps'];
  /**
   * Prop getter to spread root props on the popup element.
   */
  getRootPopupProps: UseInteractionsReturn['getFloatingProps'];
  /**
   * The root context object.
   */
  rootContext: FloatingRootContext;
  /**
   * The type of instant phase the tooltip is in to remove animations.
   */
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  /**
   * The transition status of the tooltip.
   */
  transitionStatus: TransitionStatus;
}
