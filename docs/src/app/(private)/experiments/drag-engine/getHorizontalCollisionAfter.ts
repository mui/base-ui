import { ownerWindow } from '@base-ui/utils/owner';
import type { Draggable } from '@base-ui/react/draggable';

/** Decide whether to insert after the target, flipping left and right in RTL rows. */
export function getHorizontalCollisionAfter(target: Draggable.Target.Record, delta?: number) {
  const rtl = ownerWindow(target.element).getComputedStyle(target.element).direction === 'rtl';
  const after = delta ? delta > 0 : target.getLocalPoint().x > 0.5;
  return after !== rtl;
}
