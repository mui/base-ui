import type { Side } from '@floating-ui/react';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/BaseUI.types';
import type { TooltipPopupParameters } from './useTooltipPopup.types';
import type { TooltipPopupRootOwnerState } from '../PopupRoot/TooltipPopupRoot.types';

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
  instant: 'delay' | 'focus' | 'dismiss' | undefined;
  entering: boolean;
  exiting: boolean;
};

export interface TooltipPopupProps
  extends BaseUIComponentProps<'div', TooltipPopupOwnerState>,
    TooltipPopupParameters {
  /**
   * The container element to which the tooltip content will be appended to.
   */
  container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
  /**
   * Customize the positioned root element.
   */
  renderRoot?: BaseUIComponentProps<'div', TooltipPopupRootOwnerState>['render'];
}
