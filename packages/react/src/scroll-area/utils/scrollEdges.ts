import { clamp } from '../../utils/clamp';

export const SCROLL_EDGE_TOLERANCE_PX = 1;

export function normalizeScrollOffset(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  const clamped = clamp(value, 0, max);
  const startDistance = clamped;
  const endDistance = max - clamped;
  const withinStartTolerance = startDistance <= SCROLL_EDGE_TOLERANCE_PX;
  const withinEndTolerance = endDistance <= SCROLL_EDGE_TOLERANCE_PX;

  if (withinStartTolerance && withinEndTolerance) {
    return startDistance <= endDistance ? 0 : max;
  }

  if (withinStartTolerance) {
    return 0;
  }

  if (withinEndTolerance) {
    return max;
  }

  return clamped;
}
