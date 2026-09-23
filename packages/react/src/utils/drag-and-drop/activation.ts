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

/**
 * The press activations for `pointerType`: every entry that addresses it, minus
 * `double-click` (handled by the `dblclick` and double-tap paths). The per-pointer
 * default applies only when no entry addresses the pointer type at all, so
 * `[{ mouse: double-click }, { touch: press-hold }]` leaves mouse with the
 * double-click alone. An empty array disables pickup.
 */
export function resolveActivation(
  config: DragActivationConfig | readonly DragActivationConfig[] | undefined,
  pointerType: DragPointerType,
): DragActivation[] {
  if (config === undefined) {
    return [DEFAULT_ACTIVATION[pointerType]];
  }
  const configs = normalizeConfig(config);
  if (isPointerDisabled(configs, pointerType)) {
    return [];
  }
  let addressed = configs.length === 0;
  const activations = configs.flatMap((activation) => {
    const specific = 'type' in activation ? activation : activation[pointerType];
    if (!specific) {
      return [];
    }
    addressed = true;
    return specific.type === 'double-click' ? [] : [specific];
  });
  return addressed ? activations : [DEFAULT_ACTIVATION[pointerType]];
}

/**
 * Whether `pointerType` can pick up with a double-click (mouse) or a double-tap
 * (touch, pen). A single-value `double-click` applies to every pointer type; a
 * per-pointer map opts each type in on its own.
 */
export function hasDoubleClickActivation(
  config: DragActivationConfig | readonly DragActivationConfig[] | undefined,
  pointerType: DragPointerType,
): boolean {
  if (config === undefined) {
    return false;
  }
  const configs = normalizeConfig(config);
  if (isPointerDisabled(configs, pointerType)) {
    return false;
  }
  return configs.some((activation) => {
    if ('type' in activation) {
      return activation.type === 'double-click';
    }
    const specific = activation[pointerType];
    return specific !== false && specific?.type === 'double-click';
  });
}

function isPointerDisabled(configs: DragActivationConfig[], pointerType: DragPointerType): boolean {
  return configs.some((config) => !('type' in config) && config[pointerType] === false);
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
 * - `double-click`: with a mouse, the drag starts on a double-click, follows the
 *   pointer without a held button, and ends on the next primary click. With touch
 *   or pen, the drag starts on the second tap of a double-tap while the pointer
 *   is still down, and ends on release.
 */
export type DragActivation =
  | { type: 'immediate' }
  | { type: 'distance'; distance: number }
  | { type: 'press-hold'; delay: number; tolerance?: number | undefined }
  | { type: 'double-click' };

/**
 * A single activation applied to all pointer types, or a per-pointer map.
 * Missing entries fall back to the per-pointer defaults. Pass an array of these
 * values to enable multiple activation methods. Set a pointer entry to `false`
 * to disable pickup for that pointer type, overriding all methods in an array.
 */
export type DragActivationConfig =
  | DragActivation
  | {
      mouse?: DragActivation | false | undefined;
      touch?: DragActivation | false | undefined;
      pen?: DragActivation | false | undefined;
    };

export type ActivationDecision = 'pending' | 'activate' | 'cancel';
