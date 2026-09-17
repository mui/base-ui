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
  config: DragActivationConfig | readonly DragActivationConfig[] | undefined,
  pointerType: DragPointerType,
): DragActivation[] {
  const configs =
    config === undefined ? [DEFAULT_ACTIVATION[pointerType]] : normalizeConfig(config);
  return configs.flatMap((activation) => {
    if ('type' in activation) {
      return activation.type === 'double-click' ? [] : [activation];
    }
    const specific = activation[pointerType];
    if (specific && specific.type !== 'double-click') {
      return [specific];
    }
    return specific ? [] : [DEFAULT_ACTIVATION[pointerType]];
  });
}

export function hasDoubleClickActivation(
  config: DragActivationConfig | readonly DragActivationConfig[] | undefined,
): boolean {
  if (config === undefined) {
    return false;
  }
  return normalizeConfig(config).some((activation) => {
    if ('type' in activation) {
      return activation.type === 'double-click';
    }
    return activation.mouse?.type === 'double-click';
  });
}

function normalizeConfig(
  config: DragActivationConfig | readonly DragActivationConfig[],
): DragActivationConfig[] {
  if (Array.isArray(config)) {
    return [...config] as DragActivationConfig[];
  }
  return [config as DragActivationConfig];
}

function squaredDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function evaluateActivation(
  activation: DragActivation | readonly DragActivation[],
  origin: { x: number; y: number },
  current: { x: number; y: number },
  elapsedMs: number,
): ActivationDecision {
  const activations = Array.isArray(activation) ? activation : [activation];
  if (activations.length === 0) {
    return 'cancel';
  }

  let hasPending = false;
  for (const activation of activations) {
    switch (activation.type) {
      case 'immediate':
        return 'activate';
      case 'distance': {
        const threshold = activation.distance * activation.distance;
        if (squaredDistance(origin, current) >= threshold) {
          return 'activate';
        }
        hasPending = true;
        break;
      }
      case 'press-hold': {
        const tolerance = activation.tolerance ?? MOVEMENT_TOLERANCE_PX;
        const toleranceSq = tolerance * tolerance;
        if (squaredDistance(origin, current) <= toleranceSq && elapsedMs >= activation.delay) {
          return 'activate';
        }
        if (squaredDistance(origin, current) <= toleranceSq) {
          hasPending = true;
        }
        break;
      }
      case 'double-click':
        break;
      default:
        break;
    }
  }
  return hasPending ? 'pending' : 'cancel';
}

export function getActivationDelayMs(
  activation: DragActivation | readonly DragActivation[],
): number | null {
  const activations = Array.isArray(activation) ? activation : [activation];
  const delays = activations
    .filter((activation) => activation.type === 'press-hold')
    .map((activation) => activation.delay);
  return delays.length > 0 ? Math.min(...delays) : null;
}

/**
 * When a `pointerdown` becomes a drag. Discriminated on `type`:
 * - `immediate`: any `pointerdown` starts the drag.
 * - `distance`: the drag starts after the pointer has moved by `distance` CSS pixels.
 * - `press-hold`: the drag starts after `delay` ms of holding still; movement
 *   larger than `tolerance` CSS pixels (default 5) cancels the gesture.
 * - `double-click`: the drag starts on a double-click and ends on the next click.
 */
export type DragActivation =
  | { type: 'immediate' }
  | { type: 'distance'; distance: number }
  | { type: 'press-hold'; delay: number; tolerance?: number | undefined }
  | { type: 'double-click' };

/**
 * A single activation applied to all pointer types, or a per-pointer map.
 * Missing entries fall back to the per-pointer defaults. Pass an array of these
 * values to enable multiple activation methods.
 */
export type DragActivationConfig =
  DragActivation | Partial<Record<DragPointerType, DragActivation>>;

export type ActivationDecision = 'pending' | 'activate' | 'cancel';
