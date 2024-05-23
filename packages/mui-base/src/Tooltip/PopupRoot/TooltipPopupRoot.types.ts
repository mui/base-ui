import type { BaseUIComponentProps } from '../../utils/BaseUI.types';

export type TooltipPopupRootOwnerState = {};

export interface TooltipPopupRootProps
  extends BaseUIComponentProps<'div', TooltipPopupRootOwnerState> {
  /**
   * The container element to which the tooltip content will be appended to.
   */
  container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
}
