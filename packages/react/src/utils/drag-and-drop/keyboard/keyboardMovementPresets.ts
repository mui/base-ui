import { getElementScale } from '../utils';
import type { DragKeyboardMovement } from '../../../types/drag';

/**
 * A `keyboardMovement` preset that moves only between accepting drop targets.
 * Each arrow press moves to the nearest target in that direction. If no target
 * is available, nothing moves. Use it for sortable lists and boards where empty
 * space is not a valid drop position.
 */
export const targetsOnlyKeyboardMovement: DragKeyboardMovement = ({ suggestion }) =>
  suggestion.type === 'target' ? suggestion : false;

/** How much further one press travels while Shift is held, matching the default behavior. */
const SHIFT_MULTIPLIER = 4;

/**
 * A `keyboardMovement` preset that moves by a fixed step without finding a drop target.
 *
 * Use it on a canvas where every point is valid. The default target search could
 * otherwise move the source across the canvas when a drop target is registered.
 *
 * `step` uses the source's coordinate system, so an ancestor `scale()` does not
 * change the distance on a zoomable canvas. Holding Shift moves four times as far.
 *
 * ```jsx
 * <Draggable.Root keyboardMovement={Draggable.fixedStepKeyboardMovement(20)} />
 * ```
 */
export function fixedStepKeyboardMovement(
  step: number | { x: number; y: number },
): DragKeyboardMovement {
  const stepX = typeof step === 'number' ? step : step.x;
  const stepY = typeof step === 'number' ? step : step.y;

  return ({ position, direction, shiftKey, source }) => {
    const scale = getElementScale(source.element);
    const multiplier = shiftKey ? SHIFT_MULTIPLIER : 1;
    return {
      x: position.x + direction.x * stepX * scale.x * multiplier,
      y: position.y + direction.y * stepY * scale.y * multiplier,
    };
  };
}
