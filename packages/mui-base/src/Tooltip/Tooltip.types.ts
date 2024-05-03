import type * as React from 'react';
import type {
  FloatingArrowProps,
  FloatingContext,
  OpenChangeReason,
  Side,
  VirtualElement,
} from '@floating-ui/react';
import type { BaseUIComponentProps, GenericHTMLProps } from '../utils/BaseUI.types';
import type { TooltipContentParameters } from '../useTooltip';
import type { Status } from '../useTransitionStatus';

export interface ContextValue {
  open: boolean;
  setOpen: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  triggerEl: Element | null;
  setTriggerEl: (el: Element | null) => void;
  triggerProps: React.HTMLAttributes<Element>;
  setTriggerProps: (props: React.HTMLProps<Element>) => void;
  delay: number;
  closeDelay: number;
  delayType: 'rest' | 'hover';
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  status: Status;
}

export interface ContentContextValue {
  open: boolean;
  side: Side;
  alignment: 'start' | 'end' | 'center';
  arrowRef: React.MutableRefObject<Element | null>;
  floatingContext: FloatingContext;
}

export type OwnerState = {
  open: boolean;
};

export type ContentOwnerState = OwnerState & {
  side: Side;
  alignment: 'start' | 'end' | 'center';
};

export type ArrowOwnerState = ContentOwnerState &
  Pick<FloatingArrowProps, 'tipRadius' | 'staticOffset' | 'd'> & {
    floatingContext: FloatingContext;
  };

export interface RootProps {
  children: React.ReactNode;
  /**
   * If `true`, the tooltip content is open. Use when controlled.
   */
  open?: boolean;
  /**
   * Callback fired when the tooltip content is requested to be opened or closed. Use when
   * controlled.
   */
  onOpenChange?: (isOpen: boolean, event?: Event, reason?: OpenChangeReason) => void;
  /**
   * Specifies whether the tooltip is open initially when uncontrolled.
   */
  defaultOpen?: boolean;
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
}
export interface GroupProps {
  children: React.ReactNode;
  /**
   * The delay in milliseconds until tooltips within the group are open.
   * @default 0
   */
  delay?: number;
  /**
   * The delay in milliseconds until the tooltip content is closed.
   * @default 0
   */
  closeDelay?: number;
  /**
   * The timeout in milliseconds until the grouping logic is no longer active after the last tooltip
   * in the group has closed.
   * @default 400
   */
  timeout?: number;
}
export interface ContentProps
  extends BaseUIComponentProps<'div', ContentOwnerState>,
    TooltipContentParameters {
  /**
   * The container element to which the tooltip content will be appended to.
   * @default document.body
   */
  container?: Element | null | (() => Element | null);
  /**
   * If `true`, the tooltip content will be kept mounted in the DOM.
   * @default false
   */
  keepMounted?: boolean;
  /**
   * The anchor element to which the tooltip content will be placed at.
   */
  anchor?:
    | Element
    | null
    | VirtualElement
    | React.MutableRefObject<Element | null>
    | (() => Element | VirtualElement | null);
}
export interface TriggerProps {
  children: React.ReactElement | ((htmlProps: GenericHTMLProps) => React.ReactElement);
}
export interface ArrowProps
  extends Omit<BaseUIComponentProps<'svg', ArrowOwnerState>, 'width' | 'height' | 'strokeWidth'>,
    Pick<
      FloatingArrowProps,
      // Sizes must be in pixels.
      'width' | 'height' | 'strokeWidth' | 'tipRadius' | 'd' | 'staticOffset'
    > {
  /**
   * If `true`, the arrow will be hidden when it can't point to the center of the anchor element.
   * @default false
   */
  hideWhenUncentered?: boolean;
}
