import { getCssDimensions } from '../../utils/getCssDimensions';
import { NavigationMenuPopupCssVars } from '../popup/NavigationMenuPopupCssVars';
import { NavigationMenuPositionerCssVars } from '../positioner/NavigationMenuPositionerCssVars';

export function setFixedSize(element: HTMLElement, type: 'popup' | 'positioner') {
  const widthVar =
    type === 'popup'
      ? NavigationMenuPopupCssVars.popupWidth
      : NavigationMenuPositionerCssVars.positionerWidth;
  const heightVar =
    type === 'popup'
      ? NavigationMenuPopupCssVars.popupHeight
      : NavigationMenuPositionerCssVars.positionerHeight;

  const previousWidth = parseFloat(element.style.getPropertyValue(widthVar)) || 0;
  const previousHeight = parseFloat(element.style.getPropertyValue(heightVar)) || 0;

  const { width, height } = getCssDimensions(element);

  const resolvedWidth = width || previousWidth || element.offsetWidth;
  const resolvedHeight = height || previousHeight || element.offsetHeight;

  if (resolvedWidth === 0 || resolvedHeight === 0) {
    return;
  }

  element.style.setProperty(widthVar, `${resolvedWidth}px`);
  element.style.setProperty(heightVar, `${resolvedHeight}px`);
}
