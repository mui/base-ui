import type { FloatingRootContext, OpenChangeReason } from '@floating-ui/react';
import type { GenericHTMLProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

export interface UsePopoverRootParameters {
  /**
   * Whether the popover popup is open by default. Use when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Whether the popover popup is open. Use when controlled.
   * @default false
   */
  open?: boolean;
  /**
   * Callback fired when the popover popup is requested to be opened or closed. Use when
   * controlled.
   */
  onOpenChange?: (isOpen: boolean, event?: Event, reason?: OpenChangeReason) => void;
  /**
   * Whether the popover popup opens when the trigger is hovered after the provided `delay`.
   * @default false
   */
  openOnHover?: boolean;
  /**
   * The delay in milliseconds until the popover popup is opened when `openOnHover` is `true`.
   * @default 500
   */
  delay?: number;
  /**
   * The delay in milliseconds until the popover popup is closed when `openOnHover` is `true`.
   * @default 0
   */
  closeDelay?: number;
  /**
   * The delay type to use when `openOnHover` is `true`. `rest` means the `delay` represents how
   * long the user's cursor must rest on the trigger before the popover popup is opened. `hover`
   * means the `delay` represents how long to wait as soon as the user's cursor has entered the
   * trigger.
   * @default 'rest'
   */
  delayType?: 'rest' | 'hover';
  /**
   * The trigger element that opens the popover popup. Store in state.
   * @default null
   */
  triggerElement?: Element | null;
  /**
   * The element that positioners the popover popup. Store in state.
   * @default null
   */
  positionerElement?: HTMLElement | null;
  /**
   * Whether the popover popup element stays mounted in the DOM when closed.
   * @default false
   */
  keepMounted?: boolean;
  /**
   * Determines which axis the tooltip should follow the cursor on.
   * @default 'none'
   */
  followCursorAxis?: 'none' | 'x' | 'y';
  /**
   * Whether the tooltip can animate, adding animation-related attributes and allowing for exit
   * animations to play. Useful to disable in tests to remove async behavior.
   * @default true
   */
  animated?: boolean;
}

export interface UsePopoverRootReturnValue {
  open: boolean;
  setOpen: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  transitionStatus: TransitionStatus;
  titleId: string | undefined;
  setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
  descriptionId: string | undefined;
  setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  floatingRootContext: FloatingRootContext;
  getRootTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getRootPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  instantType: 'dismiss' | 'click' | undefined;
}
