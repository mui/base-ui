import type { Side, VirtualElement } from '@floating-ui/react';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/BaseUI.types';
import type { TooltipPopupParameters } from './useTooltipPopup.types';
import type { TransitionStatus } from '../../useTransitionStatus';

export interface TooltipPopupContextValue {
  open: boolean;
  side: Side;
  alignment: 'start' | 'end' | 'center';
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  getArrowProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}

export type TooltipPopupOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'end' | 'center';
  status: TransitionStatus | undefined;
  instant: 'delay' | 'focus' | 'dismiss' | undefined;
};

export interface TooltipPopupProps
  extends BaseUIComponentProps<'div', TooltipPopupOwnerState>,
    TooltipPopupParameters {
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
