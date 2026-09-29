import type { DraggablePointerType } from '../../draggable/DraggableProvider';
import type {
  DraggableRootActivation,
  DraggableRootActivationConfig,
} from '../../draggable/root/DraggableRoot';

const MOVEMENT_TOLERANCE_PX = 5;

const DEFAULT_ACTIVATION: Record<DraggablePointerType, DraggableRootActivation> = {
  // Distance-based so a stationary click on a clickable child doesn't become a drag.
  mouse: { type: 'distance', distance: MOVEMENT_TOLERANCE_PX },
  // Distance-based so a stylus tap doesn't briefly enter a drag session.
  pen: { type: 'distance', distance: MOVEMENT_TOLERANCE_PX },
  // Press-hold even with a drag handle, because a distance activation would
  // hijack scrolls that start on the handle.
  touch: { type: 'press-hold', delay: 250 },
};

/**
 * The press activations for `pointerType`. These are the entries that address
 * it, minus `double-click`, which the `dblclick` and double-tap paths handle.
 * The per-pointer default applies only when no entry addresses the pointer type,
 * so `[{ mouse: double-click }, { touch: press-hold }]` leaves mouse with only
 * the double-click. An empty `config` array disables pickup.
 */
export function resolveActivation(
  config: DraggableRootActivationConfig | readonly DraggableRootActivationConfig[] | undefined,
  pointerType: DraggablePointerType,
): DraggableRootActivation[] {
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
 * (touch, pen). An entry with `type: 'double-click'` applies to every pointer
 * type. A per-pointer map opts in each type separately.
 */
export function hasDoubleClickActivation(
  config: DraggableRootActivationConfig | readonly DraggableRootActivationConfig[] | undefined,
  pointerType: DraggablePointerType,
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
  config: DraggableRootActivationConfig | readonly DraggableRootActivationConfig[],
  pointerType: DraggablePointerType,
): readonly DraggableRootActivationConfig[] | null {
  const configs: readonly DraggableRootActivationConfig[] = Array.isArray(config)
    ? config
    : [config as DraggableRootActivationConfig];
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
  activation: DraggableRootActivation,
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
 * Evaluate every pending activation. The gesture activates if any one of them
 * does. Canceled ones are pruned, since a hold that exceeded its tolerance can't
 * recover by moving back.
 */
export function evaluateActivations(
  activations: readonly DraggableRootActivation[],
  origin: { x: number; y: number },
  current: { x: number; y: number },
  elapsedMs: number,
): { activate: boolean; remaining: DraggableRootActivation[] } {
  let activate = false;
  const remaining: DraggableRootActivation[] = [];
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
export function getActivationDelayMs(
  activations: readonly DraggableRootActivation[],
): number | null {
  let delay: number | null = null;
  for (const activation of activations) {
    if (activation.type === 'press-hold' && (delay === null || activation.delay < delay)) {
      delay = activation.delay;
    }
  }
  return delay;
}

type ActivationDecision = 'pending' | 'activate' | 'cancel';
