import { clamp } from '../../utils/clamp';

export const SCROLL_EDGE_TOLERANCE_PX = 1;

export function normalizeScrollOffset(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  const clamped = clamp(value, 0, max);

  if (clamped <= SCROLL_EDGE_TOLERANCE_PX) {
    return 0;
  }

  if (clamped >= max - SCROLL_EDGE_TOLERANCE_PX) {
    return max;
  }

  return clamped;
}
