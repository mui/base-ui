import { getElementScale } from '../utils';
import type { DragKeyboardMovement } from '../../../types/drag';

/**
 * A `keyboardMovement` preset that only ever moves between accepting drop
 * targets: each arrow press snaps to the nearest target in the pressed
 * direction, and a press with no target ahead does nothing. Use it when free
 * space is never a valid drop position, such as a sortable list or a board —
 * without it, a press past the last target nudges the preview into dead space.
 */
export const targetsOnlyKeyboardMovement: DragKeyboardMovement = ({ suggestion }) =>
  suggestion.type === 'target' ? suggestion : false;

/** How much further one press travels while Shift is held, matching the default behavior. */
const SHIFT_MULTIPLIER = 4;

/**
 * A `keyboardMovement` preset that always nudges by a fixed step and never seeks a drop target.
 *
 * The opposite of {@link targetsOnlyKeyboardMovement}, and what a free surface wants: on a
 * canvas every point is a valid position, so the default's "snap to the nearest accepting
 * target in this direction" sends the source across the board the moment anything registers as
 * a target.
 *
 * `step` is in the source's own coordinate space, so an ancestor `scale()` — a zoomable
 * canvas — moves the source by the same distance on the board at any zoom. Holding Shift
 * travels four times as far.
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
