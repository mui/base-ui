import type { Side, VirtualElement } from '@floating-ui/react';
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
    Omit<TooltipPopupParameters, 'mounted' | 'rootContext' | 'instant' | 'setMounted'> {
  /**
   * The container element to which the tooltip content will be appended to.
   */
  container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
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
  /**
   * Customize the positioned root element.
   */
  renderRoot?: BaseUIComponentProps<'div', TooltipPopupRootOwnerState>['render'];
}
