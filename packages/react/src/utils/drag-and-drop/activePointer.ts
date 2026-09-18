import type { DragInput } from '../../types/drag';
import { getSharedSlot } from './sharedState';

interface ActivePointerAccessors {
  getInput(): DragInput | null;
  getHitElement(): Element | null;
  notifyScroll(): void;
}

// Optional features read the live sensor without importing its preview and
// activation machinery. Shared across bundled copies, like the sensor state.
const slot = getSharedSlot<{ accessors: ActivePointerAccessors | null }>('activePointer', () => ({
  accessors: null,
}));

export function setActivePointerAccessors(accessors: ActivePointerAccessors): void {
  slot.accessors = accessors;
}

export function getRawActivePointerInput(): DragInput | null {
  return slot.accessors?.getInput() ?? null;
}

export function getActiveHitElement(): Element | null {
  return slot.accessors?.getHitElement() ?? null;
}

export function notifyExternalScroll(): void {
  slot.accessors?.notifyScroll();
}
