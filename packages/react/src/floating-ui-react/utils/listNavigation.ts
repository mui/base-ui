import { ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, ARROW_UP } from './constants';

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
  return matchesOrientation(
    orientation,
    key === ARROW_UP || key === ARROW_DOWN,
    key === ARROW_LEFT || key === ARROW_RIGHT,
  );
}

export function isMainOrientationToEndKey(key: string, orientation: ListOrientation, rtl: boolean) {
  return (
    matchesOrientation(
      orientation,
      key === ARROW_DOWN,
      rtl ? key === ARROW_LEFT : key === ARROW_RIGHT,
    ) ||
    key === 'Enter' ||
    key === ' ' ||
    key === ''
  );
}

export function isCrossOrientationOpenKey(key: string, orientation: ListOrientation, rtl: boolean) {
  return matchesOrientation(
    orientation,
    rtl ? key === ARROW_LEFT : key === ARROW_RIGHT,
    key === ARROW_DOWN,
  );
}

export function isCrossOrientationCloseKey(
  key: string,
  orientation: ListOrientation,
  rtl: boolean,
  grid: boolean,
) {
  if (orientation === 'both' || (orientation === 'horizontal' && grid)) {
    return key === 'Escape';
  }
  return matchesOrientation(
    orientation,
    rtl ? key === ARROW_RIGHT : key === ARROW_LEFT,
    key === ARROW_UP,
  );
}
