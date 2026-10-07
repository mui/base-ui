import type { DraggableInput } from '../../draggable/DraggableProvider';
import { getSharedSlot } from './sharedState';

interface ActivePointerAccessors {
  getInput(): DraggableInput | null;
  notifyScroll(): void;
}

// Auto-scroll reads the live pointer sensor through this slot instead of
// importing it, so a chunk with only drop targets and viewports doesn't bundle
// the pickup code. Bundled copies share the slot, like the sensor state.
const slot = getSharedSlot<{ accessors: ActivePointerAccessors | null }>('activePointer', () => ({
  accessors: null,
}));

export function setActivePointerAccessors(accessors: ActivePointerAccessors): void {
  slot.accessors = accessors;
}

/** The active pointer drag's raw input, before `modifiers` apply, or `null` without one. */
export function getRawActivePointerInput(): DraggableInput | null {
  return slot.accessors?.getInput() ?? null;
}

/** Flag that something scrolled under the active pointer drag. */
export function notifyExternalScroll(): void {
  slot.accessors?.notifyScroll();
}
