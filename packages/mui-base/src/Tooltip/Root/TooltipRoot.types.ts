import type {
  FloatingRootContext,
  OpenChangeReason,
  UseInteractionsReturn,
} from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

export interface TooltipRootContextValue {
  open: boolean;
  setOpen: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  triggerElement: Element | null;
  setTriggerElement: (el: Element | null) => void;
  popupElement: HTMLElement | null;
  setPopupElement: (el: HTMLElement | null) => void;
  delay: number;
  closeDelay: number;
  delayType: 'rest' | 'hover';
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  getTriggerProps: UseInteractionsReturn['getReferenceProps'];
  getRootPositionerProps: UseInteractionsReturn['getFloatingProps'];
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  rootContext: FloatingRootContext;
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
}
