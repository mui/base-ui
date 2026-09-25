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
  const configs = getEnabledConfigs(config, pointerType);
  if (configs === null) {
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
  const configs = config === undefined ? null : getEnabledConfigs(config, pointerType);
  if (configs === null) {
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

/**
 * The config entries as a list, or `null` when any per-pointer map turns
 * `pointerType` off (`{ touch: false }`), which disables every form of pickup.
 */
function getEnabledConfigs(
  config: DragActivationConfig | readonly DragActivationConfig[],
  pointerType: DragPointerType,
): readonly DragActivationConfig[] | null {
  const configs: readonly DragActivationConfig[] = Array.isArray(config)
    ? config
    : [config as DragActivationConfig];
  const disabled = configs.some((entry) => !('type' in entry) && entry[pointerType] === false);
  return disabled ? null : configs;
}

function squaredDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** One activation's verdict on the gesture so far. */
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
      if (squaredDistance(origin, current) > tolerance * tolerance) {
        return 'cancel';
      }
      return elapsedMs >= activation.delay ? 'activate' : 'pending';
    }
    // Handled by the `dblclick` and double-tap paths, never evaluated here.
    case 'double-click':
    default:
      return 'cancel';
  }
}

/**
 * Evaluate every pending activation at once. Any one activating activates the
 * gesture (OR semantics); the ones that canceled are pruned, since a hold that
 * exceeded its tolerance cannot recover by moving back.
 */
export function evaluateActivations(
  activations: readonly DragActivation[],
  origin: { x: number; y: number },
  current: { x: number; y: number },
  elapsedMs: number,
): { activate: boolean; remaining: DragActivation[] } {
  let activate = false;
  const remaining: DragActivation[] = [];
  for (const activation of activations) {
    const decision = evaluateActivation(activation, origin, current, elapsedMs);
    if (decision === 'activate') {
      activate = true;
    }
    if (decision !== 'cancel') {
      remaining.push(activation);
    }
  }
  return { activate, remaining };
}

/** The earliest press-hold deadline among `activations`, or `null` without one. */
export function getActivationDelayMs(activations: readonly DragActivation[]): number | null {
  let delay: number | null = null;
  for (const activation of activations) {
    if (activation.type === 'press-hold' && (delay === null || activation.delay < delay)) {
      delay = activation.delay;
    }
  }
  return delay;
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
