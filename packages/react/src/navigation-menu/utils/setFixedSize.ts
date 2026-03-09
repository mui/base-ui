import { getCssDimensions } from '../../utils/getCssDimensions';
import { NavigationMenuPopupCssVars } from '../popup/NavigationMenuPopupCssVars';
import { NavigationMenuPositionerCssVars } from '../positioner/NavigationMenuPositionerCssVars';

type NavigationMenuElementType = 'popup' | 'positioner';

export type NavigationMenuSize = Readonly<{
  width: number;
  height: number;
}>;

export const EMPTY_SIZE: NavigationMenuSize = { width: 0, height: 0 };

function getSizeVars(type: NavigationMenuElementType) {
  const widthVar =
    type === 'popup'
      ? NavigationMenuPopupCssVars.popupWidth
      : NavigationMenuPositionerCssVars.positionerWidth;
  const heightVar =
    type === 'popup'
      ? NavigationMenuPopupCssVars.popupHeight
      : NavigationMenuPositionerCssVars.positionerHeight;

  return { widthVar, heightVar };
}

export function getFixedSize(
  element: HTMLElement,
  type: NavigationMenuElementType,
  fallbackSize: NavigationMenuSize = EMPTY_SIZE,
): NavigationMenuSize {
  const { widthVar, heightVar } = getSizeVars(type);

  const previousWidth = parseFloat(element.style.getPropertyValue(widthVar)) || 0;
  const previousHeight = parseFloat(element.style.getPropertyValue(heightVar)) || 0;

  const { width, height } = getCssDimensions(element);

  const resolvedWidth = width || fallbackSize.width || previousWidth || element.offsetWidth;
  const resolvedHeight = height || fallbackSize.height || previousHeight || element.offsetHeight;

  if (resolvedWidth === 0 || resolvedHeight === 0) {
    return EMPTY_SIZE;
  }

  return { width: resolvedWidth, height: resolvedHeight };
}

export function getCommittedSize(
  element: HTMLElement,
  type: NavigationMenuElementType,
  fallbackSize: NavigationMenuSize = EMPTY_SIZE,
): NavigationMenuSize {
  if (fallbackSize.width !== 0 && fallbackSize.height !== 0) {
    return fallbackSize;
  }

  const { widthVar, heightVar } = getSizeVars(type);
  const previousWidth = parseFloat(element.style.getPropertyValue(widthVar)) || 0;
  const previousHeight = parseFloat(element.style.getPropertyValue(heightVar)) || 0;

  if (previousWidth !== 0 && previousHeight !== 0) {
    return { width: previousWidth, height: previousHeight };
  }

  return getFixedSize(element, type);
}

export function setFixedSize(
  element: HTMLElement,
  type: NavigationMenuElementType,
  size: NavigationMenuSize = getFixedSize(element, type),
) {
  if (size.width === 0 || size.height === 0) {
    return EMPTY_SIZE;
  }

  const { widthVar, heightVar } = getSizeVars(type);

  element.style.setProperty(widthVar, `${size.width}px`);
  element.style.setProperty(heightVar, `${size.height}px`);

  return size;
}

export function clearFixedSizes(popupElement: HTMLElement, positionerElement: HTMLElement) {
  popupElement.style.removeProperty(NavigationMenuPopupCssVars.popupWidth);
  popupElement.style.removeProperty(NavigationMenuPopupCssVars.popupHeight);
  positionerElement.style.removeProperty(NavigationMenuPositionerCssVars.positionerWidth);
  positionerElement.style.removeProperty(NavigationMenuPositionerCssVars.positionerHeight);
}

export function setSharedFixedSize(
  popupElement: HTMLElement,
  positionerElement: HTMLElement,
  size: NavigationMenuSize = getFixedSize(popupElement, 'popup'),
) {
  if (size.width === 0 || size.height === 0) {
    return EMPTY_SIZE;
  }

  setFixedSize(popupElement, 'popup', size);
  setFixedSize(positionerElement, 'positioner', size);

  return size;
}
