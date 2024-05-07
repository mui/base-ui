import type { OpenChangeReason } from '@floating-ui/react';
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
   * The transition status of the tooltip.
   */
  transitionStatus: TransitionStatus;
}
