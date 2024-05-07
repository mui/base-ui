import type { Side, FloatingContext, VirtualElement } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/BaseUI.types';
import type { TooltipContentParameters } from './useTooltipContent.types';
import type { TransitionStatus } from '../../useTransitionStatus';

export interface TooltipContentContextValue {
  open: boolean;
  side: Side;
  alignment: 'start' | 'end' | 'center';
  arrowRef: React.MutableRefObject<Element | null>;
  floatingContext: FloatingContext;
}

export type TooltipContentOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'end' | 'center';
  status: TransitionStatus;
  instant: 'delay' | 'focus' | 'dismiss' | undefined;
};

export interface TooltipContentProps
  extends BaseUIComponentProps<'div', TooltipContentOwnerState>,
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
