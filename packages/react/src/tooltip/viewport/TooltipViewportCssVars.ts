import { CommonPopupDimensionAttributes } from '../../utils/popupStateMapping';

export enum TooltipViewportCssVars {
  /**
   * The width of the parent popup.
   * This variable is placed on the 'previous' container and stores the width of the popup when the previous content was rendered.
   * It can be used to freeze the dimensions of the popup when animating between different content.
   */
  popupWidth = CommonPopupDimensionAttributes.popupWidth,
  /**
   * The height of the parent popup.
   * This variable is placed on the 'previous' container and stores the height of the popup when the previous content was rendered.
   * It can be used to freeze the dimensions of the popup when animating between different content.
   */
  popupHeight = CommonPopupDimensionAttributes.popupHeight,
}
