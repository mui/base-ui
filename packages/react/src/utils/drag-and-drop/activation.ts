import type { DragPointerType } from '../../types/drag';

const MOVEMENT_TOLERANCE_PX = 5;

export const DEFAULT_ACTIVATION: Record<DragPointerType, DragActivation> = {
  // Distance-based so a stationary click on a clickable child doesn't become a drag.
  mouse: { type: 'distance', distance: MOVEMENT_TOLERANCE_PX },
  // Distance-based so a stylus tap doesn't briefly enter a drag session.
  pen: { type: 'distance', distance: MOVEMENT_TOLERANCE_PX },
  // Press-hold for touch (with or without a drag handle): a distance-based
  // activation would hijack scrolls that happen to start on a handle.
  touch: { type: 'press-hold', delay: 250 },
};

export function resolveActivation(
  config: DragActivationConfig | undefined,
  pointerType: DragPointerType,
): DragActivation {
  if (config && 'type' in config) {
    return config;
  }
  const map = config as Partial<Record<DragPointerType, DragActivation>> | undefined;
  const specific = map?.[pointerType];
  if (specific) {
    return specific;
  }
  return DEFAULT_ACTIVATION[pointerType];
}

function squaredDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function evaluateActivation(
  activation: DragActivation,
  origin: { x: number; y: number },
  current: { x: number; y: number },
  elapsedMs: number,
): ActivationDecision {
  switch (activation.type) {
    case 'immediate':
      return 'activate';
    case 'distance': {
      const threshold = activation.distance * activation.distance;
      return squaredDistance(origin, current) >= threshold ? 'activate' : 'pending';
    }
    case 'press-hold': {
      const tolerance = activation.tolerance ?? MOVEMENT_TOLERANCE_PX;
      const toleranceSq = tolerance * tolerance;
      if (squaredDistance(origin, current) > toleranceSq) {
        return 'cancel';
      }
      if (elapsedMs >= activation.delay) {
        return 'activate';
      }
      return 'pending';
    }
    default:
      return 'pending';
  }
}

export function getActivationDelayMs(activation: DragActivation): number | null {
  return activation.type === 'press-hold' ? activation.delay : null;
}

/**
 * Determines when a `pointerdown` starts a drag.
 * - `immediate` starts on `pointerdown`.
 * - `distance` starts after the pointer moves by `distance` CSS pixels.
 * - `press-hold` starts after `delay` milliseconds. Moving farther than
 *   `tolerance` CSS pixels cancels the gesture. The default tolerance is 5.
 */
export type DragActivation =
  | { type: 'immediate' }
  | { type: 'distance'; distance: number }
  | { type: 'press-hold'; delay: number; tolerance?: number | undefined };

/**
 * A single activation applied to all pointer types, or a per-pointer map.
 * Missing entries fall back to the per-pointer defaults.
 */
export type DragActivationConfig =
  DragActivation | Partial<Record<DragPointerType, DragActivation>>;

export type ActivationDecision = 'pending' | 'activate' | 'cancel';
