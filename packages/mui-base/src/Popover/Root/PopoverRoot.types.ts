import type { FloatingRootContext, OpenChangeReason } from '@floating-ui/react';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { GenericHTMLProps } from '../../utils/types';

export interface PopoverRootContextValue {
  open: boolean;
  openOnHover: boolean;
  setOpen: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  triggerElement: Element | null;
  setTriggerElement: (el: Element | null) => void;
  positionerElement: HTMLElement | null;
  setPositionerElement: (el: HTMLElement | null) => void;
  delay: number;
  closeDelay: number;
  delayType: 'rest' | 'hover';
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  transitionStatus: TransitionStatus;
  titleId: string | undefined;
  setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
  descriptionId: string | undefined;
  setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  rootContext: FloatingRootContext;
  getRootTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getRootPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}

export type PopoverRootOwnerState = {
  open: boolean;
};

export interface PopoverRootProps {
  children: React.ReactNode;
  /**
   * If `true`, the popover popup is open. Use when controlled.
   */
  open?: boolean;
  /**
   * Callback fired when the popover popup is requested to be opened or closed. Use when
   * controlled.
   */
  onOpenChange?: (isOpen: boolean, event?: Event, reason?: OpenChangeReason) => void;
  /**
   * Specifies whether the popover is open initially when uncontrolled.
   */
  defaultOpen?: boolean;
  /**
   * If `true`, the popover popup opens when the trigger is hovered.
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
