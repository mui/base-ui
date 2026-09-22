import { ownerWindow } from '@base-ui/utils/owner';
import type { Draggable } from '@base-ui/react/draggable';

/** Interpret physical target coordinates in the row's reading direction. */
export function getHorizontalCollisionAfter(
  collision: Draggable.CollisionProvider.Collision,
  delta?: number,
) {
  const { target } = collision;
  const rtl = ownerWindow(target.element).getComputedStyle(target.element).direction === 'rtl';
  const after = delta ? delta > 0 : target.getLocalPoint().x > 0.5;
  return after !== rtl;
}
