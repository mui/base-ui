import { NavigationMenuPopupCssVars } from '../popup/NavigationMenuPopupCssVars';
import { NavigationMenuPositionerCssVars } from '../positioner/NavigationMenuPositionerCssVars';

export function setFixedSize(element: HTMLElement, type: 'popup' | 'positioner') {
  element.style.setProperty(
    type === 'popup'
      ? NavigationMenuPopupCssVars.popupWidth
      : NavigationMenuPositionerCssVars.positionerWidth,
    `${element.offsetWidth}px`,
  );
  element.style.setProperty(
    type === 'popup'
      ? NavigationMenuPopupCssVars.popupHeight
      : NavigationMenuPositionerCssVars.positionerHeight,
    `${element.offsetHeight}px`,
  );
}
