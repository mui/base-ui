import { getCssDimensions } from '../../utils/getCssDimensions';
import { NavigationMenuPopupCssVars } from '../popup/NavigationMenuPopupCssVars';
import { NavigationMenuPositionerCssVars } from '../positioner/NavigationMenuPositionerCssVars';

export function setFixedSize(element: HTMLElement, type: 'popup' | 'positioner') {
  const { width, height } = getCssDimensions(element);
  element.style.setProperty(
    type === 'popup'
      ? NavigationMenuPopupCssVars.popupWidth
      : NavigationMenuPositionerCssVars.positionerWidth,
    `${width}px`,
  );
  element.style.setProperty(
    type === 'popup'
      ? NavigationMenuPopupCssVars.popupHeight
      : NavigationMenuPositionerCssVars.positionerHeight,
    `${height}px`,
  );
}
