import {
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
} from '../../floating-ui-react/utils/constants';

export type ListOrientation = 'vertical' | 'horizontal' | 'both' | undefined;

function matchesOrientation(orientation: ListOrientation, vertical: boolean, horizontal: boolean) {
  switch (orientation) {
    case 'vertical':
      return vertical;
    case 'horizontal':
      return horizontal;
    default:
      return vertical || horizontal;
  }
}

export function isMainOrientationKey(key: string, orientation: ListOrientation) {
  const vertical = key === ARROW_UP || key === ARROW_DOWN;
  const horizontal = key === ARROW_LEFT || key === ARROW_RIGHT;
  return matchesOrientation(orientation, vertical, horizontal);
}

export function isCrossOrientationOpenKey(key: string, orientation: ListOrientation, rtl: boolean) {
  const vertical = rtl ? key === ARROW_LEFT : key === ARROW_RIGHT;
  const horizontal = key === ARROW_DOWN;
  return matchesOrientation(orientation, vertical, horizontal);
}

export function isCrossOrientationCloseKey(
  key: string,
  orientation: ListOrientation,
  rtl: boolean,
  grid: boolean,
) {
  const vertical = rtl ? key === ARROW_RIGHT : key === ARROW_LEFT;
  const horizontal = key === ARROW_UP;
  if (orientation === 'both' || (orientation === 'horizontal' && grid)) {
    return key === 'Escape';
  }
  return matchesOrientation(orientation, vertical, horizontal);
}
